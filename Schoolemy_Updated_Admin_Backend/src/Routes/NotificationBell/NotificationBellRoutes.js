import express from "express";
const router = express.Router();

import {
  createNotification,
  getNotifications,
  markAsRead,
markAllNotificationsRead,
  deleteNotification
} from "../../Controllers/Notificationbell/NotificationController.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";

// Get all notifications
router.get("/", verifyToken, getNotifications);

// Create new notification
router.post("/create", verifyToken, createNotification);

// Mark all as read (must be before /:id/read)
router.put("/mark-all-read", verifyToken, markAllNotificationsRead);

// Mark notification as read
router.put("/:id/read", verifyToken, markAsRead);

// Delete notification
router.delete("/:id", verifyToken, deleteNotification);

export default router;
