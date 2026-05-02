import express from "express";
import {
  createStudentNewExamRecords,
  updateStudentExamRecords,
  getAllStudentExamMarks,
  downloadStudentExamRecords,
  getStudentExamStatistics,
} from "../../Controllers/Data-Maintenance/exam-mark-records-controller.js";
import UserExamAttempt from "../../Models/Courses/UserExamAnswer.js";

const router = express.Router();

// Debug route to check exam attempts
router.get('/exam-records/debug', async (req, res) => {
  try {
    const attempts = await UserExamAttempt.find({})
      .populate('courseId', 'coursename category')
      .limit(5)
      .lean();
    
    res.json({
      success: true,
      count: attempts.length,
      data: attempts,
      message: 'Debug: Fetching exam attempts'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/exam-records/create', createStudentNewExamRecords);

router.put('/exam-records/update/:id', updateStudentExamRecords);

router.get('/exam-records/all', getAllStudentExamMarks);

router.get("/exam-records/download", downloadStudentExamRecords);

router.get("/exam-records/statistics", getStudentExamStatistics);

export default router;
