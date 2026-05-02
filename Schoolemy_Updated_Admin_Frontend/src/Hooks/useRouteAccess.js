import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { canAccessRoute, getAccessibleRoutes } from "../Routes/ProtectedRoutes";
import { secureStorage } from "../Utils/security";


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


export const useAccessibleRoutes = () => {
  const role = secureStorage.getItem("role");
  return getAccessibleRoutes(role);
};


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
