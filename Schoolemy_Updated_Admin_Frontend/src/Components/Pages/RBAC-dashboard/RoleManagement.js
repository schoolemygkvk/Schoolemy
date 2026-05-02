import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../Utils/api";

const RoleManagement = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [editForm, setEditForm] = useState({ displayName: "", hierarchy: "" });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const PROTECTED_ROLES = ["superadmin", "admin"];

  const styles = {
    container: {
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "2rem 1rem",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    maxWidth: {
      maxWidth: "1000px",
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
    card: {
      background: "white",
      borderRadius: "12px",
      padding: "2rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      border: "1px solid #e2e8f0",
      marginBottom: "2rem",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.95rem",
    },
    th: {
      background: "#f1f5f9",
      padding: "1rem",
      textAlign: "left",
      fontWeight: 600,
      color: "#334155",
      borderBottom: "2px solid #e2e8f0",
    },
    td: {
      padding: "1rem",
      borderBottom: "1px solid #e2e8f0",
      color: "#475569",
    },
    button: {
      padding: "0.5rem 1rem",
      fontSize: "0.9rem",
      fontWeight: 600,
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      transition: "all 0.2s",
      marginRight: "0.5rem",
    },
    editButton: {
      background: "#3b82f6",
      color: "white",
    },
    editButtonHover: {
      background: "#2563eb",
    },
    deleteButton: {
      background: "#ef4444",
      color: "white",
    },
    deleteButtonHover: {
      background: "#dc2626",
    },
    disabledButton: {
      background: "#cbd5e1",
      color: "#94a3b8",
      cursor: "not-allowed",
    },
    backButton: {
      background: "#e2e8f0",
      color: "#334155",
      marginBottom: "1rem",
      padding: "0.75rem 1.5rem",
      fontSize: "1rem",
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
    editRow: {
      background: "#f0fdf4",
    },
    input: {
      padding: "0.5rem",
      fontSize: "0.95rem",
      border: "1px solid #e2e8f0",
      borderRadius: "6px",
      fontFamily: "inherit",
      boxSizing: "border-box",
      width: "100%",
      marginRight: "0.5rem",
    },
    saveButton: {
      background: "#10b981",
      color: "white",
    },
    cancelButton: {
      background: "#94a3b8",
      color: "white",
    },
    dialogOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    dialogBox: {
      background: "white",
      borderRadius: "12px",
      padding: "2rem",
      boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
      maxWidth: "400px",
      textAlign: "center",
    },
    dialogTitle: {
      fontSize: "1.25rem",
      fontWeight: 700,
      color: "#1e293b",
      marginBottom: "1rem",
    },
    dialogMessage: {
      color: "#64748b",
      marginBottom: "1.5rem",
      lineHeight: 1.6,
    },
    dialogButtons: {
      display: "flex",
      gap: "1rem",
      justifyContent: "center",
    },
  };

  // Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      try {
        const response = await api.get("/api/rbac/roles");
        const list = response.data?.data?.roles || [];
        setRoles(list.sort((a, b) => b.hierarchy - a.hierarchy));
      } catch (error) {
        console.error("Failed to fetch roles:", error);
        setMessage({
          type: "error",
          text: error.response?.data?.message || "Failed to load roles",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, []);

  const handleEdit = (role) => {
    setEditingRole(role.roleName);
    setEditForm({
      displayName: role.displayName,
      hierarchy: role.hierarchy,
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.displayName.trim()) {
      setMessage({ type: "error", text: "Display name is required" });
      return;
    }
    if (!editForm.hierarchy || editForm.hierarchy < 1 || editForm.hierarchy > 100) {
      setMessage({ type: "error", text: "Hierarchy must be between 1 and 100" });
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/api/rbac/roles/${editingRole}`, {
        displayName: editForm.displayName.trim(),
        hierarchy: parseInt(editForm.hierarchy),
      });

      const updatedRole = response.data?.data?.role;
      setRoles(
        roles
          .map((r) => (r.roleName === editingRole ? updatedRole : r))
          .sort((a, b) => b.hierarchy - a.hierarchy)
      );

      setEditingRole(null);
      setMessage({ type: "success", text: "Role updated successfully!" });

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Save error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update role",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async (roleName) => {
    setDeleting(roleName);
    try {
      await api.delete(`/api/rbac/roles/${roleName}`);

      setRoles(roles.filter((r) => r.roleName !== roleName));
      setConfirmDelete(null);
      setMessage({ type: "success", text: "Role deleted successfully!" });

      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Delete error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete role",
      });
    } finally {
      setDeleting(null);
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
          }}
        >
          ← Back
        </button>

        <div style={styles.card}>
          <header style={styles.header}>
            <h1 style={styles.title}>Role Management</h1>
            <p style={styles.subtitle}>
              View, edit display name/hierarchy, and delete custom roles
            </p>
          </header>

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

          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center" }}>Loading roles...</p>
          ) : roles.length === 0 ? (
            <p style={{ color: "#64748b", textAlign: "center" }}>No roles found</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Display Name</th>
                  <th style={styles.th}>Role Name</th>
                  <th style={styles.th}>Hierarchy</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr
                    key={role.roleName}
                    style={editingRole === role.roleName ? styles.editRow : {}}
                  >
                    <td style={styles.td}>
                      {editingRole === role.roleName ? (
                        <input
                          type="text"
                          value={editForm.displayName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              displayName: e.target.value,
                            })
                          }
                          style={styles.input}
                        />
                      ) : (
                        role.displayName
                      )}
                    </td>
                    <td style={styles.td}>{role.roleName}</td>
                    <td style={styles.td}>
                      {editingRole === role.roleName ? (
                        <input
                          type="number"
                          value={editForm.hierarchy}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              hierarchy: parseInt(e.target.value) || "",
                            })
                          }
                          min="1"
                          max="100"
                          style={styles.input}
                        />
                      ) : (
                        role.hierarchy
                      )}
                    </td>
                    <td style={styles.td}>
                      {editingRole === role.roleName ? (
                        <>
                          <button
                            onClick={handleSaveEdit}
                            style={{
                              ...styles.button,
                              ...styles.saveButton,
                            }}
                            disabled={saving}
                            onMouseOver={(e) => {
                              if (!saving)
                                Object.assign(e.target.style, {
                                  background: "#059669",
                                });
                            }}
                            onMouseOut={(e) => {
                              if (!saving)
                                e.target.style.background = "#10b981";
                            }}
                          >
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={() => setEditingRole(null)}
                            style={{
                              ...styles.button,
                              ...styles.cancelButton,
                            }}
                            disabled={saving}
                            onMouseOver={(e) => {
                              if (!saving)
                                Object.assign(e.target.style, {
                                  background: "#78716c",
                                });
                            }}
                            onMouseOut={(e) => {
                              if (!saving)
                                e.target.style.background = "#94a3b8";
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(role)}
                            style={{
                              ...styles.button,
                              ...styles.editButton,
                            }}
                            onMouseOver={(e) =>
                              Object.assign(e.target.style, styles.editButtonHover)
                            }
                            onMouseOut={(e) =>
                              Object.assign(e.target.style, styles.editButton)
                            }
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete(role.roleName)}
                            disabled={PROTECTED_ROLES.includes(role.roleName)}
                            style={{
                              ...styles.button,
                              ...(PROTECTED_ROLES.includes(role.roleName)
                                ? styles.disabledButton
                                : styles.deleteButton),
                            }}
                            onMouseOver={(e) => {
                              if (
                                !PROTECTED_ROLES.includes(role.roleName)
                              )
                                Object.assign(
                                  e.target.style,
                                  styles.deleteButtonHover
                                );
                            }}
                            onMouseOut={(e) => {
                              if (
                                !PROTECTED_ROLES.includes(role.roleName)
                              )
                                Object.assign(
                                  e.target.style,
                                  styles.deleteButton
                                );
                            }}
                            title={
                              PROTECTED_ROLES.includes(role.roleName)
                                ? "Cannot delete built-in role"
                                : ""
                            }
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div style={styles.dialogOverlay} onClick={() => setConfirmDelete(null)}>
          <div
            style={styles.dialogBox}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.dialogTitle}>Delete Role?</div>
            <div style={styles.dialogMessage}>
              Are you sure you want to delete the role <strong>{confirmDelete}</strong>? This
              action cannot be undone.
            </div>
            <div style={styles.dialogButtons}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  ...styles.button,
                  ...styles.cancelButton,
                  flex: 1,
                }}
                disabled={deleting === confirmDelete}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(confirmDelete)}
                style={{
                  ...styles.button,
                  ...styles.deleteButton,
                  flex: 1,
                }}
                disabled={deleting === confirmDelete}
              >
                {deleting === confirmDelete ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
