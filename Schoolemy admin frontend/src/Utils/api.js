import axios from "axios";
import { secureStorage } from "./security";
// eslint-disable-next-line no-unused-vars
import {
  invalidateCache,
  invalidateAllDashboardCache,
  setCachedData,
  CACHE_KEYS,
} from "./dashboardCache";

// =============================================================================
// PRODUCTION-READY API CONFIGURATION
// =============================================================================
// NO PROXY NEEDED - Works identically in development and production
// Uses environment variables for flexibility
// =============================================================================

// API Base URL from environment variable
// Development: https://w4jpp7oi02.execute-api.ap-south-1.amazonaws.com/dev (set in .env.development)
// Production: https://your-api.com (set in .env.production)

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://w4jpp7oi02.execute-api.ap-south-1.amazonaws.com/dev';

const API_BASE_URL =
// process.env.REACT_APP_API_URL || "http://localhost:5000";
process.env.REACT_APP_API_URL || "https://e3a24h4aa3.execute-api.ap-south-1.amazonaws.com/dev";
// process.env.REACT_APP_API_URL || "https://w4jpp7oi02.execute-api.ap-south-1.amazonaws.com/dev";
console.log("🌐 [API Config] Environment:", process.env.NODE_ENV);
console.log("🌐 [API Config] Base URL:", API_BASE_URL);
console.log(
  "🌐 [API Config] Full API endpoint example:",
  `${API_BASE_URL}/api/courses/getcoursesname`,
);

// =============================================================================
// SOCKET.IO CONFIGURATION
// =============================================================================
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || null;
export const SOCKET_ENABLED = !!SOCKET_URL;

