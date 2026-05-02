import mongoose from "mongoose";

const AdCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "scheduled", "active", "paused", "completed"],
      default: "draft",
    },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    createdBy: { type: String },
    
    integrationWebhookUrl: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const AdCampaign = mongoose.model("AdCampaign", AdCampaignSchema, "marketing_campaigns");
export default AdCampaign;
