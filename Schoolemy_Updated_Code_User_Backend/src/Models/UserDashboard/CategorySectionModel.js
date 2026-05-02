import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  color: { type: String, required: true },
  bgColor: { type: String, required: true },
}, { _id: false });

const categorySectionSchema = new mongoose.Schema({
  sectionTitle: { type: String, required: true },
  categories: [categorySchema],
}, {
  timestamps: true,
});

// Singleton pattern - ensure only one document exists
categorySectionSchema.statics.getSection = async function() {
  return await this.findOne();
};

const CategorySection = mongoose.model("das-CategorySection", categorySectionSchema);

export default CategorySection;
