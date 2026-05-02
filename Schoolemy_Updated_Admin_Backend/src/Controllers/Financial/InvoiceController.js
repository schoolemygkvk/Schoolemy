import Invoice from "../../Models/Financial/InvoiceModel.js";
import mongoose from "mongoose";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Helper function to escape regex special characters (prevents ReDoS)
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Create new invoice
export const createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice({
      ...req.body,
      auditLog: [
        {
          action: "Created",
          performedBy: req.user?.id,
          timestamp: new Date(),
          changes: { ...req.body },
        },
      ],
    });

    await invoice.save();
    await invoice.populate("userId", "name email mobile");

    sendSuccess(res, 201, "Created successfully", invoice,
    );
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create invoice",
      error: error.message,
    });
  }
};

// Get all invoices with filters and pagination
export const getAllInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      invoiceType,
      paymentType,
      paymentMethod,
      startDate,
      endDate,
      financialYear,
      search,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (invoiceType) query.invoiceType = invoiceType;
    if (paymentType) query.paymentType = paymentType;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (financialYear) query.financialYear = financialYear;

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) query.paymentDate.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { username: { $regex: escapeRegex(search), $options: "i" } },
        { email: { $regex: escapeRegex(search), $options: "i" } },
        { invoiceNumber: { $regex: escapeRegex(search), $options: "i" } },
        { transactionId: { $regex: escapeRegex(search), $options: "i" } },
        { studentRegisterNumber: { $regex: escapeRegex(search), $options: "i" } },
      ];
    }

    const limitNum = Math.min(parseInt(limit) || 10, 100);
    const skip = (parseInt(page) - 1) * limitNum;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate("userId", "name email mobile")
        .sort({ paymentDate: -1 })
        .skip(skip)
        .limit(limitNum),
      Invoice.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        total,
        page: parseInt(page),
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};

// Get invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findById(invoiceId)
      .populate("userId", "name email mobile")
      .populate("courseId", "courseName CourseMotherId")
      .populate("auditLog.performedBy", "name email role");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    sendSuccess(res, 200, "Success", invoice,
    );
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
};

// Get invoice by invoice number
export const getInvoiceByNumber = async (req, res) => {
  try {
    const { invoiceNumber } = req.params;

    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate("userId", "name email mobile")
      .populate("courseId", "courseName CourseMotherId")
      .populate("auditLog.performedBy", "name email role");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    res.status(200).json({
      success: true,
      invoice: invoice,
    });
  } catch (error) {
    console.error("Get invoice by number error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoice",
      error: error.message,
    });
  }
};

// Update invoice
export const updateInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const updates = req.body;

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Store old values for audit
    const oldValues = invoice.toObject();

    // Update fields
    Object.keys(updates).forEach((key) => {
      if (key !== "auditLog" && key !== "invoiceNumber") {
        invoice[key] = updates[key];
      }
    });

    // Add audit log entry
    invoice.auditLog.push({
      action: "Updated",
      performedBy: req.user?.id,
      timestamp: new Date(),
      changes: {
        old: oldValues,
        new: updates,
      },
    });

    await invoice.save();
    await invoice.populate("userId", "name email mobile");

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update invoice",
      error: error.message,
    });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Add audit log before deletion
    invoice.auditLog.push({
      action: "Deleted",
      performedBy: req.user?.id,
      timestamp: new Date(),
    });

    await invoice.save();
    await Invoice.findByIdAndDelete(invoiceId);

    res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Delete invoice error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete invoice",
      error: error.message,
    });
  }
};

// Update invoice status
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { status } = req.body;

    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const oldStatus = invoice.status;
    invoice.status = status;

    // Update emailSent if status is "sent"
    if (status === "sent" && !invoice.emailSent) {
      invoice.emailSent = true;
      invoice.emailSentAt = new Date();
    }

    invoice.auditLog.push({
      action: status.charAt(0).toUpperCase() + status.slice(1),
      performedBy: req.user?.id,
      timestamp: new Date(),
      changes: {
        old: { status: oldStatus },
        new: { status },
      },
    });

    await invoice.save();
    await invoice.populate("userId", "name email mobile");

    res.status(200).json({
      success: true,
      message: `Invoice status updated to ${status}`,
      data: invoice,
    });
  } catch (error) {
    console.error("Update invoice status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update invoice status",
      error: error.message,
    });
  }
};

// Get invoice statistics
export const getInvoiceStatistics = async (req, res) => {
  try {
    const { startDate, endDate, financialYear } = req.query;

    const matchStage = {};

    if (startDate || endDate) {
      matchStage.paymentDate = {};
      if (startDate) matchStage.paymentDate.$gte = new Date(startDate);
      if (endDate) matchStage.paymentDate.$lte = new Date(endDate);
    }

    if (financialYear) {
      matchStage.financialYear = financialYear;
    }

    const statistics = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          totalTax: { $sum: "$taxAmount" },
          avgInvoice: { $avg: "$amount" },
          maxInvoice: { $max: "$amount" },
          minInvoice: { $min: "$amount" },
        },
      },
    ]);

    const byType = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$invoiceType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const byStatus = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const byPaymentMethod = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: statistics[0] || {
          totalInvoices: 0,
          totalAmount: 0,
          totalTax: 0,
          avgInvoice: 0,
          maxInvoice: 0,
          minInvoice: 0,
        },
        byType,
        byStatus,
        byPaymentMethod,
      },
    });
  } catch (error) {
    console.error("Get invoice statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
};
