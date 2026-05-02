import bcrypt from "bcryptjs";
import crypto from "crypto";

const BCRYPT_SALT_ROUNDS = 12;

/**
 * Hash a password with consistent bcrypt salt rounds (12)
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compare plain text password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password from database
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
export const comparePassword = async (password, hash) => {
  if (!password || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
};

/**
 * Hash a refresh token string
 * Uses same salt rounds as passwords for consistency
 * @param {string} token - Plain text refresh token
 * @returns {Promise<string>} Hashed token
 */
export const hashToken = async (token) => {
  if (!token || typeof token !== "string") {
    throw new Error("Token must be a non-empty string");
  }
  return bcrypt.hash(token, BCRYPT_SALT_ROUNDS);
};

/**
 * Compare plain text token with hashed token
 * @param {string} token - Plain text token
 * @param {string} hash - Hashed token from database
 * @returns {Promise<boolean>} True if tokens match, false otherwise
 */
export const compareToken = async (token, hash) => {
  if (!token || !hash) {
    return false;
  }
  return bcrypt.compare(token, hash);
};

/**
 * Hash a refresh token using SHA-256 (for fast O(1) DB lookup)
 * Replaces bcrypt for token storage — tokens are high-entropy random strings, not user passwords
 * @param {string} token - Plain text refresh token
 * @returns {string} SHA-256 hash (hex string)
 */
export const hashTokenSHA256 = (token) => {
  if (!token || typeof token !== "string") {
    throw new Error("Token must be a non-empty string");
  }
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Verify a plain text token against its SHA-256 hash
 * @param {string} token - Plain text token
 * @param {string} hash - SHA-256 hash from database (hex string)
 * @returns {boolean} True if token matches hash, false otherwise
 */
export const verifyTokenSHA256 = (token, hash) => {
  if (!token || !hash) {
    return false;
  }
  const computed = hashTokenSHA256(token);
  return computed === hash;
};
