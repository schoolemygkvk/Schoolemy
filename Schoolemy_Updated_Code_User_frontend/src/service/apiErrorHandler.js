/**
 * SECURITY FIX 3.5.2: Centralized API error handling
 * Provides consistent error responses across all API services
 * Prevents sensitive error details from being exposed to users
 */

/**
 * Sanitize error message for user display
 * Removes internal system details that could expose architecture
 * @param {Error} error - Axios error object
 * @param {string} defaultMessage - Fallback message if error cannot be parsed
 * @returns {Object} Sanitized error response
 */
export const handleApiError = (error, defaultMessage = 'An error occurred. Please try again.') => {
  // Network error (no response from server)
  if (!error.response) {
    console.error('[Network Error]:', error.message);
    return {
      success: false,
      error: error.message === 'Network Error'
        ? 'Network error. Please check your connection.'
        : defaultMessage,
      code: 'NETWORK_ERROR',
      statusCode: null,
    };
  }

  const status = error.response.status;
  const data = error.response.data;

  // Get server message or fallback
  const message = data?.message || data?.error || defaultMessage;

  // Log full error for debugging (includes internals)
  console.error(`[API Error ${status}]:`, {
    message,
    path: error.config?.url,
    method: error.config?.method,
    data: data,
  });

  // Return sanitized error for user
  return {
    success: false,
    error: sanitizeErrorMessage(message, status),
    code: status,
    statusCode: status,
    // Include these for components that need to handle specific errors
    serverMessage: message,
  };
};

/**
 * Sanitize error message to prevent information disclosure
 * Removes file paths, SQL errors, database details, etc.
 * @param {string} message - Original error message
 * @param {number} status - HTTP status code
 * @returns {string} Sanitized message for user
 */
export const sanitizeErrorMessage = (message, status) => {
  if (!message) {
    return getDefaultErrorMessage(status);
  }

  const messageStr = String(message).toLowerCase();

  // Remove file paths (e.g., /home/user/src/controllers/...)
  let sanitized = message.replace(/\/[a-z_/.\-0-9]+\.js/gi, '[System Error]');

  // Remove database errors (MongoDB, SQL)
  if (messageStr.includes('mongodb') || messageStr.includes('cast') || messageStr.includes('objectid')) {
    return getDefaultErrorMessage(status);
  }

  // Remove SQL errors
  if (messageStr.includes('sql') || messageStr.includes('syntax error')) {
    return getDefaultErrorMessage(status);
  }

  // Remove internal Node/Express details
  if (messageStr.includes('enotfound') || messageStr.includes('econnrefused')) {
    return 'Service temporarily unavailable. Please try again later.';
  }

  // Remove line numbers and stack traces
  sanitized = sanitized.replace(/at line \d+/gi, '');
  sanitized = sanitized.replace(/\(line:\s*\d+[^)]*\)/gi, '');

  return sanitized || getDefaultErrorMessage(status);
};

/**
 * Get appropriate error message based on HTTP status
 * @param {number} status - HTTP status code
 * @returns {string} User-friendly error message
 */
export const getDefaultErrorMessage = (status) => {
  const messages = {
    400: 'Invalid request. Please check your input.',
    401: 'Authentication failed. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    408: 'Request timeout. Please try again.',
    409: 'This resource already exists.',
    413: 'File is too large. Maximum size is 10MB.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. Our team has been notified.',
    502: 'Service temporarily unavailable. Please try again later.',
    503: 'Service is undergoing maintenance. Please try again later.',
    504: 'Request timeout. The server is taking too long to respond.',
  };

  return messages[status] || 'An error occurred. Please try again.';
};

/**
 * Wrap an async API call with error handling
 * Returns {success: boolean, data?, error?} instead of throwing
 * @param {Promise} apiCall - The API call promise
 * @param {string} errorMessage - Fallback error message
 * @returns {Promise<Object>} Result object with success, data, or error
 */
export const safeApiCall = async (apiCall, errorMessage = 'Request failed') => {
  try {
    const response = await apiCall;
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    return handleApiError(error, errorMessage);
  }
};

/**
 * Create a wrapped API service with error handling
 * Automatically handles errors for all methods in a service object
 * @param {Object} service - Service object with API methods
 * @returns {Object} Wrapped service with error handling
 */
export const createSafeApiService = (service) => {
  const wrapped = {};

  for (const [key, fn] of Object.entries(service)) {
    if (typeof fn === 'function') {
      wrapped[key] = async (...args) => {
        try {
          const result = await fn(...args);
          return {
            success: true,
            data: result,
          };
        } catch (error) {
          return handleApiError(error, `${key} failed`);
        }
      };
    } else {
      wrapped[key] = fn;
    }
  }

  return wrapped;
};

export default {
  handleApiError,
  sanitizeErrorMessage,
  getDefaultErrorMessage,
  safeApiCall,
  createSafeApiService,
};
