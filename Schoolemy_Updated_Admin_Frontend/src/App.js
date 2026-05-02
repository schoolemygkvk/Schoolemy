import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";

import Login from "./Components/Login/login";
import AdminDashboard from "./Routes/AdminDashboard";

import { AuthProvider, useAuth } from "./Components/Auth/AuthProvider";
import ProtectedRoute from "./Components/Auth/ProtectedRoute";
import PublicRoute from "./Components/Auth/PublicRoute";
import AuthLoading from "./Components/Auth/AuthLoading";
import UnauthorizedPage from "./Components/Auth/UnauthorizedPage";

import BlogDetail from "./Components/Pages/Blog/BlogDetail";
import BlogList from "./Components/Pages/Blog/BlogList";

import ErrorBoundary from "./Components/Common/ErrorBoundary";

import { initializeSecurity, cleanupOnUnload } from "./Utils/securityCheck";

const AppContent = () => {
  const { isLoading } = useAuth();
  const navigate = useNavigate();

  // Listen for logout event from api interceptor and navigate softly
  useEffect(() => {
    const handleLogout = () => {
      console.log("[App] Logout event received, navigating to login...");
      navigate("/");
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [navigate]);

  if (isLoading) {
    return <AuthLoading />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route path="/blogs" element={<BlogList />} />
      <Route path="/blogs/:id" element={<BlogDetail />} />

      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        path="/tutor-management/*"
        element={
          <ProtectedRoute allowedRoles={["tutormanagement"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/schoolemy/*"
        element={
          <ProtectedRoute allowedRoles={[
            "superadmin",
            "admin",
            "committeeoftrustees",
            "boscontroller",
            "bosmembers",
            "coursemanagement",
            "tutormanagement",
            "usermanagement",
            "documentverification",
            "marketing",
            "auditor",
            "Financial"
          ]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  useEffect(() => {
    initializeSecurity();
    cleanupOnUnload();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </Router>
    </AuthProvider>
  );
};

export default App;
