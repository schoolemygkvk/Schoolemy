// File: admin-backend/src/Routes/NotificationBell/materialRoutes.js

import express from 'express';
import multer from 'multer';
import path from 'path';

import { sendMaterial } from '../../Controllers/Notificationbell/MaterialController.js';

const router = express.Router();

// Multer setup (file upload-kaaga)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route definition
router.post('/send', upload.single('materialPdf'), sendMaterial);

export default router;