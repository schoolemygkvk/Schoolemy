import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../Utils/api";


export function normalizeRouteAccess(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = v === true || v === "true" || v === 1;
  }
  return out;
}

const routeGroups = [
  {
    groupName: "Dashboard",
    routes: ["dashboard"],
  },
  {
    groupName: "Admin / COT",
    routes: ["admin-users", "create-admin", "admin-details", "admin-analytics"],
  },
  {
    groupName: "Tutors",
    routes: [
      "create-tutors",
      "tutor-details",
      "tutor-analytics",
      "tutor-list",
      "tutor-courses",
      "tutor-course-detail",
      "tutor-course-review",
      "tutor-payment-details",
    ],
  },
  {
    groupName: "Users",
    routes: ["users", "user-details"],
  },
  {
    groupName: "Courses",
    routes: ["courses", "add-course", "course-list", "edit-course"],
  },
  {
    groupName: "BOS",
    routes: ["bos", "bos-meetings", "bos-voting", "bos-proposals"],
  },
  {
    groupName: "Financial",
    routes: ["financial-auditing", "Payment-record"],
  },
  {
    groupName: "DirectMeet",
    routes: ["DM_Dashboard"],
  },
  {
    groupName: "Marketing",
    routes: ["marketing-dashboard"],
  },
  {
    groupName: "Other",
    routes: ["pcm-dashboard", "vote", "user-landing-page", "documentVerification"],
  },
  {
    groupName: "Role Access",
    routes: ["rbac-dashboard", "role-creation", "page-permissions"],
  },
];

