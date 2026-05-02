/**
 * Security utility functions for token validation and sanitization
 */

/**
 * Validates JWT token format without verifying signature
 * Checks: structure (header.payload.signature), base64 encoding, expiry
 * Note: Server will verify signature separately via jwt.verify()
 */
export const isValidToken = (token) => {
  if (!token || typeof token !== "string") return false;

  try {
    // Check JWT format: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Validate each part is valid base64
    for (const part of parts) {
      if (!part || !/^[A-Za-z0-9_-]+$/.test(part)) {
        return false;
      }
    }

    // Decode payload (don't verify signature, server will do that)
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));

    // Check required JWT claims
    if (!payload || typeof payload !== "object") return false;

    // Check expiry if present
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false; // Token expired
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Extracts JWT payload without verification
 * Only used for non-sensitive information (like displaying username)
 * NEVER use decoded values for authorization decisions
 */
export const getTokenPayload = (token) => {
  if (!isValidToken(token)) return null;

  try {
    const parts = token.split(".");
    return JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
  } catch (error) {
    return null;
  }
};

/**
 * Safely extracts token from Authorization header
 * Returns null if format is invalid
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || typeof authHeader !== "string") return null;

  if (!authHeader.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  return isValidToken(token) ? token : null;
};

/**
 * Checks if token is close to expiration (within X minutes)
 */
export const isTokenExpiringSoon = (token, minutesThreshold = 2) => {
  const payload = getTokenPayload(token);
  if (!payload || !payload.exp) return false;

  const expiryTime = payload.exp * 1000; // Convert to milliseconds
  const timeUntilExpiry = expiryTime - Date.now();
  const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);

  return minutesUntilExpiry <= minutesThreshold;
};
