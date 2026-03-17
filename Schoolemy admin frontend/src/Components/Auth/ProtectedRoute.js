import React from "react";
import { Navigate } from "react-router-dom";
import { secureStorage, isValidToken } from "../../Utils/security";

const ProtectedRoute = ({ children }) => {
  const token = secureStorage.getItem("token");
  const isAuthenticated = token && isValidToken(token);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If authenticated, render the protected component
  return children;
};

export default ProtectedRoute;
