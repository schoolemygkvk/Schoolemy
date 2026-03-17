import express from 'express';
import multer from 'multer';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import Advertisement from '../../Models/Advertisement/AdvertisementModel.js';
import { verifyToken } from '../../Middleware/authMiddleware.js';
import s3 from '../../DB/adudios3.js';

const router = express.Router();

const AD_BUCKET = process.env.AWS_S3_STAFF_BUCKET || process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/** Upload advertisement image buffer to S3 and return public URL */
async function uploadAdImageToS3(buffer, mimeType, originalName) {
    if (!AD_BUCKET) throw new Error('AWS_S3_STAFF_BUCKET or AWS_BUCKET_NAME is not configured in .env');
    const ext = (originalName && originalName.split('.').pop()) || (mimeType && mimeType.split('/')[1]) || 'jpg';
    const key = `advertisements/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const command = new PutObjectCommand({
        Bucket: AD_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType || 'image/jpeg',
    });
    await s3.send(command);
    return `https://${AD_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

/**
 * @route   POST /api/advertisements/create
 * @desc    Create a single advertisement. Image via multipart (adImage) or legacy base64. S3 URL saved in image_path.
 * @access  Private (Admin)
 * @body    multipart: adImage (file), title?, targetUrl?  OR  JSON: image_base64, title?, targetUrl?
 */
router.post('/create', verifyToken, upload.single('adImage'), async (req, res) => {
    try {
        const targetUrl = req.body.targetUrl || req.body.target_url;
        const title = req.body.title || '';
        const image_base64 = req.body.image_base64;

        const hasFile = req.file && req.file.buffer;
        if (!hasFile && !image_base64) {
            return res.status(400).json({ error: 'Advertisement image is required. Upload a file (adImage) or send image_base64.' });
        }

        let image_path = '';
        if (hasFile) {
            image_path = await uploadAdImageToS3(req.file.buffer, req.file.mimetype, req.file.originalname);
        }

        await Advertisement.updateMany({}, { is_active: false });
        const newAdvertisement = new Advertisement({
            title,
            target_url: targetUrl || '',
            image_base64: image_base64 || '',
            image_path,
            is_active: true,
        });
        await newAdvertisement.save();
        res.status(201).json(newAdvertisement);
    } catch (error) {
        console.error('Error creating advertisement:', error);
        res.status(500).json({ error: error.message || 'Server error while creating advertisement.' });
    }
});

/**
 * @route   POST /api/advertisements/create-bulk
 * @desc    Create multiple advertisements. Images as base64 array.
 * @access  Private (Admin)
 * @body    { images: [base64,...], titles?: [], targetUrls?: [] }
 */
router.post('/create-bulk', verifyToken, async (req, res) => {
    try {
        const { images = [], titles = [], targetUrls = [] } = req.body;
        if (!Array.isArray(images) || images.length === 0) {
            return res.status(400).json({ error: 'At least one advertisement image is required.' });
        }
        await Advertisement.updateMany({}, { is_active: false });
        const created = [];
        for (let i = 0; i < images.length; i++) {
            const ad = new Advertisement({
                title: titles[i] || '',
                target_url: targetUrls[i] || '',
                image_base64: images[i],
                is_active: i === 0,
            });
            await ad.save();
            created.push(ad);
        }
        res.status(201).json(created);
    } catch (error) {
        console.error('Error creating bulk advertisements:', error);
        res.status(500).json({ error: 'Server error while creating advertisements.' });
    }
});

/**
 * @route   GET /api/advertisements/active
 * @desc    Get the single currently active advertisement (for users)
 * @access  Public
 */
router.get('/active', async (req, res) => {
    try {
        const activeAd = await Advertisement.findOne({ is_active: true });
        if (!activeAd) return res.status(200).json(null);
        res.status(200).json(activeAd);
    } catch (error) {
        console.error('Error fetching active advertisement:', error);
        res.status(500).json({ error: 'Server error while fetching advertisement.' });
    }
});

/**
 * @route   GET /api/advertisements/all
 * @desc    Get all advertisements (for admin panel)
 * @access  Private (Admin)
 */
router.get('/all', verifyToken, async (req, res) => {
    try {
        const allAdvertisements = await Advertisement.find({}).sort({ createdAt: -1 });
        res.status(200).json(allAdvertisements);
    } catch (error) {
        console.error('Error fetching all advertisements:', error);
        res.status(500).json({ error: 'Server error while fetching advertisements.' });
    }
});

/**
 * @route   GET /api/advertisements/:id
 * @desc    Get one advertisement by ID
 * @access  Private (Admin)
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const ad = await Advertisement.findById(req.params.id);
        if (!ad) return res.status(404).json({ error: 'Advertisement not found.' });
        res.status(200).json(ad);
    } catch (error) {
        console.error('Error fetching advertisement:', error);
        res.status(500).json({ error: 'Server error while fetching advertisement.' });
    }
});

/**
 * @route   PUT /api/advertisements/:id
 * @desc    Update advertisement (title, targetUrl, optional image file or image_base64)
 * @access  Private (Admin)
 */
router.put('/:id', verifyToken, upload.single('adImage'), async (req, res) => {
    try {
        const ad = await Advertisement.findById(req.params.id);
        if (!ad) return res.status(404).json({ error: 'Advertisement not found.' });
        const { title, targetUrl, image_base64 } = req.body;
        if (title !== undefined) ad.title = title;
        if (targetUrl !== undefined) ad.target_url = targetUrl;
        if (image_base64) ad.image_base64 = image_base64;
        if (req.file && req.file.buffer) {
            ad.image_path = await uploadAdImageToS3(req.file.buffer, req.file.mimetype, req.file.originalname);
        }
        await ad.save();
        res.status(200).json(ad);
    } catch (error) {
        console.error('Error updating advertisement:', error);
        res.status(500).json({ error: error.message || 'Server error while updating advertisement.' });
    }
});

/**
 * @route   PUT /api/advertisements/:id/set-active
 * @desc    Set this advertisement as the active one
 * @access  Private (Admin)
 */
router.put('/:id/set-active', verifyToken, async (req, res) => {
    try {
        const ad = await Advertisement.findById(req.params.id);
        if (!ad) return res.status(404).json({ error: 'Advertisement not found.' });
        await Advertisement.updateMany({}, { is_active: false });
        ad.is_active = true;
        await ad.save();
        res.status(200).json(ad);
    } catch (error) {
        console.error('Error setting active advertisement:', error);
        res.status(500).json({ error: 'Server error.' });
    }
});

/**
 * @route   DELETE /api/advertisements/:id
 * @desc    Delete an advertisement
 * @access  Private (Admin)
 */
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const ad = await Advertisement.findById(req.params.id);
        if (!ad) return res.status(404).json({ error: 'Advertisement not found.' });
        await Advertisement.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Advertisement deleted successfully.', id: req.params.id });
    } catch (error) {
        console.error('Error deleting advertisement:', error);
        res.status(500).json({ error: 'Server error while deleting advertisement.' });
    }
});

export default router;
