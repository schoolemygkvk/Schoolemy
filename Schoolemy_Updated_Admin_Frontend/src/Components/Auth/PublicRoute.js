import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";


const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // If authenticated, redirect to dashboard
  // <Navigate> already handles both routing and history replacement
  if (isAuthenticated) {
    return <Navigate to="/schoolemy" replace />;
  }

  return children;
};

export default PublicRoute;
