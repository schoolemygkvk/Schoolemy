/**
 * Security initialization and checks
 * Run on app startup to enforce security measures
 */

import { enforceHTTPS, isSecureConnection } from "./security";

export const initializeSecurity = () => {
  // Enforce HTTPS in production
  enforceHTTPS();

  // Warn if not using HTTPS in production
  if (process.env.NODE_ENV === "production" && !isSecureConnection()) {
    console.warn(
      "⚠️ Security Warning: Application is not using HTTPS. Sensitive data may be at risk."
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

  // Disable right-click context menu in production (optional, can be commented out)
  // if (process.env.NODE_ENV === "production") {
  //   document.addEventListener("contextmenu", (e) => e.preventDefault());
  //   document.addEventListener("keydown", (e) => {
  //     // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
  //     if (
  //       e.key === "F12" ||
  //       (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
  //       (e.ctrlKey && e.key === "U")
  //     ) {
  //       e.preventDefault();
  //     }
  //   });
  // }
};

// Clear sensitive data on page unload
export const cleanupOnUnload = () => {
  window.addEventListener("beforeunload", () => {
    // Optionally clear sensitive data when leaving (commented out to keep user logged in)
    // sessionStorage.clear();
  });
};

