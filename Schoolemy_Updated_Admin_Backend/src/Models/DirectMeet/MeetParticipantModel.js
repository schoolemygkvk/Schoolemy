import { Schema, model } from "mongoose";

// Meet Participant / Attendance Schema
const meetParticipantSchema = new Schema(
  {
    meet_id: {
      type: Schema.Types.ObjectId,
      ref: "CourseMeet",
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course_id: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    // Assignment status
    assigned_at: {
      type: Date,
      default: Date.now,
    },
    assigned_by: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    // Payment status
    is_payment_required: {
      type: Boolean,
      default: false,
    },
    payment_status: {
      type: String,
      enum: ["not_required", "pending", "completed", "failed"],
      default: "not_required",
    },
    payment_id: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
    },
    payment_date: {
      type: Date,
    },
    payment_amount: {
      type: Number,
      default: 0,
    },
    // Attendance tracking
    attendance_status: {
      type: String,
      enum: ["not_joined", "joined", "completed", "absent"],
      default: "not_joined",
      index: true,
    },
    joined_at: {
      type: Date,
    },
    completed_at: {
      type: Date,
    },
    // Daily attendance tracking
    attendance_dates: [{
      date: {
        type: Date,
        required: true
      },
      check_in_time: {
        type: Date
      },
      check_out_time: {
        type: Date
      },
      duration_minutes: {
        type: Number,
        default: 0
      },
      status: {
        type: String,
        enum: ["present", "absent", "late"],
        default: "present"
      }
    }],
    total_attendance_days: {
      type: Number,
      default: 0
    },
    // Material access
    can_access_materials: {
      type: Boolean,
      default: false,
    },
    // Notifications
    notification_sent: {
      type: Boolean,
      default: false,
    },
    reminder_sent: {
      type: Boolean,
      default: false,
    },
  },
  { 
    timestamps: true 
  }
);

// Compound index for unique participant per meet
meetParticipantSchema.index({ meet_id: 1, user_id: 1 }, { unique: true });

// Indexes for queries
meetParticipantSchema.index({ meet_id: 1, attendance_status: 1 });
meetParticipantSchema.index({ user_id: 1, attendance_status: 1 });

// Pre-save middleware to update material access
meetParticipantSchema.pre('save', function(next) {
  // If attended or completed, allow material access
  if (this.attendance_status === 'joined' || this.attendance_status === 'completed') {
    // Check if within 5-day window
    if (this.joined_at) {
      const daysSinceJoin = Math.floor((new Date() - this.joined_at) / (1000 * 60 * 60 * 24));
      if (daysSinceJoin <= 5) {
        this.can_access_materials = true;
      } else {
        this.can_access_materials = false;
      }
    } else {
      this.can_access_materials = true;
    }
  }
  next();
});

const MeetParticipant = model("MeetParticipant", meetParticipantSchema);

export default MeetParticipant;
