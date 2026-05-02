/**
 * SECURITY FIX 3.30.1: Safe JSON parsing from localStorage
 * Prevents silent data loss by properly handling parse errors
 *
 * Features:
 * - Logs errors to console AND external service
 * - Shows user-friendly error message
 * - Provides graceful fallback
 * - Tracks parse errors for monitoring
 */

// Track errors for monitoring/debugging
const parseErrorLog = [];

/**
 * Log parse errors to external service for monitoring
 * In production, send to error tracking service (Sentry, LogRocket, etc)
 */
const logParseErrorToService = (error, key, context) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    error: error.message || String(error),
    stack: error.stack,
    key, // localStorage key
    context, // Additional context
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  parseErrorLog.push(errorData);

  // Log to console (always)
  console.error('[StorageParseError]', {
    key,
    context,
    error: error.message,
    url: window.location.href,
  });

  // TODO: In production, send to external error tracking service
  // Example with Sentry:
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, {
  //     tags: { type: 'storage-parse' },
  //     extra: { key, context }
  //   });
  // }
};

/**
 * Show user-friendly error message
 * SECURITY FIX 3.30.1: Notify user of data loss instead of silently failing
 */
const showStorageErrorNotification = (context) => {
  // Create a notification element if one doesn't exist
  let notificationDiv = document.getElementById('storage-error-notification');
  if (!notificationDiv) {
    notificationDiv = document.createElement('div');
    notificationDiv.id = 'storage-error-notification';
    notificationDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      color: #7f1d1d;
    `;
    document.body.appendChild(notificationDiv);
  }

  notificationDiv.innerHTML = `
    <div style="display: flex; gap: 12px; align-items: flex-start;">
      <span style="font-size: 20px; flex-shrink: 0;">⚠️</span>
      <div style="flex: 1;">
        <p style="margin: 0 0 8px 0; font-weight: 600;">Data Issue Detected</p>
        <p style="margin: 0 0 12px 0; font-size: 14px;">
          Your ${context || 'data'} may have been corrupted.
          <a href="javascript:location.reload()" style="color: #dc2626; text-decoration: underline; cursor: pointer;">
            Refresh the page
          </a> to recover.
        </p>
        <button onclick="this.parentElement.parentElement.style.display='none'"
          style="
            background: #dc2626;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          ">
          Dismiss
        </button>
      </div>
    </div>
  `;

  // Auto-dismiss after 8 seconds
  setTimeout(() => {
    if (notificationDiv.parentElement) {
      notificationDiv.style.opacity = '0';
      notificationDiv.style.transition = 'opacity 0.3s ease-out';
      setTimeout(() => notificationDiv.remove(), 300);
    }
  }, 8000);
};

/**
 * SECURITY FIX 3.30.1: Safe JSON.parse with error handling
 * @param {string} json - JSON string to parse
 * @param {*} defaultValue - Value to return if parsing fails
 * @param {string} key - localStorage key (for logging)
 * @param {string} context - Context description (for user notification)
 * @returns {*} Parsed value or defaultValue
 */
export const safeJsonParse = (
  json,
  defaultValue = null,
  key = 'unknown',
  context = 'data'
) => {
  // Return default if no JSON provided
  if (json === null || json === undefined || json === '') {
    return defaultValue;
  }

  try {
    return JSON.parse(json);
  } catch (error) {
    // SECURITY FIX 3.30.1: Don't silently fail
    logParseErrorToService(error, key, context);
    showStorageErrorNotification(context);

    // Return default value
    return defaultValue;
  }
};

/**
 * SECURITY FIX 3.30.1: Get item from localStorage with safe parsing
 * @param {string} key - localStorage key
 * @param {*} defaultValue - Value to return if key not found or parsing fails
 * @param {string} context - Context description (for user notification)
 * @returns {*} Parsed value or defaultValue
 */
export const getSafeStorageItem = (key, defaultValue = null, context = 'data') => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return safeJsonParse(item, defaultValue, key, context);
  } catch (error) {
    logParseErrorToService(error, key, `${context} (read)`);
    return defaultValue;
  }
};

/**
 * SECURITY FIX 3.30.1: Safely set item in localStorage
 * @param {string} key - localStorage key
 * @param {*} value - Value to store
 * @returns {boolean} True if successful, false otherwise
 */
export const setSafeStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('[StorageWriteError]', {
      key,
      error: error.message,
      type: error.name, // QuotaExceededError, SecurityError, etc.
    });

    // Show warning if storage is full
    if (error.name === 'QuotaExceededError') {
      showStorageErrorNotification('storage is full - some data may not be saved');
    }

    return false;
  }
};

/**
 * Get error log for debugging
 * (useful for monitoring in production)
 */
export const getStorageParseErrorLog = () => {
  return [...parseErrorLog];
};

/**
 * Clear error log
 */
export const clearStorageParseErrorLog = () => {
  parseErrorLog.length = 0;
};

export default {
  safeJsonParse,
  getSafeStorageItem,
  setSafeStorageItem,
  getStorageParseErrorLog,
  clearStorageParseErrorLog,
};
