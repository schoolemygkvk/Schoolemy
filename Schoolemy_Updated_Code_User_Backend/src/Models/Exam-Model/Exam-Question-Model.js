import mongoose from "mongoose";

const QuestionItemSchema = new mongoose.Schema({
  question: { type: String, required: true, index: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  marks: { type: Number, required: true },
});

const ExamSchema = new mongoose.Schema(
  {
    // FIX 2.14.1: Add courseId reference for reliable exam queries (instead of coursename)
    // Using ObjectId is more reliable than string matching
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false, // Made optional for backward compatibility with existing data
      index: true,
    },

    // Keep coursename for backward compatibility but prefer courseId for new queries
    coursename: { type: String, required: true, index: true },
    chapterTitle: { type: String, required: true, index: true },
    examinationName: { type: String, required: true, index: true },
    subject: { type: String, required: true, index: true },
    totalMarks: { type: Number, required: true },
    examQuestions: [QuestionItemSchema],

    // FIX 2.14.2: Add exam duration (minutes) for server-side enforcement
    // Prevents tampering with frontend timer
    durationMinutes: {
      type: Number,
      required: true,
      default: 60,
      min: 1,
      max: 480, // 8 hour max exam
    },

    // FIX 2.14.3: Add reattempt policy configuration
    // Controls how many times a user can attempt this exam
    maxAttempts: {
      type: Number,
      required: true,
      default: 3, // Default: three attempts allowed
      min: 1,
      max: 10,
    },

    // FIX 2.14.8: Cooldown period between attempts (in hours)
    // Prevents students from immediately retaking exams
    cooldownPeriodHours: {
      type: Number,
      required: false,
      default: 24, // Default: 24 hours between attempts
      min: 0, // 0 = no cooldown
      max: 720, // Max 30 days
    },

    // FIX 2.14.9: Minimum score requirement to allow reattempt
    // Percentage of total marks (0-100)
    // If previous score < this, student cannot reattempt
    minScoreForReattempt: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
    },

    // Passing score (percentage) - optional
    passingScore: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
    },

    // Whether this exam is mandatory to complete the course
    isMandatory: {
      type: Boolean,
      default: true,
    },

    // FIX 2.14.10: Course type for policy application
    // Different policies can apply to regular, EMI, or tutoring courses
    courseType: {
      type: String,
      enum: ["regular", "emi", "tutoring"],
      default: "regular",
    },

    // FIX 2.14.11: Allow passing students to reattempt for better score
    allowReattemptAfterPass: {
      type: Boolean,
      default: false, // Default: no reattempt after passing
    },

    // Version number for tracking exam modifications
    // Increment when questions/answers change
    version: {
      type: Number,
      default: 1,
    },

    uploadDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

ExamSchema.index({ coursename: 1, chapterTitle: 1 });

const ExamQuestion = mongoose.model("ExamQuestion", ExamSchema);
export default ExamQuestion;