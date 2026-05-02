import MeetNotification from '../../Models/DirectMeet/MeetNotificationModel.js';
import MeetParticipant from '../../Models/DirectMeet/MeetParticipantModel.js';
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// ============================================================================
// NOTIFICATION CONTROLLERS
// ============================================================================

// Get notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { is_read, page = 1, limit = 20 } = req.query;

    const filter = { user_id };
    if (is_read !== undefined) {
      filter.is_read = is_read === 'true';
    }

    const notifications = await MeetNotification.find(filter)
      .populate('meet_id', 'title meet_date course_name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalRecords = await MeetNotification.countDocuments(filter);
    const unreadCount = await MeetNotification.countDocuments({ user_id, is_read: false });

    res.status(200).json({ 
      success: true, 
      notifications,
      totalRecords,
      unreadCount,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching notifications', 
      error: error.message 
    });
  }
};

// Mark notification as read
export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await MeetNotification.findByIdAndUpdate(
      id,
      { is_read: true, read_at: new Date() },
      { new: true }
    );

    if (!notification) {
      return sendError(res, 404, "Notification not found");
    }

    res.status(200).json({ 
      success: true, 
      message: 'Notification marked as read',
      notification 
    });
  } catch (error) {
    console.error('Error marking notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error marking notification', 
      error: error.message 
    });
  }
};

// Mark all notifications as read for user
export const markAllNotificationsRead = async (req, res) => {
  try {
    const { user_id } = req.params;

    await MeetNotification.updateMany(
      { user_id, is_read: false },
      { is_read: true, read_at: new Date() }
    );

    res.status(200).json({ 
      success: true, 
      message: 'All notifications marked as read' 
    });
  } catch (error) {
    console.error('Error marking notifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error marking notifications', 
      error: error.message 
    });
  }
};

export default {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
