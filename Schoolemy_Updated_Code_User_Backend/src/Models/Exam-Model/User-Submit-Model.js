import mongoose from "mongoose";

const UserAnswerSchema = new mongoose.Schema({
  // FIX 2.14.4: Use questionId instead of question text for reliable matching
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  question: { type: String, required: true },
  selectedAnswer: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  marksAwarded: { type: Number, default: 0 },
});

const ExamAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    studentRegisterNumber: { type: String },
    email: { type: String },
    username: { type: String },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    CourseMotherId: { type: String },
    chapterTitle: { type: String, required: true },
    lessonName: { type: String, required: true },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamQuestion",
      required: true,
      index: true,
    },

    // Immutable exam snapshot for this attempt
    // This immutable record ensures grading consistency even if exam is modified
    // Contains complete question data at time of attempt
    examSnapshot: {
      type: {
        examId: mongoose.Schema.Types.ObjectId,
        version: Number,
        title: String,
        duration: Number,
        totalQuestions: Number,
        questions: [{
          _id: mongoose.Schema.Types.ObjectId,
          question: String,
          options: [String],
          correctAnswer: String,
          marks: Number,
        }],
        capturedAt: Date,
      },
      required: false,
      select: true,
    },

    answers: [UserAnswerSchema],
    totalMarks: { type: Number, default: 0 },
    obtainedMarks: { type: Number, default: 0 },

    // FIX 2.14.3: Add attempt number tracking
    attemptNumber: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    // FIX 2.14.2: Add exam start and end times for server-side duration enforcement
    startedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // When the exam was submitted
    submittedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // Duration in minutes that the exam took
    durationTaken: {
      type: Number,
      required: false,
    },

    // FIX 2.14.6: Timestamp from server for consistency
    serverTime: {
      type: Date,
      required: true,
      default: Date.now,
    },

    // FIX 2.14.12: Timestamp when student becomes eligible to reattempt
    // Calculated as submittedAt + cooldownPeriodHours
    nextReattemptAvailableAt: {
      type: Date,
      required: false,
    },

    // Pass/fail status
    passed: {
      type: Boolean,
      required: false,
    },

    // Exam version when attempted
    examVersion: {
      type: Number,
      default: 1,
    },

    attemptedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// One document per user/exam/attempt number
// Ensures only one attempt per user per exam per attempt number
ExamAttemptSchema.index({ userId: 1, examId: 1, attemptNumber: 1 }, { unique: true });

//export default mongoose.model("UserExamAttempt", ExamAttemptSchema);
const UserAttempt = mongoose.model("UserExamAnswer", ExamAttemptSchema);
export default UserAttempt;
