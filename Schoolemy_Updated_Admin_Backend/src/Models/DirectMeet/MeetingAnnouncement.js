import { Schema, model } from "mongoose";


const meetingAnnouncementSchema = new Schema(
  {
    course_id: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    meeting_id: {
      type: Schema.Types.ObjectId,
      ref: 'DirectMeet',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    announcement_type: {
      type: String,
      enum: ['general', 'pre_meeting', 'reminder', 'update', 'cancellation'],
      default: 'general',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
    scheduled_date: {
      type: Date,
      default: Date.now,
    },
    expires_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
meetingAnnouncementSchema.index({ course_id: 1, is_active: 1 });
meetingAnnouncementSchema.index({ meeting_id: 1, is_active: 1 });
meetingAnnouncementSchema.index({ created_at: -1 });

const MeetingAnnouncement = model('MeetingAnnouncement', meetingAnnouncementSchema);

export default MeetingAnnouncement;
