import mongoose from 'mongoose';

const statSchema = new mongoose.Schema({
  value: { type: String, required: true },
  label: { type: String, required: true }
}, { _id: false });

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  avatar: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  text: { type: String, required: true }
}, { _id: false });

const feedbackSectionSchema = new mongoose.Schema({
  badgeText: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  stats: [statSchema],
  testimonials: [testimonialSchema]
}, {
  timestamps: true
});

// Singleton pattern - ensure only one document exists
feedbackSectionSchema.statics.getSection = async function() {
  return await this.findOne();
};

const FeedbackSection = mongoose.model('das-FeedbackSection', feedbackSectionSchema);

export default FeedbackSection;
