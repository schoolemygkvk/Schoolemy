import  logger  from "../../Utils/logger.js";

import {
  getInvoiceByNumber,
  getUserInvoices,
  getInvoiceByPaymentId,
  getInvoiceStatistics,
} from "../../Services/Invoice-Service.js";


const invoiceOwnerIdString = (invoice) => {
  const uid = invoice?.userId;
  if (uid == null) return null;
  if (typeof uid === "object" && uid._id != null) {
    return String(uid._id);
  }
  return String(uid);
};

const isInvoiceOwner = (invoice, sessionUserId) => {
  if (sessionUserId == null) return false;
  const owner = invoiceOwnerIdString(invoice);
  if (!owner) return false;
  return owner === String(sessionUserId);
};

export const getInvoiceDetails = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const userId = req.userId; // From auth middleware

    logger.debug(" Getting invoice details:", { invoiceNumber, userId });

    if (!userId) {
      logger.error(" No userId found in request - authentication failed");
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again.",
      });
    }

    const invoice = await getInvoiceByNumber(invoiceNumber);

    if (!invoice) {
      logger.debug(` Invoice not found: ${invoiceNumber}`);
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Verify ownership: Invoice must belong to the logged-in user
    if (!isInvoiceOwner(invoice, userId)) {
      logger.error(` Unauthorized access attempt: User ${userId} tried to access invoice owned by ${invoiceOwnerIdString(invoice)}`);
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this invoice",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      invoice,
    });
  } catch (error) {
    logger.error(" Error getting invoice details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoice details",
      error: error.message,
    });
  }
};


export const getMyInvoices = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { invoiceType, status, startDate, endDate } = req.query;


    const filters = {};
    if (invoiceType) filters.invoiceType = invoiceType;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const invoices = await getUserInvoices(userId, filters);

    logger.debug(` Found ${invoices.length} invoices for user ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Invoices retrieved successfully",
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    logger.error(" Error getting user invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoices",
      error: error.message,
    });
  }
};


export const getInvoiceByPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const userId = req.userId; // From auth middleware

    const invoice = await getInvoiceByPaymentId(paymentId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found for this payment",
      });
    }

    if (!isInvoiceOwner(invoice, userId)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to invoice",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      invoice,
    });
  } catch (error) {
    logger.error(" Error getting invoice by payment ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoice",
      error: error.message,
    });
  }
};


export const getMyInvoiceStatistics = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware

    const statistics = await getInvoiceStatistics(userId);

    return res.status(200).json({
      success: true,
      message: "Invoice statistics retrieved successfully",
      statistics,
    });
  } catch (error) {
    logger.error(" Error getting invoice statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoice statistics",
      error: error.message,
    });
  }
};



export const downloadInvoice = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const userId = req.userId; // From auth middleware

    const invoice = await getInvoiceByNumber(invoiceNumber);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }


    if (!isInvoiceOwner(invoice, userId)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to invoice",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice download feature - Coming soon",
      invoice: invoice.getInvoiceDetails(),
    });
  } catch (error) {
    logger.error(" Error downloading invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download invoice",
      error: error.message,
    });
  }
};

export default {
  getInvoiceDetails,
  getMyInvoices,
  getInvoiceByPayment,
  getMyInvoiceStatistics,
  downloadInvoice,
};
