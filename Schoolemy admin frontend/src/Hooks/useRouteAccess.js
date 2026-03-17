import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { canAccessRoute } from "../Routes/ProtectedRoutes";
import { secureStorage } from "../Utils/security";

/**
 * Hook to check if current user can access a route
 * Automatically redirects to dashboard if no access
 * @param {string} routeKey - Route key from routeAccessConfig
 * @param {boolean} redirectOnDeny - Whether to redirect on access deny (default: true)
 * @returns {boolean} - Whether user has access
 */
export const useRouteAccess = (routeKey, redirectOnDeny = true) => {
  const navigate = useNavigate();
  // Use secure storage to get role
  const role = secureStorage.getItem("role");
  const hasAccess = canAccessRoute(role, routeKey);

  useEffect(() => {
    if (!hasAccess && redirectOnDeny) {
      console.warn(
        `Access denied to route: ${routeKey} for role: ${role}`
      );
      // Redirect to appropriate dashboard based on role
      if (role === "tutor") {
        navigate("/schoolemy/tutor/dashboard", { replace: true });
      } else {
        navigate("/schoolemy", { replace: true });
      }
    }
  }, [hasAccess, redirectOnDeny, navigate, role, routeKey]);

  return hasAccess;
};

/**
 * Hook to get all accessible routes for current user
 * @returns {Object} - Object with accessible route keys and configs
 */
export const useAccessibleRoutes = () => {
  // Use secure storage to get role
  const role = secureStorage.getItem("role");
  const { getAccessibleRoutes } = require("../Routes/ProtectedRoutes");
  return getAccessibleRoutes(role);
};

/**
 * Hook to check if user can access multiple routes
 * @param {string[]} routeKeys - Array of route keys to check
 * @returns {Object} - Object with route keys as keys and boolean access values
 */
export const useMultiRouteAccess = (routeKeys) => {
  // Use secure storage to get role
  const role = secureStorage.getItem("role");
  const result = {};

  routeKeys.forEach((key) => {
    result[key] = canAccessRoute(role, key);
  });

  return result;
};

export default useRouteAccess;
