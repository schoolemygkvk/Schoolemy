import { Schema, model } from "mongoose";

// Course-based Meet Schema
const courseMeetSchema = new Schema(
  {
    meet_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    course_id: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    course_name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    meet_date: {
      type: Date,
      required: true,
    },
    meet_time: {
      type: String,
      required: true,
    },
    duration_minutes: {
      type: Number,
      required: true,
      min: [15, "Duration must be at least 15 minutes"],
    },
    meet_type: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
      required: true,
    },
    meet_link: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    is_paid_meet: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
      index: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: "Admin-data-login",
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    // Material upload settings
    material_access_type: {
      type: String,
      enum: ["all", "attended_only"],
      default: "attended_only",
    },
    attendance_days_limit: {
      type: Number,
      default: 1,
      min: 1,
      max: 7,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual: Check if meet has started
courseMeetSchema.virtual('has_started').get(function() {
  return new Date() >= this.meet_date;
});

// Virtual: Check if meet has ended
courseMeetSchema.virtual('has_ended').get(function() {
  const meetEndTime = new Date(this.meet_date.getTime() + this.duration_minutes * 60000);
  return new Date() >= meetEndTime;
});

// Indexes for performance
courseMeetSchema.index({ course_id: 1, meet_date: 1 });
courseMeetSchema.index({ category: 1, status: 1 });
courseMeetSchema.index({ meet_date: 1, status: 1 });

const CourseMeet = model("CourseMeet", courseMeetSchema);

export default CourseMeet;
