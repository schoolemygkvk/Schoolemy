import express from "express";
import {
  getUserMeets,
  getUserMeetById,
  joinMeet,
  completeMeet,
  getUserMeetHistory,
  validateJoinAccess
} from "../../Controllers/DirectMeet/UserCourseMeetController.js";

const router = express.Router();

// Get all available meets for user
router.get("/user/:user_id/meets", getUserMeets);

// Get single meet details
router.get("/user/:user_id/meets/:meet_id", getUserMeetById);

// Validate if user can join a meet
router.get("/meets/:meet_id/validate/:user_id", validateJoinAccess);

// Join a meet
router.post("/meets/:meet_id/join", joinMeet);

// Mark meet as completed
router.post("/meets/:meet_id/complete", completeMeet);

// Get user's meet history
router.get("/user/:user_id/history", getUserMeetHistory);

export default router;