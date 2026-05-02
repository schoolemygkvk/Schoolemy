import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../Utils/api";

const RoleCreation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    roleName: "",
    displayName: "",
    hierarchy: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Ensure CSRF token is available on component mount
  useEffect(() => {
    const ensureCsrfToken = async () => {
      try {
        await api.get("/csrf-token", { noAuth: true });
      } catch (err) {
      }
    };
    ensureCsrfToken();
  }, []);

  const styles = {
    container: {
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "2rem 1rem",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    maxWidth: {
      maxWidth: "600px",
      margin: "0 auto",
    },
    header: {
      marginBottom: "2rem",
    },
    title: {
      fontSize: "2rem",
      fontWeight: 800,
      color: "#1e293b",
      margin: "0 0 0.5rem 0",
    },
    subtitle: {
      fontSize: "1rem",
      color: "#64748b",
      margin: "0",
    },
    formGroup: {
      marginBottom: "1.5rem",
    },
    label: {
      display: "block",
      fontSize: "0.9rem",
      fontWeight: 600,
      color: "#334155",
      marginBottom: "0.5rem",
    },
    input: {
      width: "100%",
      padding: "0.75rem",
      fontSize: "1rem",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontFamily: "inherit",
      boxSizing: "border-box",
      transition: "all 0.2s",
    },
    inputFocus: {
      borderColor: "#3b82f6",
      outline: "none",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    },
    helpText: {
      fontSize: "0.85rem",
      color: "#64748b",
      marginTop: "0.25rem",
    },
    card: {
      background: "white",
      borderRadius: "12px",
      padding: "2rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      border: "1px solid #e2e8f0",
    },
    button: {
      padding: "0.75rem 1.5rem",
      fontSize: "1rem",
      fontWeight: 600,
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s",
    },
    submitButton: {
      background: "#3b82f6",
      color: "white",
      width: "100%",
    },
    submitButtonHover: {
      background: "#2563eb",
    },
    backButton: {
      background: "#e2e8f0",
      color: "#334155",
      marginBottom: "1rem",
    },
    successMessage: {
      background: "#d1fae5",
      color: "#065f46",
      padding: "1rem",
      borderRadius: "8px",
      marginBottom: "1rem",
      border: "1px solid #a7f3d0",
    },
    errorMessage: {
      background: "#fee2e2",
      color: "#991b1b",
      padding: "1rem",
      borderRadius: "8px",
      marginBottom: "1rem",
      border: "1px solid #fecaca",
    },
    buttonGroup: {
      display: "flex",
      gap: "1rem",
      marginTop: "1.5rem",
    },
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    // Validation
    if (!formData.roleName.trim()) {
      setError("Role name is required");
      return;
    }
    if (!formData.displayName.trim()) {
      setError("Display name is required");
      return;
    }
    if (!formData.hierarchy || parseInt(formData.hierarchy) < 1 || parseInt(formData.hierarchy) > 100) {
      setError("Hierarchy must be a number between 1 and 100");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/api/rbac/roles", {
        roleName: formData.roleName.trim(),
        displayName: formData.displayName.trim(),
        hierarchy: parseInt(formData.hierarchy),
      });

      setMessage("Role created successfully!");
      setFormData({
        roleName: "",
        displayName: "",
        hierarchy: "",
      });

      setTimeout(() => {
        navigate("/schoolemy/page-permissions");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.details ||
          "Failed to create role"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.maxWidth}>
        <button
          onClick={() => navigate(-1)}
          style={{
            ...styles.button,
            ...styles.backButton,
            marginBottom: "1rem",
          }}
        >
          ← Back
        </button>

        <div style={styles.card}>
          <header style={styles.header}>
            <h1 style={styles.title}>Create New Role</h1>
            <p style={styles.subtitle}>
              Set up a new role with display name and hierarchy level
            </p>
          </header>

          {message && <div style={styles.successMessage}>{message}</div>}
          {error && <div style={styles.errorMessage}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="roleName">
                Role Name *
              </label>
              <input
                type="text"
                id="roleName"
                name="roleName"
                value={formData.roleName}
                onChange={handleChange}
                placeholder="e.g., coursecontroller, contentwriter"
                style={styles.input}
                onFocus={(e) =>
                  Object.assign(e.target.style, styles.inputFocus)
                }
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
                disabled={loading}
              />
              <div style={styles.helpText}>
                Unique identifier, stored as lowercase (will be stored as
                lowercase)
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="displayName">
                Display Name *
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="e.g., Course Controller, Content Writer"
                style={styles.input}
                onFocus={(e) =>
                  Object.assign(e.target.style, styles.inputFocus)
                }
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
                disabled={loading}
              />
              <div style={styles.helpText}>
                Human-readable name displayed in the UI
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label} htmlFor="hierarchy">
                Hierarchy Level *
              </label>
              <input
                type="number"
                id="hierarchy"
                name="hierarchy"
                value={formData.hierarchy}
                onChange={handleChange}
                placeholder="e.g., 50"
                min="1"
                max="100"
                style={styles.input}
                onFocus={(e) =>
                  Object.assign(e.target.style, styles.inputFocus)
                }
                onBlur={(e) => {
                  e.target.style.borderColor = "#e2e8f0";
                  e.target.style.boxShadow = "none";
                }}
                disabled={loading}
              />
              <div style={styles.helpText}>
                1–100: Higher number = more permissions (100 = superadmin,
                1 = lowest)
              </div>
            </div>

            <button
              type="submit"
              style={{
                ...styles.button,
                ...styles.submitButton,
              }}
              disabled={loading}
              onMouseOver={(e) => {
                if (!loading)
                  Object.assign(e.target.style, styles.submitButtonHover);
              }}
              onMouseOut={(e) => {
                if (!loading) e.target.style.background = "#3b82f6";
              }}
            >
              {loading ? "Creating..." : "Create Role"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RoleCreation;
