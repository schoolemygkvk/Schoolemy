import express from 'express';
import multer from 'multer';

import {
    createAnnouncement,
    getLatestAnnouncement,
    getAllAnnouncements,
    deleteAnnouncement
} from '../../Controllers/Announcement/AnnouncementController.js';

import { verifyToken } from '../../Middleware/authMiddleware.js';

const router = express.Router();

// Multer: keep file in memory so we can upload buffer to S3 (no disk path)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

// Accept optional image file under field name 'image'
router.post('/create', verifyToken, upload.single('image'), createAnnouncement);

router.get('/latest', getLatestAnnouncement);

router.get('/all', verifyToken, getAllAnnouncements);
router.delete('/:id', verifyToken, deleteAnnouncement);

export default router;