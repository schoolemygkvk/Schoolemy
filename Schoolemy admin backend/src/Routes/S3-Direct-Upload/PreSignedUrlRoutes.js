import express from "express";
import {
  generatePreSignedUploadUrl,
  getUploadLimits,
} from "../../Controllers/S3-Direct-Upload/PreSignedUrlController.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/s3/generate-upload-url
 * @desc    Generate pre-signed URL for direct S3 upload
 * @access  Private (requires authentication)
 * @body    { fileName, fileType, folder, fileSize? }
 * @returns { uploadUrl, fileUrl, key, fileName, folder, expiresIn }
 */
router.post("/generate-upload-url", verifyToken, generatePreSignedUploadUrl);

/**
 * @route   GET /api/s3/upload-limits
 * @desc    Get file upload limits and allowed file types
 * @access  Public
 * @returns { folders, limits }
 */
router.get("/upload-limits", getUploadLimits);

export default router;
