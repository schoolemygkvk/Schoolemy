//Routes/Payment-Routes/Webhook-Routes.js
// Separate router for webhooks to ensure they're not protected by auth middleware
import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import { handleCashfreeWebhook } from "../../Controllers/Payment-controller/Webhook-Handler.js";

const router = express.Router();

// Cashfree Webhook Route
// CRITICAL: This route handles raw request body for signature verification
// The express.raw() middleware here ensures the body is a Buffer, not a parsed object
// Signature verification MUST use the original raw bytes from Cashfree
router.post(
  "/webhook/cashfree",
  express.raw({ type: "application/json" }), // Raw buffer for signature verification
  asyncHandler(handleCashfreeWebhook),
);

export default router;
