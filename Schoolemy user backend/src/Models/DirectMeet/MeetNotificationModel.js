import mongoose from "mongoose";

const meetNotificationSchema = new mongoose.Schema(
  {
    meet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseMeet",
      required: false,
      default: null,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notification_type: {
      type: String,
      enum: [
        "meet_assigned",
        "meet_reminder",
        "meet_started",
        "meet_cancelled",
        "meet_rescheduled",
        "meet_completed",
        "material_uploaded",
        "user_joined",
        "payment_success",
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
    },
    read_at: {
      type: Date,
      default: null,
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
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
meetNotificationSchema.index({ user_id: 1, is_read: 1 });
meetNotificationSchema.index({ meet_id: 1 });
meetNotificationSchema.index({ createdAt: -1 });

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

export default mongoose.model("MeetNotification", meetNotificationSchema);