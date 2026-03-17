//Routes/Payment-Routes/Payment-Routes.js
import express from "express";
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
// Migrated from Razorpay to Cashfree webhook handler
import { handleCashfreeWebhook } from "../../Controllers/Payment-controller/Webhook-Handler.js";

const router = express.Router();

// Cashfree Webhook Route (No auth required - must be before middleware)
// Migrated from /webhook/razorpay to /webhook/cashfree
router.post(
  "/webhook/cashfree",
  express.json(), // Cashfree sends JSON, not raw
  handleCashfreeWebhook
);

// Legacy Razorpay webhook (for backward compatibility during transition)
// TODO: Remove after ensuring all old payments are processed
// router.post(
//   "/webhook/razorpay",
//   express.raw({ type: "application/json" }),
//   handleRazorpayWebhook
// );

// User Payment Dashboard
// Note: createPayment accepts either courseId (regular course) or tutorCourseId (tutor course)
// Tutor courses support one-time full payment only (no EMI)
router.post("/user/payment/create", createPayment);
router.post("/user/payment/verify", verifyPayment);
router.get("/user/payment/emi-details/:courseId", getEmiDetailsForCourse);

// EMI Management Routes
router.post("/user/emi/pay-overdue", payOverdueEmis);
router.post("/user/emi/pay-monthly", payMonthlyEmi); // New: Monthly EMI payment for existing users
router.post("/user/emi/verify-payment", verifyEmiPayment); // New: Verify EMI payment after Razorpay success
router.get("/user/emi/status/:courseId", getEmiStatus);
router.get("/user/emi/due-amounts/:courseId", getEmiDueAmounts); // Get due amounts and payment options
router.get("/user/emi/monthly-due/:courseId", getMonthlyDueAmount); // New: Get monthly due amount
router.get("/user/emi/summary", getUserEmiSummary); // New: Get comprehensive EMI summary
router.get("/user/payment/status/:courseId", getPaymentStatus); // Works for both EMI and full payment users

// IMPORTANT: More specific routes must come BEFORE generic routes
// Get tutor course payments for the authenticated user
router.get("/user/payment/tutor-courses", getMyTutorCoursePayments);
// Get payment details for a specific tutor course ID
// Optional query param: ?courseType=regular or ?courseType=tutor (auto-detects if not provided)
router.get("/user/payment/tutor-course/:courseId", getPaymentForCourse);

router.get("/user/payment", getUserPayments);

router.get("/user/payment/:id", getUserPaymentById);

export default router;
