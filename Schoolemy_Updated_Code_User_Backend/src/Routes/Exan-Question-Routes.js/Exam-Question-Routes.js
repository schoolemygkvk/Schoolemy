import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import {
  getExamQuestionsByCourseAndChapter,
  getExamQuestionsByCourseIdAndChapter,
} from "../../Controllers/Exam-Controller/Exam-Question-Controll.js";
import { submitExamAttempt , getUserExamAttempts } from "../../Controllers/Exam-Controller/User-Submit-Answer.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import { validateReattempt, getReattemptStatus } from "../../Middleware/reattemptValidation.js";
const router = express.Router();

// SECURITY FIX: Added verifyToken middleware to all exam routes
// This ensures only authenticated, enrolled users can access exams
router.get("/exam-question", verifyToken, asyncHandler(getExamQuestionsByCourseAndChapter));
router.get(
  "/exam-question-by-course",
  verifyToken,
  asyncHandler(getExamQuestionsByCourseIdAndChapter),
);

// FIX 2.14.14: Reattempt status endpoint - returns detailed reattempt eligibility info
router.get("/exam/reattempt-status", verifyToken, asyncHandler(getReattemptStatus));

// FIX 2.14.15: Submit exam with reattempt validation
router.post("/user/exam/answer-submit", verifyToken, validateReattempt, asyncHandler(submitExamAttempt));

router.get("/user/exam/result", verifyToken, asyncHandler(getUserExamAttempts));

export default router;