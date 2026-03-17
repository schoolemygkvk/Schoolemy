import express from 'express';
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

const router = express.Router();

// ==================== GET ROUTES ====================

router.get('/top-banner', getTopBannerSection);
router.get('/hero', getHeroSection);
router.get('/why-choose-us', getWhyChooseUsSection);
router.get('/courses', getCoursesSection);
router.get('/categories', getCategorySection);
router.get('/what-we-offer', getWhatWeOfferSection);
router.get('/demo-video', getDemoVideoSection);
router.get('/feedback', getFeedbackSection);
router.get('/cta', getCtaSection);

export default router;
