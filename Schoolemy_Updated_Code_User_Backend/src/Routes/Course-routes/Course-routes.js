//Routes/Course-routes/Course-routes.js
import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import { getCourseDetailWithPaymentCheck,getCoursesForUserView,getCourseContent,getCoursesByCategory } from "../../Controllers/Course-Controller/Course-Controller.js";
import { checkCourseAccessMiddleware } from "../../Middleware/EMI-accessMiddleware.js";
// BUG 2.8.2: Import optional auth middleware for enrollment status
import { optionalAuth } from "../../Middleware/authMiddleware.js";
const router = express.Router();

// BUG 2.8.2: Add optional auth to get enrollment status for logged-in users
router.get("/user-view", optionalAuth, asyncHandler(getCoursesForUserView));   // For grid view
router.get("/category/:categoryName", optionalAuth, asyncHandler(getCoursesByCategory)); // Anonymous browse + enrollment when token present
router.get("/:id", optionalAuth, checkCourseAccessMiddleware, asyncHandler(getCourseDetailWithPaymentCheck));
router.get("/:id/content", optionalAuth, checkCourseAccessMiddleware, asyncHandler(getCourseContent));

export default router;
