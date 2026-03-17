import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET operations
import {
  getTopBannerSection,
  getHeroSection,
  getWhyChooseUsSection,
  getCoursesSection,
  getCategorySection,
  getWhatWeOfferSection,
  getDemoVideoSection,
  getFeedbackSection,
  getCtaSection
} from '../../Controllers/UserDashboard/UserDashboardGetController.js';

// UPDATE operations
import {
  updateTopBannerSection,
  updateHeroSection,
  updateWhyChooseUsSection,
  updateCoursesSection,
  updateCategorySection,
  updateWhatWeOfferSection,
  updateDemoVideoSection,
  updateFeedbackSection,
  updateCtaSection
} from '../../Controllers/UserDashboard/UserDashboardUpdateController.js';


// Determine upload directory based on environment
const isLambda = process.env.NODE_ENV === 'lambda';
const uploadDir = isLambda 
  ? '/tmp/uploads/userdashboard'
  : path.join(__dirname, '../../../public/uploads/userdashboard');

// Create upload directory if it doesn't exist
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  console.warn('Could not create upload directory (may be in Lambda):', err.message);
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure directory exists before saving
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.warn('Failed to create upload directory:', err.message);
      }
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'userdashboard-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

// Flexible upload that accepts any field name (for dynamic field names like slide0Image, slide1Image, etc.)
const uploadAnyMiddleware = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for files
    fieldSize: 50 * 1024 * 1024, // 50MB limit for form fields (to handle base64 images in slides array)
    fields: 100, // Maximum number of non-file fields
    fieldNameSize: 100 // Maximum field name size
  },
  fileFilter: fileFilter
}).any();

// Wrapper function to handle Multer errors
const uploadAny = (req, res, next) => {
  uploadAnyMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('❌ Multer Error:', err.code, err.message);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          success: false,
          message: 'File too large. Maximum size is 10MB per file.'
        });
      }
      if (err.code === 'LIMIT_FIELD_VALUE') {
        return res.status(413).json({
          success: false,
          message: 'Field value too long. The slides array with base64 images may be too large. Maximum field size is 50MB.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(413).json({
          success: false,
          message: 'Too many files. Maximum is 100 files per request.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`
      });
    }
    if (err) {
      console.error('❌ Upload Error:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'File upload failed'
      });
    }
    next();
  });
};

// ==================== GET ROUTES (Requires Authentication) ====================

router.get('/top-banner',  getTopBannerSection);
router.get('/hero',  getHeroSection);
router.get('/why-choose-us',  getWhyChooseUsSection);
router.get('/courses',  getCoursesSection);
router.get('/categories',  getCategorySection);
router.get('/what-we-offer',  getWhatWeOfferSection);
router.get('/demo-video',  getDemoVideoSection);
router.get('/feedback',  getFeedbackSection);
router.get('/cta',  getCtaSection);

// ==================== ADMIN UPDATE ROUTES (Requires Authentication) ====================

// Update Top Banner Section (supports image uploads for banner backgrounds)
// Uses uploadAny to accept dynamic field names like slide0Image, slide1Image, etc.
router.put('/top-banner',  uploadAny, updateTopBannerSection);

// Update Hero Section (supports image uploads for main image and card images)
router.put('/hero',  uploadAny, updateHeroSection);

// Update Why Choose Us Section (supports image upload - saved as base64)
router.put('/why-choose-us',  uploadAny, updateWhyChooseUsSection);

// Update Courses Section (supports image uploads for course images)
// Uses uploadAny to accept dynamic field names like course0Image, course1Image, etc.
router.put('/courses',  uploadAny, updateCoursesSection);

// Update Category Section (supports image uploads for category images)
// Uses uploadAny to accept dynamic field names like category0Image, category1Image, etc.
router.put('/categories',  uploadAny, updateCategorySection);

// Update What We Offer Section (no image uploads needed, icons are text)
router.put('/what-we-offer',  updateWhatWeOfferSection);

// Update Demo Video Section (supports image uploads for video thumbnail and review image - saved as base64)
router.put('/demo-video',  uploadAny, updateDemoVideoSection);

// Update Feedback Section (supports image uploads for testimonial avatars)
// Uses uploadAny to accept dynamic field names like avatar0, avatar1, etc.
router.put('/feedback',  uploadAny, updateFeedbackSection);

// Update CTA Section (no image uploads needed)
router.put('/cta',  updateCtaSection);

export default router;