const PageRoutePermission = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [routeAccess, setRouteAccess] = useState({});
  const [rolesLoading, setRolesLoading] = useState(false);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const styles = {
    container: {
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "2rem 1rem",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    maxWidth: {
      maxWidth: "900px",
      margin: "0 auto",
    },
    card: {
      background: "white",
      borderRadius: "12px",
      padding: "2rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      border: "1px solid #e2e8f0",
      marginBottom: "2rem",
    },
    title: {
      fontSize: "2rem",
      fontWeight: 800,
      color: "#1e293b",
      margin: "0 0 1rem 0",
    },
    subtitle: {
      fontSize: "1rem",
      color: "#64748b",
      margin: "0 0 1.5rem 0",
    },
    label: {
      fontSize: "0.9rem",
      fontWeight: 600,
      color: "#334155",
      marginBottom: "0.5rem",
      display: "block",
    },
    select: {
      width: "100%",
      padding: "0.75rem",
      fontSize: "1rem",
      border: "1px solid #e2e8f0",
      borderRadius: "8px",
      fontFamily: "inherit",
      boxSizing: "border-box",
    },
    groupContainer: {
      marginBottom: "2rem",
    },
    groupHeader: {
      fontSize: "1.1rem",
      fontWeight: 700,
      color: "#1e293b",
      marginBottom: "1rem",
      paddingBottom: "0.75rem",
      borderBottom: "2px solid #e2e8f0",
    },
    checkboxGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: "1rem",
    },
    checkboxWrapper: {
      display: "flex",
      alignItems: "center",
    },
    checkbox: {
      width: "18px",
      height: "18px",
      cursor: "pointer",
      marginRight: "0.75rem",
    },
    checkboxLabel: {
      fontSize: "0.95rem",
      color: "#334155",
      cursor: "pointer",
      userSelect: "none",
    },
    buttonGroup: {
      display: "flex",
      gap: "1rem",
      marginTop: "1.5rem",
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
    saveButton: {
      background: "#10b981",
      color: "white",
      flex: 1,
    },
    backButton: {
      background: "#e2e8f0",
      color: "#334155",
    },
    selectAllButton: {
      background: "#3b82f6",
      color: "white",
      fontSize: "0.9rem",
      padding: "0.5rem 1rem",
    },
    deselectAllButton: {
      background: "#94a3b8",
      color: "white",
      fontSize: "0.9rem",
      padding: "0.5rem 1rem",
    },
    messageContainer: {
      padding: "1rem",
      borderRadius: "8px",
      marginBottom: "1rem",
      border: "1px solid",
    },
    successMessage: {
      background: "#d1fae5",
      color: "#065f46",
      borderColor: "#a7f3d0",
    },
    errorMessage: {
      background: "#fee2e2",
      color: "#991b1b",
      borderColor: "#fecaca",
    },
    hint: {
      fontSize: "0.875rem",
      color: "#64748b",
      marginBottom: "1.25rem",
      lineHeight: 1.5,
    },
    
    rowGranted: {
      padding: "0.35rem 0.55rem",
      borderRadius: "8px",
      borderLeft: "4px solid #22c55e",
      backgroundColor: "#f0fdf4",
    },
  };

  // Ensure CSRF token is available and fetch roles on mount
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Fetch CSRF token first
        await api.get("/csrf-token", { noAuth: true });
      } catch (err) {
      }

      setRolesLoading(true);
      try {
        const response = await api.get("/api/rbac/roles");
        const list = response.data?.data?.roles || [];
        setRoles(list);
        if (list.length > 0) {
          setSelectedRole(list[0].roleName);
        }
      } catch (error) {
        setMessage({
          type: "error",
          text: "Failed to load roles",
        });
      } finally {
        setRolesLoading(false);
      }
    };

    initializeComponent();
  }, []);

  // Fetch role permissions when selected role changes
  useEffect(() => {
    if (!selectedRole) return;

    const fetchRolePermissions = async () => {
      setPermissionsLoading(true);
      try {
        const response = await api.get(`/api/rbac/roles/${selectedRole}`);

        const role = response.data?.data?.role;
        if (!role) {
          throw new Error("No role data in response");
        }


        const normalized = normalizeRouteAccess(role?.routeAccess);

        setRouteAccess(normalized);
      } catch (error) {

        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to load role permissions",
        });
        setRouteAccess({});
      } finally {
        setPermissionsLoading(false);
      }
    };

    fetchRolePermissions();
  }, [selectedRole]);

  const handleCheckboxChange = (routeKey) => {
    setRouteAccess((prev) => ({
      ...prev,
      [routeKey]: !(prev[routeKey] === true),
    }));
  };

  const handleSelectAllGroup = (routes) => {
    const newAccess = { ...routeAccess };
    routes.forEach((route) => {
      newAccess[route] = true;
    });
    setRouteAccess(newAccess);
  };

  const handleDeselectAllGroup = (routes) => {
    const newAccess = { ...routeAccess };
    routes.forEach((route) => {
      newAccess[route] = false;
    });
    setRouteAccess(newAccess);
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) {
      setMessage({
        type: "error",
        text: "Please select a role",
      });
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      // Get current role data
      const selectedRoleObj = roles.find((r) => r.roleName === selectedRole);

      const payload = {
        routeAccess,
        // Include these to satisfy schema validation
        displayName: selectedRoleObj?.displayName || selectedRole,
        hierarchy: selectedRoleObj?.hierarchy || 50,
      };


      const response = await api.put(`/api/rbac/roles/${selectedRole}`, payload);

      setMessage({
        type: "success",
        text: "Role permissions saved successfully!",
      });

      setTimeout(() => {
        setMessage("");
      }, 3000);
    } catch (error) {

      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          error.response?.data?.details ||
          error.message ||
          "Failed to save permissions",
      });
    } finally {
      setSaving(false);
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
          <h1 style={styles.title}>Page Route Permissions</h1>
          <p style={styles.subtitle}>
            Select a role and toggle access to individual pages
          </p>

          {message && (
            <div
              style={{
                ...styles.messageContainer,
                ...(message.type === "success"
                  ? styles.successMessage
                  : styles.errorMessage),
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={styles.label} htmlFor="roleSelect">
              Select Role *
            </label>
            <select
              id="roleSelect"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={styles.select}
              disabled={rolesLoading}
            >
              <option value="">-- Choose a role --</option>
              {roles.map((role) => (
                <option key={role.roleName} value={role.roleName}>
                  {role.displayName || role.roleName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedRole && !rolesLoading && (
          <div style={styles.card}>
            <h2 style={{ fontSize: "1.25rem", color: "#1e293b", marginBottom: "0.75rem" }}>
              Route Access Controls
            </h2>
            <p style={styles.hint}>
              Checked routes are allowed for this role (defaults from RBAC config plus anything saved in the database).
              <strong style={{ color: "#166534" }}> Green row</strong> highlights routes that are currently allowed.
            </p>
            {permissionsLoading && (
              <p style={{ color: "#64748b", marginBottom: "1rem" }}>Loading permissions for this role…</p>
            )}

            {routeGroups.map((group, idx) => (
              <div key={idx} style={styles.groupContainer}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={styles.groupHeader}>{group.groupName}</h3>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleSelectAllGroup(group.routes)}
                      style={{
                        ...styles.button,
                        ...styles.selectAllButton,
                      }}
                      disabled={saving || permissionsLoading}
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => handleDeselectAllGroup(group.routes)}
                      style={{
                        ...styles.button,
                        ...styles.deselectAllButton,
                      }}
                      disabled={saving || permissionsLoading}
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div style={styles.checkboxGrid}>
                  {group.routes.map((route) => {
                    const granted = routeAccess[route] === true;
                    return (
                      <div
                        key={route}
                        style={{
                          ...styles.checkboxWrapper,
                          ...(granted ? styles.rowGranted : {}),
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`route-${route}`}
                          checked={granted}
                          onChange={() => handleCheckboxChange(route)}
                          style={{
                            ...styles.checkbox,
                            ...(granted ? { accentColor: "#16a34a" } : {}),
                          }}
                          disabled={saving || permissionsLoading}
                        />
                        <label
                          htmlFor={`route-${route}`}
                          style={{
                            ...styles.checkboxLabel,
                            ...(granted ? { color: "#166534", fontWeight: 600 } : {}),
                          }}
                        >
                          {granted ? "✅ " : ""}
                          {route}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div style={styles.buttonGroup}>
              <button
                onClick={handleSavePermissions}
                style={{
                  ...styles.button,
                  ...styles.saveButton,
                }}
                disabled={saving || !selectedRole}
              >
                {saving ? "Saving..." : "Save Permissions"}
              </button>
            </div>
          </div>
        )}

        {rolesLoading && (
          <div style={styles.card}>
            <p style={{ textAlign: "center", color: "#64748b" }}>
              Loading roles…
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageRoutePermission;
