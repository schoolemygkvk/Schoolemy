import  logger  from "../../Utils/logger.js";

import ExamQuestion from "../../Models/Exam-Model/Exam-Question-Model.js";
import ExamAttempt from "../../Models/Exam-Model/User-Submit-Model.js";
import Course from "../../Models/Course-Model/Course-Model.js";
import mongoose from "mongoose";
import User from "../../Models/User-Model/User-Model.js";
import { checkCourseAccess } from "../Course-Controller/Course-Controller.js";
import { getEffectivePolicy } from "../../Utils/ExamReattemptPolicy.js";

// NO CHANGES IN THIS FUNCTION
export const submitExamAttempt = async (req, res) => {
  try {
    const userId = req.userId;
    const { examId, courseId, chapterTitle, lessonName, answers } = req.body;

    logger.debug(" Exam submission request received:", {
      userId,
      examId,
      courseId,
      chapterTitle,
      lessonName, // Added lessonName to log
      answersCount: Array.isArray(answers) ? answers.length : 0,
    });

    // 0. Check if userId exists (from auth middleware)
    if (!userId) {
      logger.error(" No userId found in request - authentication issue");
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in again.",
      });
    }

    // 1. Basic Validation
    if (
      !examId ||
      !courseId ||
      !chapterTitle ||
      !lessonName ||
      !Array.isArray(answers)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid request. Please provide examId, courseId, chapterTitle, lessonName, and answers array.",
      });
    }

    // 2. Check if Course Exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found. Please verify the courseId.",
      });
    }

    // 3. Check if Exam Exists
    const exam = await ExamQuestion.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found. Please verify the examId.",
      });
    }

    // 4. Check if Chapter Title Matches
    if (exam.chapterTitle !== chapterTitle) {
      return res.status(400).json({
        success: false,
        message: `Chapter mismatch. Exam belongs to chapter "${exam.chapterTitle}", but got "${chapterTitle}".`,
      });
    }

    // Same access rules as course content (full pay + active EMI on enrolledCourses).
    // A plain Payment.findOne({ completed }) misses EMI students whose plan is active but parent payment is not "full".
    const access = await checkCourseAccess(userId, courseId);
    if (!access.hasAccess) {
      logger.warn(`Exam submission denied: User ${userId} course ${courseId} reason=${access.reason}`);
      return res.status(403).json({
        success: false,
        code: access.reason === "emi_locked" || access.reason === "emi_overdue" ? "COURSE_ACCESS_LOCKED" : "NOT_ENROLLED",
        message:
          access.message ||
          "You do not have access to submit this exam. Purchase the course or restore access (e.g. clear overdue EMI).",
      });
    }

    // Exam snapshot for consistent grading
    // Capture complete exam state at time of attempt
    // This protects against grading inconsistencies if exam is modified during attempt
    const examSnapshot = {
      examId: exam._id,
      version: exam.version || 1,
      title: exam.examinationName,
      duration: exam.durationMinutes,
      totalQuestions: exam.examQuestions.length,
      questions: exam.examQuestions.map(q => ({
        _id: q._id,
        question: q.question,
        options: [...q.options],
        correctAnswer: q.correctAnswer,
        marks: q.marks,
      })),
      capturedAt: new Date(),
    };

    // FIX 2.14.3: Check reattempt policy from exam configuration
    // Count how many times user has attempted this exam
    const attemptCount = await ExamAttempt.countDocuments({
      userId,
      examId,
    });

    // If maxAttempts is defined, enforce the limit
    if (exam.maxAttempts && attemptCount >= exam.maxAttempts) {
      return res.status(409).json({
        success: false,
        message: `You have reached the maximum number of attempts (${exam.maxAttempts}) for this exam. No more attempts allowed.`,
      });
    }

    // FIX 2.14.2: Validate exam submission against server-side duration
    // Extract client-provided timestamps from request body (endTime = legacy / alias for submitTime)
    const { startTime: startTimeBody, submitTime: submitTimeBody, endTime, autoSubmitted } = req.body;
    const submitTime = submitTimeBody ?? endTime;
    const startTime = startTimeBody || submitTime;

    let startMs;
    let submitMs;

    if (startTime && submitTime) {
      startMs = new Date(startTime).getTime();
      submitMs = new Date(submitTime).getTime();
    } else if (autoSubmitted) {
      submitMs = Date.now();
      const allowedMs = (exam.durationMinutes || 60) * 60 * 1000;
      startMs = submitMs - allowedMs;
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Invalid request. startTime and submitTime are required (or pass autoSubmitted: true for timed auto-submit).",
      });
    }

    const durationSeconds = (submitMs - startMs) / 1000;
    const durationMinutes = durationSeconds / 60;
    const graceMinutes = 1;
    // Allow at least 2 minutes per question (matches user-frontend per-question cap) or configured duration, whichever is larger
    const perQuestionMinutes = 2;
    const minByQuestionCount =
      (exam.examQuestions?.length || 0) * perQuestionMinutes;
    const allowedDurationMinutes =
      Math.max(exam.durationMinutes || 0, minByQuestionCount) + graceMinutes;

    if (durationMinutes > allowedDurationMinutes) {
      logger.warn(
        `Exam submission exceeded time limit: ${durationMinutes} minutes > ${allowedDurationMinutes} minutes (cap)`,
      );
      return res.status(400).json({
        success: false,
        message: `Exam submission time exceeded. Maximum allowed: ${Math.round(allowedDurationMinutes - graceMinutes)} minutes. Submitted after: ${Math.round(durationMinutes)} minutes.`,
      });
    }
    const user = await User.findById(userId).lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // 6. Process Answers — one row per exam question (blanks / null selectedAnswer allowed)
    let obtainedMarks = 0;
    const detailedAnswers = exam.examQuestions.map((originalQuestion) => {
      const userAnswer =
        answers.find(
          (a) =>
            (a.questionId != null &&
              originalQuestion._id &&
              String(a.questionId) === String(originalQuestion._id)) ||
            (a.question != null && a.question === originalQuestion.question),
        ) || {};
      const selected = userAnswer.selectedAnswer ?? null;
      const isCorrect =
        selected != null && originalQuestion.correctAnswer === selected;
      const marksAwarded = isCorrect ? originalQuestion.marks : 0;
      if (isCorrect) obtainedMarks += marksAwarded;
      return {
        questionId: originalQuestion._id,
        question: originalQuestion.question,
        selectedAnswer: selected,
        isCorrect,
        marksAwarded,
      };
    });

    if (exam.examQuestions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "This exam has no questions.",
      });
    }

    // FIX 2.14.3: Calculate attempt number (1-indexed)
    const nextAttemptNumber = attemptCount + 1;

    // FIX 2.14.13: Calculate next reattempt available time based on cooldown policy
    const policy = getEffectivePolicy(exam);
    const submitDate = new Date(submitTime);
    const nextReattemptAvailableAt = new Date(
      submitDate.getTime() + (policy.cooldownPeriodHours * 60 * 60 * 1000),
    );

    // 7. Save Exam Attempt with all metadata
    const attemptData = {
      userId,
      CourseMotherId: course.CourseMotherId || undefined,
      studentRegisterNumber: user.studentRegisterNumber || undefined,
      email: user.email || undefined,
      username: user.username || undefined,
      courseId,
      chapterTitle,
      lessonName,
      examId,
      answers: detailedAnswers,
      totalMarks: exam.totalMarks,
      obtainedMarks,

      // Store snapshot so grading matches this attempt’s exam version
      // This ensures grading is always against the same exam version
      examSnapshot,

      // FIX 2.14.3: Track attempt number
      attemptNumber: nextAttemptNumber,

      // FIX 2.14.2: Store timing information
      startedAt: new Date(startTime),
      submittedAt: new Date(submitTime),
      durationTaken: Math.round(durationMinutes),
      serverTime: new Date(),

      // FIX 2.14.12: Store when student becomes eligible for next reattempt
      nextReattemptAvailableAt,

      // FIX 2.14.7: Track exam version for grading consistency
      examVersion: exam.version || 1,

      // Determine if passed based on passing score
      passed: exam.passingScore ? (obtainedMarks >= (exam.passingScore * exam.totalMarks / 100)) : null,
    };

    logger.debug(" Attempting to save exam attempt:", {
      userId,
      courseId,
      chapterTitle,
      lessonName, // Added lessonName
      examId,
      answersCount: detailedAnswers.length,
      obtainedMarks,
      totalMarks: exam.totalMarks,
    });

    const attempt = new ExamAttempt(attemptData);
    await attempt.save();

    logger.debug(" Exam attempt saved successfully:", attempt._id);

    // 8. Return Success Response
    return res.status(201).json({
      success: true,
      message: "Exam submitted successfully.",
      data: {
        totalMarks: exam.totalMarks,
        obtainedMarks,
        correctCount: detailedAnswers.filter((a) => a.isCorrect).length,
        wrongCount: detailedAnswers.filter((a) => !a.isCorrect).length,
      },
    });
  } catch (error) {
    logger.error(" Error submitting exam:", error);
    logger.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while submitting the exam. Please try again later.",
      error: error.message,
    });
  }
};

