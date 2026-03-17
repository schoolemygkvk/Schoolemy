import express from "express";
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
router.post("/invoice/create", createInvoice);
router.get("/invoice/list", getAllInvoices);
router.get("/invoice/statistics", getInvoiceStatistics);
router.get("/invoice/:invoiceId", getInvoiceById);
router.get("/invoice/number/:invoiceNumber", getInvoiceByNumber);
router.put("/invoice/:invoiceId", updateInvoice);
router.delete("/invoice/:invoiceId", deleteInvoice);
router.patch("/invoice/:invoiceId/status", updateInvoiceStatus);

export default router;
