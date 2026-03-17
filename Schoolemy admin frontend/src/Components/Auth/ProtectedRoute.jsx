import React from "react";
import { Navigate } from "react-router-dom";
import { secureStorage, isValidToken } from "../../Utils/security";

/**
 * Protected Route Component for Role-Based Access Control
 * Restricts routes based on user role
 * 
 * @param {React.Component} children - Child components to render if authorized
 * @param {Array<string>} allowedRoles - Array of roles allowed to access the route
 * @param {string} redirectPath - Path to redirect if unauthorized (default: "/tutor/login")
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectPath = "/tutor/login" 
}) => {
  // Get authentication data from secure storage
  const token = secureStorage.getItem("token");
  const role = secureStorage.getItem("role");

  // If no valid token, redirect to login
  if (!token || !isValidToken(token)) {
    return <Navigate to={redirectPath} replace />;
  }

  // If allowedRoles is specified and user's role is not in the list, redirect
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
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
