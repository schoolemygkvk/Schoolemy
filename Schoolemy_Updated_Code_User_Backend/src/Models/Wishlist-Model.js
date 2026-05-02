import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courses: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true,
        },
        // Store course snapshot for quick access without ref lookup
        courseSnapshot: {
          title: String,
          coursename: String,
          thumbnail: String,
          category: String,
          price: {
            amount: Number,
            finalPrice: Number,
          },
          instructor: String,
          rating: Number,
          level: String,
          
          isTutorCourse: { type: Boolean, default: false },
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient lookups
wishlistSchema.index({ userId: 1, "courses.courseId": 1 });

export default mongoose.models.Wishlist ||
  mongoose.model("Wishlist", wishlistSchema);