// Create axios instance with base URL pointing directly to backend
const api = axios.create({
  baseURL: API_BASE_URL, // Points to backend, NOT /api
  timeout: 300000, // 5 minutes - increased for file uploads
  maxContentLength: 100 * 1024 * 1024,
  maxBodyLength: 100 * 1024 * 1024,
  withCredentials: true, // Send cookies with requests
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Add token and security headers
api.interceptors.request.use(
  (config) => {
    // Log full request URL for debugging
    const fullUrl = `${API_BASE_URL}${config.url}`;
    console.log(`[API] ${config.method?.toUpperCase()} ${fullUrl}`);

    // For FormData: remove Content-Type so axios sets multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
      // Increase timeout for file uploads to 5 minutes
      config.timeout = 300000;
    }

    // Skip auth for specific endpoints
    if (config.noAuth) {
      delete config.noAuth;
      return config;
    }

    // Get token from secure storage
    const token = secureStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Security headers
    config.headers["X-Requested-With"] = "XMLHttpRequest";

    // Cache control for mutations
    if (["post", "put", "delete", "patch"].includes(config.method)) {
      config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle token expiration, errors, and cache invalidation
api.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase();
    const url = response.config?.url || "";

    // Handle cache invalidation on successful mutations
    if (["post", "put", "delete", "patch"].includes(method)) {
      console.log(`[Cache] Mutation detected: ${method.toUpperCase()} ${url}`);

      // Invalidate relevant caches based on endpoint
      if (
        url.includes("/instructor") ||
        url.includes("/post-create-instructor") ||
        url.includes("/update-instructor")
      ) {
        invalidateCache(CACHE_KEYS.INSTRUCTORS);
        console.log("[Cache] Invalidated instructors cache");
      }

      if (url.includes("/tutor") || url.includes("/all-tutors")) {
        invalidateCache(CACHE_KEYS.TUTORS);
        console.log("[Cache] Invalidated tutors cache");
      }

      if (url.includes("/course") || url.includes("/courses")) {
        invalidateCache(CACHE_KEYS.COURSES);
        invalidateCache(CACHE_KEYS.TUTOR_COURSES);
        console.log("[Cache] Invalidated courses cache");
      }

      if (url.includes("/user") || url.includes("/getallusers")) {
        invalidateCache(CACHE_KEYS.USERS);
        console.log("[Cache] Invalidated users cache");
      }

      if (
        url.includes("/tutor/calculate-admin-payments") ||
        url.includes("/payment")
      ) {
        invalidateCache(CACHE_KEYS.TUTOR_EARNINGS);
        console.log("[Cache] Invalidated tutor earnings cache");
      }

      if (url.includes("/profile")) {
        invalidateCache(CACHE_KEYS.TUTOR_PROFILE);
        console.log("[Cache] Invalidated tutor profile cache");
      }

      // If it's a general mutation that might affect dashboard, invalidate all
      // This is a safety net for endpoints we might not have explicitly handled
      if (
        url.includes("/create") ||
        url.includes("/update") ||
        url.includes("/delete") ||
        url.includes("/remove")
      ) {
        // Only invalidate all if we can't determine the specific cache
        // This prevents unnecessary cache clearing
        const hasSpecificCache =
          url.includes("/instructor") ||
          url.includes("/tutor") ||
          url.includes("/course") ||
          url.includes("/user") ||
          url.includes("/payment") ||
          url.includes("/profile");

        if (!hasSpecificCache) {
          console.log(
            "[Cache] General mutation detected, invalidating all dashboard caches",
          );
          invalidateAllDashboardCache();
        }
      }
    }

    // Update cache on successful GET requests for dashboard endpoints
    if (method === "get" && response.status === 200) {
      try {
        if (url === "/getallusers" || url.includes("/getallusers")) {
          const totalUsers =
            response.data?.data?.length || response.data?.length || 0;
          if (totalUsers > 0) {
            setCachedData(CACHE_KEYS.USERS, totalUsers);
          }
        }

        if (
          url === "/api/courses/getcoursesname" ||
          url.includes("/getcoursesname")
        ) {
          const totalCourses = response.data?.length || 0;
          if (totalCourses >= 0) {
            setCachedData(CACHE_KEYS.COURSES, totalCourses);
          }
        }

        if (url === "/all-tutors" || url.includes("/all-tutors")) {
          const tutorCount =
            response.data?.data?.pagination?.totalTutors ||
            response.data?.pagination?.totalTutors ||
            0;
          if (tutorCount >= 0) {
            setCachedData(CACHE_KEYS.TUTORS, tutorCount);
          }
        }

        if (
          url === "/get-instructors-all" ||
          url.includes("/get-instructors-all")
        ) {
          let instructorsData = [];
          if (response.data?.success && response.data.instructors) {
            instructorsData = response.data.instructors;
          } else if (response.data?.success && response.data.data) {
            instructorsData = Array.isArray(response.data.data)
              ? response.data.data
              : response.data.data.instructors || [];
          } else if (Array.isArray(response.data)) {
            instructorsData = response.data;
          }

          if (instructorsData.length > 0) {
            // Process and cache instructors data
            const processed = instructorsData
              .map((instructor) => ({
                ...instructor,
                image: instructor.imageUrl || instructor.image || "",
              }))
              .sort((a, b) => {
                const orderA =
                  a.order !== undefined && a.order !== null
                    ? a.order
                    : Number.MAX_SAFE_INTEGER;
                const orderB =
                  b.order !== undefined && b.order !== null
                    ? b.order
                    : Number.MAX_SAFE_INTEGER;
                return orderA - orderB;
              });
            setCachedData(CACHE_KEYS.INSTRUCTORS, processed);
          }
        }

        if (
          url === "/tutor/calculate-admin-payments" ||
          url.includes("/calculate-admin-payments")
        ) {
          const totalCommission =
            response.data?.data?.totals?.totalCommission || 0;
          if (totalCommission >= 0) {
            setCachedData(CACHE_KEYS.TUTOR_EARNINGS, totalCommission);
          }
        }

        if (url === "/courses-tutors" || url.includes("/courses-tutors")) {
          const payload =
            response.data && response.data.data
              ? response.data.data
              : response.data;
          const courses = Array.isArray(payload) ? payload : [];
          if (courses.length >= 0) {
            const coursesMetrics = {
              totalCourses: courses.length,
              approvedCourses: courses.filter(
                (course) => course.status === "approved",
              ).length,
              pendingReview: courses.filter(
                (course) =>
                  course.status === "pending_review" ||
                  course.status === "pending" ||
                  course.status === "draft" ||
                  !course.status,
              ).length,
            };
            setCachedData(CACHE_KEYS.TUTOR_COURSES, coursesMetrics);
          }
        }

        if (url === "/profile" || url.includes("/profile")) {
          const payload = response.data || {};
          const p = payload.profile ?? payload.data ?? payload.user ?? payload;
          if (p && Object.keys(p).length > 0) {
            const profileData = {
              name: p.name,
              title: p.subject ?? p.qualification,
              experience: p.experience,
              rating: p.rating,
              students: p.students,
              profilePictureUpload: p.profilePictureUpload,
            };
            setCachedData(CACHE_KEYS.TUTOR_PROFILE, profileData);
          }
        }
      } catch (cacheError) {
        // Silently fail cache updates - don't break the API response
        console.warn(
          "[Cache] Error updating cache from GET response:",
          cacheError,
        );
      }
    }

    return response;
  },
  (error) => {
    // Enhanced error logging for debugging
    const requestUrl = error.config?.url || "unknown";
    const fullUrl = `${API_BASE_URL}${requestUrl}`;

    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      console.error(`[API] 401 Unauthorized - ${fullUrl}`);
      // Clear all auth data using secure storage
      secureStorage.removeItem("token");
      secureStorage.removeItem("_id");
      secureStorage.removeItem("role");
      secureStorage.removeItem("name");
      secureStorage.removeItem("isApproved");

      // Redirect to login page
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }

    // Handle 403 Forbidden - Access denied
    else if (error.response?.status === 403) {
      console.error(`[API] 403 Forbidden - ${fullUrl}`, error.response?.data);
    }

    // Handle 413 Payload Too Large
    else if (error.response?.status === 413) {
      console.error(
        `[API] 413 Payload Too Large - ${fullUrl}\n` +
          `The request payload is too large for the server to process.\n` +
          `\n🔴 POSSIBLE SOLUTIONS:\n` +
          `1. ✓ Reduce file sizes before uploading\n` +
          `2. ✓ Upload fewer files at once\n` +
          `3. ✓ Compress images/videos before upload\n` +
          `4. ✓ Check AWS API Gateway payload limits (default: 10MB)\n` +
          `5. ✓ Consider implementing chunked upload for large files`,
      );
      error.userMessage = `File(s) too large. Please reduce file size or upload fewer files at once.`;
    }

    // Handle CORS errors
    else if (error.code === "ERR_NETWORK" || error.message?.includes("CORS")) {
      console.error(
        `[API] CORS/Network Error - ${fullUrl}\n` +
          `Error: ${error.message}\n` +
          `\n🔴 TROUBLESHOOTING STEPS:\n` +
          `1. ✓ Check if backend server is running at: ${API_BASE_URL}\n` +
          `2. ✓ Verify CORS is configured for origin: ${window.location.origin}\n` +
          `3. ✓ Current API_URL: ${API_BASE_URL}\n` +
          `4. ✓ Update .env.development file if backend is on different URL\n` +
          `5. ✓ Restart frontend after changing .env file (npm start)\n` +
          `\n💡 Quick Fix: If backend is local, ensure it's running on port 5000`,
      );

      // Enhanced error object for better debugging
      error.userMessage = `Cannot connect to backend server at ${API_BASE_URL}. Please check if the backend is running.`;
    }

    // Handle timeout errors
    else if (
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout")
    ) {
      console.error(
        `[API] Request Timeout - ${fullUrl}\n` +
          `Server took longer than 30 seconds to respond`,
      );
    }

    // Handle other network errors
    else if (!error.response) {
      console.error(
        `[API] Network Error - ${fullUrl}\n` +
          `Error Code: ${error.code || "unknown"}\n` +
          `Error Message: ${error.message || "Unable to reach server"}\n` +
          `API URL: ${API_BASE_URL}\n` +
          `Check if backend server is running and accessible`,
      );
    }

    // Handle other HTTP errors
    else {
      console.error(
        `[API] HTTP Error ${error.response.status} - ${fullUrl}\n` +
          `Response:`,
        error.response?.data,
      );
    }

    return Promise.reject(error);
  },
);

// Health check function to test backend connectivity
export const checkBackendHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      timeout: 5000,
      validateStatus: () => true, // Accept any status
    });
    console.log(`[API] Backend health check: OK (${API_BASE_URL})`);
    return { success: true, url: API_BASE_URL, status: response.status };
  } catch (error) {
    console.error(
      `[API] Backend health check: FAILED (${API_BASE_URL})`,
      error.message,
    );
    return {
      success: false,
      url: API_BASE_URL,
      error: error.message,
      suggestion: "Please ensure backend server is running and accessible",
    };
  }
};

// Export API_BASE_URL for debugging purposes (backward compatible export as API_URL)
export { API_BASE_URL as API_URL };

export default api;
