import mongoose from "mongoose";

const meetParticipantSchema = new mongoose.Schema(
  {
    meet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseMeet",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    attendance_status: {
      type: String,
      enum: ["not_joined", "joined", "completed", "absent"],
      default: "not_joined",
    },
    joined_at: {
      type: Date,
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
    payment_status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    can_access_materials: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: "",
    },
    // Additional tracking fields
    total_duration_minutes: {
      type: Number,
      default: 0,
    },
    last_activity: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
meetParticipantSchema.index({ meet_id: 1, user_id: 1 }, { unique: true });
meetParticipantSchema.index({ meet_id: 1 });
meetParticipantSchema.index({ user_id: 1 });
meetParticipantSchema.index({ attendance_status: 1 });

// Virtual to check if user is active in meet
meetParticipantSchema.virtual("is_active").get(function () {
  return this.attendance_status === "joined";
});

// Method to mark as joined
meetParticipantSchema.methods.markJoined = function () {
  this.attendance_status = "joined";
  this.joined_at = new Date();
  return this.save();
};

// Method to mark as completed
meetParticipantSchema.methods.markCompleted = function () {
  this.attendance_status = "completed";
  this.completed_at = new Date();
  return this.save();
};

// Method to mark as absent
meetParticipantSchema.methods.markAbsent = function () {
  this.attendance_status = "absent";
  return this.save();
};

// Static method to get participants by meet
meetParticipantSchema.statics.getByMeet = function (meetId, filters = {}) {
  const query = { meet_id: meetId };
  
  if (filters.status) {
    query.attendance_status = filters.status;
  }
  
  return this.find(query)
    .populate("user_id", "name email phone")
    .sort({ joined_at: -1 });
};

// Post-save hook to create notification when user joins a meet
meetParticipantSchema.post("save", async function (doc, next) {
  try {
    // Only create notification when status changes to 'joined' and it's a new join
    if (doc.attendance_status === "joined" && doc.joined_at) {
      const wasJustUpdated = doc.isNew || doc.modifiedPaths().includes("attendance_status");
      
      if (wasJustUpdated) {
        // Dynamically import to avoid circular dependencies
        const MeetNotification = (await import("./MeetNotificationModel.js")).default;
        const CourseMeet = (await import("./CourseMeetModel.js")).default;
        
        const meet = await CourseMeet.findById(doc.meet_id).select("title course_name scheduled_date");
        
        if (meet) {
          // Check if notification already exists for this join
          const existingNotification = await MeetNotification.findOne({
            meet_id: doc.meet_id,
            user_id: doc.user_id,
            notification_type: "user_joined"
          });
          
          if (!existingNotification) {
            await MeetNotification.create({
              meet_id: doc.meet_id,
              user_id: doc.user_id,
              notification_type: "user_joined",
              title: "Successfully Joined Meet",
              message: `You have successfully joined "${meet.title}" for ${meet.course_name}`,
              priority: "high",
              action_url: `/user/meets/${doc.meet_id}`,
              metadata: {
                joined_at: doc.joined_at,
                scheduled_date: meet.scheduled_date
              }
            });
            console.log(`✅ Created join notification for user ${doc.user_id} in meet ${meet.title}`);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error creating join notification:", error);
    // Don't fail the save operation if notification creation fails
  }
  next();
});

// Static method to get attendance stats
meetParticipantSchema.statics.getStats = async function (meetId) {
  const stats = await this.aggregate([
    { $match: { meet_id: new mongoose.Types.ObjectId(meetId) } },
    {
      $group: {
        _id: "$attendance_status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    total: 0,
    not_joined: 0,
    joined: 0,
    completed: 0,
    absent: 0,
  };

  stats.forEach((stat) => {
    result[stat._id] = stat.count;
    result.total += stat.count;
  });

  return result;
};

// Pre-save hook to update last_activity
meetParticipantSchema.pre("save", function (next) {
  if (this.isModified("attendance_status")) {
    this.last_activity = new Date();
  }
  next();
});

export default mongoose.model("MeetParticipant", meetParticipantSchema);