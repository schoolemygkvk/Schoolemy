import  logger from "../Utils/logger.js";

import Invoice from "../Models/Invoice-Model/Invoice-Model.js";
import mongoose from "mongoose";


export const createInvoice = async (invoiceData) => {
  const maxRetries = 5; // Maximum number of retry attempts for duplicate key errors
  let attempt = 0;

  while (attempt < maxRetries) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        invoiceType,
        userId,
        username,
        email,
        mobile,
        studentRegisterNumber,
        paymentId,
        transactionId,
        courseId,
        tutorCourseId,
        meetId,
        emiPlanId,
        emiInstallmentNumber,
        itemDescription,
        courseName,
        CourseMotherId,
        amount,
        currency,
        taxAmount,
        taxPercentage,
        paymentType,
        paymentMethod,
        paymentGateway,
        paymentDate,
        notes,
        metadata,
      } = invoiceData;

      // Get current financial year
      const financialYear = Invoice.getCurrentFinancialYear();

      // Determine the invoice prefix (payment and emi share the same INV-GKVK prefix)
      const prefixMap = {
        payment: "INV-GKVK",
        emi: "INV-GKVK",
        meet: "MEET-GKVK",
        tutor: "TUT-GKVK",
      };

      const prefix = prefixMap[invoiceType];

      // Get next sequence number by finding the highest sequence across all invoice types with the same prefix
      // This prevents race conditions between 'payment' and 'emi' types which share INV-GKVK prefix
      const typesWithSamePrefix = Object.keys(prefixMap).filter(key => prefixMap[key] === prefix);

      const lastInvoice = await Invoice.findOne({
        invoiceType: { $in: typesWithSamePrefix },
        financialYear,
      })
        .sort({ sequenceNumber: -1 })
        .select("sequenceNumber")
        .session(session);

      const sequenceNumber = lastInvoice ? lastInvoice.sequenceNumber + 1 : 1;

      // Generate invoice number
      const invoiceNumber = Invoice.generateInvoiceNumber(
        invoiceType,
        financialYear,
        sequenceNumber,
      );

      logger.debug(` Attempt ${attempt + 1}: Generating invoice ${invoiceNumber} with sequence ${sequenceNumber}`);

      // Create invoice
      const invoice = new Invoice({
        invoiceNumber,
        invoiceType,
        sequenceNumber,
        financialYear,
        userId,
        username,
        email,
        mobile,
        studentRegisterNumber,
        paymentId,
        transactionId,
        courseId,
        tutorCourseId,
        meetId,
        emiPlanId,
        emiInstallmentNumber,
        itemDescription,
        courseName,
        CourseMotherId,
        amount,
        currency: currency || "INR",
        taxAmount: taxAmount || 0,
        taxPercentage: taxPercentage || 0,
        paymentType,
        paymentMethod,
        paymentGateway: paymentGateway || "cashfree",
        paymentDate: paymentDate || new Date(),
        status: "issued",
        emailSent: false,
        notes,
        metadata: metadata || {},
      });

      await invoice.save({ session });
      await session.commitTransaction();

      logger.debug(` Invoice created: ${invoiceNumber}`);
      return invoice;
    } catch (error) {
      await session.abortTransaction();

      // Check if it's a duplicate key error (code 11000)
      if (error.code === 11000 && error.message.includes("invoiceNumber")) {
        attempt++;
        logger.warn(` Duplicate invoice number detected (attempt ${attempt}/${maxRetries}). Retrying...`);

        if (attempt < maxRetries) {
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue; // Retry
        } else {
          logger.error(` Failed to create invoice after ${maxRetries} attempts due to duplicate key`);
          throw new Error(`Failed to generate unique invoice number after ${maxRetries} attempts`);
        }
      }

      // For other errors, throw immediately
      logger.error(" Error creating invoice:", error);
      throw error;
    } finally {
      session.endSession();
    }
  }
};


export const getInvoiceByNumber = async (invoiceNumber) => {
  try {
    const invoice = await Invoice.findOne({ invoiceNumber })
      .populate("userId", "username email mobile studentRegisterNumber")
      .populate("courseId", "coursename price")
      .populate("tutorCourseId", "coursename price")
      .populate("meetId", "meetTitle meetDate")
      .populate("emiPlanId", "emiPeriod totalAmount");

    return invoice;
  } catch (error) {
    logger.error(" Error getting invoice:", error);
    throw error;
  }
};


export const getUserInvoices = async (userId, filters = {}) => {
  try {
    const query = {};

    // If userId is provided, filter by it; otherwise, get all (for admin)
    if (userId) {
      query.userId = userId;
    }

    // Apply filters
    if (filters.invoiceType) {
      query.invoiceType = filters.invoiceType;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.startDate && filters.endDate) {
      query.paymentDate = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .populate("courseId", "coursename")
      .populate("tutorCourseId", "coursename")
      .populate("meetId", "meetTitle");

    return invoices;
  } catch (error) {
    logger.error(" Error getting user invoices:", error);
    throw error;
  }
};


export const getInvoiceByPaymentId = async (paymentId) => {
  try {
    const invoice = await Invoice.findOne({ paymentId })
      .populate("userId", "username email mobile")
      .populate("courseId", "coursename")
      .populate("tutorCourseId", "coursename")
      .populate("meetId", "meetTitle");

    return invoice;
  } catch (error) {
    logger.error(" Error getting invoice by payment ID:", error);
    throw error;
  }
};


export const markInvoiceAsSent = async (invoiceId, emailAddress) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      invoiceId,
      {
        emailSent: true,
        emailSentAt: new Date(),
        emailSentTo: emailAddress,
        status: "sent",
      },
      { new: true },
    );

    logger.debug(` Invoice marked as sent: ${invoice.invoiceNumber}`);
    return invoice;
  } catch (error) {
    logger.error(" Error marking invoice as sent:", error);
    throw error;
  }
};


export const updateInvoiceStatus = async (invoiceNumber, status) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { invoiceNumber },
      { status },
      { new: true },
    );

    return invoice;
  } catch (error) {
    logger.error(" Error updating invoice status:", error);
    throw error;
  }
};


export const getInvoiceStatistics = async (userId = null) => {
  try {
    const matchStage = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};

    const stats = await Invoice.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$invoiceType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    return stats;
  } catch (error) {
    logger.error(" Error getting invoice statistics:", error);
    throw error;
  }
};

export default {
  createInvoice,
  getInvoiceByNumber,
  getUserInvoices,
  getInvoiceByPaymentId,
  markInvoiceAsSent,
  updateInvoiceStatus,
  getInvoiceStatistics,
};
