//Routes/Invoice-Routes/Invoice-Routes.js
import express from "express";
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

/**
 * User Invoice Routes
 * All routes require authentication middleware
 * IMPORTANT: Specific routes must come BEFORE generic routes to avoid Express matching issues
 */

// Get all invoices for logged-in user
// Supports query parameters: invoiceType, status, startDate, endDate
// Example: /user/invoices?invoiceType=payment&status=issued
router.get("/user/invoices", getMyInvoices);

// Get invoice statistics for user
router.get("/user/invoice/statistics", getMyInvoiceStatistics);

// Download invoice as PDF (coming soon) - MUST be before the generic :invoiceNumber route
router.get("/user/invoice/:invoiceNumber/download", downloadInvoice);

// Get invoice by payment ID
router.get("/user/invoice/payment/:paymentId", getInvoiceByPayment);

// Get invoice details by invoice number - MUST be last as it's the most generic
router.get("/user/invoice/:invoiceNumber", getInvoiceDetails);

export default router;
