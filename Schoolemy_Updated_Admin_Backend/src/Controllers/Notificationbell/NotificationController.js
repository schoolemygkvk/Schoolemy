import NotificationBell from '../../Models/Notificationbell/NotificationModel.js';
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";


export async function getNotifications(req, res) {
  try {
    // Get all notifications sorted by creation date (role query reserved for future filtering)
    const notifications = await NotificationBell.find()
      .sort({ createdAt: -1 })
      .lean();

    // Ensure all notifications have valid createdAt dates
    const validatedNotifications = notifications.map((n) => ({
      ...n,
      isRead: n.isRead === true,
      createdAt: n.createdAt && !isNaN(new Date(n.createdAt).getTime())
        ? n.createdAt
        : new Date().toISOString(),
    }));

    sendSuccess(
      res,
      200,
      "Notifications retrieved successfully",
      validatedNotifications || []
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching notifications.',
      error: error.message,
    });
  }
}


// Function to create notification
export async function createNotification(req, res) {
  try {
    const { title, message, courseName, buttonName, joinLink } = req.body;

    // Validation: Message cannot be empty
    if (!message || message.trim() === '') {
      return sendError(res, 400, "Notification message cannot be empty.");
    }

    // Create new notification in database
    const newNotification = await NotificationBell.create({
      title: title || "",
      message,
      courseName,
      buttonName: buttonName || null,
      joinLink: joinLink || null,
      isRead: false,
    });
    sendSuccess(res, 201, "Created successfully", newNotification
    );

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating notification.',
      error: error.message
    });
  }
}


export async function markAsRead(req, res) {
  try {
    const { id } = req.params;

    const notification = await NotificationBell.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: notification,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating notification.',
      error: error.message,
    });
  }
}


export async function markAllNotificationsRead(req, res) {
  try {
    const result = await NotificationBell.updateMany(
      { $or: [{ isRead: false }, { isRead: { $exists: false } }] },
      { $set: { isRead: true } },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount ?? result.matchedCount,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Server error while marking all as read.",
      error: error.message,
    });
  }
}


export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;

    const notification = await NotificationBell.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully.',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting notification.',
      error: error.message,
    });
  }
}
