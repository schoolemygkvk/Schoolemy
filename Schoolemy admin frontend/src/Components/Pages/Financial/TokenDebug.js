import React, { useEffect, useState } from "react";
import api from "../../../Utils/api";

/**
 * Token Debug Component
 * Use this to check if your JWT token is valid
 * Navigate to /schoolemy/token-debug to use it
 */
const TokenDebug = () => {
  const [tokenInfo, setTokenInfo] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found in localStorage");
        return;
      }

      // Decode token (basic decode, not verification)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      setTokenInfo({
        token: token.substring(0, 50) + "...",
        payload,
        isExpired: payload.exp * 1000 < Date.now(),
        expiresAt: new Date(payload.exp * 1000).toLocaleString(),
      });

      // Test API call
      const response = await api.get("/api/donation/statistics");
      setTokenInfo(prev => ({
        ...prev,
        apiTest: "✅ API call successful",
        response: response.data
      }));
    } catch (err) {
      console.error("Token check error:", err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const clearAndReload = () => {
    localStorage.clear();
    alert("localStorage cleared. Please login again.");
    window.location.href = "/";
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>JWT Token Debugger</h1>

        {error && (
          <div style={styles.errorBox}>
            <h3>❌ Error</h3>
            <p>{error}</p>
            <button onClick={clearAndReload} style={styles.clearButton}>
              Clear Token & Reload
            </button>
          </div>
        )}

        {tokenInfo && (
          <div style={styles.infoBox}>
            <h3>Token Information</h3>
            <div style={styles.field}>
              <strong>Token (truncated):</strong>
              <code style={styles.code}>{tokenInfo.token}</code>
            </div>
            
            <div style={styles.field}>
              <strong>User ID:</strong> {tokenInfo.payload.id}
            </div>
            
            <div style={styles.field}>
              <strong>Email:</strong> {tokenInfo.payload.email}
            </div>
            
            <div style={styles.field}>
              <strong>Role:</strong> {tokenInfo.payload.role}
            </div>
            
            <div style={styles.field}>
              <strong>Name:</strong> {tokenInfo.payload.name}
            </div>
            
            <div style={styles.field}>
              <strong>Expires:</strong> {tokenInfo.expiresAt}
            </div>
            
            <div style={styles.field}>
              <strong>Status:</strong> {" "}
              <span style={{
                color: tokenInfo.isExpired ? "#ef4444" : "#10b981",
                fontWeight: "bold"
              }}>
                {tokenInfo.isExpired ? "⚠️ EXPIRED" : "✅ Valid"}
              </span>
            </div>

            {tokenInfo.apiTest && (
              <div style={styles.successBox}>
                <p>{tokenInfo.apiTest}</p>
              </div>
            )}

            <button onClick={clearAndReload} style={styles.clearButton}>
              Clear Token & Login Again
            </button>
          </div>
        )}

        <div style={styles.instructions}>
          <h3>Troubleshooting 403 Errors:</h3>
          <ol>
            <li>If token is expired, clear it and login again</li>
            <li>If you see "invalid signature" error, the JWT_SECRET changed - clear token and login</li>
            <li>Make sure your backend server is running on https://e3a24h4aa3.execute-api.ap-south-1.amazonaws.com/dev</li>
            <li>Check that JWT_SECRET in backend .env file is set correctly</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "24px",
    maxWidth: "800px",
    margin: "0 auto",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    padding: "32px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: "24px",
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    border: "2px solid #ef4444",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
  },
  infoBox: {
    backgroundColor: "#f0fdf4",
    border: "2px solid #10b981",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
  },
  successBox: {
    backgroundColor: "#dbeafe",
    border: "2px solid #3b82f6",
    borderRadius: "8px",
    padding: "12px",
    marginTop: "16px",
  },
  field: {
    marginBottom: "12px",
    fontSize: "14px",
  },
  code: {
    display: "block",
    backgroundColor: "#f3f4f6",
    padding: "8px",
    borderRadius: "4px",
    fontSize: "12px",
    marginTop: "4px",
    overflowX: "auto",
  },
  clearButton: {
    marginTop: "16px",
    padding: "12px 24px",
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  instructions: {
    backgroundColor: "#fef3c7",
    border: "2px solid #f59e0b",
    borderRadius: "8px",
    padding: "16px",
  },
};

export default TokenDebug;
