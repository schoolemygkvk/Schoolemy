import express from "express";
import {
  getApprovedTutorCourses,
  getApprovedTutorCoursesByCategory,
  getApprovedTutorCourseById,
  getTutorCourseContent,
  getTutorCoursesByTutorId,
} from "../../Controllers/Tutor-Course-Controller/TutorCourseController.js";

const router = express.Router();

// Get all approved tutor courses
router.get("/tutor-courses/approved", getApprovedTutorCourses);

// Get approved tutor courses by category
router.get(
  "/tutor-courses/approved/category/:categoryName",
  getApprovedTutorCoursesByCategory,
);

// Get approved tutor course by ID
router.get("/tutor-courses/:courseId", getApprovedTutorCourseById);

// Get tutor course content by ID
router.get("/tutor-courses/:courseId/content", getTutorCourseContent);

// Get tutor courses by tutor ID
router.get("/tutor-courses/tutor/:tutorId", getTutorCoursesByTutorId);

export default router;
