// Models/Invoice-Model/Invoice-Model.js
import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    // Invoice Number (Auto-generated based on type)
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    // Invoice Type
    invoiceType: {
      type: String,
      enum: ["payment", "emi", "meet", "tutor"],
      required: true,
      index: true,
    },
    
    // Sequential Number (for invoice generation)
    sequenceNumber: {
      type: Number,
      required: true,
    },
    
    // Financial Year
    financialYear: {
      type: String,
      required: true,
    },
    
    // User Information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    username: { type: String, required: true },
    email: { type: String, required: true },
    mobile: { type: String },
    studentRegisterNumber: { type: String },
    
    // Payment Reference
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      index: true,
    },
    transactionId: { type: String },
    
    // Course/Meet/Tutor Reference
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    tutorCourseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TutorCourse",
    },
    meetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseMeet",
    },
    
    // EMI Reference (if applicable)
    emiPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EMIPlan",
    },
    emiInstallmentNumber: { type: Number },
    
    // Invoice Details
    itemDescription: {
      type: String,
      required: true,
    },
    courseName: { type: String },
    CourseMotherId: { type: String },
    
    // Amount Details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      enum: ["INR", "USD"],
      default: "INR",
    },
    
    // Tax Information (if applicable)
    taxAmount: {
      type: Number,
      default: 0,
    },
    taxPercentage: {
      type: Number,
      default: 0,
    },

    // GST & Fee Breakdown (stored for accurate invoice display)
    breakdown: {
      courseValue: { type: Number, default: 0 },
      cgst: { type: Number, default: 0 },
      sgst: { type: Number, default: 0 },
      gstTotal: { type: Number, default: 0 },
      transactionFee: { type: Number, default: 0 },
    },
    
    // Payment Information
    paymentType: {
      type: String,
      enum: ["full", "emi", "emi_overdue", "emi_installment", "one-time"],
    },
    paymentMethod: {
      type: String,
      enum: [
        "UPI",
        "CARD",
        "DEBIT_CARD",
        "CREDIT_CARD",
        "NETBANKING",
        "WALLET",
        "EMI",
        "COD",
        "PAYLATER",
        "BANK_TRANSFER",
        "QR_CODE",
        "AUTO_DEBIT",
      ],
    },
    paymentGateway: {
      type: String,
      default: "cashfree",
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    
    // Invoice Status
    status: {
      type: String,
      enum: ["issued", "sent", "viewed", "paid", "cancelled"],
      default: "issued",
    },
    
    // Email Information
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: { type: Date },
    emailSentTo: { type: String },
    
    // Additional Metadata
    notes: { type: String },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying
invoiceSchema.index({ userId: 1, createdAt: -1 });
invoiceSchema.index({ invoiceType: 1, sequenceNumber: -1 });
invoiceSchema.index({ paymentId: 1 });
invoiceSchema.index({ email: 1 });

// Virtual for formatted amount
invoiceSchema.virtual("formattedAmount").get(function () {
  return `${this.currency} ${this.amount.toFixed(2)}`;
});

// Method to get invoice details as object
invoiceSchema.methods.getInvoiceDetails = function () {
  return {
    invoiceNumber: this.invoiceNumber,
    invoiceType: this.invoiceType,
    date: this.paymentDate,
    amount: this.amount,
    currency: this.currency,
    userName: this.username,
    email: this.email,
    itemDescription: this.itemDescription,
    paymentMethod: this.paymentMethod,
    transactionId: this.transactionId,
  };
};

// Static method to get next sequence number (with atomic increment to prevent race conditions)
invoiceSchema.statics.getNextSequenceNumber = async function (invoiceType, financialYear, session) {
  // Use findOneAndUpdate with $inc to atomically increment the sequence
  // This prevents race conditions when multiple payments are processed simultaneously
  
  const result = await this.findOneAndUpdate(
    {
      invoiceType,
      financialYear,
      // Find the document with the highest sequence
    },
    {},
    {
      sort: { sequenceNumber: -1 },
      select: "sequenceNumber",
      session, // Use session if provided for transaction support
    }
  );
  
  if (!result) {
    // No invoices exist for this type and year, start with 1
    return 1;
  }
  
  // Return next sequence number
  return result.sequenceNumber + 1;
};

// Static method to generate invoice number
invoiceSchema.statics.generateInvoiceNumber = function (invoiceType, financialYear, sequenceNumber) {
  const prefix = {
    payment: "INV-GKVK",
    emi: "INV-GKVK",
    meet: "MEET-GKVK",
    tutor: "TUT-GKVK",
  }[invoiceType];
  
  // Pad sequence number to 5 digits
  const paddedSequence = String(sequenceNumber).padStart(5, "0");
  
  return `${prefix}-${financialYear}-${paddedSequence}`;
};

// Static method to get current financial year
invoiceSchema.statics.getCurrentFinancialYear = function () {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  
  // Financial year: April to March
  // If current month is Jan-March (0-2), FY is (year-1)-year
  // If current month is Apr-Dec (3-11), FY is year-(year+1)
  if (month < 3) {
    return `${year - 1}-${year}`;
  } else {
    return `${year}-${year + 1}`;
  }
};

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
