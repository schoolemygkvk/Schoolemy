import mongoose from "mongoose";

const whyChooseUsSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image: { type: String, required: true },
  features: [{
    type: String,
    required: true,
  }],
}, {
  timestamps: true,
});

// Singleton pattern - ensure only one document exists
whyChooseUsSectionSchema.statics.getSection = async function() {
  return await this.findOne();
};

const WhyChooseUsSection = mongoose.model("das-WhyChooseUsSection", whyChooseUsSectionSchema);

export default WhyChooseUsSection;
