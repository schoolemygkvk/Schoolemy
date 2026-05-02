import express from "express";
import asyncHandler from "../Utils/asyncHandler.js";
import {
  getLessonProgress,
  getCourseProgress,
  updateLessonProgress,
  bulkUpdateProgress,
  getPlayerState,
  upsertPlayerState,
} from "../Controllers/Progress-Controller.js";

const router = express.Router();


router.post("/bulk-update", asyncHandler(bulkUpdateProgress));
router.get("/player-state/:courseId", asyncHandler(getPlayerState));
router.put("/player-state/:courseId", asyncHandler(upsertPlayerState));

router.get("/:courseId/:lessonId", asyncHandler(getLessonProgress));
router.post("/:courseId/:lessonId", asyncHandler(updateLessonProgress));
router.get("/:courseId", asyncHandler(getCourseProgress));

export default router;
