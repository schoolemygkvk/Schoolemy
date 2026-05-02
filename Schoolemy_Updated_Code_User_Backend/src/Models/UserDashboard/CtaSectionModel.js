import mongoose from "mongoose";

const subjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  color: { type: String, required: true },
  gradient: { type: String, required: true },
  icon: { type: String, required: true },
}, { _id: false });

const ctaSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  subjects: [subjectSchema],
}, {
  timestamps: true,
});

// Singleton pattern - ensure only one document exists
ctaSectionSchema.statics.getSection = async function() {
  return await this.findOne();
};

const CtaSection = mongoose.model("das-CtaSection", ctaSectionSchema);

export default CtaSection;
