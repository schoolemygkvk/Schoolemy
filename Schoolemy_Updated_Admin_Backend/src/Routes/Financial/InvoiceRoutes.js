import express from "express";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import { checkRole } from "../../Middleware/checkRole.js";
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getInvoiceByNumber,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  getInvoiceStatistics,
} from "../../Controllers/Financial/InvoiceController.js";

const router = express.Router();

// Invoice routes
router.post("/invoice/create", verifyToken, checkRole(['admin', 'finance']), createInvoice);
router.get("/invoice/list", verifyToken, checkRole(['admin', 'finance']), getAllInvoices);
router.get("/invoice/statistics", verifyToken, checkRole(['admin', 'finance']), getInvoiceStatistics);
router.get("/invoice/:invoiceId", verifyToken, checkRole(['admin', 'finance']), getInvoiceById);
router.get("/invoice/number/:invoiceNumber", verifyToken, checkRole(['admin', 'finance']), getInvoiceByNumber);
router.put("/invoice/:invoiceId", verifyToken, checkRole(['admin', 'finance']), updateInvoice);
router.delete("/invoice/:invoiceId", verifyToken, checkRole(['admin', 'finance']), deleteInvoice);
router.patch("/invoice/:invoiceId/status", verifyToken, checkRole(['admin', 'finance']), updateInvoiceStatus);

export default router;
