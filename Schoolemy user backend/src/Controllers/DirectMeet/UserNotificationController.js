import MeetNotification from "../../Models/DirectMeet/MeetNotificationModel.js";
import CourseMeet from "../../Models/DirectMeet/CourseMeetModel.js";
import MeetParticipant from "../../Models/DirectMeet/MeetParticipantModel.js";
import mongoose from "mongoose";

// Get all notifications for a user
export const getUserNotifications = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 20, is_read } = req.query;

    console.log(`🔔 Fetching notifications for user_id: ${user_id}`);

    const query = { user_id };
    
    if (is_read !== undefined) {
      query.is_read = is_read === "true";
    }

    const skip = (page - 1) * limit;

    const notifications = await MeetNotification.find(query)
      .populate({
        path: "meet_id",
        select: "title course_name scheduled_date meet_type status",
        populate: {
          path: "course_id",
          select: "coursename category"
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MeetNotification.countDocuments(query);
    const unreadCount = await MeetNotification.getUnreadCount(user_id);

    console.log(`✅ Found ${notifications.length} notifications, ${total} total, ${unreadCount} unread`);
    if (notifications.length > 0) {
      console.log(`📋 Sample notification:`, {
        id: notifications[0]._id,
        type: notifications[0].notification_type,
        title: notifications[0].title,
        is_read: notifications[0].is_read
      });
    }

    res.json({
      success: true,
      notifications,
      unread_count: unreadCount,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_notifications: total,
        per_page: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching notifications",
      error: error.message,
    });
  }
};

// Get unread notifications count
export const getUnreadCount = async (req, res) => {
  try {
    const { user_id } = req.params;
    const count = await MeetNotification.getUnreadCount(user_id);

    res.json({
      success: true,
      unread_count: count,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching unread count",
      error: error.message,
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;

    const notification = await MeetNotification.findById(notification_id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking notification as read",
      error: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const { user_id } = req.params;

    await MeetNotification.markAllAsRead(user_id);

    res.json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Error marking all as read:", error);
    res.status(500).json({
      success: false,
      message: "Error marking all notifications as read",
      error: error.message,
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notification_id } = req.params;

    const notification = await MeetNotification.findByIdAndDelete(notification_id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting notification",
      error: error.message,
    });
  }
};

// Create notification (for admin/system use)
export const createNotification = async (req, res) => {
  try {
    const {
      meet_id,
      user_id,
      notification_type,
      title,
      message,
      priority,
      action_url,
    } = req.body;

    const notification = new MeetNotification({
      meet_id,
      user_id,
      notification_type,
      title,
      message,
      priority: priority || "medium",
      action_url: action_url || `/user/meets/${meet_id}`,
    });

    await notification.save();

    res.status(201).json({
      success: true,
      message: "Notification created",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Error creating notification",
      error: error.message,
    });
  }
};

// Send notification to all users in a meet
export const notifyMeetUsers = async (req, res) => {
  try {
    const { meet_id } = req.params;
    const { notification_type, title, message, priority } = req.body;

    // Build query - check if meet_id is a valid ObjectId
    let query;
    if (mongoose.Types.ObjectId.isValid(meet_id) && meet_id.length === 24) {
      // Valid MongoDB ObjectId - search by both
      query = {
        $or: [
          { meet_id: meet_id },
          { _id: meet_id }
        ]
      };
    } else {
      // Custom meet_id format (like CM202602001)
      query = { meet_id: meet_id };
    }

    const meet = await CourseMeet.findOne(query).populate('course_id');
    
    if (!meet) {
      return res.status(404).json({
        success: false,
        message: "Meet not found",
      });
    }

    // Get all users enrolled in the course
    const User = (await import("../../Models/User-Model/User-Model.js")).default;
    const enrolledUsers = await User.find({
      course: meet.course_id._id
    }).select("_id");

    if (enrolledUsers.length === 0) {
      return res.json({
        success: true,
        message: "No enrolled users found for this course",
        notified_count: 0
      });
    }

    // Create notifications for all enrolled users
    const notifications = enrolledUsers.map((user) => ({
      meet_id: meet._id, // Use MongoDB _id for notification
      user_id: user._id,
      notification_type: notification_type || "meet_reminder",
      title: title || `Reminder: ${meet.title}`,
      message: message || `Don't forget about the upcoming meet: ${meet.title}`,
      priority: priority || "medium",
      action_url: `/user/meets/${meet._id}`,
    }));

    await MeetNotification.insertMany(notifications);

    res.json({
      success: true,
      message: `Notifications sent to ${enrolledUsers.length} users`,
      notified_count: enrolledUsers.length,
    });
  } catch (error) {
    console.error("Error notifying meet users:", error);
    res.status(500).json({
      success: false,
      message: "Error notifying meet users",
      error: error.message,
    });
  }
};