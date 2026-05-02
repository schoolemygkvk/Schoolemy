// File: user-folder/backend/routes/notificationRoutes.js

import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
const router = express.Router();

import { getAllNotifications } from "../../Controllers/NotificationBell/NotificationController.js";
import {
  sendEMIOverdueNotification,
  sendEMIDueSoonNotification,
  getNotifications,
  markAsRead,
  getUnreadCount,
} from "../../Controllers/NotificationBell/EmiNotificationController.js";

// Existing notification route
router.get("/",  asyncHandler(getAllNotifications));

// EMI Notification Routes
router.post("/emi-overdue", asyncHandler(sendEMIOverdueNotification));
router.post("/emi-due-soon", asyncHandler(sendEMIDueSoonNotification));
router.get("/list", asyncHandler(getNotifications));
router.put("/:id/read", asyncHandler(markAsRead));
router.get("/unread-count", asyncHandler(getUnreadCount));

export default router;