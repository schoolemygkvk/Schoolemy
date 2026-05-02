import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import {
  register,
  verifyOtp,
  createPassword,
  login,
  logoutUser,
  forgotPassword,
  verifyForgotPasswordOtp,
  ForgotResetPassword,
  registerForm,
  resendOtp,
  completeRegistration,
} from "../../Controllers/user-Controller/User-Auth-Controller.js";
import { refreshAccessToken } from "../../Controllers/Token-Controller/Refresh-Token-Controller.js";
import multer from "multer";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  resendOtpValidator,
  createPasswordValidator,
  forgotPasswordValidator,
  verifyForgotPasswordOtpValidator,
  resetPasswordValidator,
  handleValidationErrors,
} from "../../Middleware/validationMiddleware.js";
import {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
} from "../../Middleware/rateLimitConfig.js";
// SECURITY CHECKLIST: Account lockout middleware
import { checkAccountLockout } from "../../Middleware/accountLockoutMiddleware.js";
const router = express.Router();

// SECURITY FIX 2.16.1: Enforce consistent 5MB file size limit
// Prevents DoS attacks via large file uploads consuming server memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit (aligned with profile picture size)
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heif",
      "image/heic",
      "image/x-heic",
      "image/x-heif",
    ];

    // Check both MIME type and file extension for broader compatibility
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heif", ".heic"];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."));

    const mimeTypeValid = allowedMimeTypes.includes(file.mimetype);
    const extensionValid = allowedExtensions.includes(fileExtension);

    if (mimeTypeValid || extensionValid) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, WebP, and HEIF are allowed.",
        ),
        false,
      );
    }
  },
});

// SECURITY FIX 3.26.1: Input validation middleware added to all endpoints
// Validates request body before processing to prevent type mismatches and data corruption

router.post(
  "/complete-registration",
  upload.single("profilePicture"),
  asyncHandler(completeRegistration),
);

// Registration Flow - Rate limited to prevent brute force
// SECURITY FIX 3.26.1: Validate email, password, name format
router.post("/register", authLimiter, registerValidator, handleValidationErrors, asyncHandler(register));

// Resend OTP - Stricter rate limiting (3 per 10 minutes)
// SECURITY FIX 3.27.1: OTP endpoints protected with otpLimiter
router.post("/resend-otp", otpLimiter, resendOtpValidator, handleValidationErrors, asyncHandler(resendOtp));

// Verify OTP - Stricter rate limiting (3 per 10 minutes)
// SECURITY FIX 3.27.1: OTP brute force attacks prevented
router.post("/verify-otp", otpLimiter, verifyOtpValidator, handleValidationErrors, asyncHandler(verifyOtp));

// Create password - Validate password requirements
// Uses authLimiter (5 per 15 minutes) - part of registration flow
router.post("/create-password", authLimiter, createPasswordValidator, handleValidationErrors, asyncHandler(createPassword));

// Registration form with file upload
router.post("/form", upload.single("profilePicture"), asyncHandler(registerForm));

// Login - Rate limited to prevent brute force (5 attempts per 15 minutes)
// SECURITY FIX 3.26.1: Validate email and password presence
// SECURITY CHECKLIST: Account lockout middleware to prevent brute force
router.post("/login", checkAccountLockout, authLimiter, loginValidator, handleValidationErrors, asyncHandler(login));

// Logout
router.post("/logout", verifyToken, asyncHandler(logoutUser));

// Forgot Password Flow - Stricter rate limiting (3 per 15 minutes)
// SECURITY FIX 3.27.1: Password reset brute force attacks prevented
router.post("/forgot-password", passwordResetLimiter, forgotPasswordValidator, handleValidationErrors, asyncHandler(forgotPassword));

// Verify forgot password OTP - Stricter rate limiting (3 per 15 minutes)
// SECURITY FIX 3.27.1: Prevents OTP spam during password reset
router.post(
  "/verify-forgot-password-otp",
  passwordResetLimiter,
  verifyForgotPasswordOtpValidator,
  handleValidationErrors,
  asyncHandler(verifyForgotPasswordOtp),
);

// Reset password - Stricter rate limiting (3 per 15 minutes)
// SECURITY FIX 3.27.1: Password reset rate limited
router.post("/reset-password", passwordResetLimiter, resetPasswordValidator, handleValidationErrors, asyncHandler(ForgotResetPassword));

// SECURITY FIX 3.32.10: Refresh token endpoint
// Called by frontend when access token expires
// Frontend will make this call automatically before access token expires
// Request must include refreshToken cookie (from login response)
// Response will include new access/refresh tokens in cookies
// No rate limiting on refresh (can be called frequently as tokens expire)
router.post("/refresh-token", asyncHandler(refreshAccessToken));

export default router;
