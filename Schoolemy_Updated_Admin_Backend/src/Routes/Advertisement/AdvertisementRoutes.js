import express from 'express';
import multer from 'multer';
import { verifyToken } from '../../Middleware/authMiddleware.js';
import { checkRole } from '../../Middleware/checkRole.js';
import {
  createAdvertisement,
  createBulkAdvertisements,
  getActiveAdvertisements,
  getAllAdvertisements,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
  setAdvertisementActive,
  trackAdvertisementEvent,
  getAdvertisementAnalyticsSummary,
} from '../../Controllers/Marketing/AdvertisementController.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});


router.get('/active', getActiveAdvertisements);


router.post('/create', verifyToken, checkRole(['admin', 'marketing']), upload.single('adImage'), createAdvertisement);


router.post('/create-bulk', verifyToken, checkRole(['admin', 'marketing']), createBulkAdvertisements);


router.get(
  '/analytics/summary',
  verifyToken,
  checkRole(['admin', 'marketing', 'superadmin']),
  getAdvertisementAnalyticsSummary
);


router.post('/track', trackAdvertisementEvent);


router.get('/', verifyToken, checkRole(['admin', 'marketing']), getAllAdvertisements);


router.get('/:id', verifyToken, checkRole(['admin', 'marketing']), getAdvertisementById);


router.put('/:id', verifyToken, checkRole(['admin', 'marketing']), upload.single('adImage'), updateAdvertisement);


router.put('/:id/set-active', verifyToken, checkRole(['admin', 'marketing']), setAdvertisementActive);


router.delete('/:id', verifyToken, checkRole(['admin', 'marketing']), deleteAdvertisement);

export default router;
