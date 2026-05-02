/**
 * S3 Direct Upload Routes
 * 
 * These routes handle presigned URL generation for direct S3 uploads
 * including responsive image handling
 */

import express from "express";
import {
  generatePresignedUrl,
  verifyUpload,
  generateDownloadUrl,
  deleteFile,
} from "../../Controllers/S3-Direct-Upload/S3PresignedController.js";
import {
  generateResponsiveUploadUrls,
  processAndUploadResponsive,
  getResponsiveImageInfo,
} from "../../Controllers/S3-Direct-Upload/ResponsiveImageController.js";

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

// ============ Responsive Image Routes ============

/**
 * @route   POST /api/s3/responsive-upload
 * @desc    Generate presigned URLs for responsive image upload (multiple sizes)
 * @access  Protected
 * 
 * Request body:
 * {
 *   "fileName": "banner.jpg",
 *   "fileType": "image/jpeg",
 *   "folder": "images/banners" (optional),
 *   "sizes": ["thumbnail", "small", "medium", "large"] (optional),
 *   "outputFormat": "webp" (optional, default: webp),
 *   "expiresIn": 3600 (optional)
 * }
 * 
 * Response includes:
 * - uploadUrls: Presigned URLs for each size
 * - s3Urls: Final S3 URLs after upload
 * - srcSet: Ready-to-use srcSet string for <img> tag
 * - sizesAttribute: Ready-to-use sizes attribute
 */
router.post("/responsive-upload", generateResponsiveUploadUrls);

/**
 * @route   POST /api/s3/process-responsive
 * @desc    Server-side image processing and upload (for when client can't resize)
 * @access  Protected
 * 
 * Request body:
 * {
 *   "imageBuffer": "base64-encoded-image",
 *   "fileName": "banner.jpg",
 *   "folder": "images/banners" (optional),
 *   "outputFormat": "webp" (optional)
 * }
 */
router.post("/process-responsive", processAndUploadResponsive);

/**
 * @route   GET /api/s3/responsive-info/:s3Key
 * @desc    Get responsive image URLs for an existing image
 * @access  Protected
 */
router.get("/responsive-info/:s3Key", getResponsiveImageInfo);

export default router;
