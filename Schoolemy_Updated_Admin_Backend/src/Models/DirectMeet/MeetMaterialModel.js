import { Schema, model } from "mongoose";

// Meet Material Schema
const meetMaterialSchema = new Schema(
  {
    meet_id: {
      type: Schema.Types.ObjectId,
      ref: "CourseMeet",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    file_name: {
      type: String,
      required: true,
    },
    file_url: {
      type: String,
      required: true,
    },
    file_type: {
      type: String,
      enum: ["pdf", "video", "audio", "document", "image", "other"],
      required: true,
    },
    file_size: {
      type: Number, // in bytes
    },
    access_type: {
      type: String,
      enum: ["all_assigned", "attended_only"],
      default: "attended_only",
    },
    material_date: {
      type: Date,
      required: false,
      index: true,
    },
    day_number: {
      type: Number,
      required: false,
      min: 1,
    },
    uploaded_by: {
      type: Schema.Types.ObjectId,
      ref: "Admin-data-login",
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    },
  },
  { 
    timestamps: true 
  }
);

// Indexes
meetMaterialSchema.index({ meet_id: 1, is_active: 1 });

const MeetMaterial = model("MeetMaterial", meetMaterialSchema);

export default MeetMaterial;
