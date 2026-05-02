import logger from "../Utils/logger.js";
import { AppError } from "../Utils/errorClasses.js";

const isDev = () => !process.env.AWS_LAMBDA_FUNCTION_NAME && process.env.NODE_ENV !== "production";

// Central error handler — mount AFTER all routes
export const globalErrorHandler = (err, req, res, next) => {
  // Guard: response already sent (e.g. streaming upload)
  if (res.headersSent) return next(err);

  const statusCode = err.statusCode || err.status || 500;
  const isOperational = err instanceof AppError && err.isOperational;

  // Structured log with full request context
  const logPayload = {
    message: err.message,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.headers["x-forwarded-for"],
    userId: req.user?._id,
    role: req.user?.role,
    requestId: req.headers["x-request-id"],
    errorCode: err.code,
    stack: err.stack,
  };

  if (statusCode >= 500) {
    logger.error(logPayload);
  } else {
    logger.warn(logPayload);
  }

  // Payload too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      message: "File too large. Maximum allowed size is 100MB.",
    });
  }

  // JSON parse error
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON in request body",
    });
  }

  // Mongoose validation error
  if (err.name === "ValidationError" && err.errors) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: messages,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(409).json({
      success: false,
      message: `Duplicate value for ${field}`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ success: false, message: "Token expired" });
  }

  // Response body
  const body = {
    success: false,
    message: isOperational || isDev() ? err.message : "Internal server error",
    ...(err.code && { code: err.code }),
    ...(isDev() && { stack: err.stack }),
    ...(isOperational && err.details ? { details: err.details } : {}),
  };

  return res.status(statusCode).json(body);
};

// 404 handler — mount after all routes but before globalErrorHandler
export const notFoundHandler = (req, res) => {
  logger.warn({ message: "404 Not Found", method: req.method, url: req.originalUrl });
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
};
