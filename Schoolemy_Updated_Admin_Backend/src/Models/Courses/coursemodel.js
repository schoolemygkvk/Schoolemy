import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false, timestamps: true }
);

const lessonSchema = new mongoose.Schema(
  {
    lessonName: { type: String, required: true },
    audioFile: [MediaSchema],
    videoFile: [MediaSchema],
    pdfFile: [MediaSchema],
  },
  { timestamps: true }
);

const chapterSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    lessons: [lessonSchema],
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExamQuestion",
    },
  },
  { timestamps: true }
);

const instructorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: String,
    socialmedia_id: String,
  },
  { _id: false }
);
// EMI Schema (for students)
const emiSchema = new mongoose.Schema(
  {
    isAvailable: { type: Boolean, default: true },
    emiDurationMonths: { type: Number, default: null },
    monthlyAmount: { type: Number },
    totalAmount: { type: Number },
    notes: { type: String },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    CourseMotherId: { type: String, required: true },
    coursename: { type: String, required: true, unique: true },
    category: { type: String, required: true },
    courseDuration: {
      type: String,
      enum: ["6 months", "1 year", "2 years"],
      required: true,
    },
    thumbnail: { type: String, default: null },
    previewvideo: { type: String, default: null },
    contentDuration: {
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
      _id: false,
    },
    chapters: { type: [chapterSchema], default: [] },
    price: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "INR" },
      discount: { type: Number, default: 0, min: 0, max: 100 },
      finalPrice: { type: Number, default: 0 },
    },
    level: {
      type: String,
      enum: ["beginner", "medium", "hard"],
      default: "beginner",
    },
    language: {
      type: String,
      enum: ["english", "tamil"],
      default: "english",
    },
    certificates: {
      type: String,
      enum: ["yes", "no"],
      default: "no",
    },
    instructor: instructorSchema,
    emi: emiSchema,
    description: { type: String },
    whatYoullLearn: [String],
    review: [{ type: String }],
    rating: { type: Number, min: 0, max: 5 },
    studentEnrollmentCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    // Ensure proper UTF-8 encoding for all string fields
    collection: 'courses',
  }
);
// Automatically calculate finalPrice before saving
courseSchema.pre("save", function (next) {
  if (this.isModified("price.amount") || this.isModified("price.discount")) {
    this.price.finalPrice = this.price.amount * (1 - this.price.discount / 100);
  }
  next();
});
// Indexes for better performance
// courseSchema.index({ coursename: 1, isDeleted: 1 }); // Removed: isDeleted field does not exist
courseSchema.index({ category: 1, level: 1, language: 1 });
courseSchema.index({ price: 1, rating: 1 });
// courseSchema.index({ isPublished: 1, createdAt: -1 }); // Removed: isPublished field does not exist
courseSchema.index({ studentEnrollmentCount: -1 });
// courseSchema.index({ tags: 1 }); // Removed: tags field does not exist

const Course = mongoose.model("Course", courseSchema);
export default Course;
