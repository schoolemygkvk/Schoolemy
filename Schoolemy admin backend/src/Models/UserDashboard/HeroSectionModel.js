import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  icon: { type: String },
  value: { type: String },
  label: { type: String },
  image: { type: String },
  title: { type: String }
}, { _id: false });

const heroSectionSchema = new mongoose.Schema({
  eyebrow: { type: String, required: true },
  headline: { type: String, required: true },
  description: { type: String, required: true },
  mainImage: { type: String, required: true },
  primaryButtonText: { type: String, required: true },
  primaryButtonLink: { type: String, default: '/course' },
  secondaryButtonText: { type: String, required: true },
  secondaryButtonLink: { type: String, default: '/demo' },
  cardTop: {
    type: cardSchema,
    default: null
  },
  cardBottom: {
    type: cardSchema,
    default: null
  }
}, {
  timestamps: true
});

// Singleton pattern - ensure only one document exists
heroSectionSchema.statics.getSection = async function() {
  return await this.findOne();
};

const HeroSection = mongoose.model('das-HeroSection', heroSectionSchema);

export default HeroSection;
