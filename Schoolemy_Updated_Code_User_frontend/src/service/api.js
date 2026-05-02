import axios from "axios";

// SECURITY FIX 3.32.1: Use httpOnly cookies instead of localStorage for tokens
// Tokens are now stored in HTTP-only cookies set by the backend
// Frontend does NOT handle token storage - cookies are automatic via withCredentials: true
// SECURITY FIX 3.32.2: Add automatic token refresh on expiry
// SECURITY FIX 3.32.3: Add CSRF protection to prevent unauthorized state-changing requests

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL,
  maxContentLength: 10 * 1024 * 1024, // 10MB - for event details with base64 images
  maxBodyLength: 10 * 1024 * 1024,
  timeout: 15000, // 15s - avoid hanging when backend is slow/unresponsive
  withCredentials: true, // SECURITY FIX 3.32.5: Enable sending httpOnly cookies with requests
});

// Bare client: no interceptors — used only to fetch CSRF so we never deadlock or attach a stale header
const csrfPrimeClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 15000,
});

// SECURITY FIX 3.19.1: Create a separate public API instance for unauthenticated endpoints
// Public endpoints (course listings, etc.) should NOT include auth tokens
// This prevents 401 errors when tokens expire, breaking the public page for all users
export const publicApi = axios.create({
  baseURL,
  maxContentLength: 10 * 1024 * 1024,
  maxBodyLength: 10 * 1024 * 1024,
  timeout: 15000,
  withCredentials: false, // No cookies sent — truly public, no auth of any kind
  // NO token interceptor - this is intentional for public endpoints
});

// CSRF token management
let csrfToken = null;
let csrfPrimePromise = null;

// SECURITY FIX 3.32.6: Track refresh token attempts to prevent infinite loops
let isRefreshing = false;
let failedQueue = [];

// SECURITY FIX 3.32.9: Notify React auth state when session is forcibly cleared
let _onSessionCleared = null;
export function registerSessionClearedCallback(cb) {
  _onSessionCleared = cb;
}

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

async function fetchCsrfTokenFromServer() {
  const res = await csrfPrimeClient.get("/csrf-token", {
    params: { _: Date.now() },
  });
  const t = res.data?.csrfToken;
  if (t) {
    csrfToken = t;
    try {
      localStorage.setItem("csrfToken", t);
    } catch (e) {
      console.warn("Failed to cache CSRF token in localStorage", e);
    }
  }
  return t;
}

async function ensureCsrfTokenForMutation() {
  if (csrfToken) return;
  if (!csrfPrimePromise) {
    csrfPrimePromise = fetchCsrfTokenFromServer().finally(() => {
      csrfPrimePromise = null;
    });
  }
  await csrfPrimePromise;
  if (!csrfToken) {
    await fetchCsrfTokenFromServer();
  }
}

// Exported setter so AuthContext can store the token fetched from /csrf-token
export const setCsrfToken = (token) => {
  csrfToken = token;
  try {
    if (token) {
      localStorage.setItem("csrfToken", token);
    } else {
      localStorage.removeItem("csrfToken");
    }
  } catch (e) {
    console.warn("Failed to sync CSRF token in localStorage", e);
  }
};

/** Call on logout (and similar) so the next user/session does not reuse an old CSRF value */
export function clearCsrfToken() {
  csrfToken = null;
  csrfPrimePromise = null;
  try {
    localStorage.removeItem("csrfToken");
  } catch {
    /* ignore */
  }
}

function isInvalidCsrfError(error) {
  const status = error?.response?.status;
  if (status !== 403) return false;
  const code = error?.response?.data?.code;
  if (code === "INVALID_CSRF_TOKEN") return true;
  const msg = String(error?.response?.data?.message || "").toLowerCase();
  return msg.includes("csrf");
}

