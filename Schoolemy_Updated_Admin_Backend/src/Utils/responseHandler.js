/**
 * Unified API Response Handler
 * Ensures all endpoints return consistent response format
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (200, 201, etc.)
 * @param {string} message - Success message
 * @param {*} data - Response data (optional)
 */
export const sendSuccess = (res, statusCode = 200, message = "Success", data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (400, 401, 500, etc.)
 * @param {string} message - Error message
 * @param {*} details - Error details (optional, not shown in production)
 */
export const sendError = (res, statusCode = 500, message = "Internal Server Error", details = null) => {
  const response = {
    success: false,
    message,
  };

  // Only include details in development
  if (process.env.NODE_ENV === "development" && details) {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {*} data - Data array
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Success message
 */
export const sendPaginated = (res, data, total, page, limit, message = "Data retrieved successfully") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
};

/**
 * Send no content response (for DELETE operations)
 * @param {Object} res - Express response object
 */
export const sendNoContent = (res) => {
  return res.status(204).send();
};

/**
 * Validation error handler (400 Bad Request)
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
export const sendValidationError = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: "Validation failed",
    errors: errors.map((err) => ({
      field: err.param,
      message: err.msg,
    })),
  });
};
