

import csrf from "csurf";
import logger from "../Utils/logger.js";

// CSRF protection middleware
// Uses stateless tokens stored in session (Express will handle via middleware)
// Token is generated once at login and reused until session expires
const csrfProtection = csrf({
  cookie: false, // Don't use cookies; use session-based tokens instead
});


export const generateCsrfToken = (req, res, next) => {
  try {
    // Generate token and store in session
    csrfProtection(req, res, () => {
      const token = req.csrfToken();

      // SECURITY FIX 3.32.8: Return CSRF token in response
      // Frontend will save this token and send it in X-CSRF-Token header
      // for all state-changing requests (POST, PUT, PATCH, DELETE)
      res.json({
        success: true,
        csrfToken: token,
        message: "CSRF token generated successfully",
      });
    });
  } catch (error) {
    logger.error("CSRF token generation failed", {
      error: error.message,
      userId: req.user?.id,
    });
    res.status(500).json({
      success: false,
      message: "Failed to generate CSRF token",
    });
  }
};


export const validateCsrfToken = (req, res, next) => {
  // Wrap csrfProtection to handle errors and logging
  csrfProtection(req, res, (err) => {
    if (err) {
      // CSRF token validation failed
      logger.warn("CSRF token validation failed", {
        error: err.message,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
        ip: req.ip,
      });

      // Check if error is a CSRF error
      if (err.code === "EBADCSRFTOKEN") {
        return res.status(403).json({
          success: false,
          message: "Invalid CSRF token. Please refresh and try again.",
          code: "INVALID_CSRF_TOKEN",
        });
      }

      // Other errors
      return res.status(500).json({
        success: false,
        message: "CSRF validation error",
        code: "CSRF_ERROR",
      });
    }

    // Token is valid, continue to next middleware
    logger.debug("CSRF token validation successful", {
      userId: req.user?.id,
      path: req.path,
    });
    next();
  });
};


export const conditionalCsrfProtection = (req, res, next) => {
  // Automated tests hit many state-changing routes in one process; skip CSRF in test only
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  // Skip CSRF validation for safe HTTP methods
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // List of endpoints that don't require CSRF validation
  // These include public unauthenticated endpoints + authenticated endpoints with file uploads
  // File upload endpoints are exempt because they use multipart/form-data which is inherently safer
  const csrfExemptEndpoints = [
    "login",
    "register",
    "forgot-password",
    "reset-password",
    "verify-email",
    "resend-otp",
    "verify-otp",
    "form",
    "create-password",
    "complete-registration",
    "refresh-token",
    "profile-picture",
    "upload-url",
    "putprofile",
  ];

  // Check if current path ends with one of the exempt endpoint segments
  const isExempt = csrfExemptEndpoints.some(endpoint =>
    req.path?.endsWith(`/${endpoint}`),
  );

  if (isExempt) {
    // Skip CSRF validation for exempt paths
    console.log(`[CSRF] ✅ EXEMPT: ${req.method} ${req.path}`);
    logger.debug("CSRF validation skipped for exempt path", {
      path: req.path,
      method: req.method,
    });
    return next();
  }

  // For unsafe methods (POST, PUT, PATCH, DELETE), validate CSRF token
  console.log(`[CSRF] ⚠️ CHECKING: ${req.method} ${req.path}`);
  validateCsrfToken(req, res, next);
};

export default csrfProtection;
