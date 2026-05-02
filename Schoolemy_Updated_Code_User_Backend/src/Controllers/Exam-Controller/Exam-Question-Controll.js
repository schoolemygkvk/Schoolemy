import mongoose from "mongoose";
import ExamQuestion from "../../Models/Exam-Model/Exam-Question-Model.js";
import Payment from "../../Models/Payment-Model/Payment-Model.js";
import Course from "../../Models/Course-Model/Course-Model.js";

// GET - Fetch exams by coursename and chapterTitle
// FIXED: Added authentication, enrollment verification, and stripped correctAnswer
export const getExamQuestionsByCourseAndChapter = async (req, res) => {
  try {
    const { coursename, chapterTitle } = req.query;
    const userId = req.userId; // From JWT token verification middleware

    // SECURITY FIX 1: Check if user is authenticated
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login to access exams.",
      });
    }

    if (!coursename || !chapterTitle) {
      return res.status(400).json({
        success: false,
        message: "Both 'coursename' and 'chapterTitle' are required in query.",
      });
    }

    // SECURITY FIX 2: Verify user is enrolled in the course
    // Find course by coursename or title (handle both old and new field names)
    const course = await Course.findOne({
      $or: [{ coursename }, { title: coursename }],
    }).select("_id");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    // Check if user has paid for this course (enrollment verification)
    const enrollment = await Payment.findOne({
      userId,
      courseId: course._id,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course. Please purchase the course to access exams.",
      });
    }

    // SECURITY FIX 3: Fetch exams WITHOUT correct answers
    const exams = await ExamQuestion.find({
      coursename,
      chapterTitle,
    }).select("-examQuestions.correctAnswer"); // Strip correctAnswer field from nested questions

    if (!exams || exams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No exams found for the given course and chapter.",
      });
    }

    res.status(200).json({ success: true, exams });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch exams",
      error: error.message,
    });
  }
};


export const getExamQuestionsByCourseIdAndChapter = async (req, res) => {
  try {
    const { courseId, chapterTitle } = req.query;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!courseId || !chapterTitle) {
      return res.status(400).json({
        success: false,
        message: "courseId and chapterTitle are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseId.",
      });
    }

    const cid = new mongoose.Types.ObjectId(courseId);
    const course = await Course.findById(cid).select("coursename").lean();
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    const enrollment = await Payment.findOne({
      userId,
      courseId: cid,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course.",
      });
    }

    const exam = await ExamQuestion.findOne({
      $or: [
        { courseId: cid, chapterTitle },
        { coursename: course.coursename, chapterTitle },
      ],
    }).select("-examQuestions.correctAnswer");

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "No exam found for this chapter.",
      });
    }

    return res.status(200).json({ success: true, exam });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch exam",
      error: error.message,
    });
  }
};
