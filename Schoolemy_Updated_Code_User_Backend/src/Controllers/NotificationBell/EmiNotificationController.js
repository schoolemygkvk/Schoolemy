import  logger  from "../../Utils/logger.js";

import User from "../../Models/User-Model/User-Model.js";
import Notification from "../../Models/NotificationBell/NotificationModel.js";
import EmailTransport from "../../Notification/EmailTransport.js"; // SECURITY FIX 3.26.1: Use canonical EmailTransport location


export const sendEMIOverdueNotification = async (req, res) => {
  try {
    const { userId, courseId, courseName, overdueAmount, overdueCount, dueDate } = req.body;

    // Create notification in database
    const notification = new Notification({
      userId,
      type: "emi_overdue",
      title: "EMI Payment Overdue!",
      message: `Your EMI payment for "${courseName}" is overdue. ${overdueCount} payment(s) totaling ₹${overdueAmount} are pending. Your course access has been locked.`,
      metadata: {
        courseId,
        courseName,
        overdueAmount,
        overdueCount,
        dueDate,
        actionUrl: `/user/emi-payment/${courseId}`,
      },
      priority: "high",
      read: false,
    });

    await notification.save();

    // Get user details for email
    const user = await User.findById(userId);
    if (user && user.email) {
      // Send email notification
      const emailSubject = ` EMI Payment Overdue - ${courseName}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ef4444;"> EMI Payment Overdue</h2>
          <p>Dear ${user.name || "Student"},</p>
          <p>Your EMI payment for <strong>${courseName}</strong> is overdue.</p>
          
          <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #991b1b;">Payment Details:</h3>
            <p><strong>Overdue Payments:</strong> ${overdueCount}</p>
            <p><strong>Total Amount Due:</strong> ₹${overdueAmount.toLocaleString("en-IN")}</p>
            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString("en-IN")}</p>
          </div>

          <p><strong> Your course access has been temporarily locked.</strong></p>
          
          <p>To restore your access, please clear the pending payments immediately.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/user/emi-payment/${courseId}" 
               style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Pay Now & Unlock Course
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact our support team.
          </p>

          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This is an automated notification from Schoolemy.
          </p>
        </div>
      `;

      await EmailTransport.sendEmail({
        to: user.email,
        subject: emailSubject,
        html: emailBody,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Overdue notification sent successfully",
      notificationId: notification._id,
    });
  } catch (error) {
    logger.error("Error sending EMI overdue notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};


export const sendEMIDueSoonNotification = async (req, res) => {
  try {
    const { userId, courseId, courseName, dueAmount, dueDate } = req.body;

    // Create notification in database
    const notification = new Notification({
      userId,
      type: "emi_due_soon",
      title: "EMI Payment Due Soon",
      message: `Your EMI payment of ₹${dueAmount} for "${courseName}" is due on ${new Date(dueDate).toLocaleDateString("en-IN")}. Pay now to avoid course lock.`,
      metadata: {
        courseId,
        courseName,
        dueAmount,
        dueDate,
        actionUrl: `/user/emi-payment/${courseId}`,
      },
      priority: "medium",
      read: false,
    });

    await notification.save();

    // Get user details for email
    const user = await User.findById(userId);
    if (user && user.email) {
      const emailSubject = `Reminder: EMI Payment Due Soon - ${courseName}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">EMI Payment Due Soon</h2>
          <p>Dear ${user.name || "Student"},</p>
          <p>This is a friendly reminder that your EMI payment for <strong>${courseName}</strong> is due soon.</p>
          
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400e;">Payment Details:</h3>
            <p><strong>Amount Due:</strong> ₹${dueAmount.toLocaleString("en-IN")}</p>
            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString("en-IN")}</p>
          </div>

          <p>Please make your payment before the due date to avoid any interruption in your course access.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/user/emi-payment/${courseId}" 
               style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Pay Now
            </a>
          </div>

          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Thank you for staying on track with your payments!
          </p>

          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            This is an automated reminder from Schoolemy.
          </p>
        </div>
      `;

      await EmailTransport.sendEmail({
        to: user.email,
        subject: emailSubject,
        html: emailBody,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Due soon notification sent successfully",
      notificationId: notification._id,
    });
  } catch (error) {
    logger.error("Error sending EMI due soon notification:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};


export const getNotifications = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { page = 1, limit = 10 } = req.query;

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Notification.countDocuments({ userId });

    return res.status(200).json({
      success: true,
      data: notifications,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    logger.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
      error: error.message,
    });
  }
};


export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true, readAt: new Date() },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    logger.error("Error marking notification as read:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};


export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const count = await Notification.countDocuments({
      userId,
      read: false,
    });

    return res.status(200).json({
      success: true,
      count,
    });
  } catch (error) {
    logger.error("Error fetching unread count:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread count",
      error: error.message,
    });
  }
};
