import express from "express";
import { getAllData, getAdminById } from "../../Controllers/Admin-Tutor-auth/Admingetcontroller.js";

const router = express.Router();

router.get("/get-admins", getAllData);
router.get("/admin/:id", getAdminById);

export default router;