// SECURITY FIX 3.32.7: Request interceptor - Add CSRF token for state-changing requests
// No longer adds Authorization header - tokens are in cookies
api.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toUpperCase();

  // SECURITY FIX 3.32.5: Tokens are in HTTP-only cookies
  // Do NOT add Authorization header - let cookies handle authentication
  // The backend reads tokens from cookies, not headers
  // Cookies are automatically sent with withCredentials: true

  if (config.__skipCsrfPrime) {
    return config;
  }

  // SECURITY FIX 3.32.8: Add CSRF token for state-changing requests
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    await ensureCsrfTokenForMutation();
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers["X-CSRF-Token"] = csrfToken;
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[api] No CSRF token after /csrf-token — POST may return 403. Use the same host for app and API (e.g. both localhost).",
      );
    }
  }

  return config;
});

// SECURITY FIX 3.32.6: Response interceptor - Handle token refresh automatically
// When access token expires (401 TOKEN_EXPIRED):
// 1. Call /refresh-token endpoint with refresh token (in cookie)
// 2. Backend returns new access token (in cookie)
// 3. Retry original request with new token
api.interceptors.response.use(
  (response) => {
    const newCsrfToken = response.headers["x-csrf-token"];
    if (newCsrfToken) {
      setCsrfToken(newCsrfToken);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const code = error?.response?.data?.code;

    // Handle CSRF token refresh
    if (
      isInvalidCsrfError(error) &&
      originalRequest &&
      !originalRequest._csrfRetry
    ) {
      originalRequest._csrfRetry = true;
      clearCsrfToken();
      try {
        await fetchCsrfTokenFromServer();
        originalRequest.headers = originalRequest.headers || {};
        if (csrfToken) {
          if (typeof originalRequest.headers.set === "function") {
            originalRequest.headers.set("X-CSRF-Token", csrfToken);
          } else {
            originalRequest.headers["X-CSRF-Token"] = csrfToken;
          }
        }
        return api.request(originalRequest);
      } catch (retryErr) {
        console.warn("CSRF refresh retry failed:", retryErr?.message || retryErr);
      }
    }

    // SECURITY FIX 3.32.6: Handle access token expiry with automatic refresh
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
          return api.request(originalRequest);
        });
      }

      isRefreshing = true;
      originalRequest._retry = true;

      try {
        // Call refresh token endpoint
        // Backend reads refreshToken from cookie and returns new access token in cookie
        await api.post("/api/v1/users/refresh-token");

        // Token refresh successful - process queued requests
        processQueue(null);

        // Retry original request with new access token
        return api.request(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError.message);

        // Refresh failed - clear session and reject queued requests
        // User must login again
        clearSession();
        processQueue(refreshError);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle complete session invalidation (401 without TOKEN_EXPIRED)
    if (status === 401 && code !== "TOKEN_EXPIRED") {
      clearSession();
      // NOTE: Do NOT redirect here. Public pages (e.g. homepage) make API calls that
      // can return 401 for unauthenticated users — a hard redirect would send the user
      // to /login even though no auth is required to view that page.
      // Protected pages (Wishlist, Payment, Resources) handle their own redirects
      // via their own auth guards. AuthContext sets isLoggedIn=false on 401 which
      // triggers those guards automatically.
    } else if (status === 403 && code === "INVALID_TOKEN") {
      // JWT bad signature / malformed — session unusable; clear client state
      clearSession();
    } else if (status === 403) {
      // Other 403s — drop cached CSRF so next request fetches a new one
      if (!isInvalidCsrfError(error)) {
        clearCsrfToken();
      }
    }

    return Promise.reject(error);
  },
);

// Helper function to clear session on logout/auth failure
function clearSession() {
  // Clear any remaining localStorage data (no longer stores tokens)
  try {
    localStorage.removeItem("userData");
    // "userId" and "csrfToken" may exist for non-sensitive client state
    localStorage.removeItem("userId");
    localStorage.removeItem("csrfToken");
  } catch {
    /* ignore */
  }
  clearCsrfToken();

  // SECURITY FIX 3.32.9: Notify AuthContext so React UI updates immediately
  _onSessionCleared?.();
}

export default api;
