// routes/adminRoutes.js
import express from "express";
import { getUserDetails, getAllUsers } from "../../Controllers/User/student-Info.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import { checkRole } from "../../Middleware/checkRole.js";

const router = express.Router();

// Admin routes - Protected with authentication and role-based access control
router.get("/admin/students", verifyToken, checkRole(['admin', 'usermanagement']), getAllUsers); // Get all users' details
router.get("/admin/students/:id", verifyToken, checkRole(['admin', 'usermanagement']), getUserDetails); // Get specific user details by _id or studentRegisterNumber

export default router;