// Routes/Payment-Routes.js
import express from "express";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import {
  getAllPayments,
  getTutorCoursePaymentHistory,
  calculateAdminPaymentToTutors,
  calculateAdminPaymentForLoggedInTutor,
  getTutorCommissionDue,
  getTutorCommissionPaymentDetails,
  markTutorCommissionPaid,
  markTutorCommissionPending,
} from "../../Controllers/Payment/payment-controller.js";

const router = express.Router();

// All payments (existing)
router.get("/payments", verifyToken, getAllPayments);

// Payments filtered by TutorCourse / Tutor with tutor name
router.get("/tutor-course-payments", verifyToken, getTutorCoursePaymentHistory);

// Calculate admin payment to tutors based on completed payments
router.get("/calculate-admin-payments", verifyToken, calculateAdminPaymentToTutors);

// Get admin-style payment summary, but only for the logged-in tutor
// Same response shape as /calculate-admin-payments (admin endpoint),
// but scoped to the authenticated tutor.
router.get(
  "/tutor/calculate-admin-payments",
  calculateAdminPaymentForLoggedInTutor
);

// Tutor Commission Due - 15-day commission list, hierarchy by period
router.get("/tutor-commission-due", getTutorCommissionDue);
router.get("/tutor-commission-due-details", getTutorCommissionPaymentDetails);
router.post("/tutor-commission/mark-paid", verifyToken, markTutorCommissionPaid);
router.post("/tutor-commission/mark-pending", verifyToken, markTutorCommissionPending);

export default router;
