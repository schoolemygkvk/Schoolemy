import React, { useEffect, useState } from "react";
import axios from "../../../Utils/api";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogTitle from "@mui/material/DialogTitle";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const BOSMembers = () => {
  const [admins, setAdmins] = useState([]);
  const [originalAdmins, setOriginalAdmins] = useState([]);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobilenumber: "",
    role: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    adminId: null,
    adminName: "",
  });

  useEffect(() => {
    fetchAdmins();
  });

  const fetchAdmins = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showSnackbar("Authentication token missing. Please login.", "error");
      return;
    }

    try {
      const response = await axios.get("/get-admins", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Filter to only include specific roles
      const filtered = response.data.filter(
        (admin) => admin.role === "bosmembers" || admin.role === "boscontroller"
      );

      setAdmins(filtered);
      setOriginalAdmins(filtered);
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Error fetching admin data.",
        "error"
      );
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleEditClick = (admin) => {
    setEditingAdmin(admin._id);
    setFormData({
      name: admin.name,
      email: admin.email,
      mobilenumber: admin.mobilenumber,
      role: admin.role,
    });
    document.body.style.overflow = "hidden";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdate = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`/update/${editingAdmin}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showSnackbar("Admin updated successfully!");
      closeModal();
      fetchAdmins();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Error updating admin.",
        "error"
      );
    }
  };

  const handleDeleteClick = (adminId, adminName) => {
    setDeleteDialog({
      open: true,
      adminId,
      adminName,
    });
  };

  const handleDeleteConfirm = async () => {
    const { adminId } = deleteDialog;
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`/admin/${adminId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showSnackbar("Admin deleted successfully!");
      fetchAdmins();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Error deleting admin.",
        "error"
      );
    } finally {
      setDeleteDialog({ open: false, adminId: null, adminName: "" });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, adminId: null, adminName: "" });
  };

  const closeModal = () => {
    setEditingAdmin(null);
    document.body.style.overflow = "unset";
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    if (term === "") {
      setAdmins(originalAdmins);
    } else {
      const filtered = originalAdmins.filter(
        (admin) =>
          admin.name.toLowerCase().includes(term.toLowerCase()) ||
          admin.email.toLowerCase().includes(term.toLowerCase())
      );
      setAdmins(filtered);
    }
  };

  const resetSearch = () => {
    setSearchTerm("");
    setAdmins(originalAdmins);
  };

  const styles = {
    container: {
      padding: "2rem",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    headerContainer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1.5rem",
      flexWrap: "wrap",
      gap: "1rem",
    },
    header: {
      color: "#2c3e50",
      marginBottom: "1.5rem",
      fontSize: "1.8rem",
      fontWeight: "600",
      borderBottom: "2px solid #3498db",
      paddingBottom: "0.5rem",
    },
    searchContainer: {
      display: "flex",
      gap: "0.5rem",
    },
    searchInput: {
      padding: "0.8rem 1rem",
      border: "1px solid #bdc3c7",
      borderRadius: "6px",
      fontSize: "1rem",
      width: "300px",
      transition: "all 0.3s",
      ":focus": {
        borderColor: "#3498db",
        outline: "none",
        boxShadow: "0 0 0 2px rgba(52, 152, 219, 0.2)",
      },
    },
    resetButton: {
      backgroundColor: "#95a5a6",
      color: "white",
      border: "none",
      padding: "0.7rem 1rem",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "0.9rem",
      fontWeight: "500",
      transition: "all 0.2s",
      ":hover": {
        backgroundColor: "#7f8c8d",
        transform: "translateY(-1px)",
      },
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      boxShadow: "0 0 20px rgba(0, 0, 0, 0.1)",
      borderRadius: "8px",
      overflow: "hidden",
    },
    tableHeader: {
      backgroundColor: "#3498db",
      color: "white",
      textAlign: "left",
      padding: "1rem",
    },
    tableRow: {
      borderBottom: "1px solid #e0e0e0",
      transition: "background-color 0.2s",
      ":hover": {
        backgroundColor: "#f5f9fc",
      },
      ":last-child": {
        borderBottom: "none",
      },
    },
    tableCell: {
      padding: "1rem",
      color: "#34495e",
    },
    editButton: {
      backgroundColor: "#3498db",
      color: "white",
      border: "none",
      padding: "0.5rem 1rem",
      borderRadius: "4px",
      cursor: "pointer",
      transition: "background-color 0.2s",
      ":hover": {
        backgroundColor: "#2980b9",
      },
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      overflow: "hidden",
    },
    modalContent: {
      backgroundColor: "white",
      padding: "2rem",
      borderRadius: "12px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
      width: "90%",
      maxWidth: "500px",
      maxHeight: "80vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    modalHeader: {
      color: "#2c3e50",
      marginBottom: "1.5rem",
      fontSize: "1.5rem",
      fontWeight: "600",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    closeButton: {
      background: "none",
      border: "none",
      fontSize: "1.5rem",
      cursor: "pointer",
      color: "#7f8c8d",
      ":hover": {
        color: "#e74c3c",
      },
    },
    modalBody: {
      overflowY: "auto",
      paddingRight: "0.5rem",
      flex: 1,
      "::-webkit-scrollbar": {
        width: "6px",
      },
      "::-webkit-scrollbar-track": {
        background: "#f1f1f1",
        borderRadius: "10px",
      },
      "::-webkit-scrollbar-thumb": {
        background: "#3498db",
        borderRadius: "10px",
      },
    },
    formGroup: {
      marginBottom: "1.5rem",
    },
    label: {
      display: "block",
      marginBottom: "0.5rem",
      color: "#34495e",
      fontWeight: "500",
    },
    input: {
      width: "100%",
      padding: "0.8rem",
      border: "1px solid #bdc3c7",
      borderRadius: "6px",
      fontSize: "1rem",
      transition: "border-color 0.2s",
      ":focus": {
        borderColor: "#3498db",
        outline: "none",
        boxShadow: "0 0 0 2px rgba(52, 152, 219, 0.2)",
      },
    },
    select: {
      width: "100%",
      padding: "0.8rem",
      border: "1px solid #bdc3c7",
      borderRadius: "6px",
      fontSize: "1rem",
      backgroundColor: "white",
      transition: "border-color 0.2s",
      ":focus": {
        borderColor: "#3498db",
        outline: "none",
        boxShadow: "0 0 0 2px rgba(52, 152, 219, 0.2)",
      },
    },
    buttonGroup: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "1rem",
      marginTop: "1.5rem",
      paddingTop: "1rem",
      borderTop: "1px solid #eee",
    },
    primaryButton: {
      backgroundColor: "#3498db",
      color: "white",
      border: "none",
      padding: "0.7rem 1.5rem",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "1rem",
      fontWeight: "500",
      transition: "all 0.2s",
      ":hover": {
        backgroundColor: "#2980b9",
        transform: "translateY(-1px)",
      },
    },
    secondaryButton: {
      backgroundColor: "#95a5a6",
      color: "white",
      border: "none",
      padding: "0.7rem 1.5rem",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "1rem",
      fontWeight: "500",
      transition: "all 0.2s",
      ":hover": {
        backgroundColor: "#7f8c8d",
        transform: "translateY(-1px)",
      },
    },
    loading: {
      color: "#7f8c8d",
      textAlign: "center",
      marginTop: "2rem",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            style={{
              ...styles.secondaryButton,
              padding: "0.5rem 1.2rem",
              fontSize: "1rem",
              marginRight: "0.5rem",
            }}
            onClick={() => window.history.back()}
          >
            &#8592; Back
          </button>
          <h2 style={styles.header}>BOS - Members - Details</h2>
        </div>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button style={styles.resetButton} onClick={resetSearch}>
              Reset
            </button>
          )}
        </div>
      </div>

      {admins.length > 0 ? (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.tableHeader}>Member ID</th>
              <th style={styles.tableHeader}>Name</th>
              <th style={styles.tableHeader}>Email</th>
              <th style={styles.tableHeader}>Mobile Number</th>
              <th style={styles.tableHeader}>Role</th>
              <th style={styles.tableHeader}>Designation</th>
              <th style={styles.tableHeader}>Joining Date</th>
              <th style={styles.tableHeader}>Term End</th>{" "}
              <th style={styles.tableHeader}>Action</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin._id} style={styles.tableRow}>
                <td style={styles.tableCell}>
                  {admin.bosDetails?.member_id || "—"}
                </td>
                <td style={styles.tableCell}>{admin.name}</td>
                <td style={styles.tableCell}>{admin.email}</td>
                <td style={styles.tableCell}>{admin.mobilenumber}</td>
                <td style={styles.tableCell}>{admin.role}</td>
              <td style={styles.tableCell}>
                  {admin.bosDetails?.designation || "—"}
                </td>
                <td style={styles.tableCell}>
                  {admin.bosDetails?.joining_date
                    ? new Date(
                        admin.bosDetails.joining_date
                      ).toLocaleDateString()
                    : "—"}
                </td>
                <td style={styles.tableCell}>
                  {admin.bosDetails?.term_end
                    ? new Date(admin.bosDetails.term_end).toLocaleDateString()
                    : "—"}
                </td>
                <td style={styles.tableCell}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      style={styles.editButton}
                      onClick={() => handleEditClick(admin)}
                    >
                      Edit
                    </button>
                    <button
                      style={{
                        ...styles.editButton,
                        backgroundColor: "#e74c3c",
                      }}
                      onClick={() => handleDeleteClick(admin._id, admin.name)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p style={styles.loading}>Loading admin data...</p>
      )}

      {editingAdmin && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3>Edit Admin</h3>
              <button style={styles.closeButton} onClick={closeModal}>
                &times;
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Mobile:</label>
                <input
                  type="text"
                  name="mobilenumber"
                  value={formData.mobilenumber}
                  onChange={handleInputChange}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Role:</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  style={styles.select}
                >
                  <option value="superadmin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="boscontroller">BOS Controller</option>
                  <option value="bosmembers">BOS Members</option>
                  <option value="datamaintenance">Data Maintenance</option>
                  <option value="coursecontroller">Course Controller</option>
                  <option value="markettingcontroller">
                    Marketing Controller
                  </option>
                </select>
              </div>
            </div>
            <div style={styles.buttonGroup}>
              <button style={styles.secondaryButton} onClick={closeModal}>
                Cancel
              </button>
              <button style={styles.primaryButton} onClick={handleUpdate}>
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
      >
        <DialogTitle id="alert-dialog-title">
          {`Are you sure you want to delete admin "${deleteDialog.adminName}"?`}
        </DialogTitle>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} autoFocus color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default BOSMembers;
