

import express from "express";
import { generateCourseUploadUrls, validateCourseUploads } from "../../Controllers/Courses/S3CourseUploadController.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";

const router = express.Router();


router.post("/generate-upload-urls", verifyToken, generateCourseUploadUrls);


router.post("/validate-uploads", verifyToken, validateCourseUploads);

export default router;
