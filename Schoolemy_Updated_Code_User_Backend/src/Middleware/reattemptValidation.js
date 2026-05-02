import logger from "../Utils/logger.js";



import ExamQuestion from "../Models/Exam-Model/Exam-Question-Model.js";
import ExamAttempt from "../Models/Exam-Model/User-Submit-Model.js";
import { checkReattemptEligibility } from "../Utils/ExamReattemptPolicy.js";


export const validateReattempt = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { examId } = req.body;

    if (!userId || !examId) {
      return next(); // Continue to next middleware/controller
    }

    // Fetch exam to check policies
    const exam = await ExamQuestion.findById(examId);
    if (!exam) {
      return next(); // Continue - exam validation will happen in controller
    }

    // Fetch all attempts by this user for this exam
    const attemptHistory = await ExamAttempt.find({
      userId,
      examId,
    }).sort({ attemptNumber: 1 }).lean();

    // Check eligibility
    const eligibility = checkReattemptEligibility(exam, attemptHistory);

    // Attach eligibility info to request for controller to use
    req.reattemptEligibility = eligibility;

    if (!eligibility.canReattempt) {
      // User is NOT eligible - return error based on reason
      const statusCode = eligibility.reason === "EXAM_ATTEMPTS_EXHAUSTED" ? 409 : 403;

      return res.status(statusCode).json({
        success: false,
        message: eligibility.message,
        error: eligibility.reason,
        details: eligibility.details,
      });
    }

    // User is eligible - continue to controller
    next();
  } catch (error) {
    logger.error("Error in reattempt validation middleware:", error);
    // Don't block submission due to middleware error - let controller handle
    next();
  }
};


export const getReattemptStatus = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { examId } = req.query;

    if (!userId || !examId) {
      return res.status(400).json({
        success: false,
        message: "userId and examId are required",
      });
    }

    // Fetch exam
    const exam = await ExamQuestion.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Exam not found",
      });
    }

    // Fetch all attempts
    const attemptHistory = await ExamAttempt.find({
      userId,
      examId,
    }).sort({ attemptNumber: 1 }).lean();

    // Check eligibility
    const eligibility = checkReattemptEligibility(exam, attemptHistory);

    return res.status(200).json({
      success: true,
      data: {
        canReattempt: eligibility.canReattempt,
        reason: eligibility.reason,
        message: eligibility.message,
        details: eligibility.details,
      },
    });
  } catch (error) {
    logger.error("Error getting reattempt status:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching reattempt status",
      error: error.message,
    });
  }
};

export default { validateReattempt, getReattemptStatus };
