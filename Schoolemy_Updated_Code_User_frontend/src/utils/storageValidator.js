/**
 * SECURITY FIX 3.31.1: localStorage Validation Utility
 * Validates data types when reading from localStorage
 * Prevents crashes from corrupted or tampered data
 *
 * Features:
 * - Type validation (string, number, boolean, object, array)
 * - Safe fallback to defaults
 * - Logs validation errors
 * - Sanitizes data
 */

import { isValidEmail as validateEmailFormat } from './emailValidator';

/**
 * Validate that value is a string
 * @param {*} value - Value to validate
 * @param {string} defaultValue - Default if validation fails
 * @param {string} key - localStorage key (for logging)
 * @returns {string} Valid string or default
 */
export const validateString = (value, defaultValue = '', key = 'unknown') => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value === null || value === undefined) {
    return defaultValue;
  }

  // Log unexpected type
  console.warn(`[StorageValidationError] Expected string for key "${key}", got ${typeof value}:`, value);

  return defaultValue;
};

/**
 * Validate that value is a number
 * @param {*} value - Value to validate
 * @param {number} defaultValue - Default if validation fails
 * @param {string} key - localStorage key (for logging)
 * @returns {number} Valid number or default
 */
export const validateNumber = (value, defaultValue = 0, key = 'unknown') => {
  const num = Number(value);

  if (!isNaN(num) && isFinite(num)) {
    return num;
  }

  if (value === null || value === undefined) {
    return defaultValue;
  }

  console.warn(`[StorageValidationError] Expected number for key "${key}", got:`, value);

  return defaultValue;
};

/**
 * Validate that value is a boolean
 * @param {*} value - Value to validate
 * @param {boolean} defaultValue - Default if validation fails
 * @param {string} key - localStorage key (for logging)
 * @returns {boolean} Valid boolean or default
 */
export const validateBoolean = (value, defaultValue = false, key = 'unknown') => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }

  if (value === null || value === undefined) {
    return defaultValue;
  }

  console.warn(`[StorageValidationError] Expected boolean for key "${key}", got:`, value);

  return defaultValue;
};

/**
 * Validate that value is an array
 * @param {*} value - Value to validate
 * @param {array} defaultValue - Default if validation fails
 * @param {string} key - localStorage key (for logging)
 * @returns {array} Valid array or default
 */
export const validateArray = (value, defaultValue = [], key = 'unknown') => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return defaultValue;
  }

  console.warn(`[StorageValidationError] Expected array for key "${key}", got ${typeof value}:`, value);

  return defaultValue;
};

/**
 * Validate that value is an object
 * @param {*} value - Value to validate
 * @param {object} defaultValue - Default if validation fails
 * @param {string} key - localStorage key (for logging)
 * @returns {object} Valid object or default
 */
export const validateObject = (value, defaultValue = {}, key = 'unknown') => {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return defaultValue;
  }

  console.warn(`[StorageValidationError] Expected object for key "${key}", got ${typeof value}:`, value);

  return defaultValue;
};

/**
 * SECURITY FIX 3.31.1: Get validated string from localStorage
 * @param {string} key - localStorage key
 * @param {string} defaultValue - Default if missing or invalid
 * @returns {string} Validated string
 */
export const getStorageString = (key, defaultValue = '') => {
  try {
    const value = localStorage.getItem(key);
    return validateString(value, defaultValue, key);
  } catch (error) {
    console.error(`[StorageError] Failed to read "${key}":`, error);
    return defaultValue;
  }
};

/**
 * SECURITY FIX 3.31.1: Get validated number from localStorage
 * @param {string} key - localStorage key
 * @param {number} defaultValue - Default if missing or invalid
 * @returns {number} Validated number
 */
export const getStorageNumber = (key, defaultValue = 0) => {
  try {
    const value = localStorage.getItem(key);
    return validateNumber(value, defaultValue, key);
  } catch (error) {
    console.error(`[StorageError] Failed to read "${key}":`, error);
    return defaultValue;
  }
};

/**
 * SECURITY FIX 3.31.1: Get validated boolean from localStorage
 * @param {string} key - localStorage key
 * @param {boolean} defaultValue - Default if missing or invalid
 * @returns {boolean} Validated boolean
 */
export const getStorageBoolean = (key, defaultValue = false) => {
  try {
    const value = localStorage.getItem(key);
    return validateBoolean(value, defaultValue, key);
  } catch (error) {
    console.error(`[StorageError] Failed to read "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @param {string} defaultValue - Default if invalid
 * @returns {string} Valid email or default
 */
export const validateEmail = (email, defaultValue = '') => {
  const str = validateString(email, '', 'email');
  if (!str) return defaultValue;

  // SECURITY FIX 3.33.1: Use centralized email validator
  if (validateEmailFormat(str)) {
    return str;
  }

  console.warn('[StorageValidationError] Invalid email format:', email);
  return defaultValue;
};

/**
 * Get validated email from localStorage
 * @param {string} key - localStorage key
 * @param {string} defaultValue - Default if invalid
 * @returns {string} Validated email
 */
export const getStorageEmail = (key, defaultValue = '') => {
  try {
    const value = localStorage.getItem(key);
    return validateEmail(value, defaultValue);
  } catch (error) {
    console.error(`[StorageError] Failed to read "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Validate phone number (basic format)
 * @param {string} phone - Phone to validate
 * @param {string} defaultValue - Default if invalid
 * @returns {string} Valid phone or default
 */
export const validatePhoneNumber = (phone, defaultValue = '') => {
  const str = validateString(phone, '', 'phone');
  if (!str) return defaultValue;

  // Basic validation: at least 10 digits
  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly.length >= 10) {
    return str;
  }

  console.warn('[StorageValidationError] Invalid phone format:', phone);
  return defaultValue;
};

/**
 * Get validated phone from localStorage
 * @param {string} key - localStorage key
 * @param {string} defaultValue - Default if invalid
 * @returns {string} Validated phone
 */
export const getStoragePhone = (key, defaultValue = '') => {
  try {
    const value = localStorage.getItem(key);
    return validatePhoneNumber(value, defaultValue);
  } catch (error) {
    console.error(`[StorageError] Failed to read "${key}":`, error);
    return defaultValue;
  }
};

/**
 * Validate UUID format
 * @param {string} uuid - UUID to validate
 * @param {string} defaultValue - Default if invalid
 * @returns {string} Valid UUID or default
 */
export const validateUUID = (uuid, defaultValue = '') => {
  const str = validateString(uuid, '', 'uuid');
  if (!str) return defaultValue;

  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // Also accept standard UUID format without v4 restriction
  const standardUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (uuidRegex.test(str) || standardUuidRegex.test(str)) {
    return str;
  }

  console.warn('[StorageValidationError] Invalid UUID format:', uuid);
  return defaultValue;
};

/**
 * Get validated UUID from localStorage
 * @param {string} key - localStorage key
 * @param {string} defaultValue - Default if invalid
 * @returns {string} Validated UUID
 */
export const getStorageUUID = (key, defaultValue = '') => {
  try {
    const value = localStorage.getItem(key);
    return validateUUID(value, defaultValue);
  } catch (error) {
    console.error(`[StorageError] Failed to read "${key}":`, error);
    return defaultValue;
  }
};

export default {
  validateString,
  validateNumber,
  validateBoolean,
  validateArray,
  validateObject,
  validateEmail,
  validatePhoneNumber,
  validateUUID,
  getStorageString,
  getStorageNumber,
  getStorageBoolean,
  getStorageEmail,
  getStoragePhone,
  getStorageUUID,
};
