import { Schema, model } from "mongoose";

// Meet Notification Schema
const meetNotificationSchema = new Schema(
  {
    meet_id: {
      type: Schema.Types.ObjectId,
      ref: "CourseMeet",
      required: false,
      default: null,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    notification_type: {
      type: String,
      enum: [
        "meet_assigned",
        "meet_scheduled", 
        "meet_updated", 
        "meet_reminder", 
        "meet_started",
        "meet_cancelled",
        "meet_rescheduled",
        "meet_completed",
        "payment_pending",
        "payment_success",
        "material_uploaded",
        "user_joined",
        "course_enrolled"
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
    read_at: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    action_url: {
      type: String,
      default: "",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    // Email notification tracking
    email_sent: {
      type: Boolean,
      default: false,
    },
    email_sent_at: {
      type: Date,
    },
  },
  { 
    timestamps: true 
  }
);

// Indexes
meetNotificationSchema.index({ user_id: 1, is_read: 1, createdAt: -1 });
meetNotificationSchema.index({ meet_id: 1, notification_type: 1 });

// Method to mark as read
meetNotificationSchema.methods.markAsRead = function () {
  this.is_read = true;
  this.read_at = new Date();
  return this.save();
};

// Static method to get unread count
meetNotificationSchema.statics.getUnreadCount = function (userId) {
  return this.countDocuments({ user_id: userId, is_read: false });
};

// Static method to mark all as read
meetNotificationSchema.statics.markAllAsRead = function (userId) {
  return this.updateMany(
    { user_id: userId, is_read: false },
    { is_read: true, read_at: new Date() }
  );
};

const MeetNotification = model("MeetNotification", meetNotificationSchema);

export default MeetNotification;
