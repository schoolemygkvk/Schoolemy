//Models/User-Model/User-Model.js
import logger  from "../../Utils/logger.js";

import mongoose, { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    studentRegisterNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents to have null for this field if it's not set
      default: null,
    },
    //1st section
    email: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, select: false }, // SECURITY: Never expose password in queries
    role: { type: String, default: "user" },

    //2-section
    // Standardized name fields (single source of truth); legacy fields may be migrated
    firstName: {
      type: String,
      default: null,
      trim: true,
    },
    lastName: {
      type: String,
      default: null,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    fatherName: { type: String, default: null, trim: true, select: false }, // SECURITY: PII - sensitive family information
    dateofBirth: { type: Date, default: null, select: false }, // SECURITY: PII - used for age calculation
    gender: { type: String, enum: ["Male", "Female", "Other"], default: null },
    address: {
      street: { type: String, default: null, trim: true },
      city: { type: String, default: null, trim: true },
      state: { type: String, default: null, trim: true },
      country: { type: String, default: null, trim: true },
      zipCode: { type: String, default: null, trim: true },
    },
    bloodGroup: { type: String, default: null, trim: true, select: false }, // SECURITY: PII - medical information
    Nationality: { type: String, default: null, trim: true, select: false }, // SECURITY: PII - national/citizenship data
    Occupation: { type: String, default: null, trim: true, select: false }, // SECURITY: PII - employment/profession

    //3rd section - Profile Picture Storage (AWS S3 URL format)
    // SECURITY FIX 3.40.2: Store profile picture URLs from AWS S3 (not Binary/Base64)
    // Benefits:
    //   - No database bloat (URL string vs 5MB+ images)
    //   - Scalable cloud storage (S3 handles backups, CDN, lifecycle policies)
    //   - Fast image serving via CloudFront CDN
    //   - Automatic cleanup with S3 lifecycle rules
    // Format: "https://bucket.s3.region.amazonaws.com/profile-images/user-xxx/timestamp-random.jpg"
    profileImageUrl: {
      type: String,
      default: null,
      trim: true,
      select: true, // Exclude by default, but can be selected with .select("+profileImageUrl")
    },

    // LEGACY: Old profilePicture field (kept for backward compatibility with existing data)
    // New uploads use profileImageUrl (S3 URL) instead of storing binary
    // This field will be removed in a future migration once all users are migrated to S3
    profilePicture: {
      data: {
        type: Buffer, // Legacy binary data - no longer used for new uploads
        default: null,
        select: false,
      },
      contentType: {
        type: String,
        default: null,
        select: false,
      },
      uploadedAt: {
        type: Date,
        default: null,
        select: false,
      },
      filename: {
        type: String,
        default: null,
        select: false,
      },
      size: {
        type: Number,
        default: null,
        select: false,
      },
    },

    //User Activity Tracking
    loginHistory: [
      {
        loginTime: { type: Date, required: true },
        ipAddress: { type: String },
        userAgent: { type: String },
        logoutTime: { type: Date },
        sessionDuration: { type: Number }, // in minutes
      },
    ],
    lastActivity: { type: Date },
    status: {
      type: String,
      enum: ["active", "inactive", "logged-out"],
      default: "inactive", // Changed from null to a valid enum
    },
    lastLogout: { type: Date },

    // Registration OTP
    registerOtp: { type: String, default: undefined },
    registerOtpExpiresAt: { type: Date, default: undefined },
    registerOtpVerified: { type: Boolean, default: false },

    // Forgot Password OTP
    forgotPasswordOtp: { type: String, default: undefined },
    forgotPasswordOtpExpiresAt: { type: Date, default: undefined },
    forgotPasswordOtpVerified: { type: Boolean, default: false },

    // SECURITY FIX 3.32.1: Refresh token tracking
    // refreshTokens field is deprecated - now stored in separate RefreshToken collection
    // This allows better token management, rotation, and revocation
    // Each refresh token stored in DB with user reference, expiry, and revocation status
    currentRefreshTokenId: {
      type: Schema.Types.ObjectId,
      ref: "RefreshToken",
      default: null,
      // Points to the current valid refresh token
      // Used for quick lookup without querying RefreshToken collection
    },

    //User EMI- Details
    enrolledCourses: [
      {
        course: {
          type: Schema.Types.ObjectId,
        },
        courseType: {
          type: String,
          enum: ["Course", "TutorCourse"],
          default: "Course",
        },
        coursename: String,
        emiPlan: {
          type: Schema.Types.ObjectId,
          ref: "EMIPlan",
        },
        accessStatus: {
          type: String,
          enum: ["active", "locked"],
          default: "active",
        },
      },
    ],

    // CRITICAL FIX 1.1: Account cleanup tracking
    registrationCompletedAt: {
      type: Date,
      default: null,
    },
    registrationStage: {
      type: String,
      enum: ["email-entered", "otp-verified", "password-set", "profile-completed"],
      default: "email-entered",
    },
    accountDeletionScheduledAt: {
      type: Date,
      default: null,
    },
    lastPurchaseDate: {
      type: Date,
      default: null,
    },

    // CRITICAL FIX 3: Track registration completion separately from OTP
    registrationCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },

    // SECURITY CHECKLIST: Account lockout tracking
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    accountLockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// SCALABILITY: Database indexes for frequently queried fields
// Note: email, mobile, username indexes are already defined above with "index: true"
// Do NOT add duplicate indexes here to avoid mongoose warnings
// Only add composite indexes that aren't already defined
userSchema.index({ createdAt: 1, "enrolledCourses.0": 1 });
userSchema.index({ registrationCompleted: 1, createdAt: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isNew || this.studentRegisterNumber) return next();

  try {
    const COMPANY_CODE = "GKVK";
    const currentYear = new Date().getFullYear() % 100;
    const yearPrefix = `${COMPANY_CODE}${currentYear}`;

    // Escape regex metacharacters in prefix (literal match only)
    const escapedPrefix = yearPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const lastUser = await this.constructor.findOne(
      { studentRegisterNumber: new RegExp(`^${escapedPrefix}`) },
      { studentRegisterNumber: 1 },
      { sort: { studentRegisterNumber: -1 } },
    );

    let newSerial = 1;
    if (lastUser && lastUser.studentRegisterNumber) {
      const lastSerial = parseInt(lastUser.studentRegisterNumber.slice(-4), 10);
      newSerial = lastSerial + 1;
    }

    this.studentRegisterNumber = `${yearPrefix}B1${newSerial
      .toString()
      .padStart(4, "0")}`;
    next();
  } catch (err) {
    logger.error("Error generating studentRegisterNumber:", err);
    next(err);
  }
});
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
