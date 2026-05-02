import express from 'express';
import multer from 'multer';

const router = express.Router();

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

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Flexible upload using memory storage for S3 upload
const uploadAnyMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    fields: 100, // Maximum number of non-file fields
    fieldNameSize: 100 // Maximum field name size
  },
  fileFilter: fileFilter
}).any();

// Wrapper function to handle Multer errors
const uploadAny = (req, res, next) => {
  uploadAnyMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('Multer Error:', err.code, err.message);
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
      console.error('Upload Error:', err);
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

// Update Hero Section (supports image uploads for main image and card images - uploaded to S3)
router.put('/hero',  uploadAny, updateHeroSection);

// Update Why Choose Us Section (supports image upload - uploaded to S3)
router.put('/why-choose-us',  uploadAny, updateWhyChooseUsSection);

// Update Courses Section (supports image uploads for course images - uploaded to S3)
// Uses uploadAny to accept dynamic field names like course0Image, course1Image, etc.
router.put('/courses',  uploadAny, updateCoursesSection);

// Update Category Section (supports image uploads for category images - uploaded to S3)
// Uses uploadAny to accept dynamic field names like category0Image, category1Image, etc.
router.put('/categories',  uploadAny, updateCategorySection);

// Update What We Offer Section (no image uploads needed, icons are text)
router.put('/what-we-offer',  updateWhatWeOfferSection);

// Update Demo Video Section (supports image uploads for video thumbnail and review image - uploaded to S3)
router.put('/demo-video',  uploadAny, updateDemoVideoSection);

// Update Feedback Section (supports image uploads for testimonial avatars - uploaded to S3)
// Uses uploadAny to accept dynamic field names like avatar0, avatar1, etc.
router.put('/feedback',  uploadAny, updateFeedbackSection);

// Update CTA Section (no image uploads needed)
router.put('/cta',  updateCtaSection);

export default router;
