import express from "express";
import {
  createTutor,
  getAllTutors,
  getTutorAnalyticsLight,
  getTutorCourseAndEarningsStats,
  approveTutor,
  getTutorById,
  updateTutor,
} from "../../Controllers/Tutor/Tutor-Controller.js";

const router = express.Router();

// Create Tutor
router.post("/create-tutor", createTutor);

// Get All Tutors
router.get("/all-tutors", getAllTutors);

// Tutor analytics (no base64 / heavy fields)
router.get("/tutor-analytics-light", getTutorAnalyticsLight);

// Tutor course performance and earnings analytics
router.get("/tutor-analytics-courses", getTutorCourseAndEarningsStats);

// Approve Tutor (marks isApproved = true) - frontend should call this after final save / T&C acceptance
router.patch("/approve-tutor", approveTutor);

// Get single tutor by ID
router.get("/tutor/:id", getTutorById);

// Update tutor details
router.patch("/tutor/:id", updateTutor);

export default router;
