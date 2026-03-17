import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      index: true,
    },
    invoiceType: {
      type: String,
      enum: ["emi", "full", "course", "tutor", "meet", "other"],
      required: true,
    },
    sequenceNumber: {
      type: Number,
      required: true,
    },
    financialYear: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    studentRegisterNumber: {
      type: String,
      trim: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
    },
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
      ref: "DirectMeet",
    },
    itemDescription: {
      type: String,
      required: true,
      trim: true,
    },
    courseName: {
      type: String,
      trim: true,
    },
    CourseMotherId: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR", "GBP"],
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    paymentType: {
      type: String,
      enum: ["emi", "full", "partial", "other"],
      default: "full",
    },
    paymentMethod: {
      type: String,
      enum: [
        "DEBIT_CARD",
        "CREDIT_CARD",
        "NET_BANKING",
        "UPI",
        "WALLET",
        "CASH",
        "CHEQUE",
        "OTHER",
      ],
      default: "OTHER",
    },
    paymentGateway: {
      type: String,
      enum: ["cashfree", "razorpay", "stripe", "paypal", "manual", "other"],
      default: "other",
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["issued", "sent", "viewed", "paid", "cancelled", "refunded"],
      default: "issued",
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    auditLog: [
      {
        action: {
          type: String,
          enum: [
            "Created",
            "Updated",
            "Sent",
            "Viewed",
            "Paid",
            "Cancelled",
            "Refunded",
            "Deleted",
          ],
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Admin-data-login",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        changes: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
invoiceSchema.index({ userId: 1 });
invoiceSchema.index({ paymentDate: -1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ financialYear: 1 });
invoiceSchema.index({ email: 1 });
invoiceSchema.index({ transactionId: 1 });

// Generate invoice number before saving (financial year Apr 1 - Mar 31)
invoiceSchema.pre("save", async function (next) {
  if (!this.invoiceNumber) {
    const docDate = this.paymentDate ? new Date(this.paymentDate) : new Date();
    const fyStartYear =
      docDate.getMonth() + 1 >= 4
        ? docDate.getFullYear()
        : docDate.getFullYear() - 1;
    const fyStart = new Date(fyStartYear, 3, 1);
    const fyEnd = new Date(fyStartYear + 1, 3, 1);

    const count = await mongoose.models.Invoice.countDocuments({
      paymentDate: { $gte: fyStart, $lt: fyEnd },
    });

    const fyLabel = `${fyStartYear}-${fyStartYear + 1}`; // e.g. 2025-2026
    this.financialYear = fyLabel;
    this.sequenceNumber = count + 1;
    this.invoiceNumber = `INV-GKVK-${fyLabel}-${String(count + 1).padStart(5, "0")}`;
  }
  next();
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
