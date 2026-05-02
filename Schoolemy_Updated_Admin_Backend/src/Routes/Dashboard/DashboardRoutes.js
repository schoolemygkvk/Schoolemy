

import express from "express";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import { checkRole } from "../../Middleware/checkRole.js";
import {
  getEmiMonthlyStats,
  getEnrollmentMonthlyStats,
  getCourseCompletionRate,
  getDashboardOverview,
  getRevenueTrends
} from "../../Controllers/Dashboard/DashboardAnalyticsController.js";

const router = express.Router();


router.get("/emi-monthly-stats", verifyToken, checkRole(['admin', 'finance', 'superadmin']), getEmiMonthlyStats);


router.get("/enrollment-monthly-stats", verifyToken, checkRole(['admin', 'usermanagement', 'superadmin']), getEnrollmentMonthlyStats);


router.get("/completion-rate", verifyToken, checkRole(['admin', 'superadmin']), getCourseCompletionRate);


router.get("/overview", verifyToken, checkRole(['admin', 'superadmin']), getDashboardOverview);


router.get("/revenue-trends", verifyToken, checkRole(['admin', 'finance', 'superadmin']), getRevenueTrends);

export default router;
