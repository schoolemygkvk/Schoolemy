import axios from "axios";
import api from "./api"; // Import main api to borrow refresh logic

// Prefer dedicated blog URL, then main user API URL, then local dev
const API_URL =
  process.env.REACT_APP_BLOG_API_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:8000";

// Create axios instance
const blogApi = axios.create({
  baseURL: `${API_URL.replace(/\/$/, "")}/api/blog`,
  timeout: 10000,
  // SECURITY FIX 3.32.1: Enable cookie-based authentication
  withCredentials: true, // Send cookies with requests
});

// SECURITY FIX 3.32.1: Request interceptor - tokens are now in cookies
blogApi.interceptors.request.use(
  (config) => {
    // Tokens are in httpOnly cookies - automatically sent via withCredentials: true
    // NO Authorization header needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// SECURITY FIX 3.32.10: Shared token refresh state with main api.js
// Use module-level variables to coordinate refresh between blogApi and api
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor for error handling
blogApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const code = error?.response?.data?.code;

    // SECURITY FIX 3.32.10: Handle access token expiry with automatic refresh (same as api.js)
    if (
      status === 401 &&
      code === "TOKEN_EXPIRED" &&
      originalRequest &&
      !originalRequest._retry
    ) {
      // Prevent multiple simultaneous refresh attempts
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          // Retry original request after refresh completes
          return blogApi.request(originalRequest);
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        // Call refresh token endpoint via main api (which has the logic)
        // or directly here since we're sharing state
        await api.post("/api/v1/users/refresh-token");

        // Token refresh successful - process queued requests
        processQueue(null);

        // Retry original request with new access token
        return blogApi.request(originalRequest);
      } catch (refreshError) {
        console.error("Blog API token refresh failed:", refreshError.message);
        processQueue(refreshError);
        // Don't redirect here - let api.js handle session clear
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other 401s (not token-expired) — session is invalid
    if (status === 401 && code !== "TOKEN_EXPIRED") {
      window.location.href = "/?auth=login";
    }

    return Promise.reject(error);
  }
);

// Authentication helpers use your existing login system
// No separate blog login needed - admins use the main admin login

/**
 * SECURITY FIX 3.40.1: Check if user is authenticated
 * For UI purposes only - server MUST verify before allowing operations
 *
 * NOTE: With cookie-based auth, we cannot check for token existence
 * Instead, rely on AuthContext isLoggedIn state or attempt API call
 * The server will reject 401 if not authenticated
 *
 * @returns {boolean} Based on AuthContext or try to make authenticated call
 */
export const isAdminLoggedIn = () => {
  // SECURITY FIX 3.40.1: Tokens in cookies - cannot check localStorage
  // Import and use AuthContext instead:
  // const { isLoggedIn } = useAuth();
  //
  // OR make an authenticated API call - server will return 401 if not auth'd
  // For now, return undefined - caller should use AuthContext instead

  console.warn('[PermissionCheck] Use AuthContext.isLoggedIn for auth state, not localStorage');

  // This function should not be used with cookie-based auth
  // Use AuthContext or make an API call instead
  return undefined;
};

/**
 * SECURITY FIX 3.32.1: Get admin info from localStorage
 *
 * WARNING: This data comes from localStorage which can be tampered with
 * Use ONLY for UI/display purposes
 * Server must verify actual admin status before operations
 *
 * @returns {object} Admin info (for UI only, not secure)
 */
export const getAdminInfo = () => {
  const { getStorageString, getStorageEmail } = require('../utils/storageValidator');

  // SECURITY FIX 3.32.1: Validate localStorage data before use
  return {
    token: getStorageString("token", ""),
    role: getStorageString("role", ""),
    name: getStorageString("name", ""),
    email: getStorageEmail("email", ""),
  };
};

// Consistent error handling function
const handleApiError = (error, operation) => {
  console.error(`Error in ${operation}:`, error);
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  if (error.message) {
    throw new Error(error.message);
  }
  throw new Error(`Failed to ${operation}`);
};

// Admin Blog Management
export const createBlog = async (formData) => {
  try {
    const response = await blogApi.post("/admin/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "create blog");
  }
};

export const updateBlog = async (id, formData) => {
  try {
    const response = await blogApi.put(`/admin/update/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    handleApiError(error, "update blog");
  }
};

export const deleteBlog = async (id) => {
  try {
    const response = await blogApi.delete(`/admin/delete/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "delete blog");
  }
};

export const getAllBlogsAdmin = async () => {
  try {
    const response = await blogApi.get("/admin/all");
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch admin blogs");
  }
};

// Public Blog APIs
export const getPublishedBlogs = async (page = 1, limit = 10, category = "", sortBy = "-createdAt") => {
  try {
    const params = { page, limit };
    if (category) params.category = category;
    if (sortBy) params.sortBy = sortBy;

    const response = await blogApi.get("/published", { params });
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch published blogs");
  }
};

export const getBlogById = async (id) => {
  try {
    const response = await blogApi.get(`/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch blog by id");
  }
};

export const searchBlogs = async (query) => {
  try {
    const response = await blogApi.get("/search", { params: { q: query } });
    return response.data;
  } catch (error) {
    handleApiError(error, "search blogs");
  }
};

export const getBlogCategories = async () => {
  try {
    const response = await blogApi.get("/categories");
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch blog categories");
  }
};

export const getRelatedBlogs = async (id, limit = 3) => {
  try {
    const response = await blogApi.get(`/${id}/related`, { params: { limit } });
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch related blogs");
  }
};

export const getBlogComments = async (id) => {
  try {
    const response = await blogApi.get(`/${id}/comments`);
    return response.data;
  } catch (error) {
    handleApiError(error, "fetch blog comments");
  }
};

export const addBlogComment = async (id, comment) => {
  try {
    const response = await blogApi.post(`/${id}/comments`, { content: comment });
    return response.data;
  } catch (error) {
    handleApiError(error, "add blog comment");
  }
};

export const likeBlog = async (id) => {
  try {
    const response = await blogApi.post(`/${id}/like`);
    return response.data;
  } catch (error) {
    handleApiError(error, "like blog");
  }
};

export const unlikeBlog = async (id) => {
  try {
    const response = await blogApi.delete(`/${id}/like`);
    return response.data;
  } catch (error) {
    handleApiError(error, "unlike blog");
  }
};

// Helper function to get image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("data:image/")) return imagePath;
  if (imagePath.startsWith("http")) return imagePath;
  return `${API_URL}${imagePath}`;
};

export default blogApi;
