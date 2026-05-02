import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import {
  getApprovedTutorCourses,
  getApprovedTutorCoursesByCategory,
  getApprovedTutorCourseById,
  getTutorCourseContent,
  getTutorCoursesByTutorId,
} from "../../Controllers/Tutor-Course-Controller/TutorCourseController.js";

const router = express.Router();

// Get all approved tutor courses
router.get("/approved", asyncHandler(getApprovedTutorCourses));

// Get approved tutor courses by category
router.get(
  "/approved/category/:categoryName",
  asyncHandler(getApprovedTutorCoursesByCategory),
);

// Get approved tutor course by ID
router.get("/:courseId", asyncHandler(getApprovedTutorCourseById));

// Get tutor course content by ID
router.get("/:courseId/content", asyncHandler(getTutorCourseContent));

// Get tutor courses by tutor ID
router.get("/tutor/:tutorId", asyncHandler(getTutorCoursesByTutorId));

export default router;
