

import logger from "./logger.js";


export const sanitizeError = (error, context = "Request", isDevelopment = false) => {
  const errorInfo = {
    message: error.message || "Unknown error",
    statusCode: error.statusCode || error.status || 500,
    code: error.code,
    name: error.name,
  };

  // Log full error internally (always, for debugging)
  logger.error(`${context} - Error occurred`, {
    message: error.message,
    stack: error.stack,
    code: error.code,
    name: error.name,
    statusCode: errorInfo.statusCode,
    context,
  });

  // Determine user-facing message based on error type
  let userMessage = "An unexpected error occurred. Please try again later.";

  // Map specific error types to user-friendly messages
  if (error.name === "ValidationError") {
    userMessage = "Invalid input provided. Please check your data and try again.";
  } else if (error.name === "CastError") {
    userMessage = "Invalid identifier provided.";
  } else if (error.name === "MongoError" || error.name === "MongooseError") {
    userMessage = "Database error. Please try again later.";
  } else if (error.message?.includes("ECONNREFUSED")) {
    userMessage = "Service temporarily unavailable. Please try again later.";
  } else if (error.message?.includes("ETIMEDOUT")) {
    userMessage = "Request timeout. Please try again.";
  } else if (error.statusCode === 400 || error.status === 400) {
    userMessage = "Invalid request. Please check your input and try again.";
  } else if (error.statusCode === 401 || error.status === 401) {
    userMessage = "Unauthorized. Please log in and try again.";
  } else if (error.statusCode === 403 || error.status === 403) {
    userMessage = "You do not have permission to perform this action.";
  } else if (error.statusCode === 404 || error.status === 404) {
    userMessage = "Resource not found.";
  } else if (error.statusCode === 409 || error.status === 409) {
    userMessage = "This resource already exists.";
  } else if (error.statusCode === 429 || error.status === 429) {
    userMessage = "Too many requests. Please try again later.";
  } else if (error.statusCode === 500 || error.status === 500) {
    userMessage = "Internal server error. Our team has been notified.";
  }

  return {
    userMessage,
    internalMessage: error.message,
    statusCode: errorInfo.statusCode,
    isDevelopment,
    // Only include error details in development
    ...(isDevelopment && {
      debugInfo: {
        message: error.message,
        code: error.code,
        name: error.name,
      },
    }),
  };
};


export const formatErrorResponse = (error, context = "Request", isDevelopment = false) => {
  const sanitized = sanitizeError(error, context, isDevelopment);

  return {
    success: false,
    message: sanitized.userMessage,
    statusCode: sanitized.statusCode,
    code: error.code || "INTERNAL_ERROR",
    // Only include debug info in development
    ...(isDevelopment && sanitized.debugInfo && { debug: sanitized.debugInfo }),
  };
};


export const createSafeError = (message, statusCode = 400, code = "ERROR") => {
  return {
    success: false,
    message,
    statusCode,
    code,
  };
};


export const handleFileUploadError = (error, isDevelopment = false) => {
  let userMessage = "File upload failed. Please try again.";
  let statusCode = 400;

  if (error.code === "LIMIT_FILE_SIZE") {
    userMessage = "File is too large. Maximum size is 50MB.";
    statusCode = 413;
  } else if (error.code === "LIMIT_FILE_COUNT") {
    userMessage = "Too many files. Please upload fewer files.";
    statusCode = 400;
  } else if (error.code === "LIMIT_PART_COUNT") {
    userMessage = "Too many form fields.";
    statusCode = 400;
  } else if (error.code === "LIMIT_FIELD_SIZE") {
    userMessage = "Field value too large.";
    statusCode = 400;
  }

  // Log error internally
  logger.warn("File upload error", {
    code: error.code,
    message: error.message,
    isDevelopment,
  });

  return {
    success: false,
    message: userMessage,
    statusCode,
    code: error.code || "FILE_UPLOAD_ERROR",
  };
};


export const handleJsonError = (error, isDevelopment = false) => {
  logger.warn("JSON parse error", {
    message: error.message,
    isDevelopment,
  });

  return {
    success: false,
    message: "Invalid JSON format. Please check your request body.",
    statusCode: 400,
    code: "JSON_PARSE_ERROR",
    ...(isDevelopment && { debug: { message: error.message } }),
  };
};


export const handleDatabaseError = (error, isDevelopment = false) => {
  let userMessage = "Database error. Please try again later.";

  if (error.message?.includes("ECONNREFUSED")) {
    userMessage = "Database is unavailable. Please try again later.";
  } else if (error.message?.includes("ETIMEDOUT")) {
    userMessage = "Database connection timeout. Please try again.";
  }

  logger.error("Database error", {
    message: error.message,
    code: error.code,
    isDevelopment,
  });

  return {
    success: false,
    message: userMessage,
    statusCode: 503,
    code: "DATABASE_ERROR",
  };
};


export const handleAuthError = (message = "Authentication failed", isDevelopment = false) => {
  return {
    success: false,
    message,
    statusCode: 401,
    code: "AUTH_ERROR",
  };
};


export const handleValidationErrors = (errors) => {
  // Extract field names and error messages
  const fieldErrors = errors.reduce((acc, error) => {
    if (!acc[error.param]) {
      acc[error.param] = [];
    }
    acc[error.param].push(error.msg);
    return acc;
  }, {});

  return {
    success: false,
    message: "Validation failed. Please check your input.",
    statusCode: 400,
    code: "VALIDATION_ERROR",
    fields: fieldErrors,
  };
};


export const handleExternalApiError = (error, apiName = "External Service", isDevelopment = false) => {
  const userMessage = `Failed to communicate with ${apiName}. Please try again later.`;

  logger.error(`${apiName} error`, {
    message: error.message,
    code: error.code,
    statusCode: error.response?.status,
    isDevelopment,
  });

  return {
    success: false,
    message: userMessage,
    statusCode: 503,
    code: "EXTERNAL_API_ERROR",
  };
};

export default {
  sanitizeError,
  formatErrorResponse,
  createSafeError,
  handleFileUploadError,
  handleJsonError,
  handleDatabaseError,
  handleAuthError,
  handleValidationErrors,
  handleExternalApiError,
};
