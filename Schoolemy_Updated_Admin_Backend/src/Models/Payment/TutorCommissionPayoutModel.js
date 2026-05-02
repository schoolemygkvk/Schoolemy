// Models/Payment/TutorCommissionPayoutModel.js
// Tracks 15-day commission payout status per tutor per period
import mongoose from "mongoose";

const tutorCommissionPayoutSchema = new mongoose.Schema(
  {
    tutorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tutor",
      required: true,
      index: true,
    },
    periodId: {
      type: String,
      required: true,
      index: true,
      // Format: "2026-02-01_to_2026-02-15" (15-day period)
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
      set: (v) => parseFloat(v.toFixed(2)),
    },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index: one record per tutor per period
tutorCommissionPayoutSchema.index(
  { tutorId: 1, periodId: 1 },
  { unique: true }
);

const TutorCommissionPayout = mongoose.model(
  "TutorCommissionPayout",
  tutorCommissionPayoutSchema
);
export default TutorCommissionPayout;
