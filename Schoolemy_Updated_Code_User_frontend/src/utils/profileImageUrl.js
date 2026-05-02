import api from "../service/api";

/**
 * SECURITY FIX 3.40.2: Validate and sanitize Base64 image data
 * Prevents XSS attacks via malformed data URIs
 */
export function isValidBase64(str) {
  if (!str || typeof str !== "string") return false;
  try {
    // Check if it matches Base64 pattern (no data: prefix)
    return /^[A-Za-z0-9+/=]+$/.test(str.trim());
  } catch {
    return false;
  }
}

/**
 * Convert binary Buffer data to Base64 string
 */
export function bufferToBase64(buffer) {
  if (!buffer) return null;

  // If it's already a string, return as-is
  if (typeof buffer === "string") {
    return buffer;
  }

  // If it's an array or ArrayBuffer, convert to Base64
  try {
    if (buffer instanceof Uint8Array || Array.isArray(buffer)) {
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }
  } catch (e) {
    console.warn("Failed to convert buffer to Base64:", e);
  }

  return null;
}

/**
 * Browser-loadable URL for images returned by the API (absolute, data URI, or path under backend).
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return null;
  const u = url.trim();
  if (!u) return null;
  if (u.startsWith("data:")) return u;
  if (/^https?:\/\//i.test(u)) return u;
  const base = String(api.defaults.baseURL || "").replace(/\/$/, "");
  if (!base) return u;
  if (u.startsWith("/")) return `${base}${u}`;
  return `${base}/${u}`;
}

/**
 * SECURITY FIX 3.40.2: Get profile picture URL from various formats
 * Handles: profileImageUrl, profilePicture (Base64, Buffer, S3 URL), profilePictureData
 *
 * Format priority:
 * 1. profileImageUrl (new S3/CDN URL format)
 * 2. profilePicture.data (binary Buffer from MongoDB)
 * 3. profilePicture.base64 (Base64 string)
 * 4. profilePicture.url (S3 URL)
 * 5. profilePictureData (raw Base64)
 */
export function getProfilePictureUrl(userData) {
  if (!userData) return null;

  // Priority 1: profileImageUrl (S3/CDN URL)
  if (userData.profileImageUrl) {
    const resolved = resolveMediaUrl(userData.profileImageUrl);
    if (resolved) return resolved;
  }

  // Priority 2-5: profilePicture in various formats
  const pp = userData.profilePicture;

  if (pp) {
    // If profilePicture is a string, treat it as a URL or Base64
    if (typeof pp === "string") {
      const str = pp.trim();
      if (!str) return null;

      // Already a data URI
      if (str.startsWith("data:")) return str;

      // Try to resolve as URL
      const resolved = resolveMediaUrl(str);
      if (resolved) return resolved;

      // Assume it's Base64
      if (isValidBase64(str)) {
        return `data:image/jpeg;base64,${str}`;
      }

      return null;
    }

    // profilePicture is an object
    if (typeof pp === "object") {
      // Handle binary Buffer data from MongoDB
      if (pp.data) {
        const base64Str = bufferToBase64(pp.data);
        if (base64Str && isValidBase64(base64Str)) {
          const mimeType = pp.mimetype || "image/jpeg";
          return `data:${mimeType};base64,${base64Str}`;
        }
      }

      // Handle explicit Base64 field
      if (pp.base64) {
        const base64Str = String(pp.base64).trim();
        if (isValidBase64(base64Str)) {
          const mimeType = pp.mimetype || "image/jpeg";
          return `data:${mimeType};base64,${base64Str}`;
        }
      }

      // Handle S3 URL in different field names
      if (pp.url) {
        const resolved = resolveMediaUrl(pp.url);
        if (resolved) return resolved;
      }
      if (pp.Location) {
        const resolved = resolveMediaUrl(pp.Location);
        if (resolved) return resolved;
      }
    }
  }

  // Priority 6: Direct profilePictureData field
  if (userData.profilePictureData) {
    const dataStr = String(userData.profilePictureData).trim();
    if (dataStr) {
      if (dataStr.startsWith("data:")) return dataStr;
      if (isValidBase64(dataStr)) {
        return `data:image/jpeg;base64,${dataStr}`;
      }
    }
  }

  return null;
}
