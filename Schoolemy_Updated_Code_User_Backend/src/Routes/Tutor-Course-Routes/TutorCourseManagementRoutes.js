

import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import {
  getTutorCourseStudents,
  getTutorCoursePerformance,
  getTutorCourseDetails,
  getTutorCourseMaterials,
  getTutorCourseAssignments,
  updateTutorCourse,
  deleteTutorCourse,
  getMyTutorCourses,
} from "../../Controllers/Tutor-Course-Controller/TutorCourseManagementController.js";

const router = express.Router();



// Get all courses owned by current tutor
router.get("/my-courses", verifyToken, asyncHandler(getMyTutorCourses));

// Get students enrolled in specific course
// SECURITY: Returns 403 if tutor doesn't own course
router.get("/:courseId/students", verifyToken, asyncHandler(getTutorCourseStudents));

// Get course performance metrics
// SECURITY: Returns 403 if tutor doesn't own course
router.get("/:courseId/performance", verifyToken, asyncHandler(getTutorCoursePerformance));

// Get detailed course information
// SECURITY: Returns 403 if tutor doesn't own course
router.get("/:courseId/details", verifyToken, asyncHandler(getTutorCourseDetails));

// Get course materials and resources
// SECURITY: Returns 403 if tutor doesn't own course
router.get("/:courseId/materials", verifyToken, asyncHandler(getTutorCourseMaterials));

// Get course assignments and exams
// SECURITY: Returns 403 if tutor doesn't own course
router.get("/:courseId/assignments", verifyToken, asyncHandler(getTutorCourseAssignments));

// Update course
// SECURITY: Returns 403 if tutor doesn't own course
router.put("/:courseId", verifyToken, asyncHandler(updateTutorCourse));

// Delete course
// SECURITY: Returns 403 if tutor doesn't own course
router.delete("/:courseId", verifyToken, asyncHandler(deleteTutorCourse));

export default router;
