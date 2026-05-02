import React from "react";
import { Navigate } from "react-router-dom";
import { secureStorage, isValidToken, hasStoredSession } from "../../Utils/security";


const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectPath = "/tutor/login" 
}) => {
  // Get authentication data from secure storage
  const token = secureStorage.getItem("token");
  const role = secureStorage.getItem("role");
  const jwtOk = Boolean(token && isValidToken(token));
  const cookieSessionOk = hasStoredSession();

  // If no valid JWT and no cookie-based session markers, redirect to login
  if (!jwtOk && !cookieSessionOk) {
    return <Navigate to={redirectPath} replace />;
  }

  // If allowedRoles is specified and user's role is not in the list, redirect
  // (allowedRoles=null or undefined means auth-only check, all authenticated users pass)
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect based on role
    if (role === "superadmin" || role === "admin") {
      return <Navigate to="/schoolemy" replace />;
    } else if (role === "tutor") {
      return <Navigate to="/schoolemy/tutor/dashboard" replace />;
    } else {
      // Default to schoolemy main dashboard for all users
      return <Navigate to="/schoolemy" replace />;
    }
  }

  // User is authenticated and authorized, render children
  return children;
};

export default ProtectedRoute;
