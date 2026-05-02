import mongoose from "mongoose";

import  logger  from "../../Utils/logger.js";

const courseMeetSchema = new mongoose.Schema(
  {
    meet_id: {
      type: String,
      unique: true,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    course_name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: false,
    },
    chapter_id: {
      type: String,
      default: "",
    },
    chapter_title: {
      type: String,
      default: "",
    },
    scheduled_date: {
      type: Date,
      required: true,
    },
    meet_date: {
      type: Date,
      required: false,
    },
    meet_time: {
      type: String,
      required: false,
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
    },
    duration_minutes: {
      type: Number,
      required: false,
      min: 15,
    },
    meet_type: {
      type: String,
      enum: ["online", "offline"],
      default: "online",
    },
    meet_link: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    is_paid_meet: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    material_access_type: {
      type: String,
      enum: ["all", "attended_only"],
      default: "attended_only",
    },
    attendance_days_limit: {
      type: Number,
      default: 7,
      min: 1,
      max: 7,
    },
    max_participants: {
      type: Number,
      default: 0,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    // Additional fields
    meeting_password: {
      type: String,
      default: "",
    },
    recording_enabled: {
      type: Boolean,
      default: false,
    },
    recording_url: {
      type: String,
      default: "",
    },
    materials: [{
      title: String,
      file_url: String,
      uploaded_at: Date,
    }],
    tags: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  },
);

// Indexes
courseMeetSchema.index({ course_id: 1 });
courseMeetSchema.index({ scheduled_date: 1 });
courseMeetSchema.index({ status: 1 });
courseMeetSchema.index({ created_by: 1 });

// Virtual for formatted date
courseMeetSchema.virtual("formatted_date").get(function () {
  return this.scheduled_date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Virtual for formatted time
courseMeetSchema.virtual("formatted_time").get(function () {
  return this.scheduled_date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Method to check if meet is active
courseMeetSchema.methods.isActive = function () {
  const now = new Date();
  const meetEnd = new Date(this.scheduled_date.getTime() + this.duration * 60000);
  return this.status === "ongoing" && now < meetEnd;
};

// Method to check if meet can be joined
courseMeetSchema.methods.canJoin = function () {
  const now = new Date();
  const meetStart = this.scheduled_date;
  const joinWindow = 15 * 60000; // 15 minutes before

  return (
    (this.status === "scheduled" || this.status === "ongoing") &&
    now >= new Date(meetStart.getTime() - joinWindow)
  );
};

// Static method to get upcoming meets
courseMeetSchema.statics.getUpcoming = function (courseId, limit = 10) {
  const now = new Date();
  return this.find({
    course_id: courseId,
    scheduled_date: { $gte: now },
    status: { $in: ["scheduled", "ongoing"] },
  })
    .sort({ scheduled_date: 1 })
    .limit(limit)
    .populate("course_id", "coursename category")
    .populate("created_by", "name email");
};

// Static method to get past meets
courseMeetSchema.statics.getPast = function (courseId, limit = 10) {
  return this.find({
    course_id: courseId,
    status: { $in: ["completed", "cancelled"] },
  })
    .sort({ scheduled_date: -1 })
    .limit(limit)
    .populate("course_id", "coursename category")
    .populate("created_by", "name email");
};

// Pre-save middleware to generate meet_id
courseMeetSchema.pre("save", async function (next) {
  if (!this.meet_id) {
    const count = await this.constructor.countDocuments();
    this.meet_id = `MEET${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Pre-save middleware to update status based on time
courseMeetSchema.pre("save", function (next) {
  const now = new Date();
  const meetEnd = new Date(this.scheduled_date.getTime() + this.duration * 60000);

  if (this.status === "scheduled" && now >= this.scheduled_date && now < meetEnd) {
    this.status = "ongoing";
  } else if (this.status === "ongoing" && now >= meetEnd) {
    this.status = "completed";
  }

  next();
});

// Post-save middleware to create notifications for enrolled users when a new meet is created
courseMeetSchema.post("save", async function (doc, next) {
  try {
    // Only create notifications for newly created meets (not updates)
    if (this.isNew) {
      // Dynamically import to avoid circular dependencies
      const User = (await import("../User-Model/User-Model.js")).default;
      const MeetNotification = (await import("./MeetNotificationModel.js")).default;

      // Find all users who have purchased this course
      const enrolledUsers = await User.find({
        "enrolledCourses.course": doc.course_id,
      }).select("_id");

      if (enrolledUsers.length > 0) {
        // Create notifications for all enrolled users
        const notifications = enrolledUsers.map(user => ({
          meet_id: doc._id,
          user_id: user._id,
          notification_type: "meet_assigned",
          title: "New Meet Scheduled",
          message: `A new meet "${doc.title}" has been scheduled for ${doc.course_name}`,
          priority: "high",
          action_url: `/user/meets/${doc._id}`,
          metadata: {
            scheduled_date: doc.scheduled_date,
            duration: doc.duration,
            meet_type: doc.meet_type,
          },
        }));

        await MeetNotification.insertMany(notifications);
        logger.debug(` Created ${notifications.length} notifications for meet: ${doc.title}`);
      }
    }
  } catch (error) {
    logger.error("Error creating meet notifications:", error);
    // Don't fail the save operation if notification creation fails
  }
  next();
});

export default mongoose.model("CourseMeet", courseMeetSchema);