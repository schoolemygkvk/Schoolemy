import jwt from "jsonwebtoken";
import crypto from "crypto";
import CONFIG from "../config/constants.js";

export const JwtToken = (user) => {
  const JWT_SECRET = process.env.JWT_SECRET;

  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined. Check your .env file.');
  }

  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: CONFIG.JWT_EXPIRY }
  );
};

/**
 * Generates a long-lived refresh token JWT (7 days).
 * Stored in httpOnly cookie, used to obtain new access tokens.
 */
export const JwtRefreshToken = (user) => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

  if (!JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not defined. Check your .env file.');
  }

  return jwt.sign(
    { id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: CONFIG.JWT_REFRESH_EXPIRY }
  );
};

/**
 * Generates a short-lived access token JWT (1 hour).
 * Payload includes id, role, email, and name to avoid breaking existing controllers.
 */
export const generateAccessToken = (userId, role, email, name) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not defined. Check your .env file.");
  }
  return jwt.sign({ id: userId, role, email, name }, JWT_SECRET, { expiresIn: CONFIG.JWT_EXPIRY });
};

/**
 * Generates a cryptographically secure random string for use as a refresh token.
 * This string is NEVER stored in DB directly — it is bcrypt-hashed before storage.
 * Returns the plaintext string (to be sent to client in cookie).
 */
export const generateRefreshTokenString = () => {
  return crypto.randomBytes(64).toString("hex");
};
