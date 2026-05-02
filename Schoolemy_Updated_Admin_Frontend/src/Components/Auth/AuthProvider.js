import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { secureStorage } from "../../Utils/security";
import api from "../../Utils/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [menuAccess, setMenuAccess] = useState({});
  const [routeAccess, setRouteAccess] = useState({});

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      const userId = secureStorage.getItem("_id");
      const role = secureStorage.getItem("role");
      const userName = secureStorage.getItem("name");
      const isApproved = secureStorage.getItem("isApproved");

      // Check user data (no token validation needed — cookies are httpOnly)
      if (userId && role && userName) {
        setIsAuthenticated(true);
        setUser({
          id: userId,
          role: role,
          name: userName,
          ...(isApproved !== null ? { isApproved: isApproved === "true" } : {})
        });

        // Restore permissions from sessionStorage
        try {
          const ma = JSON.parse(sessionStorage.getItem("menuAccess") || "{}");
          const ra = JSON.parse(sessionStorage.getItem("routeAccess") || "{}");
          setMenuAccess(ma);
          setRouteAccess(ra);
        } catch (e) {
          console.warn("Failed to parse permissions from sessionStorage:", e);
          setMenuAccess({});
          setRouteAccess({});
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setMenuAccess({});
        setRouteAccess({});
      }

      // Ensure CSRF cookie is fresh on app load
      try {
        await api.get('/csrf-token', { noAuth: true });
        console.log("[Auth] CSRF token initialized successfully");
      } catch (e) {
        // Non-fatal — cookie will be fetched on first mutating request if missing
        console.warn("[Auth] CSRF token initialization failed:", e.message);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setUser(null);
      secureStorage.clear();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for forced logout events dispatched by api.js interceptor
  // Listen for forced logout events dispatched by api.js interceptor
  // Update React state; navigation is handled by AppContent which listens to same event
  useEffect(() => {
    const handleForceLogout = () => {
      setIsAuthenticated(false);
      setUser(null);
      setMenuAccess({});
      setRouteAccess({});
    };
    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, []);

  const login = (userData) => {
    try {
      // Validate required fields before storing
      if (!userData.id || !userData.role || !userData.name) {
        throw new Error("Login response missing required user fields (id, role, name)");
      }

      // Store access token for Bearer auth
      if (userData.token) {
        secureStorage.setItem("token", userData.token);
      }

      // Store refresh token for token renewal
      if (userData.refreshToken) {
        secureStorage.setItem("refreshToken", userData.refreshToken);
      }

      // Store user metadata (id, role, name)
      secureStorage.setItem("_id", userData.id);
      secureStorage.setItem("role", userData.role);
      secureStorage.setItem("name", userData.name);
      if (userData.isApproved !== undefined) {
        secureStorage.setItem("isApproved", String(userData.isApproved));
      }

      // Store permissions in sessionStorage (cleared when tab closes)
      const ma = userData.menuAccess || {};
      const ra = userData.routeAccess || {};
      sessionStorage.setItem("menuAccess", JSON.stringify(ma));
      sessionStorage.setItem("routeAccess", JSON.stringify(ra));

      setIsAuthenticated(true);
      setMenuAccess(ma);
      setRouteAccess(ra);

      // Don't include token in user object
      const userWithoutToken = {
        id: userData.id,
        role: userData.role,
        name: userData.name,
        ...(userData.isApproved !== undefined ? { isApproved: userData.isApproved } : {})
      };
      setUser(userWithoutToken);
    } catch (error) {
      console.error("Error during login:", error);
      secureStorage.clear();
      sessionStorage.clear();
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      // Call backend to invalidate httpOnly cookie
      await api.post('/logout', {}).catch(() => {
        // If backend logout fails, still clear frontend state
      });
    } catch (error) {
      console.error("[Auth] Logout error:", error);
    } finally {
      // Always clear frontend state regardless of backend result
      secureStorage.clear();
      sessionStorage.clear();
      setIsAuthenticated(false);
      setUser(null);
      setMenuAccess({});
      setRouteAccess({});
    }
  }, []);

  const value = {
    isAuthenticated,
    isLoading,
    user,
    menuAccess,
    routeAccess,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
