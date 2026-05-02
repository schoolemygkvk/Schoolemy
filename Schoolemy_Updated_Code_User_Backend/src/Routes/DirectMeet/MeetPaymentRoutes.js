import  logger  from "../../Utils/logger.js";

import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";

import {
  createMeetPaymentOrder,
  verifyMeetPayment,
  handleMeetPaymentWebhook,
  getMeetPaymentStatus,
} from "../../Controllers/DirectMeet/MeetPaymentController.js";

const router = express.Router();

// Debug endpoint to test request structure
router.post("/debug-request", (req, res) => {
  logger.debug(" Debug Request Body:", JSON.stringify(req.body, null, 2));
  logger.debug(" Debug Headers:", JSON.stringify(req.headers, null, 2));
  res.json({
    success: true,
    received: req.body,
    headers: req.headers,
  });
});

// Create payment order for meet
router.post("/create-order", asyncHandler(createMeetPaymentOrder));

// Verify payment after completion
router.post("/verify", asyncHandler(verifyMeetPayment));

// Cashfree webhook (no auth required)
router.post("/webhook/cashfree", asyncHandler(handleMeetPaymentWebhook));

// Get payment status for a meet
router.get("/status/:meet_id/:user_id", asyncHandler(getMeetPaymentStatus));

export default router;
