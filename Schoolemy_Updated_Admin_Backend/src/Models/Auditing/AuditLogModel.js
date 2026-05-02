import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    // What entity was modified
    entityType: {
      type: String,
      enum: [
        'User', 'Admin', 'Course', 'Payment', 'EMI', 'Donation', 'Expense',
        'Invoice', 'BOS-Meeting', 'BOS-MoM', 'BOS-Task', 'DirectMeet',
        'Voting-Poll', 'Testimonial', 'Advertisement', 'Announcement'
      ],
      required: true,
      index: true
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },

    // What action was performed
    action: {
      type: String,
      enum: [
        'Created', 'Updated', 'Deleted', 'Approved', 'Rejected',
        'Submitted', 'Published', 'Archived', 'Restored', 'Activated',
        'Deactivated', 'Paid', 'Pending', 'Completed', 'Cancelled'
      ],
      required: true,
      index: true
    },

    // Who performed it
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin-data-login',
      required: true,
      index: true
    },

    // When it happened
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    },

    // Before and after state
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,

    // Request context
    ipAddress: String,
    userAgent: String,

    // Optional notes
    notes: {
      type: String,
      maxlength: 1000
    }
  },
  { timestamps: false } // timestamps: false because we use explicit timestamp field
);

// Compound index for efficient queries
auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ performedBy: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
