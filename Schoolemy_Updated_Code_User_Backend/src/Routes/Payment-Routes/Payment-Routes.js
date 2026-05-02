//Routes/Payment-Routes/Payment-Routes.js
import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import {
  createPayment,
  verifyPayment,
  getEmiDetailsForCourse,
  getUserPayments,
  getUserPaymentById,
  getMyTutorCoursePayments,
  getPaymentForCourse,
} from "../../Controllers/Payment-controller/Payment-Controller.js";
import {
  payOverdueEmis,
  getEmiStatus,
  getPaymentStatus,
  getEmiDueAmounts,
  getMonthlyDueAmount,
  payMonthlyEmi,
  verifyEmiPayment,
  getUserEmiSummary,
} from "../../Controllers/Emi-Controller/EmiController.js";
import {
  verifyPaymentAuth,
  verifyPaymentIntent,
  verifyPaymentSensitiveAuth,
} from "../../Middleware/PaymentAuth.js";

const router = express.Router();

// IMPORTANT: All payment routes below require authentication
// These routes expect req.userId to be set by the verifyToken middleware (from main app)

// User Payment Dashboard
// Note: createPayment accepts either courseId (regular course) or tutorCourseId (tutor course)
// Tutor courses support one-time full payment only (no EMI)
// Bug Fix 2.11.7: Added verifyPaymentAuth and verifyPaymentIntent
router.post("/user/payment/create", verifyPaymentAuth, verifyPaymentIntent, asyncHandler(createPayment));
router.post("/user/payment/verify", verifyPaymentAuth, asyncHandler(verifyPayment));
router.get("/user/payment/emi-details/:courseId", verifyPaymentAuth, asyncHandler(getEmiDetailsForCourse));

// EMI Management Routes
// Bug Fix 2.11.7: Added verifyPaymentAuth to all EMI routes
router.post("/user/emi/pay-overdue", verifyPaymentAuth, asyncHandler(payOverdueEmis));
router.post("/user/emi/pay-monthly", verifyPaymentAuth, asyncHandler(payMonthlyEmi)); // New: Monthly EMI payment for existing users
router.post("/user/emi/verify-payment", verifyPaymentAuth, asyncHandler(verifyEmiPayment)); // New: Verify EMI payment after Razorpay success
router.get("/user/emi/status/:courseId", verifyPaymentAuth, asyncHandler(getEmiStatus));
router.get("/user/emi/due-amounts/:courseId", verifyPaymentAuth, asyncHandler(getEmiDueAmounts)); // Get due amounts and payment options
router.get("/user/emi/monthly-due/:courseId", verifyPaymentAuth, asyncHandler(getMonthlyDueAmount)); // New: Get monthly due amount
router.get("/user/emi/summary", verifyPaymentAuth, asyncHandler(getUserEmiSummary)); // New: Get comprehensive EMI summary
router.get("/user/payment/status/:courseId", verifyPaymentAuth, asyncHandler(getPaymentStatus)); // Works for both EMI and full payment users

// IMPORTANT: More specific routes must come BEFORE generic routes
// Get tutor course payments for the authenticated user
// Bug Fix 2.11.7: Added verifyPaymentAuth
router.get("/user/payment/tutor-courses", verifyPaymentAuth, asyncHandler(getMyTutorCoursePayments));
// Get payment details for a specific tutor course ID
// Optional query param: ?courseType=regular or ?courseType=tutor (auto-detects if not provided)
// Bug Fix 2.11.7: Added verifyPaymentAuth
router.get("/user/payment/tutor-course/:courseId", verifyPaymentAuth, asyncHandler(getPaymentForCourse));

// Bug Fix 2.11.7: Added verifyPaymentAuth
router.get("/user/payment", verifyPaymentAuth, asyncHandler(getUserPayments));

// Bug Fix 2.11.7: Added verifyPaymentAuth and verifyPaymentSensitiveAuth
router.get("/user/payment/:id", verifyPaymentAuth, verifyPaymentSensitiveAuth, asyncHandler(getUserPaymentById));

export default router;
