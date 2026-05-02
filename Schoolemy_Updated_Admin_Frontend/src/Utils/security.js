
export const secureStorage = {
  setItem: (key, value) => {
    try {
      // Store directly — no "encryption" needed for non-sensitive metadata
      // Real security comes from httpOnly cookies for authentication
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("Error storing item:", error);
    }
  },

  getItem: (key) => {
    try {
      return localStorage.getItem(key);
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


export const isValidToken = (token) => {
  if (!token || typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  if (!parts.every((p) => p.length > 0)) return false;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) return false;
  } catch {
    return false;
  }
  return true;
};


export const hasStoredSession = () => {
  const id = secureStorage.getItem("_id");
  const role = secureStorage.getItem("role");
  const name = secureStorage.getItem("name");
  return Boolean(id && role && name);
};


export const hasClientAuthSession = () => {
  const token = secureStorage.getItem("token");
  if (token && isValidToken(token)) return true;
  return hasStoredSession();
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

// Enforce HTTPS in production (only once)
export const enforceHTTPS = () => {
  // Check if already redirected to prevent infinite loops
  if (sessionStorage.getItem("_https_enforced")) return;

  if (
    process.env.NODE_ENV === "production" &&
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    sessionStorage.setItem("_https_enforced", "true");
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

