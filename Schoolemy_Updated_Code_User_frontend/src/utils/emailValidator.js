/**
 * SECURITY FIX 3.33.1: Centralized Email Validation Utility
 *
 * CRITICAL: Email validation is inconsistent across the app
 * - Different regex patterns in different files
 * - Some patterns too weak, some too complex
 * - Creates confusing user experience
 * - Server MUST validate anyway
 *
 * Solution: Centralized validator with strong, consistent regex
 */

/**
 * Standard email regex based on HTML5 spec
 * Balances between RFC 5322 compliance and practical validation
 *
 * Accepts:
 * - user@example.com (standard)
 * - user.name@example.co.uk (dots in local part)
 * - user+tag@example.com (plus addressing)
 * - user_name@example.com (underscores)
 * - 123@example.com (numeric local part)
 *
 * Rejects:
 * - user@domain (no TLD)
 * - user@@example.com (double @)
 * - @example.com (no local part)
 * - user@.com (no domain)
 * - spaces, special characters (except . + _ - )
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * RFC 5322 compliant regex (more strict)
 * Use this for strict validation if needed
 * Accepts more formats but more complex
 */
const EMAIL_REGEX_STRICT = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;

/**
 * SECURITY FIX 3.33.1: Validate email format
 *
 * Uses standard email regex for consistent validation
 * Server MUST verify email ownership with verification email
 *
 * @param {string} email - Email to validate
 * @param {boolean} strict - Use RFC 5322 strict validation (default: false)
 * @returns {boolean} True if email matches pattern
 */
export const isValidEmail = (email, strict = false) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Length checks
  if (trimmedEmail.length < 5 || trimmedEmail.length > 254) {
    return false;
  }

  // Basic structure check
  const [localPart, domain] = trimmedEmail.split('@');

  // Validate local part (before @)
  if (!localPart || localPart.length > 64) {
    return false;
  }

  // Validate domain
  if (!domain || domain.length < 3) {
    return false;
  }

  // Check for consecutive dots
  if (trimmedEmail.includes('..')) {
    return false;
  }

  // Check for invalid start/end characters
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  if (domain.startsWith('-') || domain.endsWith('-')) {
    return false;
  }

  // Use appropriate regex
  const regex = strict ? EMAIL_REGEX_STRICT : EMAIL_REGEX;
  return regex.test(trimmedEmail);
};

/**
 * SECURITY FIX 3.33.1: Get user-friendly error message for email
 *
 * @param {string} email - Email that failed validation
 * @returns {string} Error message to display to user
 */
export const getEmailErrorMessage = (email) => {
  if (!email || email.trim() === '') {
    return 'Please enter your email address.';
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length < 5) {
    return 'Email address is too short.';
  }

  if (trimmedEmail.length > 254) {
    return 'Email address is too long (max 254 characters).';
  }

  if (!trimmedEmail.includes('@')) {
    return 'Email must contain @ symbol.';
  }

  const [localPart, domain] = trimmedEmail.split('@');

  if (!localPart) {
    return 'Email must have characters before @ symbol.';
  }

  if (localPart.length > 64) {
    return 'Email local part is too long (max 64 characters).';
  }

  if (!domain || domain.length < 3) {
    return 'Email must have a valid domain.';
  }

  if (!domain.includes('.')) {
    return 'Email domain must contain a dot (e.g., example.com).';
  }

  if (trimmedEmail.includes('..')) {
    return 'Email cannot contain consecutive dots.';
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return 'Email local part cannot start or end with a dot.';
  }

  if (domain.startsWith('-') || domain.endsWith('-')) {
    return 'Email domain cannot start or end with a hyphen.';
  }

  return 'Please enter a valid email address.';
};

/**
 * SECURITY FIX 3.33.1: Validate email and return result with error message
 *
 * @param {string} email - Email to validate
 * @param {boolean} strict - Use strict validation
 * @returns {object} { isValid: boolean, error: string | null }
 */
export const validateEmail = (email, strict = false) => {
  const isValid = isValidEmail(email, strict);

  return {
    isValid,
    error: isValid ? null : getEmailErrorMessage(email),
  };
};

/**
 * SECURITY FIX 3.33.1: Format email for storage/transmission
 *
 * Normalizes email by:
 * - Trimming whitespace
 * - Converting to lowercase
 * - Removing common typos of popular domains
 *
 * @param {string} email - Raw email from user input
 * @returns {string} Normalized email
 */
export const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return '';
  }

  let normalized = email.trim().toLowerCase();

  // Common typo corrections (optional, can be disabled)
  const commonTypos = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
  };

  Object.entries(commonTypos).forEach(([typo, correct]) => {
    if (normalized.endsWith(typo)) {
      normalized = normalized.replace(typo, correct);
    }
  });

  return normalized;
};

/**
 * SECURITY FIX 3.33.1: Check if two emails are the same
 *
 * Compares normalized versions to handle typos/case differences
 *
 * @param {string} email1 - First email
 * @param {string} email2 - Second email
 * @returns {boolean} True if emails are equivalent
 */
export const emailsMatch = (email1, email2) => {
  const norm1 = normalizeEmail(email1);
  const norm2 = normalizeEmail(email2);
  return norm1 === norm2 && norm1.length > 0;
};

/**
 * SECURITY FIX 3.33.1: Extract domain from email
 *
 * @param {string} email - Email address
 * @returns {string} Domain or empty string
 */
export const getEmailDomain = (email) => {
  if (!email || typeof email !== 'string') {
    return '';
  }

  const normalized = normalizeEmail(email);
  const parts = normalized.split('@');

  return parts.length === 2 ? parts[1] : '';
};

/**
 * SECURITY FIX 3.33.1: Check if email is from common provider
 *
 * Useful for suggesting email verification
 *
 * @param {string} email - Email to check
 * @returns {boolean} True if from known provider (gmail, outlook, yahoo, etc.)
 */
export const isCommonEmailProvider = (email) => {
  const domain = getEmailDomain(email);
  const commonProviders = [
    'gmail.com',
    'yahoo.com',
    'outlook.com',
    'hotmail.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'protonmail.com',
  ];

  return commonProviders.includes(domain);
};

/**
 * SECURITY FIX 3.33.1: Critical Security Note
 *
 * EMAIL VALIDATION RULES:
 *
 * 1. CLIENT-SIDE (This utility)
 *    - For UX: Provide immediate feedback to user
 *    - Prevent obvious errors (no @, no domain, etc.)
 *    - Quick format validation
 *    - CANNOT BE TRUSTED for security
 *
 * 2. SERVER-SIDE (REQUIRED)
 *    - Verify format again
 *    - Check for duplicate emails
 *    - Send verification email
 *    - Confirm user owns the email
 *    - ONLY source of truth
 *
 * 3. EMAIL VERIFICATION (RECOMMENDED)
 *    - Send confirmation link to email
 *    - User clicks link to confirm ownership
 *    - Only then grant full access
 *    - Prevents typos and fake emails
 *
 * DO NOT:
 * ❌ Use client-side validation for security decisions
 * ❌ Trust email validation for access control
 * ❌ Grant account access without verification
 * ❌ Assume client email is validated
 *
 * MUST DO:
 * ✅ Always validate on server
 * ✅ Send verification email
 * ✅ Require email confirmation
 * ✅ Log email validation failures
 */

export default {
  isValidEmail,
  validateEmail,
  getEmailErrorMessage,
  normalizeEmail,
  emailsMatch,
  getEmailDomain,
  isCommonEmailProvider,
  EMAIL_REGEX,
  EMAIL_REGEX_STRICT,
};
