//Models/Complaint-Model/Complaint-Model.js
import { Schema, model } from "mongoose";

const complaintSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    regNo: {
      type: String,
      trim: true,
      default: null,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ["Technical", "Billing", "Course Content", "Account", "Other"],
      default: "Other",
    },
    status: {
      type: String,
      enum: ["pending", "resolved"],
      default: "pending",
    },
    adminResponse: {
      type: String,
      trim: true,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  },
);

// Index for efficient queries
complaintSchema.index({ userId: 1, createdAt: -1 });
complaintSchema.index({ status: 1, createdAt: -1 });

const Complaint = model("Complaint", complaintSchema);

export default Complaint;
