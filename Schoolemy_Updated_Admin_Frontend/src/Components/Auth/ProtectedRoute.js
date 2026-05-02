import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";


const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user?.role || "").toLowerCase();
    const normalized = allowedRoles.map((r) => String(r).toLowerCase());
    if (!userRole || !normalized.includes(userRole)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
