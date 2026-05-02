import mongoose from "mongoose";

const offeringSchema = new mongoose.Schema({
  title: { type: String, required: true },
  icon: { type: String, required: true },
  link: { type: String, default: "/course" },
}, { _id: false });

const whatWeOfferSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  buttonText: { type: String, required: true },
  buttonLink: { type: String, default: "/course" },
  offerings: [offeringSchema],
}, {
  timestamps: true,
});

// Singleton pattern - ensure only one document exists
whatWeOfferSectionSchema.statics.getSection = async function() {
  return await this.findOne();
};

const WhatWeOfferSection = mongoose.model("das-WhatWeOfferSection", whatWeOfferSectionSchema);

export default WhatWeOfferSection;
