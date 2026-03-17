/**
 * Security utilities for token encryption and secure storage
 * Note: Client-side encryption is not 100% secure but adds an extra layer
 * For maximum security, use httpOnly cookies (requires backend changes)
 */

// Simple obfuscation function (not true encryption, but adds a layer of protection)
const obfuscate = (str) => {
  if (!str) return null;
  try {
    // Simple base64 encoding with a prefix to make it less obvious
    const encoded = btoa(encodeURIComponent(str));
    return `sc_${encoded}`;
  } catch (error) {
    console.error("Obfuscation error:", error);
    return str;
  }
};

const deobfuscate = (str) => {
  if (!str) return null;
  try {
    // Remove prefix and decode
    if (str.startsWith("sc_")) {
      const decoded = decodeURIComponent(atob(str.substring(3)));
      return decoded;
    }
    // Backward compatibility for non-obfuscated values
    return str;
  } catch (error) {
    console.error("Deobfuscation error:", error);
    return str;
  }
};

// Secure token storage with obfuscation
export const secureStorage = {
  setItem: (key, value) => {
    try {
      const obfuscated = obfuscate(value);
      localStorage.setItem(key, obfuscated);
    } catch (error) {
      console.error("Error storing item:", error);
    }
  },

  getItem: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return deobfuscate(item);
    } catch (error) {
      console.error("Error retrieving item:", error);
      return null;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing item:", error);
    }
  },

  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing storage:", error);
    }
  },
};

// Validate token format (basic validation)
export const isValidToken = (token) => {
  if (!token || typeof token !== "string") return false;
  // Basic check: token should be non-empty and not too short
  return token.length > 10;
};

// Sanitize user input (prevent XSS)
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;
  
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  
  return input.replace(/[&<>"'/]/g, (char) => map[char]);
};

// Check if running on HTTPS
export const isSecureConnection = () => {
  if (typeof window === "undefined") return false;
  return (
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
};

// Enforce HTTPS in production
export const enforceHTTPS = () => {
  if (
    process.env.NODE_ENV === "production" &&
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    window.location.replace(
      `https:${window.location.href.substring(window.location.protocol.length)}`
    );
  }
};

// Generate a simple CSRF token (for form submissions)
export const generateCSRFToken = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
};

// Store CSRF token
export const setCSRFToken = () => {
  const token = generateCSRFToken();
  sessionStorage.setItem("csrf_token", token);
  return token;
};

// Get CSRF token
export const getCSRFToken = () => {
  return sessionStorage.getItem("csrf_token") || setCSRFToken();
};

