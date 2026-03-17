import express from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  notifyMeetUsers,
} from "../../Controllers/DirectMeet/UserNotificationController.js";

const router = express.Router();

// Get user notifications
router.get("/user/:user_id/notifications", getUserNotifications);

// Get unread count  
router.get("/user/:user_id/notifications/unread-count", getUnreadCount);

// Mark notification as read
router.patch("/notifications/:notification_id/read", markAsRead);

// Mark all as read
router.patch("/user/:user_id/notifications/read-all", markAllAsRead);

// Delete notification
router.delete("/notifications/:notification_id", deleteNotification);

// Create notification (admin/system)
router.post("/notifications", createNotification);

// Notify all users in a meet
router.post("/meets/:meet_id/notify", notifyMeetUsers);

export default router;

