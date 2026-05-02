import mongoose from 'mongoose';

const notificationBellSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      required: [true, "Notification message cannot be empty"],
      trim: true,
    },
    courseName: {
      type: String,
      required: [true, "Course name is required."],
      trim: true,
    },
    buttonName: {
      type: String,
      trim: true,
      default: null,
    },
    joinLink: {
      type: String,
      trim: true,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

const NotificationBell = mongoose.model("NotificationBell", notificationBellSchema);

export default NotificationBell; 