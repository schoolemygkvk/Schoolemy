import React, { useEffect, useState } from "react";
import axios from "../../../Utils/api";

const ViewUpdateDeleteMoM = () => {
  const [momList, setMomList] = useState([]);
  const [selectedMoM, setSelectedMoM] = useState(null);
  const [formData, setFormData] = useState({
    decisions: "",
    notes: "",
    action_items: "",
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("list"); 

  // Fetch all MoMs
  const fetchMoMs = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get("/get-allmom");
      setMomList(res.data.data);
    } catch (err) {
      console.error("Error fetching MoMs:", err);
      setMessage("Failed to fetch MoMs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMoMs();
  }, []);

  const handleSelect = (mom) => {
    setSelectedMoM(mom);
    setFormData({
      decisions: mom.decisions,
      notes: mom.notes || "",
      action_items: mom.action_items?.join(", ") || "",
    });
    setViewMode("view");
    setMessage("");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this MoM?")) return;
    try {
      await axios.delete(`/delete/${id}`);
      setMessage("MoM deleted successfully");
      fetchMoMs();
      setSelectedMoM(null);
      setViewMode("list");
    } catch (err) {
      setMessage("Error deleting MoM");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/update-mom/${selectedMoM.minutes_id}`, {
        decisions: formData.decisions,
        notes: formData.notes,
        action_items: formData.action_items
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });
      setMessage("MoM updated successfully");
      fetchMoMs();
      setViewMode("view");
    } catch (err) {
      setMessage("Error updating MoM");
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Minutes of Meeting Manager</h2>
        <p style={styles.subHeading}>View, edit or delete meeting records</p>
      </div>

      {message && (
        <div
          style={
            message.includes("success")
              ? styles.successMessage
              : styles.errorMessage
          }
        >
          {message}
        </div>
      )}

      {viewMode === "list" && (
        <div style={styles.listSection}>
          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Available MoMs</h3>
            <button
              style={styles.refreshBtn}
              onClick={fetchMoMs}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh List"}
            </button>
          </div>

          {isLoading ? (
            <div style={styles.loader}>Loading...</div>
          ) : (
            <div style={styles.listContainer}>
              {momList.length === 0 ? (
                <p style={styles.noRecords}>No meeting records found</p>
              ) : (
                momList.map((mom) => (
                  <div
                    key={mom.minutes_id}
                    style={styles.card}
                    onClick={() => handleSelect(mom)}
                  >
                    <div style={styles.cardHeader}>
                      <span style={styles.meetingId}>
                        Meeting ID : {mom.meeting_id}
                      </span>
                    </div>
                    <div style={styles.cardHeader}>
                      <span style={styles.minutesId}>
                        MoM ID: {mom.minutes_id}
                      </span>{" "}
                    </div>
                    <div style={styles.cardMeta}>
                      <span style={styles.uploadedBy}>
                        <strong>Uploaded by:</strong> {mom.uploaded_by}
                      </span>
                    </div>
                    <div style={styles.cardMeta}>
                      <span style={styles.date}>
                        <strong>Created:</strong> {formatDate(mom.createdAt)}
                      </span>
                    </div>

                    <div style={styles.cardActions}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(mom);
                        }}
                        style={styles.viewBtn}
                      >
                        View Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(mom.minutes_id);
                        }}
                        style={styles.deleteBtn}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {viewMode === "view" && selectedMoM && (
        <div style={styles.detailSection}>
          <div style={styles.detailHeader}>
            <h3 style={styles.sectionTitle}>MoM Details</h3>
            <div style={styles.detailActions}>
              <button
                style={styles.editActionBtn}
                onClick={() => setViewMode("edit")}
              >
                Edit
              </button>
              <button
                style={styles.backBtn}
                onClick={() => setViewMode("list")}
              >
                Back to List
              </button>
            </div>
          </div>

          <div style={styles.detailContent}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Meeting ID:</span>
              <span style={styles.detailValue}>{selectedMoM.meeting_id}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>MoM ID:</span>
              <span style={styles.detailValue}>{selectedMoM.minutes_id}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Uploaded By:</span>
              <span style={styles.detailValue}>{selectedMoM.uploaded_by}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Created:</span>
              <span style={styles.detailValue}>
                {formatDate(selectedMoM.createdAt)}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Last Updated:</span>
              <span style={styles.detailValue}>
                {formatDate(selectedMoM.updatedAt)}
              </span>
            </div>

            <div style={styles.detailSectionDivider} />

            <div style={styles.detailFieldGroup}>
              <h4 style={styles.detailFieldTitle}>Decisions</h4>
              <div style={styles.detailFieldValue}>
                {selectedMoM.decisions || <em>No decisions recorded</em>}
              </div>
            </div>

            <div style={styles.detailFieldGroup}>
              <h4 style={styles.detailFieldTitle}>Notes</h4>
              <div style={styles.detailFieldValue}>
                {selectedMoM.notes || <em>No additional notes</em>}
              </div>
            </div>

            <div style={styles.detailFieldGroup}>
              <h4 style={styles.detailFieldTitle}>Action Items</h4>
              <div style={styles.detailFieldValue}>
                {selectedMoM.action_items &&
                selectedMoM.action_items.length > 0 ? (
                  <ul style={styles.actionItemsList}>
                    {selectedMoM.action_items.map((item, index) => (
                      <li key={index} style={styles.actionItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <em>No action items</em>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "edit" && selectedMoM && (
        <div style={styles.editSection}>
          <div style={styles.editHeader}>
            <h3 style={styles.sectionTitle}>Edit MoM</h3>
            <span style={styles.minutesId}>ID: {selectedMoM.minutes_id}</span>
          </div>

          <form onSubmit={handleUpdate} style={styles.form}>
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Meeting ID</label>
                <input
                  type="text"
                  value={selectedMoM.meeting_id}
                  style={styles.readOnlyInput}
                  readOnly
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Uploaded By</label>
                <input
                  type="text"
                  value={selectedMoM.uploaded_by}
                  style={styles.readOnlyInput}
                  readOnly
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Decisions*</label>
              <textarea
                name="decisions"
                value={formData.decisions}
                onChange={(e) =>
                  setFormData({ ...formData, decisions: e.target.value })
                }
                style={styles.textarea}
                placeholder="Enter meeting decisions..."
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                style={styles.textarea}
                placeholder="Enter additional notes..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Action Items</label>
              <textarea
                name="action_items"
                value={formData.action_items}
                onChange={(e) =>
                  setFormData({ ...formData, action_items: e.target.value })
                }
                style={styles.textarea}
                placeholder="Enter each action item on a new line or separate with commas"
                rows={3}
              />
              <small style={styles.hint}>
                Separate multiple items with commas or new lines
              </small>
            </div>

            <div style={styles.formActions}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => setViewMode("view")}
              >
                Cancel
              </button>
              <button type="submit" style={styles.updateBtn}>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// Internal CSS with Yellow & Blue Theme
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "30px auto",
    padding: "0",
    backgroundColor: "#f8f9fa",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    background: "linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)",
    color: "white",
    padding: "25px 30px",
    borderBottom: "4px solid #FFD600",
  },
  heading: {
    margin: "0",
    fontSize: "28px",
    fontWeight: "600",
  },
  subHeading: {
    margin: "5px 0 0",
    fontSize: "16px",
    opacity: "0.9",
    fontWeight: "400",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  listSection: {
    padding: "25px",
  },
  detailSection: {
    padding: "25px",
  },
  editSection: {
    padding: "25px",
    backgroundColor: "#f5f9ff",
  },
  sectionTitle: {
    color: "#1976D2",
    margin: "0 0 10px",
    fontSize: "20px",
    fontWeight: "600",
    borderBottom: "2px solid #FFD600",
    paddingBottom: "8px",
    display: "inline-block",
  },
  listContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
    marginTop: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    transition: "all 0.2s ease",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
      borderColor: "#1976D2",
    },
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  meetingId: {
    fontWeight: "600",
    color: "#1976D2",
    fontSize: "16px",
  },
  minutesId: {
    fontSize: "13px",
    color: "#666",
    backgroundColor: "#f0f0f0",
    padding: "2px 8px",
    borderRadius: "10px",
  },
  cardMeta: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "13px",
    color: "#666",
    marginBottom: "15px",
  },
  uploadedBy: {
    maxWidth: "60%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  date: {
    textAlign: "right",
  },
  cardPreview: {
    color: "#444",
    fontSize: "14px",
    lineHeight: "1.5",
    marginBottom: "15px",
    display: "-webkit-box",
    WebkitLineClamp: "3",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  cardActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  viewBtn: {
    padding: "6px 12px",
    backgroundColor: "#1976D2",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#1565C0",
    },
  },
  deleteBtn: {
    padding: "6px 12px",
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#d32f2f",
    },
  },
  refreshBtn: {
    padding: "6px 12px",
    backgroundColor: "#FFD600",
    color: "#333",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "#FFC107",
    },
    ":disabled": {
      opacity: "0.7",
      cursor: "not-allowed",
    },
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  detailActions: {
    display: "flex",
    gap: "10px",
  },
  editActionBtn: {
    padding: "8px 16px",
    backgroundColor: "#1976D2",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#1565C0",
    },
  },
  backBtn: {
    padding: "8px 16px",
    backgroundColor: "transparent",
    color: "#1976D2",
    border: "1px solid #1976D2",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "#E3F2FD",
    },
  },
  detailContent: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "25px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  detailRow: {
    display: "flex",
    marginBottom: "15px",
  },
  detailLabel: {
    fontWeight: "600",
    color: "#1976D2",
    width: "150px",
    flexShrink: "0",
  },
  detailValue: {
    color: "#333",
    flexGrow: "1",
  },
  detailSectionDivider: {
    height: "1px",
    backgroundColor: "#e0e0e0",
    margin: "20px 0",
  },
  detailFieldGroup: {
    marginBottom: "25px",
  },
  detailFieldTitle: {
    color: "#1976D2",
    margin: "0 0 10px",
    fontSize: "16px",
  },
  detailFieldValue: {
    backgroundColor: "#f9f9f9",
    padding: "15px",
    borderRadius: "6px",
    border: "1px solid #e0e0e0",
    lineHeight: "1.6",
  },
  actionItemsList: {
    margin: "0",
    paddingLeft: "20px",
  },
  actionItem: {
    marginBottom: "8px",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: "8px",
    padding: "25px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  formRow: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    flex: "1",
  },
  label: {
    fontWeight: "500",
    color: "#1976D2",
    fontSize: "15px",
  },
  readOnlyInput: {
    padding: "10px",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    fontSize: "15px",
    backgroundColor: "#f5f5f5",
    color: "#666",
  },
  input: {
    padding: "12px",
    border: "1px solid #BBDEFB",
    borderRadius: "6px",
    fontSize: "15px",
    backgroundColor: "#fff",
    transition: "border 0.2s",
    ":focus": {
      outline: "none",
      borderColor: "#1976D2",
      boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.2)",
    },
  },
  textarea: {
    padding: "12px",
    border: "1px solid #BBDEFB",
    borderRadius: "6px",
    fontSize: "15px",
    minHeight: "100px",
    resize: "vertical",
    backgroundColor: "#fff",
    transition: "border 0.2s",
    ":focus": {
      outline: "none",
      borderColor: "#1976D2",
      boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.2)",
    },
  },
  hint: {
    color: "#666",
    fontSize: "13px",
    fontStyle: "italic",
  },
  formActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "25px",
  },
  updateBtn: {
    padding: "10px 20px",
    backgroundColor: "#1976D2",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "#1565C0",
      transform: "translateY(-1px)",
    },
  },
  cancelBtn: {
    padding: "10px 20px",
    backgroundColor: "transparent",
    color: "#666",
    border: "1px solid #ddd",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "500",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "#f5f5f5",
      borderColor: "#bbb",
    },
  },
  successMessage: {
    backgroundColor: "#E8F5E9",
    color: "#2E7D32",
    padding: "12px 20px",
    margin: "0",
    textAlign: "center",
    borderBottom: "2px solid #C8E6C9",
    fontSize: "15px",
    fontWeight: "500",
  },
  errorMessage: {
    backgroundColor: "#FFEBEE",
    color: "#C62828",
    padding: "12px 20px",
    margin: "0",
    textAlign: "center",
    borderBottom: "2px solid #FFCDD2",
    fontSize: "15px",
    fontWeight: "500",
  },
  loader: {
    textAlign: "center",
    padding: "40px",
    color: "#1976D2",
    fontSize: "16px",
  },
  noRecords: {
    textAlign: "center",
    color: "#666",
    padding: "40px",
    fontSize: "16px",
    gridColumn: "1 / -1",
  },
};

export default ViewUpdateDeleteMoM;
