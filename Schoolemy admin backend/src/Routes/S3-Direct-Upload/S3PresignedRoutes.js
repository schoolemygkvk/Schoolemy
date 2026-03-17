/**
 * S3 Direct Upload Routes
 * 
 * These routes handle presigned URL generation for direct S3 uploads
 */

import express from "express";
import {
  generatePresignedUrl,
  verifyUpload,
  generateDownloadUrl,
  deleteFile,
} from "../../Controllers/S3-Direct-Upload/S3PresignedController.js";

const router = express.Router();

/**
 * @route   POST /api/s3/presigned-upload
 * @desc    Generate presigned URL for direct S3 upload
 * @access  Protected (requires authentication)
 * 
 * Request body:
 * {
 *   "fileName": "video.mp4",
 *   "fileType": "video/mp4",
 *   "folder": "courses/videos" (optional),
 *   "expiresIn": 3600 (optional, in seconds)
 * }
 */
router.post("/presigned-upload", generatePresignedUrl);

/**
 * @route   POST /api/s3/verify-upload
 * @desc    Verify upload completion and save metadata
 * @access  Protected
 * 
 * Request body:
 * {
 *   "s3Url": "https://bucket.s3.region.amazonaws.com/path/file.mp4",
 *   "s3Key": "courses/videos/file.mp4",
 *   "fileName": "video.mp4",
 *   "fileSize": 50000000,
 *   "fileType": "video/mp4",
 *   "metadata": {} (optional)
 * }
 */
router.post("/verify-upload", verifyUpload);

/**
 * @route   POST /api/s3/presigned-download
 * @desc    Generate presigned URL for downloading files
 * @access  Protected
 */
router.post("/presigned-download", generateDownloadUrl);

/**
 * @route   DELETE /api/s3/delete
 * @desc    Delete file from S3
 * @access  Protected (Admin only)
 */
router.delete("/delete", deleteFile);

export default router;
