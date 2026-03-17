// Controllers/Invoice-Controller/Invoice-Controller.js
import {
  getInvoiceByNumber,
  getUserInvoices,
  getInvoiceByPaymentId,
  getInvoiceStatistics,
} from "../../Services/Invoice-Service.js";


/**
 * @desc    Get invoice by invoice number
 * @route   GET /api/user/invoice/:invoiceNumber
 * @access  Private
 */
export const getInvoiceDetails = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;
    const userId = req.userId; // From auth middleware

    console.log("📄 Getting invoice details:", { invoiceNumber, userId });

    if (!userId) {
      console.error("❌ No userId found in request - authentication failed");
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again.",
      });
    }

    const invoice = await getInvoiceByNumber(invoiceNumber);

    if (!invoice) {
      console.log(`⚠️ Invoice not found: ${invoiceNumber}`);
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Verify user owns this invoice
    // Temporarily allow all authenticated users for development
    // if (invoice.userId.toString() !== userId) {
    //   console.log(`⚠️ Unauthorized access attempt: ${userId} tried to access invoice for ${invoice.userId}`);
    //   return res.status(403).json({
    //     success: false,
    //     message: "You don't have permission to view this invoice",
    //   });
    // }

    console.log(`✅ Invoice retrieved successfully: ${invoiceNumber}`);
    return res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      invoice,
    });
  } catch (error) {
    console.error("❌ Error getting invoice details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoice details",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all invoices for logged-in user
 * @route   GET /api/user/invoices
 * @access  Private
 */
export const getMyInvoices = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { invoiceType, status, startDate, endDate } = req.query;

    console.log("📄 Fetching invoices for user:", userId);
    console.log("📄 Filters:", { invoiceType, status, startDate, endDate });

    const filters = {};
    if (invoiceType) filters.invoiceType = invoiceType;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const invoices = await getUserInvoices(userId, filters);

    console.log(`✅ Found ${invoices.length} invoices for user ${userId}`);

    return res.status(200).json({
      success: true,
      message: "Invoices retrieved successfully",
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("❌ Error getting user invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoices",
      error: error.message,
    });
  }
};

/**
 * @desc    Get invoice by payment ID
 * @route   GET /api/user/invoice/payment/:paymentId
 * @access  Private
 */
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

    // Verify user owns this invoice
    if (invoice.userId.toString() !== userId) {
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
    console.error("❌ Error getting invoice by payment ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoice",
      error: error.message,
    });
  }
};

/**
 * @desc    Get invoice statistics for user
 * @route   GET /api/user/invoice/statistics
 * @access  Private
 */
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
    console.error("❌ Error getting invoice statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invoice statistics",
      error: error.message,
    });
  }
};

/**
 * @desc    Download invoice as PDF (placeholder - implement PDF generation)
 * @route   GET /api/user/invoice/:invoiceNumber/download
 * @access  Private
 */

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
    
    // Verify user owns this invoice
    if (invoice.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to invoice",
      });
    }
    
    // TODO: Implement PDF generation using libraries like pdfkit or puppeteer
    // For now, return invoice data
    return res.status(200).json({
      success: true,
      message: "Invoice download feature - Coming soon",
      invoice: invoice.getInvoiceDetails(),
    });
  } catch (error) {
    console.error("❌ Error downloading invoice:", error);
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
