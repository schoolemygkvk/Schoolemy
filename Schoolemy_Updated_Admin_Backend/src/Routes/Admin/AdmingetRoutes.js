import express from "express";
import { getAllData, getAdminById } from "../../Controllers/Admin-Tutor-auth/Admingetcontroller.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";

const router = express.Router();

router.get("/get-admins", verifyToken, getAllData);
router.get("/admin/:id", verifyToken, getAdminById);

export default router;