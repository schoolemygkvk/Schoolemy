/**
 * AWS S3 Multipart Upload Routes
 * 
 * Handles LARGE file uploads (GBs) via S3 multipart upload
 * Backend NEVER receives file data - only coordinates the upload
 */

import express from "express";
import {
  startMultipartUpload,
  getPresignedUrlForPart,
  completeMultipartUpload,
  abortMultipartUpload,
} from "../../Controllers/S3-Direct-Upload/S3MultipartController.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";

const router = express.Router();

/**
 * @route   POST /api/s3/multipart/start
 * @desc    Initialize multipart upload session
 * @access  Private (requires authentication)
 * @body    { fileName, fileType, folder }
 * @returns { uploadId, objectKey, fileUrl }
 */
router.post("/multipart/start", verifyToken, startMultipartUpload);

/**
 * @route   POST /api/s3/multipart/presign
 * @desc    Generate pre-signed URL for uploading a specific part
 * @access  Private (requires authentication)
 * @body    { uploadId, objectKey, partNumber }
 * @returns { presignedUrl, partNumber, expiresIn }
 */
router.post("/multipart/presign", verifyToken, getPresignedUrlForPart);

/**
 * @route   POST /api/s3/multipart/complete
 * @desc    Complete multipart upload and assemble all parts
 * @access  Private (requires authentication)
 * @body    { uploadId, objectKey, parts: [{ ETag, PartNumber }] }
 * @returns { fileUrl, objectKey, location }
 */
router.post("/multipart/complete", verifyToken, completeMultipartUpload);

/**
 * @route   POST /api/s3/multipart/abort
 * @desc    Abort multipart upload and cleanup
 * @access  Private (requires authentication)
 * @body    { uploadId, objectKey }
 * @returns { message }
 */
router.post("/multipart/abort", verifyToken, abortMultipartUpload);

export default router;
