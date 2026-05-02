//exam-mark-records-model.js
import mongoose from 'mongoose';

const examMarkSchema = new mongoose.Schema(
  {
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    studentId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    // Course and Category Information
    courseName: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    chapterTitle: {
      type: String,
      required: false,
      trim: true,
    },
    examinationName: {
      type: String,
      required: false,
      trim: true,
    },
    subject: {
      type: String,
      required: false,
      trim: true,
    },
    // Exam Results
    grade: {
      type: String,
      required: true,
      enum: ['A+', 'A', 'B', 'C', 'D', 'E', 'F'],
      default: null,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    mark: {
      type: Number,
      required: true,
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: false,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pass', 'Fail', 'Absent'],
      default: null,
    },
    // Additional Information
    remarks: {
      type: String,
      required: false,
      trim: true,
    },
    examDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true, 
  }
);

// Add compound index for efficient querying
examMarkSchema.index({ studentId: 1, courseName: 1 });
examMarkSchema.index({ courseName: 1, category: 1 });

// Now safe to use UserExamAnswer after renaming the other model to UserExamAttempt
const UserExamAnswer = mongoose.model('UserExamAnswer', examMarkSchema);
export default UserExamAnswer;