import express from "express";
import { 
  generatePresignedUrls, 
  validateS3Uploads,
  initializeMultipartUpload,
  completeMultipartUpload,
  abortMultipartUpload
} from "../../Controllers/Courses/S3UploadController.js";

const router = express.Router();

// =============================================================================
// DIRECT S3 UPLOAD ROUTES (Bypasses API Gateway payload limits)
// =============================================================================

// Generate presigned URLs for direct S3 uploads (files up to 5GB)
router.post("/s3/presigned-urls", generatePresignedUrls);

// Validate S3 uploads (check if files exist on S3)
router.post("/s3/validate-uploads", validateS3Uploads);

// =============================================================================
// MULTIPART UPLOAD ROUTES (For files > 5GB)
// =============================================================================

// Initialize multipart upload for very large files
router.post("/s3/multipart/initialize", initializeMultipartUpload);

// Complete multipart upload after all parts are uploaded
router.post("/s3/multipart/complete", completeMultipartUpload);

// Abort multipart upload if something goes wrong
router.post("/s3/multipart/abort", abortMultipartUpload);

export default router;
