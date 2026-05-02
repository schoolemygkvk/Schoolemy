import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import {
  getTopBannerSection,
  getHeroSection,
  getWhyChooseUsSection,
  getCoursesSection,
  getCategorySection,
  getWhatWeOfferSection,
  getDemoVideoSection,
  getFeedbackSection,
  getCtaSection,
} from "../../Controllers/UserDashboard/UserDashboardGetController.js";

const router = express.Router();

// ==================== GET ROUTES ====================

router.get("/top-banner", asyncHandler(getTopBannerSection));
router.get("/hero", asyncHandler(getHeroSection));
router.get("/why-choose-us", asyncHandler(getWhyChooseUsSection));
router.get("/courses", asyncHandler(getCoursesSection));
router.get("/categories", asyncHandler(getCategorySection));
router.get("/what-we-offer", asyncHandler(getWhatWeOfferSection));
router.get("/demo-video", asyncHandler(getDemoVideoSection));
router.get("/feedback", asyncHandler(getFeedbackSection));
router.get("/cta", asyncHandler(getCtaSection));

export default router;
