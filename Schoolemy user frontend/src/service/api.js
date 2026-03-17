import axios from "axios";

// Use environment variable if provided, otherwise fall back to the hardcoded URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "https://2sxaoo5hlk.execute-api.ap-south-1.amazonaws.com/dev",
  maxContentLength: 10 * 1024 * 1024, // 10MB - for event details with base64 images
  maxBodyLength: 10 * 1024 * 1024,
  timeout: 15000, // 15s - avoid hanging when backend is slow/unresponsive
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global response interceptor to handle expired/invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Clear stored auth data so user is forced to login again
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userData");
      // Redirect to login page (avoid infinite loops by checking current location if needed)
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);
export default api;
