import { Schema, model } from "mongoose";
import CONFIG from "../../config/constants.js";

// Login History Sub-Schema
const loginHistorySchema = new Schema(
  {
    loginTime: { type: Date, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    logoutTime: { type: Date },
    sessionDuration: { type: Number },
  },
  { _id: false }
);

const tutorSchema = new Schema(
  {
    // Auto-generated Tutor ID (unique identifier)
    tutorId: {
      type: String,
      unique: true,
      required: true,
      default: function() {
        const randomSuffix = Math.floor(CONFIG.TUTOR_ID_RANDOM_RANGE.min + Math.random() * (CONFIG.TUTOR_ID_RANDOM_RANGE.max - CONFIG.TUTOR_ID_RANDOM_RANGE.min));
        return `${CONFIG.TUTOR_ID_PREFIX}${randomSuffix}`;
      },
    },

    // Tutor Details
    name: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },
    mobilenumber: {
      type: String,
      unique: true,
      required: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number"],
    },
    age: { type: Number, min: 18, max: 100 },
    // Additional Tutor Information
    qualification: {
      type: String,
      trim: true,
      default: null,
    },
    subject: {
      type: String,
      trim: true,
      default: null,
    },
    experience: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      street: { type: String, default: null, trim: true },
      city: { type: String, default: null, trim: true },
      state: { type: String, default: null, trim: true },
      zipCode: { type: String, default: null, trim: true },
    },
    gender: {
      type: String,
      enum: ["male", "Male", "female", "Female"],
      required: true,
    },
    govtIdProofs: [
      {
        idType: {
          type: String,
          enum: ["Aadhar", "PAN", "Passport", "VoterID", "DrivingLicense"],
          required: true,
        },
        idNumber: { type: String, required: true, trim: true },
        documentImage: { type: String }, // URL or base64 image of the document
      },
    ],
    profilePictureUpload: { type: String }, // URL or base64 image
    role: {
      type: String,
      default: "tutormanagement",
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: [8, "Password must be at least 8 characters long"],
      match: [
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/,
        "Password must contain at least one lowercase letter, one uppercase letter, one number and one special character",
      ],
    },
    // Subscription/Renewal Status
    subscriptionStatus: {
      type: String,
      enum: ["active", "expired", "pending"],
      default: "active",
    },
    subscriptionExpiryDate: {
      type: Date,
      default: null,
    },

    // Stats
    totalCoursesUploaded: {
      type: Number,
      default: 0,
    },

    // Metadata
    isApproved: {
      type: Boolean,
      default: false,
    },

    isFirstTime: { type: Boolean, default: true },
    otp: { type: String },
    otpExpiresAt: { type: Date },
    forgotPasswordOtp: { type: String },
    forgotPasswordOtpExpiresAt: { type: Date },
    forgotPasswordOtpVerified: { type: Boolean, default: false },
    loginHistory: [loginHistorySchema],
    currentRefreshTokenId: {
      type: Schema.Types.ObjectId,
      ref: "RefreshToken",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Additional security tracking
tutorSchema.add({
  otpAttempts: { type: Number, default: 0 },
  passwordUpdatedAt: { type: Date },
});


const Tutor = model("Tutor", tutorSchema);
export default Tutor;
