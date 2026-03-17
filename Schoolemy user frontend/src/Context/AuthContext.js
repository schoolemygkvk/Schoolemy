import React, { createContext, useState, useContext, useEffect } from "react";
import api from "../service/api"; // Use centralized API instance

// Default placeholder image (e.g., a generic avatar)
const DEFAULT_AVATAR =
  "https://via.placeholder.com/150/CCCCCC/FFFFFF?Text=No+Image";

// 1. Create the context
const AuthContext = createContext(null);

// 2. Create the Provider component that will wrap your app
export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const getToken = () => localStorage.getItem("token"); // Adjust 'authToken' if your key is different

  // Restore userData from localStorage on mount so Header shows name/photo immediately on refresh
  const restoreUserDataFromStorage = () => {
    try {
      const cached = localStorage.getItem("userData");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") {
          setUserData(parsed);
          setProfilePicturePreview(
            parsed.profilePicture?.url || DEFAULT_AVATAR,
          );
        }
      }
    } catch (e) {
      console.warn("Failed to restore userData from localStorage", e);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      restoreUserDataFromStorage();
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");
      setSuccessMessage("");

      try {
        const response = await api.get(`/profiles`);
        const data = response.data;
        setUserData(data);
        setProfilePicturePreview(
          data.profilePicture?.url || DEFAULT_AVATAR,
        );
        try {
          localStorage.setItem("userData", JSON.stringify(data));
        } catch (e) {
          console.warn("Failed to cache userData in localStorage", e);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch profile data.",
        );
        console.error("Fetch profile error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // This function will be called from your LoginForm
  // Enhanced login: fetch user profile after login
  const login = async (token, userId) => {
    localStorage.setItem("token", token);
    localStorage.setItem("userId", userId);
    setIsLoggedIn(true);
    try {
      const response = await api.get(`/profiles`);
      const data = response.data;
      setUserData(data);
      setProfilePicturePreview(
        data.profilePicture?.url || DEFAULT_AVATAR,
      );
      try {
        localStorage.setItem("userData", JSON.stringify(data));
      } catch (e) {
        console.warn("Failed to cache userData in localStorage", e);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch profile data.");
      console.error("Fetch profile error (after login):", err);
    }
  };

  // This function will be called from your Header's new logout button
  const logout = async () => {
    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userData");
      setUserData(null);
      setProfilePicturePreview(null);
      setIsLoggedIn(false);
    }
  };

  const value = {
    isLoggedIn,
    login,
    logout,
    userData,
    // Allow components to update the user data stored in context
    updateUserData: (newData) => {
      setUserData((prev) => {
        const updated = { ...(prev || {}), ...(newData || {}) };
        try {
          localStorage.setItem("userData", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to cache userData in localStorage", e);
        }
        // Update profile picture preview if available
        if (updated.profilePicture && updated.profilePicture.url) {
          setProfilePicturePreview(updated.profilePicture.url);
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
