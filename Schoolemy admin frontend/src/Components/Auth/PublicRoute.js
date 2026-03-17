import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { secureStorage, isValidToken } from "../../Utils/security";

const PublicRoute = ({ children }) => {
  const token = secureStorage.getItem("token");
  const isAuthenticated = !!token && isValidToken(token);

  // Prevent browser back button to login page
  useEffect(() => {
    if (isAuthenticated) {
      // Replace current history entry so back button doesn't work
      window.history.replaceState(null, null, "/schoolemy");
    }
  }, [isAuthenticated]);

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/schoolemy" replace />;
  }

  // If not authenticated, render the public component (login page)
  return children;
};

export default PublicRoute;
