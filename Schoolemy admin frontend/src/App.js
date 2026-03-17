import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

//Home
import Login from "./Components/Login/login";
import AdminDashboard from "./Routes/AdminDashboard";

// Auth Components
import { AuthProvider, useAuth } from "./Components/Auth/AuthProvider";
import ProtectedRoute from "./Components/Auth/ProtectedRoute";
import PublicRoute from "./Components/Auth/PublicRoute";
import AuthLoading from "./Components/Auth/AuthLoading";

// Public Blog Components
import BlogDetail from "./Components/Pages/Blog/BlogDetail";
import BlogList from "./Components/Pages/Blog/BlogList";

// Security
import { initializeSecurity, cleanupOnUnload } from "./Utils/securityCheck";

const AppContent = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <AuthLoading />;
  }

  return (
    <Routes>
      {/* Public Route - Login page */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      
      {/* Public Blog Routes - Accessible to everyone */}
      <Route path="/blogs" element={<BlogList />} />
      <Route path="/blogs/:id" element={<BlogDetail />} />
      
      {/* Protected Route - Tutor dashboard */}
      <Route 
        path="/tutor-management/*" 
        element={
          <ProtectedRoute allowedRoles={["tutormanagement"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Protected Route - Admin dashboard pages */}
      <Route 
        path="/schoolemy/*" 
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

const App = () => {
  useEffect(() => {
    // Initialize security measures on app start
    initializeSecurity();
    cleanupOnUnload();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div>
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
