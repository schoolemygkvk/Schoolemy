import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
}, { _id: false });

const coursesSectionSchema = new mongoose.Schema({
  sectionTitle: { type: String, required: true },
  courses: [courseSchema],
}, {
  timestamps: true,
});

// Singleton pattern - ensure only one document exists
coursesSectionSchema.statics.getSection = async function() {
  return await this.findOne();
};

const CoursesSection = mongoose.model("das-CoursesSection", coursesSectionSchema);

export default CoursesSection;
