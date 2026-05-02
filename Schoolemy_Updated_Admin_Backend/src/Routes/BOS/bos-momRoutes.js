import express from "express";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import { checkRole } from "../../Middleware/checkRole.js";
import {
  createMoM,
  getAllMoM,
  getMoMById,
  updateMoM,
  deleteMoM,
} from "../../Controllers/BOS/bos-momController.js";

const router = express.Router();

// Create new minutes of meeting
router.post("/create", verifyToken, checkRole(['boscontroller', 'admin']), createMoM);

// Get all minutes of meetings
router.get("/get-allmom", verifyToken, checkRole(['boscontroller', 'admin']), getAllMoM);

// Get single minutes of meeting by ID
router.get("/get-mom/:id", verifyToken, checkRole(['boscontroller', 'admin']), getMoMById);

// Update minutes of meeting
router.put("/update-mom/:id", verifyToken, checkRole(['boscontroller', 'admin']), updateMoM);

// Delete minutes of meeting
router.delete("/delete/:id", verifyToken, checkRole(['boscontroller', 'admin']), deleteMoM);

export default router;
