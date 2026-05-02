import logger from "../Utils/logger.js";
import { sanitizeError } from "../Utils/errorResponseHandler.js";



export const globalErrorHandler = (err, req, res, next) => {
  // Ensure we have error object
  if (!err) {
    return next();
  }

  // Get safe error representation
  const sanitized = sanitizeError(err);

  // Log full error details server-side for debugging
  logger.error("Unhandled error", {
    originalMessage: err.message,
    originalName: err.name,
    statusCode: err.statusCode || sanitized.statusCode || 500,
    path: req.path,
    method: req.method,
    userId: req.userId || "anonymous",
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // Extract HTTP status code
  const statusCode = err.statusCode || sanitized.statusCode || 500;

  // Build response object
  const errorResponse = {
    success: false,
    code: err.code || sanitized.code || "INTERNAL_SERVER_ERROR",
    message: sanitized.message || "An unexpected error occurred",
    ...(process.env.NODE_ENV === "development" && { details: err.message }),
    timestamp: new Date().toISOString(),
  };

  // Add validation errors if present
  if (err.validationErrors && Array.isArray(err.validationErrors)) {
    errorResponse.errors = err.validationErrors;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};


export const notFoundHandler = (req, res) => {
  logger.warn("404 Not Found", {
    path: req.path,
    method: req.method,
    userId: req.userId || "anonymous",
    timestamp: new Date().toISOString(),
  });

  res.status(404).json({
    success: false,
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
};
