import React, { createContext, useContext, useState, useEffect } from "react";
import { secureStorage, isValidToken } from "../../Utils/security";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = () => {
    try {
      const token = secureStorage.getItem("token");
      const userId = secureStorage.getItem("_id");
      const role = secureStorage.getItem("role");
      const userName = secureStorage.getItem("name");
      const isApproved = secureStorage.getItem("isApproved");

      // Validate token before considering user authenticated
      if (token && isValidToken(token) && userId && role && userName) {
        setIsAuthenticated(true);
        setUser({
          id: userId,
          role: role,
          name: userName,
          token: token,
          ...(isApproved !== null ? { isApproved: isApproved === "true" } : {})
        });
      } else {
        // Clear invalid tokens
        if (token && !isValidToken(token)) {
          secureStorage.clear();
        }
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setUser(null);
      // Clear potentially corrupted data
      secureStorage.clear();
    } finally {
      setIsLoading(false);
    }
  };

  const login = (userData) => {
    try {
      // Validate token before storing
      if (!isValidToken(userData.token)) {
        throw new Error("Invalid token format");
      }

      // Store securely with obfuscation
      secureStorage.setItem("_id", userData.id);
      secureStorage.setItem("token", userData.token);
      secureStorage.setItem("role", userData.role);
      secureStorage.setItem("name", userData.name);
      if (userData.isApproved !== undefined) {
        secureStorage.setItem("isApproved", String(userData.isApproved));
      }
      
      setIsAuthenticated(true);
      setUser(userData);
    } catch (error) {
      console.error("Error during login:", error);
      secureStorage.clear();
      throw error;
    }
  };

  const logout = () => {
    secureStorage.clear();
    sessionStorage.clear(); // Also clear session storage
    setIsAuthenticated(false);
    setUser(null);
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
