import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import { getAllStaff } from "../../Controllers/Resources-Controller/staff-details.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";
const router = express.Router();

// SECURITY FIX 3.43.1: Authentication Required
// All staff details endpoints require authentication
// Only authenticated users with proper authorization can access staff information

// Get all staff with pagination (authenticated users only)
router.get("/staff-details", verifyToken, asyncHandler(getAllStaff));


export default router;