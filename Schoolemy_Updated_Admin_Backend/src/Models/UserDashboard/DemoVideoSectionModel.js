import mongoose from 'mongoose';

const metricSchema = new mongoose.Schema({
  value: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: String, required: true }
}, { _id: false });

const reviewSchema = new mongoose.Schema({
  image: { type: String, required: true },
  text: { type: String, required: true }
}, { _id: false });

const demoVideoSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  videoThumbnail: { type: String, required: true },
  videoUrl: { type: String, required: true },
  statsTitle: { type: String, required: true },
  buttonText: { type: String, required: true },
  buttonLink: { type: String, default: '/register' },
  metrics: [metricSchema],
  review: {
    type: reviewSchema,
    default: null
  }
}, {
  timestamps: true
});

// Singleton pattern - ensure only one document exists
demoVideoSectionSchema.statics.getSection = async function() {
  return await this.findOne();
};

const DemoVideoSection = mongoose.model('das-DemoVideoSection', demoVideoSectionSchema);

export default DemoVideoSection;
