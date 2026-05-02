import mongoose from "mongoose";


const coursePlayerStateSchema = new mongoose.Schema(
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
    completedLessons: { type: [String], default: [] },
    attemptedExams: { type: mongoose.Schema.Types.Mixed, default: {} },
    certificateEmailSentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

coursePlayerStateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const CoursePlayerState = mongoose.model(
  "CoursePlayerState",
  coursePlayerStateSchema,
);
export default CoursePlayerState;
