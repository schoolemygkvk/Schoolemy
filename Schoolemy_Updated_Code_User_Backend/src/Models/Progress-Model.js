import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // Progress percentage (0-100)
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Timestamp of last update
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    // Session info
    duration: {
      type: Number, // seconds watched/listened
      default: 0,
    },
    currentTime: {
      type: Number, // Current playback position in seconds
      default: 0,
    },
    // Status: "not-started", "in-progress", "completed"
    status: {
      type: String,
      enum: ["not-started", "in-progress", "completed"],
      default: "not-started",
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient lookups
progressSchema.index({ userId: 1, courseId: 1 });
progressSchema.index({ userId: 1, courseId: 1, lessonId: 1 });
progressSchema.index({ lastAccessed: -1 });

export default mongoose.models.Progress ||
  mongoose.model("Progress", progressSchema);
