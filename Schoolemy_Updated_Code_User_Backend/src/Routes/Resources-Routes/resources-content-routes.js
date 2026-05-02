import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import { verifyToken } from "../../Middleware/auth.js";
import {
  getResourcesByLesson,
  downloadResource,
  getCourseResources,
} from "../../Controllers/Resources-Controller/resources-content.js";

const router = express.Router();


router.get("/:courseId", (req, res, next) => {
  // Make auth optional
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    // Verify token if provided
    verifyToken(req, res, next);
  } else {
    // Continue without auth
    next();
  }
}, asyncHandler(getCourseResources));


router.get("/:courseId/lesson/:lessonId", verifyToken, asyncHandler(getResourcesByLesson));


router.get("/download/:courseId/:resourceId/:fileType", verifyToken, asyncHandler(downloadResource));

export default router;
