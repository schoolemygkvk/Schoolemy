//Routes/Invoice-Routes/Invoice-Routes.js
import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import {
  getInvoiceDetails,
  getMyInvoices,
  getInvoiceByPayment,
  getMyInvoiceStatistics,
  downloadInvoice,
} from "../../Controllers/Invoice-Controller/Invoice-Controller.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication to all invoice routes
router.use(verifyToken);



// Get all invoices for logged-in user
// Supports query parameters: invoiceType, status, startDate, endDate
// Example: /user/invoices?invoiceType=payment&status=issued
router.get("/user/invoices", asyncHandler(getMyInvoices));

// Get invoice statistics for user
router.get("/user/invoice/statistics", asyncHandler(getMyInvoiceStatistics));

// Download invoice as PDF (coming soon) - MUST be before the generic :invoiceNumber route
router.get("/user/invoice/:invoiceNumber/download", asyncHandler(downloadInvoice));

// Get invoice by payment ID
router.get("/user/invoice/payment/:paymentId", asyncHandler(getInvoiceByPayment));

// Get invoice details by invoice number - MUST be last as it's the most generic
router.get("/user/invoice/:invoiceNumber", asyncHandler(getInvoiceDetails));

export default router;
