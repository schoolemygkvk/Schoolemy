import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
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
router.get("/user/:user_id/notifications", asyncHandler(getUserNotifications));

// Get unread count
router.get("/user/:user_id/notifications/unread-count", asyncHandler(getUnreadCount));

// Mark notification as read
router.patch("/notifications/:notification_id/read", asyncHandler(markAsRead));

// Mark all as read
router.patch("/user/:user_id/notifications/read-all", asyncHandler(markAllAsRead));

// Delete notification
router.delete("/notifications/:notification_id", asyncHandler(deleteNotification));

// Create notification (admin/system)
router.post("/notifications", asyncHandler(createNotification));

// Notify all users in a meet
router.post("/meets/:meet_id/notify", asyncHandler(notifyMeetUsers));

export default router;

