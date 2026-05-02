

import rateLimit from "express-rate-limit";
import logger from "../Utils/logger.js";


export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts maximum
  message: "Too many login/registration attempts. Please try again after 15 minutes.",
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: () =>
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
  handler: (req, res, next, options) => {
    const email = req.body.email || "unknown";
    const ip = req.ip;

    logger.warn("🚫 Authentication rate limit exceeded", {
      email,
      ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      message: options.message,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});


export const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // 3 attempts maximum
  message: "Too many OTP requests. Please try again after 10 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () =>
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
  handler: (req, res, next, options) => {
    const email = req.body.email || "unknown";
    const ip = req.ip;

    logger.warn("🚫 OTP rate limit exceeded", {
      email,
      ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      message: options.message,
      code: "OTP_RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});


export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts maximum
  message: "Too many password reset attempts. Please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () =>
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
  handler: (req, res, next, options) => {
    const email = req.body.email || "unknown";
    const ip = req.ip;

    logger.warn("🚫 Password reset rate limit exceeded", {
      email,
      ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      message: options.message,
      code: "PASSWORD_RESET_RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});


export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts maximum
  message: "Too many payment attempts. Please try again after 1 hour.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () =>
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
  handler: (req, res, next, options) => {
    const userId = req.user?.id || req.body.userId || "unknown";
    const ip = req.ip;

    logger.warn("🚫 Payment rate limit exceeded", {
      userId,
      ip,
      amount: req.body.amount,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      message: options.message,
      code: "PAYMENT_RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});


export const enrollmentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 attempts maximum
  message: "Too many enrollment attempts. Please try again after 1 hour.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () =>
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
  handler: (req, res, next, options) => {
    const userId = req.user?.id || "unknown";
    const ip = req.ip;

    logger.warn("🚫 Enrollment rate limit exceeded", {
      userId,
      ip,
      courseId: req.params.courseId,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      message: options.message,
      code: "ENROLLMENT_RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});


export const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests maximum
  message: "Too many requests. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () =>
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
  handler: (req, res, next, options) => {
    const ip = req.ip;

    logger.info("⚠️ General API rate limit approaching", {
      ip,
      path: req.path,
      method: req.method,
      remaining: req.rateLimit?.remaining,
    });

    res.status(429).json({
      success: false,
      message: options.message,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});


export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests maximum
  message: "Too many requests to this sensitive endpoint. Please try again after 1 hour.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: () =>
    process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
  handler: (req, res, next, options) => {
    const userId = req.user?.id || "unknown";
    const ip = req.ip;

    logger.warn("🚫 Strict rate limit exceeded (sensitive endpoint)", {
      userId,
      ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      success: false,
      message: options.message,
      code: "STRICT_RATE_LIMIT_EXCEEDED",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});


export const limiters = {
  auth: authLimiter,
  otp: otpLimiter,
  passwordReset: passwordResetLimiter,
  payment: paymentLimiter,
  enrollment: enrollmentLimiter,
  generalApi: generalApiLimiter,
  strict: strictLimiter,
};

export default limiters;
