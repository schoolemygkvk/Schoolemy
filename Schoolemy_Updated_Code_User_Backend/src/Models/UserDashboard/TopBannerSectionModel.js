import mongoose from "mongoose";

const slideSchema = new mongoose.Schema({
  eyebrow: { type: String },
  title: { type: String },
  bgImage: { type: String, required: true },
  bgSize: { type: String, default: "cover" },
  vAlign: { type: String, default: "50%" },
  hAlign: { type: String, enum: ["left", "right"], default: "left" },
}, { _id: false });

const topBannerSectionSchema = new mongoose.Schema({
  slides: [slideSchema],
}, {
  timestamps: true,
});

// Singleton pattern - ensure only one document exists
topBannerSectionSchema.statics.getSection = async function() {
  return await this.findOne() || new this({ slides: [] });
};

const TopBannerSection = mongoose.model("das-TopBannerSection", topBannerSectionSchema);

export default TopBannerSection;
