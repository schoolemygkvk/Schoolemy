

import { enforceHTTPS, isSecureConnection } from "./security";

export const initializeSecurity = () => {
  // Skip HTTPS enforcement in development/localhost
  // Only enforce in production AND prevent infinite redirects
  if (
    process.env.NODE_ENV === "production" &&
    !window.location.href.includes("https")
  ) {
    enforceHTTPS();
  }

  // Warn if not using HTTPS in production
  if (process.env.NODE_ENV === "production" && !isSecureConnection()) {
    console.warn(
      "Security Warning: Application is not using HTTPS. Sensitive data may be at risk."
    );
  }

  // Disable console in production for better security
  if (process.env.NODE_ENV === "production") {
    // Keep only error logging
    console.log = () => {};
    console.debug = () => {};
    console.info = () => {};
    console.warn = () => {};
  }


};

// Clear sensitive data on page unload
export const cleanupOnUnload = () => {
  window.addEventListener("beforeunload", () => {

  });
};

