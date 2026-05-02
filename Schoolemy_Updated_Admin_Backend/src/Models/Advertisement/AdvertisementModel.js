import mongoose from 'mongoose';

const AdvertisementSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: false,
        description: "S3 URL for the advertisement image",
    },
    image_base64: {
        type: String,
        required: false,
        default: null,
        description: "DEPRECATED: Use imageUrl instead. This field is for backward compatibility only.",
    },
    image_path: {
        type: String,
        required: false,
    },
    title: {
        type: String,
        required: false,
    },
    target_url: {
        type: String,
        required: false,
    },
    is_active: {
        type: Boolean,
        default: false,
    },
    campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdCampaign",
        default: null,
    },
    impressionCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    clickCount: {
        type: Number,
        default: 0,
        min: 0,
    },
    createdBy: {
        type: String,
        required: false,
    },
}, { timestamps: true });

const Advertisement = mongoose.model('Advertisement', AdvertisementSchema);

export default Advertisement;