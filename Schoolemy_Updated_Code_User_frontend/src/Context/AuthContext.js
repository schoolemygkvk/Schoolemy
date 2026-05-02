import React, { createContext, useState, useContext, useEffect } from "react";
import api, { setCsrfToken, clearCsrfToken, registerSessionClearedCallback } from "../service/api"; // Use centralized API instance
import { getProfilePictureUrl } from "../utils/profileImageUrl";
import { migrateGuestWishlistToUser } from "../utils/wishlistStorage";

// 1. Create the context
const AuthContext = createContext(null);

// SECURITY FIX 3.32.1: Tokens are in httpOnly cookies - never in localStorage
// This function always returns false because tokens cannot be read from JavaScript
function readTokenPresent() {
  // Tokens are in HTTP-only cookies set by backend
  // We can't read them from JavaScript (that's the security feature)
  // Auto-login happens via the profile fetch attempt instead
  return false;
}

// 2. Create the Provider component that will wrap your app
// Access + refresh tokens live in httpOnly cookies (set by the backend). They are not stored in
// React state or localStorage. axios in ../service/api.js sends cookies (withCredentials) and
// refreshes the session on TOKEN_EXPIRED via POST /api/v1/users/refresh-token — no UI token vars.
export const AuthProvider = ({ children }) => {
  // Hydrate from storage on first paint so children (e.g. Wishlist) never see a false "logged out" flash before useEffect runs.
  const [isLoggedIn, setIsLoggedIn] = useState(readTokenPresent);
  const [userData, setUserData] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // SECURITY FIX 3.32.1: Tokens are in httpOnly cookies - NOT readable from JavaScript
  // This function always returns null (tokens cannot be accessed)
  // Tokens are automatically sent with API requests via withCredentials: true
  const getToken = () => {
    // Tokens are NEVER stored in localStorage
    // They're in HTTP-only cookies set by the backend
    return null;
  };

  // SECURITY FIX 3.30.1: Restore userData from localStorage with error handling
  // Uses safeJsonParse to log errors and notify user if data is corrupted
  const restoreUserDataFromStorage = () => {
    const { getSafeStorageItem } = require('../utils/safeStorageParser');
    const parsed = getSafeStorageItem("userData", null, "user profile");
    if (parsed && typeof parsed === "object") {
      setUserData(parsed);
      setProfilePicturePreview(getProfilePictureUrl(parsed));
    }
  };

  // Fetch a fresh CSRF token from the backend and store it via setCsrfToken.
  // Must be called after login and after session is confirmed on refresh,
  // so that PUT/POST/PATCH/DELETE requests can attach the X-CSRF-Token header.
  const refreshCsrfToken = async () => {
    try {
      const res = await api.get("/csrf-token");
      if (res.data?.csrfToken) {
        setCsrfToken(res.data.csrfToken);
      }
    } catch (err) {
      console.warn("Failed to fetch CSRF token:", err.message);
    }
  };

  useEffect(() => {
    // SECURITY FIX 3.32.1: No token in localStorage anymore
    // Restore cached userData instantly for optimistic UI while profile fetch runs
    // Auto-login happens via the profile fetch attempt in the main useEffect
    restoreUserDataFromStorage();
  }, []);

  // Prime session + CSRF early so POSTs (e.g. payment) are not blocked while profile fetch runs
  useEffect(() => {
    refreshCsrfToken();
  }, []);

  // SECURITY FIX 3.32.9: Register callback so api.js can update React state when session is forcibly cleared
  useEffect(() => {
    registerSessionClearedCallback(() => {
      setIsLoggedIn(false);
      setUserData(null);
      setProfilePicturePreview(null);
      try {
        localStorage.removeItem("userData");
        localStorage.removeItem("userId");
        localStorage.removeItem("csrfToken");
      } catch {
        /* ignore */
      }
    });
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      // SECURITY FIX 3.32.1: Auto-login via cookie
      // Try to fetch profile - if it succeeds, user has valid access token in cookie
      // If it fails with 401, user is not logged in
      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      try {
        const response = await api.get(`/api/v1/user-profile/profiles`);
        const data = response.data;

        // Check if we got valid user data back
        if (data && data._id) {
          setIsLoggedIn(true);
          setUserData(data);
          setProfilePicturePreview(getProfilePictureUrl(data));
          try {
            localStorage.setItem("userData", JSON.stringify(data));
            localStorage.setItem("userId", data._id || data.id);
          } catch (e) {
            console.warn("Failed to cache userData in localStorage", e);
          }
          // Session is confirmed valid — fetch a fresh CSRF token so that
          // subsequent state-changing requests (profile picture, etc.) can succeed.
          await refreshCsrfToken();
        } else {
          // No valid user data returned
          setIsLoggedIn(false);
          setUserData(null);
        }
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          // User is not authenticated - cookies are invalid or expired
          // Clear everything
          localStorage.removeItem("userId");
          localStorage.removeItem("userData");
          clearCsrfToken();
          setIsLoggedIn(false);
          setUserData(null);
        } else {
          // Non-401/403 errors (network timeout, 500, etc.) do not log the user out
          // Keep the cached user data so the UI doesn't flash "logged out"
          console.warn("Profile fetch error (non-fatal):", err.message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // This function will be called from your LoginForm
  // Enhanced login: fetch user profile after login
  // SECURITY FIX 3.32.4: Login now uses cookies (no token storage)
  // SECURITY FIX 3.32.5: Tokens are NOT passed as parameters anymore
  const login = async (userId) => {
    // SECURITY FIX 3.32.5: No token storage needed
    // Token is in HTTP-only cookie set by backend - automatically sent with API requests
    // Just store userId for reference
    localStorage.setItem("userId", userId != null ? String(userId) : "");
    migrateGuestWishlistToUser(userId != null ? String(userId) : null);
    setIsLoggedIn(true);
    try {
      const response = await api.get(`/api/v1/user-profile/profiles`);
      const data = response.data;
      setUserData(data);
      setProfilePicturePreview(getProfilePictureUrl(data));
      try {
        localStorage.setItem("userData", JSON.stringify(data));
      } catch (e) {
        console.warn("Failed to cache userData in localStorage", e);
      }
      // Fetch CSRF token after login so state-changing requests work immediately.
      await refreshCsrfToken();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch profile data.");
      console.error("Fetch profile error (after login):", err);
    }
  };

  // This function will be called from your Header's new logout button
  // SECURITY FIX 3.17.1: Clear httpOnly cookie via backend
  // SECURITY FIX 3.18.1: Clear CSRF token on logout
  const logout = async () => {
    try {
      // Backend logout endpoint clears httpOnly cookie and CSRF token
      await api.post("/api/v1/users/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear any remaining localStorage data (for transition period)
      localStorage.removeItem("userId"); // Non-sensitive, can stay but clear for completeness
      localStorage.removeItem("userData"); // Clear user data
      clearCsrfToken();
      setUserData(null);
      setProfilePicturePreview(null);
      setIsLoggedIn(false);
    }
  };

  const value = {
    isLoggedIn,
    /** True until initial session check / profile fetch finishes — use to avoid redirect flash on refresh */
    isAuthLoading: isLoading,
    /** @deprecated use isAuthLoading — kept for Payment / ProtectedPaymentRoute */
    isLoading,
    login,
    logout,
    userData,
    // Allow components to update the user data stored in context
    // SECURITY FIX 3.40.2: Properly handle Base64 image data updates
    updateUserData: (newData) => {
      setUserData((prev) => {
        const updated = {
          ...(prev || {}),
          ...(newData || {}),
          // FIX: Preserve S3 profileImageUrl if new data doesn't include it (happens after profile details save)
          profileImageUrl: newData?.profileImageUrl ?? prev?.profileImageUrl,
        };
        try {
          localStorage.setItem("userData", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to cache userData in localStorage", e);
        }
        // Extract and display image - handles Base64, Buffer, S3 URLs
        const imageUrl = getProfilePictureUrl(updated);
        if (imageUrl) {
          setProfilePicturePreview(imageUrl);
        }
        return updated;
      });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Create a custom hook to easily use this context in other components
export const useAuth = () => {
  return useContext(AuthContext);
};
