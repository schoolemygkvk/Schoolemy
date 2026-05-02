import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import {
  getClassesBySubject,
} from "../../Controllers/PCM-Class-Controller/PCMClassController.js";

const router = express.Router();

// Get PCM classes by subject (changed to POST to accept body parameters)
router.post("/classes-pcm", asyncHandler(getClassesBySubject));

export default router;
