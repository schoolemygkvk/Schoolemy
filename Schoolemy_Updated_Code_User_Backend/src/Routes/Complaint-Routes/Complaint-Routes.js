//Routes/Complaint-Routes/Complaint-Routes.js
import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import { submitComplaint, getUserComplaints } from "../../Controllers/Complaint-Controller/Complaint-Controller.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";

const router = express.Router();

// All complaint routes require authentication
router.use(verifyToken);

// Submit a new complaint
router.post("/", asyncHandler(submitComplaint));

// Get user's complaints
router.get("/", asyncHandler(getUserComplaints));

export default router;