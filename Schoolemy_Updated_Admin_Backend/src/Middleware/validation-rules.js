import { body, param, query, validationResult } from "express-validator";

// Validation error handler middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// ============================================================================
// ADMIN VALIDATION RULES
// ============================================================================

export const validateCreateAdmin = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters, spaces, hyphens, and apostrophes"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email format"),

  body("mobilenumber")
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be exactly 10 digits"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage("Password must contain at least one special character")
    .custom((password, { req }) => {
      const confirm = req.body.confirmPassword ?? req.body.conformpassword;
      if (confirm === undefined || confirm === null || String(confirm).length === 0) {
        throw new Error("Confirm password is required");
      }
      if (confirm !== password) {
        throw new Error("Passwords do not match");
      }
      return true;
    }),

  body("gender")
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === "") return true;
      const v = String(value).trim().toLowerCase();
      return ["male", "female", "other"].includes(v);
    })
    .withMessage("Gender must be Male, Female, or Other"),

  body("age")
    .optional()
    .isInt({ min: 18, max: 100 })
    .withMessage("Age must be between 18 and 100"),

  body("role")
    .isIn([
      "admin",
      "superadmin",
      "bosmembers",
      "boscontroller",
      "auditor",
      "committeeoftrustees",
    ])
    .withMessage("Invalid role selected"),

  body("permanentAddress")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Permanent address must not exceed 500 characters"),

  body("tempAddress")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Temporary address must not exceed 500 characters"),

  body("designationInBoard")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Board designation must be between 2 and 100 characters"),

  body("designation")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Designation must not exceed 100 characters"),

  body("tenureStart")
    .optional()
    .isISO8601()
    .withMessage("Tenure start date must be valid ISO8601 format"),

  body("tenureEnd")
    .optional()
    .isISO8601()
    .withMessage("Tenure end date must be valid ISO8601 format"),

  handleValidationErrors,
];

export const validateUpdateAdmin = [
  param("id")
    .isMongoId()
    .withMessage("Invalid admin ID format"),

  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters")
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage("Name can only contain letters, spaces, hyphens, and apostrophes"),

  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email format"),

  body("mobilenumber")
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Mobile number must be exactly 10 digits"),

  body("gender")
    .optional()
    .custom((value) => {
      if (value === undefined || value === null || value === "") return true;
      const v = String(value).trim().toLowerCase();
      return ["male", "female", "other"].includes(v);
    })
    .withMessage("Gender must be Male, Female, or Other"),

  body("age")
    .optional()
    .isInt({ min: 18, max: 100 })
    .withMessage("Age must be between 18 and 100"),

  body("role")
    .optional()
    .isIn([
      "admin",
      "superadmin",
      "bosmembers",
      "boscontroller",
      "auditor",
      "committeeoftrustees",
    ])
    .withMessage("Invalid role selected"),

  handleValidationErrors,
];

export const validateDeleteAdmin = [
  param("id")
    .isMongoId()
    .withMessage("Invalid admin ID format"),
];

// ============================================================================
// LOGIN VALIDATION RULES
// ============================================================================

export const validateLogin = [
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email format"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  handleValidationErrors,
];

export const validateVerifyOtp = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email format"),

  body("otp")
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be exactly 6 digits"),

  handleValidationErrors,
];

export const validateResetPassword = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Invalid email format"),

  body("otp")
    .trim()
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be exactly 6 digits"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
    .withMessage("Password must contain at least one special character"),

  body("confirmPassword")
    .custom((value, { req }) => value === req.body.password)
    .withMessage("Passwords do not match"),

  handleValidationErrors,
];

// ============================================================================
// COURSE VALIDATION RULES
// ============================================================================

export const validateCreateCourse = [
  body("coursename")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Course name must be between 3 and 200 characters"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required"),

  body("courseduration")
    .trim()
    .notEmpty()
    .withMessage("Course duration is required"),

  body("courseDescription")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters"),

  body("credits")
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage("Credits must be between 1 and 10"),

  handleValidationErrors,
];

export const validateUpdateCourse = [
  param("coursename")
    .trim()
    .notEmpty()
    .withMessage("Course name is required"),

  body("coursename")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Course name must be between 3 and 200 characters"),

  body("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category is required"),

  body("courseduration")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Course duration is required"),

  handleValidationErrors,
];

// ============================================================================
// QUERY VALIDATION RULES
// ============================================================================

export const validatePaginationQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term must not exceed 100 characters"),

  handleValidationErrors,
];

// ============================================================================
// GENERIC PARAM VALIDATION
// ============================================================================

export const validateIdParam = [
  param("id")
    .isMongoId()
    .withMessage("Invalid ID format"),
];

export const validateCourseName = [
  param("coursename")
    .trim()
    .notEmpty()
    .withMessage("Course name is required"),
];

export const validateCategoryName = [
  param("categoryName")
    .trim()
    .notEmpty()
    .withMessage("Category name is required"),
];
