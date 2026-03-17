
import express from "express";
import {
  createAdmin,
  updateAdmin,
  deleteAdminById,
  profile,
  proxyImage,
} from "../../Controllers/Admin-Tutor-auth/Admin-controller.js";
import {
  listPendingTutorCourses,
  approveTutorCourse,
  requestChangesForTutorCourse,
  rejectTutorCourse,
  deleteTutorCourseById,
} from "../../Controllers/Tutor/Tutor-coure-controller.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";

const router = express.Router();

// Admin Routes

// POST - Create a new admin
router.post("/createadmin", createAdmin);

// GET - Proxy S3 image for PDF export (bypasses CORS)
router.get("/proxy-image", proxyImage);

// Update admin by ID
router.put("/update/:id", updateAdmin);

// DELETE - Delete admin by ID
router.delete("/admin/:id", deleteAdminById);

// GET - Admin Profile
router.get("/profile", profile);

// Tutor course review routes (protected by token; controllers re-check role)
router.get(
  "/tutor-courses/pending",
  verifyToken,
  listPendingTutorCourses
);
router.put(
  "/tutor-courses/:id/approve",
  verifyToken,
  approveTutorCourse
);
router.put(
  "/tutor-courses/:id/request-changes",
  verifyToken,
  requestChangesForTutorCourse
);
router.put(
  "/tutor-courses/:id/reject",
  verifyToken,
  rejectTutorCourse
);
router.delete(
  "/tutor-courses/:id",
  verifyToken,
  deleteTutorCourseById
);

export default router;
