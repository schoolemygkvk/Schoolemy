/**
 * S3 Course Upload Routes
 * 
 * Provides endpoints for:
 * - Generating presigned URLs for direct S3 uploads
 * - Validating uploaded files
 * 
 * This bypasses API Gateway's 10MB payload limit by allowing
 * clients to upload directly to S3.
 */

import express from "express";
import { generateCourseUploadUrls, validateCourseUploads } from "../../Controllers/Courses/S3CourseUploadController.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";

const router = express.Router();

/**
 * Generate presigned URLs for course file uploads
 * 
 * @route POST /api/courses/generate-upload-urls
 * @access Protected (requires JWT authentication)
 * @description
 * - Request contains file metadata (name, type, size, category)
 * - Returns presigned URLs for direct S3 upload
 * - No file data passes through API Gateway
 * - Supports files up to 5GB
 */
router.post("/generate-upload-urls", verifyToken, generateCourseUploadUrls);

/**
 * Validate uploaded files on S3
 * 
 * @route POST /api/courses/validate-uploads
 * @access Protected (requires JWT authentication)
 * @description
 * - Request contains S3 URLs to validate
 * - Checks if files exist and returns metadata
 * - Call this before creating/updating course
 */
router.post("/validate-uploads", verifyToken, validateCourseUploads);

export default router;
