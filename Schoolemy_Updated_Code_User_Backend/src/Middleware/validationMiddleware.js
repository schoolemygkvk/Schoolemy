

import { body, param, query, validationResult } from "express-validator";
import logger from "../Utils/logger.js";


export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn("Request validation failed", {
      path: req.path,
      method: req.method,
      errors: errors.array(),
      body: req.body,
      ip: req.ip,
    });

    return res.status(400).json({
      success: false,
      message: "Request validation failed",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};



// Register endpoint validation - STEP 1: Only email required
// Password and name come in later steps (createPassword, completeRegistration)
export const registerValidator = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email address")
    .isLength({ max: 255 })
    .withMessage("Email must be less than 255 characters"),
];

// Login endpoint validation
export const loginValidator = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 1 })
    .withMessage("Password is required"),
];

// OTP verification validation
export const verifyOtpValidator = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email address"),
  body("otp")
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be exactly 6 digits")
    .matches(/^\d{6}$/)
    .withMessage("OTP must contain only numeric digits"),
];

// Resend OTP validation
export const resendOtpValidator = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email address"),
];

// Create password validation
export const createPasswordValidator = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .isLength({ max: 128 })
    .withMessage("Password must be less than 128 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/\d/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character"),
];

// Forgot password validation
export const forgotPasswordValidator = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email address"),
];

// Forgot password OTP verification
export const verifyForgotPasswordOtpValidator = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email address"),
  body("otp")
    .trim()
    .isLength({ min: 4, max: 6 })
    .withMessage("OTP must be between 4 and 6 characters")
    .isAlphanumeric()
    .withMessage("OTP must contain only alphanumeric characters"),
];

// Reset password validation (matches isValidPassword from validate.js)
// Backend only validates email and newPassword strength
// Frontend is responsible for confirming passwords match before submission
export const resetPasswordValidator = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email address"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .isLength({ max: 128 })
    .withMessage("Password must be less than 128 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/)
    .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"),
];



// Update profile validation
export const updateProfileValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9\-\+\s\(\)]+$/)
    .withMessage("Invalid phone number format"),
  body("age")
    .optional()
    .isInt({ min: 1, max: 150 })
    .withMessage("Age must be between 1 and 150"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other", ""])
    .withMessage("Gender must be male, female, or other"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio must be less than 500 characters"),
];



// Enroll in course validation
export const enrollCourseValidator = [
  param("courseId")
    .isMongoId()
    .withMessage("Invalid course ID"),
];

// Payment processing validation
export const processPaymentValidator = [
  body("courseId")
    .isMongoId()
    .withMessage("Invalid course ID"),
  body("amount")
    .isFloat({ min: 0.01 })
    .withMessage("Amount must be greater than 0"),
  body("paymentMethod")
    .isIn(["credit_card", "debit_card", "upi", "netbanking", "wallet"])
    .withMessage("Invalid payment method"),
];

// Exam submission validation
export const submitExamValidator = [
  body("courseId")
    .isMongoId()
    .withMessage("Invalid course ID"),
  body("examId")
    .isMongoId()
    .withMessage("Invalid exam ID"),
  body("answers")
    .isArray()
    .withMessage("Answers must be an array"),
  body("answers.*.questionId")
    .isMongoId()
    .withMessage("Invalid question ID"),
  body("answers.*.selectedOption")
    .isString()
    .withMessage("Selected option must be a string"),
];



// Contact form validation
export const contactFormValidator = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email address"),
  body("phone")
    .optional()
    .trim()
    .matches(/^[0-9\-\+\s\(\)]{10,}$/)
    .withMessage("Invalid phone number"),
  body("subject")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Subject must be between 5 and 100 characters"),
  body("message")
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage("Message must be between 10 and 5000 characters"),
];



// Pagination validator
export const paginationValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sort")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Sort must be asc or desc"),
];

// Search validator
export const searchValidator = [
  query("search")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search term must be between 2 and 100 characters"),
];



// Profile picture upload validation (middleware that checks file existence)
export const profilePictureValidator = [
  body().custom((value, { req }) => {
    if (!req.file) {
      throw new Error("Profile picture is required");
    }
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedMimes.includes(req.file.mimetype)) {
      throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.");
    }
    if (req.file.size > 5 * 1024 * 1024) {
      throw new Error("File size must be less than 5MB");
    }
    return true;
  }),
];



// Mark lesson complete validator
export const markLessonCompleteValidator = [
  param("courseId")
    .isMongoId()
    .withMessage("Invalid course ID"),
  body("chapterIndex")
    .isInt({ min: 0 })
    .withMessage("Chapter index must be a non-negative integer"),
  body("lessonIndex")
    .isInt({ min: 0 })
    .withMessage("Lesson index must be a non-negative integer"),
];

// Request certificate validator
export const requestCertificateValidator = [
  param("courseId")
    .isMongoId()
    .withMessage("Invalid course ID"),
];


export const validators = {
  // Auth validators
  register: registerValidator,
  login: loginValidator,
  verifyOtp: verifyOtpValidator,
  resendOtp: resendOtpValidator,
  createPassword: createPasswordValidator,
  forgotPassword: forgotPasswordValidator,
  verifyForgotPasswordOtp: verifyForgotPasswordOtpValidator,
  resetPassword: resetPasswordValidator,

  // Profile validators
  updateProfile: updateProfileValidator,

  // Course validators
  enrollCourse: enrollCourseValidator,
  processPayment: processPaymentValidator,
  submitExam: submitExamValidator,

  // Contact validators
  contactForm: contactFormValidator,

  // Query validators
  pagination: paginationValidator,
  search: searchValidator,

  // File validators
  profilePicture: profilePictureValidator,

  // Progress validators
  markLessonComplete: markLessonCompleteValidator,
  requestCertificate: requestCertificateValidator,
};


export const checkEmailExists = body("email")
  .custom(async (value, { req }) => {
    // This would be implemented based on your database
    // Example:
    // const user = await User.findOne({ email: value });
    // if (user) throw new Error('Email already registered');
  });


export const validationLogger = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.info("Validation issues detected", {
      path: req.path,
      method: req.method,
      errorCount: errors.array().length,
      errors: errors.array().map((e) => `${e.param}: ${e.msg}`),
    });
  }
  next();
};

export default {
  handleValidationErrors,
  validators,
  validationLogger,
};
