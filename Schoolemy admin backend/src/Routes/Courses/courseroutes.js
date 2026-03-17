import express from "express";
import multer from "multer";
import {
  createCourse,
  createCourseWithS3Urls,
  getCourseNames,
  getCourseByName,
  updateCourse,
  updateCourseWithS3Urls,
  getCoursesByCategory
} from "../../Controllers/Courses/coursecontroller.js";
import { deleteCourse } from "../../Controllers/Courses/DeleteCourseController.js";
import { generateCourseUploadUrls, validateCourseUploads } from "../../Controllers/Courses/S3CourseUploadController.js";

// Initialize router
const router = express.Router();

// Multer config: store uploaded files in memory with size limits
// NOTE: For files > 100MB, consider using direct S3 upload via /api/s3/presigned-urls
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size (for API route uploads)
    files: 100, // Max 100 files per request
    fieldSize: 50 * 1024 * 1024, // 50MB max field value size
  }
});

// Multer error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer Error:', err.code, err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large. Maximum size is 500MB per file.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({
        success: false,
        error: 'Too many files. Maximum is 100 files per request.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }
  if (err) {
    console.error('❌ Upload Error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'File upload failed'
    });
  }
  next();
};

// Wrapper to handle multer errors properly
const uploadWithErrorHandling = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      return handleMulterError(err, req, res, next);
    }
    next();
  });
};

// =============================================================================
// COURSE ROUTES
// =============================================================================

// POST - Generate presigned URLs for direct S3 upload (STEP 1 of S3 workflow)
// ✅ Bypasses API Gateway's 10MB limit completely
// ✅ Returns presigned URLs that frontend can use to upload directly to S3
// Call this FIRST to get upload URLs, then upload files, then call create-with-s3-urls
router.post("/generate-upload-urls", generateCourseUploadUrls);

// POST - Validate that files were uploaded to S3 successfully (STEP 2, optional)
router.post("/validate-uploads", validateCourseUploads);

// POST - Create course using S3 URLs (no file uploads, RECOMMENDED - STEP 3)
// ✅ Supports unlimited file sizes (up to 5GB per file)
// ✅ Bypasses API Gateway's 10MB limit
// ✅ ZERO 413 errors
// Workflow:
// 1. Call POST /api/courses/generate-upload-urls to get presigned URLs
// 2. Upload files directly to S3 using those URLs
// 3. Call this endpoint with the S3 URLs + course metadata
router.post("/create-with-s3-urls", createCourseWithS3Urls);

// POST - Create a new course with multimedia files (LEGACY)
// ⚠️ LIMITED to 10MB total payload (API Gateway limit)
// ⚠️ May cause 413 errors with large files
// For large files (>10MB), use create-with-s3-urls instead
router.post("/createcourses", uploadWithErrorHandling, createCourse);

// GET - Retrieve courses name
router.get("/getcoursesname", getCourseNames );

// GET - Retrieve courses by category (MUST be before generic :coursename route)
router.get("/courses/category/:categoryName", getCoursesByCategory);

// GET - Retrieve specific course by name
router.get("/courses/:coursename", getCourseByName);

// PUT - Update course by ID (add chapters/lessons/media)
// WARNING: Limited to 500MB total payload. For larger files, use update-with-urls
// Support both /course/update/:coursename and /update/:coursename (→ /api/courses/update/:coursename)
router.put("/course/update/:coursename", uploadWithErrorHandling, updateCourse);
router.put("/update/:coursename", uploadWithErrorHandling, updateCourse);

// PUT - Update course with pre-uploaded S3 URLs (lightweight, no file upload)
// ✅ RECOMMENDED: Use this to avoid 413 payload size errors
// 1. First, get presigned URLs: POST /api/s3/presigned-urls
// 2. Upload files directly to S3 using those URLs
// 3. Then call this endpoint with the S3 URLs
router.put("/course/update-with-urls/:coursename", updateCourseWithS3Urls);

// DELETE - Delete course and all associated data (question papers and S3 files)
router.delete("/course/delete/:coursename", deleteCourse);

export default router;
