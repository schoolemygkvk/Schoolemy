// File: user-folder/backend/routes/notificationRoutes.js

import express from 'express';
const router = express.Router();

import { getAllNotifications } from '../../Controllers/NotificationBell/NotificationController.js';
import { 
  sendEMIOverdueNotification, 
  sendEMIDueSoonNotification,
  getNotifications,
  markAsRead,
  getUnreadCount
} from '../../Controllers/NotificationBell/EmiNotificationController.js';

// Existing notification route
router.get('/',  getAllNotifications);

// EMI Notification Routes
router.post('/emi-overdue', sendEMIOverdueNotification);
router.post('/emi-due-soon', sendEMIDueSoonNotification);
router.get('/list', getNotifications);
router.put('/:id/read', markAsRead);
router.get('/unread-count', getUnreadCount);

export default router;