import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
        button_text: { type: String, default: '' },
        button_url: { type: String, default: '' },
        // S3 public URL or legacy path to the announcement image
        image_path: { type: String, default: '' },
}, 
{
    timestamps: true // இது createdAt, updatedAt ஆகியவற்றைத் தானாகவே சேர்க்கும்
});

const Announcement = mongoose.model('Announcement', announcementSchema);

export default Announcement;