export const getUserExamAttempts = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId, examId, page = 1, limit = 10 } = req.query;

    if (courseId && !mongoose.Types.ObjectId.isValid(courseId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid courseId." });
    }
    if (examId && !mongoose.Types.ObjectId.isValid(examId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid examId." });
    }

    const query = { userId };
    if (courseId) query.courseId = courseId;
    if (examId) query.examId = examId;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const pageFinal = isNaN(pageNum) || pageNum < 1 ? 1 : pageNum;
    const limitFinal = isNaN(limitNum) || limitNum < 1 ? 10 : limitNum;
    const skip = (pageFinal - 1) * limitFinal;

    const attempts = await ExamAttempt.find(query)
      .sort({ attemptedAt: -1 })
      .skip(skip)
      .limit(limitFinal)
      .lean();

    const titleToIndex = {};
    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      const courseDoc = await Course.findById(courseId)
        .select("chapters.title")
        .lean();
      courseDoc?.chapters?.forEach((ch, i) => {
        titleToIndex[ch.title] = i;
      });
    }

    const enrichedAttempts = await Promise.all(
      attempts.map(async (attempt) => {
        const exam = await ExamQuestion.findById(attempt.examId).lean();
        if (!exam) {
          return {
            ...attempt,
            answers: attempt.answers.map((ans) => ({
              ...ans,
              questionDetails: {
                question: ans.question,
                correctAnswer: "N/A",
                options: [ans.selectedAnswer],
              },
            })),
          };
        }

        const enrichedAnswers = attempt.answers.map((userAnswer) => {
          const byId =
            userAnswer.questionId &&
            exam.examQuestions.find(
              (q) => q._id && q._id.toString() === String(userAnswer.questionId),
            );
          const originalQuestion =
            byId ||
            exam.examQuestions.find((q) => q.question === userAnswer.question);

          // 1. We now return a new object with the `questionDetails` structure
          return {
            _id: userAnswer._id,
            selectedAnswer: userAnswer.selectedAnswer,
            isCorrect: userAnswer.isCorrect,
            marksAwarded: userAnswer.marksAwarded,

            // 2. This new nested object contains all the original question info
            questionDetails: {
              question: originalQuestion
                ? originalQuestion.question
                : userAnswer.question,
              correctAnswer: originalQuestion
                ? originalQuestion.correctAnswer
                : "N/A",
              // 3. This is the most important part: We add the full options array
              options: originalQuestion
                ? originalQuestion.options
                : [userAnswer.selectedAnswer],
            },
          };
        });

        return {
          ...attempt,
          chapterIndex:
            titleToIndex[attempt.chapterTitle] !== undefined
              ? titleToIndex[attempt.chapterTitle]
              : -1,
          answers: enrichedAnswers,
        };
      }),
    );

    const totalCount = await ExamAttempt.countDocuments(query);

    let message;
    if (totalCount === 0) {
      message = "You have not attempted any exams yet.";
    } else {
      message = "Exam attempts retrieved successfully.";
    }

    return res.status(200).json({
      success: true,
      message,
      data: enrichedAttempts,
      pagination: {
        currentPage: pageFinal,
        totalPages: Math.ceil(totalCount / limitFinal),
        totalItems: totalCount,
        itemsPerPage: limitFinal,
      },
    });
  } catch (error) {
    logger.error(" Error fetching exam attempts:", error);
    logger.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching exam attempts.",
      error: error.message,
    });
  }
};
