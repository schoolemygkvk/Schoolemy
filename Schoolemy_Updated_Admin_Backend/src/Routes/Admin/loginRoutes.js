import express from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import {
  login,
  logoutAdmin,
  verifyOtp,
  sendForgetPasswordOtp,
  resetPasswordWithOtp,
} from "../../Controllers/Admin-Tutor-auth/logincontroller.js";
import { refreshAccessToken } from "../../Controllers/Token-Controller/Refresh-Token-Controller.js";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import {
  validateLogin,
  validateVerifyOtp,
  validateResetPassword,
} from "../../Middleware/validation-rules.js";

const router = express.Router();

// Rate limiters (IPv6 safe with ipKeyGenerator)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: "Too many login attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const ip = ipKeyGenerator(req, res);
    return `${ip}-${req.body.email || "unknown"}`;
  },
});

const otpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3, // 3 OTP attempts per 30 minutes
  message: "Too many OTP attempts. Please request a new OTP.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const ip = ipKeyGenerator(req, res);
    return `${ip}-${req.body.email || "unknown"}`;
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: "Too many password reset attempts. Please try again in 1 hour.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const ip = ipKeyGenerator(req, res);
    return `${ip}-${req.body.email || "unknown"}`;
  },
});

// Admin Authentication Routes

// Admin Login (rate limited + validated)
router.post("/adminlogin", loginLimiter, validateLogin, login);

// Admin Logout (needs JWT on cookie — mounted before global verifyToken in server.js)
router.post("/adminlogout", verifyToken, logoutAdmin);

// Verify OTP (rate limited + validated)
router.post("/verify-otp", otpLimiter, validateVerifyOtp, verifyOtp);

// Forgot Password - Send OTP and Reset Password (rate limited)
router.post("/forgot-password", forgotPasswordLimiter, sendForgetPasswordOtp);

// Reset Password with OTP (rate limited + validated)
router.post("/reset-password", otpLimiter, validateResetPassword, resetPasswordWithOtp);

// Token Management
router.post("/refresh-token", refreshAccessToken);

export default router;
