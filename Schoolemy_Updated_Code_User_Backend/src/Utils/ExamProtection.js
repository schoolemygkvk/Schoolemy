import { logger } from "../Utils/logger.js";



import ExamQuestion from "../Models/Exam-Model/Exam-Question-Model.js";
import ExamAttempt from "../Models/Exam-Model/User-Submit-Model.js";


export const checkActiveAttempts = async (examId) => {
  try {
    const activeAttempts = await ExamAttempt.countDocuments({
      examId: examId,
      submittedAt: null, // Not yet submitted = still in progress
    });

    return {
      hasActive: activeAttempts > 0,
      count: activeAttempts,
    };
  } catch (error) {
    logger.error("Error checking active attempts:", error);
    throw error;
  }
};


export const validateExamModification = async (examId, updates) => {
  // Check for active attempts
  const activeCheck = await checkActiveAttempts(examId);

  if (activeCheck.hasActive) {
    return {
      canModify: false,
      reason: `Cannot modify exam. ${activeCheck.count} student(s) are currently attempting it.`,
      activeAttempts: activeCheck.count,
    };
  }

  // Check if modification changes questions/answers
  const exam = await ExamQuestion.findById(examId).select("examQuestions totalMarks version");

  if (!exam) {
    return {
      canModify: false,
      reason: "Exam not found",
    };
  }

  const isBreakingChange =
    updates.examQuestions ||
    updates.totalMarks ||
    updates.durationMinutes ||
    updates.maxAttempts;

  if (isBreakingChange) {
    return {
      canModify: true,
      requiresVersionIncrement: true,
      reason: "Exam modification detected. Version will be incremented.",
    };
  }

  return {
    canModify: true,
    requiresVersionIncrement: false,
  };
};


export const updateExamWithVersioning = async (examId, updates) => {
  // Validate modification is safe
  const validation = await validateExamModification(examId, updates);

  if (!validation.canModify) {
    const error = new Error(validation.reason);
    error.statusCode = 409; // Conflict
    throw error;
  }

  // Increment version if breaking change
  const updateObj = { ...updates };
  if (validation.requiresVersionIncrement) {
    const currentExam = await ExamQuestion.findById(examId).select("version");
    updateObj.version = (currentExam.version || 1) + 1;

    // Log version history
    updateObj.$push = {
      versionHistory: {
        version: updateObj.version,
        changedAt: new Date(),
        changes: Object.keys(updates).join(", "),
      },
    };
  }

  // Update exam
  const updatedExam = await ExamQuestion.findByIdAndUpdate(
    examId,
    updateObj,
    { new: true, runValidators: true },
  );

  return updatedExam;
};


export const gradeAgainstSnapshot = (snapshot, answers) => {
  if (!snapshot || !snapshot.questions) {
    throw new Error("Invalid exam snapshot");
  }

  let totalMarks = 0;
  const details = [];

  // Grade each answer against snapshot
  answers.forEach((answer) => {
    const question = snapshot.questions.find(
      q => q._id.toString() === answer.questionId.toString(),
    );

    if (!question) {
      // Question not found in snapshot - mark as wrong
      details.push({
        questionId: answer.questionId,
        isCorrect: false,
        marksAwarded: 0,
        reason: "Question not found in exam version",
      });
      return;
    }

    // Check answer against snapshot
    const isCorrect = answer.selectedAnswer === question.correctAnswer;
    const marksAwarded = isCorrect ? question.marks : 0;

    if (isCorrect) {
      totalMarks += marksAwarded;
    }

    details.push({
      questionId: answer.questionId,
      isCorrect,
      marksAwarded,
      expectedAnswer: question.correctAnswer,
    });
  });

  return {
    score: totalMarks,
    maxScore: snapshot.questions.reduce((sum, q) => sum + q.marks, 0),
    details,
  };
};


export const getAttemptHistory = async (userId, examId) => {
  const attempts = await ExamAttempt.find({
    userId,
    examId,
  }).select("attemptNumber examSnapshot obtainedMarks totalMarks submittedAt passed");

  return attempts.map(attempt => ({
    attemptNumber: attempt.attemptNumber,
    examVersion: attempt.examSnapshot?.version || "N/A",
    score: attempt.obtainedMarks,
    maxScore: attempt.totalMarks,
    passed: attempt.passed,
    submittedAt: attempt.submittedAt,
    questionsInAttempt: attempt.examSnapshot?.totalQuestions || "N/A",
  }));
};

export default {
  checkActiveAttempts,
  validateExamModification,
  updateExamWithVersioning,
  gradeAgainstSnapshot,
  getAttemptHistory,
};
