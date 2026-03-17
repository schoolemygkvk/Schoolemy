// File: backend/src/Controllers/Admin/Announcement/AnnouncementController.js
import { PutObjectCommand } from '@aws-sdk/client-s3';
import Announcement from '../../Models/Announcement/AnnouncementModel.js';
import s3 from '../../DB/adudios3.js';

const ANNOUNCEMENT_BUCKET = process.env.AWS_S3_STAFF_BUCKET || process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

/** Upload announcement image buffer to S3 and return public URL */
const uploadAnnouncementImageToS3 = async (buffer, mimeType, originalName) => {
    if (!ANNOUNCEMENT_BUCKET) {
        throw new Error('AWS_S3_STAFF_BUCKET or AWS_BUCKET_NAME is not configured in .env');
    }
    const ext = (originalName && originalName.split('.').pop()) || (mimeType && mimeType.split('/')[1]) || 'jpg';
    const key = `announcements/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const command = new PutObjectCommand({
        Bucket: ANNOUNCEMENT_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType || 'image/jpeg',
    });
    await s3.send(command);
    return `https://${ANNOUNCEMENT_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
};

export const createAnnouncement = async (req, res) => {
    try {
        const { title, content, button_text, button_url } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required.' });
        }

        let image_path = '';
        if (req.file && req.file.buffer) {
            image_path = await uploadAnnouncementImageToS3(
                req.file.buffer,
                req.file.mimetype,
                req.file.originalname
            );
        }

        const newAnnouncement = new Announcement({
            title,
            content,
            button_text,
            button_url,
            image_path,
        });

        const savedAnnouncement = await newAnnouncement.save();
        res.status(201).json(savedAnnouncement);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({
            message: error.message || 'Server error while creating announcement.',
            success: false,
        });
    }
};


export const getLatestAnnouncement = async (req, res) => {
    try {
        const latestAnnouncement = await Announcement.findOne().sort({ createdAt: -1 });
        
        if (!latestAnnouncement) {
            return res.status(200).json(null);
        }
        
        res.status(200).json(latestAnnouncement);

    } catch (error) {
        console.error('Error fetching latest announcement:', error);
        res.status(500).json({ message: 'Server error while fetching announcement.' });
    }
};


export const getAllAnnouncements = async (req, res) => {
    try {
        const allAnnouncements = await Announcement.find({}).sort({ createdAt: -1 });
        res.status(200).json(allAnnouncements);

    } catch (error) {
        console.error('Error fetching all announcements:', error);
        res.status(500).json({ message: 'Server error while fetching announcements.' });
    }
};


export const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Announcement.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Announcement not found.' });
        }
        res.status(200).json({ message: 'Announcement deleted successfully.', id });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ message: 'Server error while deleting announcement.' });
    }
};