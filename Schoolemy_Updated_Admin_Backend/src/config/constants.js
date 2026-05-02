// Centralized configuration constants for Schoolemy Admin Backend
// All magic numbers and configuration values defined here for easy maintenance

// JWT Configuration
export const JWT_EXPIRY = "1h"; // Access token expiration time (1 hour)
export const JWT_REFRESH_EXPIRY = "7d"; // Refresh token expiration time (7 days)
export const REFRESH_TOKEN_EXPIRY_DAYS = 7; // Used for DB document expiry and cookie maxAge
export const ACCESS_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour in milliseconds (for cookie maxAge)
export const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// OTP Configuration
export const OTP_LENGTH = 6; // OTP digit length (100000-999999 range)
export const OTP_EXPIRY_MINUTES = 5; // OTP validity duration in minutes

// Polling/Scheduler Configuration
export const POLL_CHECK_INTERVAL = 5 * 60 * 1000; // Poll status check interval (5 minutes in milliseconds)
export const POLL_DEADLINE_CHECK_INTERVAL = 60 * 60 * 1000; // Poll deadline notification check (1 hour in milliseconds)

// File Size Limits
export const MAX_FILE_SIZE_MB = 5; // Maximum file size in MB (5MB for profile pictures and documents)
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // Convert to bytes for validation

export const MAX_BASE64_SIZE = 100 * 1024 * 1024 * 1.33; // Base64 encoded 100MB limit (~133MB encoded)

// Tutor ID Configuration
export const TUTOR_ID_PREFIX = "TUTOR"; // Prefix for auto-generated tutor IDs
export const TUTOR_ID_RANDOM_RANGE = { min: 100000, max: 999999 }; // Range for random tutor ID suffix

// Export all as default object for convenience
export default {
  JWT_EXPIRY,
  JWT_REFRESH_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
  ACCESS_TOKEN_EXPIRY_MS,
  REFRESH_TOKEN_EXPIRY_MS,
  OTP_LENGTH,
  OTP_EXPIRY_MINUTES,
  POLL_CHECK_INTERVAL,
  POLL_DEADLINE_CHECK_INTERVAL,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  MAX_BASE64_SIZE,
  TUTOR_ID_PREFIX,
  TUTOR_ID_RANDOM_RANGE,
};
