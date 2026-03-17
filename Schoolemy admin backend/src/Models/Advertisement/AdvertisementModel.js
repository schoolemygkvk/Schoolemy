import mongoose from 'mongoose';

const AdvertisementSchema = new mongoose.Schema({
    image_base64: {
        type: String,
        required: false,
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
}, { timestamps: true });

const Advertisement = mongoose.model('Advertisement', AdvertisementSchema);

export default Advertisement;