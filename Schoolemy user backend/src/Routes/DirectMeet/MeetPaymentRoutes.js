import express from "express";
import {
  createMeetPaymentOrder,
  verifyMeetPayment,
  handleMeetPaymentWebhook,
  getMeetPaymentStatus
} from "../../Controllers/DirectMeet/MeetPaymentController.js";

const router = express.Router();

// Debug endpoint to test request structure
router.post("/debug-request", (req, res) => {
  console.log("📋 Debug Request Body:", JSON.stringify(req.body, null, 2));
  console.log("📋 Debug Headers:", JSON.stringify(req.headers, null, 2));
  res.json({
    success: true,
    received: req.body,
    headers: req.headers
  });
});

// Create payment order for meet
router.post("/create-order", createMeetPaymentOrder);

// Verify payment after completion
router.post("/verify", verifyMeetPayment);

// Cashfree webhook (no auth required)
router.post("/webhook/cashfree", handleMeetPaymentWebhook);

// Get payment status for a meet
router.get("/status/:meet_id/:user_id", getMeetPaymentStatus);

export default router;
