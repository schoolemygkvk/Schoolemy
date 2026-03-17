import React, { useState, useEffect, useCallback } from "react";
import axios from "../../../Utils/api";

// Style Constants
const colors = {
  primary: "#4F46E5",
  primaryDark: "#4338CA",
  textPrimary: "#1F2937",
  textSecondary: "#4B5563",
  textLight: "#6B7280",
  borderLight: "#E5E7EB",
  borderDefault: "#D1D5DB",
  bgRoot: "linear-gradient(to bottom right, #F9FAFB, #F3F4F6)",
  bgLight: "#F9FAFB",
  bgLighter: "#F3F4F6",
  white: "#FFFFFF",
  success: "#10B981",
  error: "#EF4444",
  deleteColor: "#DC2626",
  deleteDark: "#B91C1C",
  statusColors: {
    pending: "#F59E0B", // Amber
    resolved: "#10B981", // Green
    rejected: "#78716C", // Stone
  },
};

const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  modal: "0 20px 25px -5px rgba(0,0,0,0.2), 0 10px 10px -5px rgba(0,0,0,0.1)",
};

const typography = {
  fontFamily:
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
};

// --- Reusable Form Fields Components ---
const CreateComplaintFormFields = ({ formData, handleChange, errors }) => {
  const formStyles = {
    formGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "20px" }, // Single column for create
    formLabel: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: colors.textSecondary,
      marginBottom: "4px",
    },
    formInput: {
      width: "100%",
      padding: "10px 16px",
      borderRadius: "8px",
      border: `1px solid ${colors.borderDefault}`,
      fontSize: "14px",
      boxSizing: "border-box",
      transition: "border-color 0.2s, box-shadow 0.2s",
      outline: "none",
    },
    formTextarea: { minHeight: "120px", resize: "vertical" },
    formInputFocus: {
      borderColor: colors.primary,
      boxShadow: `0 0 0 1px ${colors.primary}`,
    },
    formInputError: { borderColor: colors.error },
    formErrorText: { marginTop: "4px", fontSize: "12px", color: colors.error },
  };
  const handleFocus = (e) => {
    e.target.style.borderColor = colors.primary;
    e.target.style.boxShadow = formStyles.formInputFocus.boxShadow;
  };
  const handleBlur = (e) => {
    e.target.style.boxShadow = "none";
    if (errors[e.target.name]) e.target.style.borderColor = colors.error;
    else e.target.style.borderColor = colors.borderDefault;
  };

  return (
    <div style={formStyles.formGrid}>
      <div>
        <label style={formStyles.formLabel}>Student Name *</label>
        <input
          type="text"
          name="userName"
          value={formData.userName}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...formStyles.formInput,
            ...(errors.userName && formStyles.formInputError),
          }}
          placeholder="Enter student name"
        />
        {errors.userName && (
          <p style={formStyles.formErrorText}>{errors.userName}</p>
        )}
      </div>
      <div>
        <label style={formStyles.formLabel}>Student Register Number *</label>
        <input
          type="text"
          name="regNo"
          value={formData.regNo}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...formStyles.formInput,
            ...(errors.regNo && formStyles.formInputError),
          }}
          placeholder="Enter student register number"
        />
        {errors.regNo && <p style={formStyles.formErrorText}>{errors.regNo}</p>}
      </div>
      <div>
        <label style={formStyles.formLabel}>Student Email *</label>
        <input
          type="email"
          name="userEmail"
          value={formData.userEmail}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...formStyles.formInput,
            ...(errors.userEmail && formStyles.formInputError),
          }}
          placeholder="Enter student email"
        />
        {errors.userEmail && (
          <p style={formStyles.formErrorText}>{errors.userEmail}</p>
        )}
      </div>
      <div>
        <label style={formStyles.formLabel}>User ID (ObjectId) *</label>
        <input
          type="text"
          name="userId"
          value={formData.userId}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...formStyles.formInput,
            ...(errors.userId && formStyles.formInputError),
          }}
          placeholder="Enter User ObjectId"
        />
        {errors.userId && (
          <p style={formStyles.formErrorText}>{errors.userId}</p>
        )}
      </div>
      <div>
        <label style={formStyles.formLabel}>Subject *</label>
        <input
          type="text"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...formStyles.formInput,
            ...(errors.subject && formStyles.formInputError),
          }}
          placeholder="Brief subject of complaint"
        />
        {errors.subject && (
          <p style={formStyles.formErrorText}>{errors.subject}</p>
        )}
      </div>
      <div>
        <label style={formStyles.formLabel}>Category *</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...formStyles.formInput,
            ...(errors.category && formStyles.formInputError),
          }}
        >
          <option value="">Select category</option>
          <option value="Technical">Technical</option>
          <option value="Content">Content</option>
          <option value="Billing">Billing</option>
          <option value="Other">Other</option>
        </select>
        {errors.category && (
          <p style={formStyles.formErrorText}>{errors.category}</p>
        )}
      </div>
      <div>
        <label style={formStyles.formLabel}>Description *</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...formStyles.formInput,
            ...formStyles.formTextarea,
            ...(errors.description && formStyles.formInputError),
          }}
          placeholder="Describe the complaint in detail..."
        />
        {errors.description && (
          <p style={formStyles.formErrorText}>{errors.description}</p>
        )}
      </div>
    </div>
  );
};

const UpdateStatusFormFields = ({ formData, handleChange, errors }) => {
  const formStyles = {
    /* Same as CreateComplaintFormFields for consistency */
    formGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "20px" },
    formLabel: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: colors.textSecondary,
      marginBottom: "4px",
    },
    formInput: {
      width: "100%",
      padding: "10px 16px",
      borderRadius: "8px",
      border: `1px solid ${colors.borderDefault}`,
      fontSize: "14px",
      boxSizing: "border-box",
      transition: "border-color 0.2s, box-shadow 0.2s",
      outline: "none",
    },
    formTextarea: { minHeight: "100px", resize: "vertical" },
    formInputFocus: {
      borderColor: colors.primary,
      boxShadow: `0 0 0 1px ${colors.primary}`,
    },
    formInputError: { borderColor: colors.error },
    formErrorText: { marginTop: "4px", fontSize: "12px", color: colors.error },
  };
  const handleFocus = (e) => {
    e.target.style.borderColor = colors.primary;
    e.target.style.boxShadow = formStyles.formInputFocus.boxShadow;
  };
  const handleBlur = (e) => {
    e.target.style.boxShadow = "none";
    if (errors[e.target.name]) e.target.style.borderColor = colors.error;
    else e.target.style.borderColor = colors.borderDefault;
  };
  const statusOptions = ["pending", "resolved", "rejected"];

  return (
    <div style={formStyles.formGrid}>
      <div>
        <label style={formStyles.formLabel}>Status *</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...formStyles.formInput,
            ...(errors.status && formStyles.formInputError),
          }}
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        {errors.status && (
          <p style={formStyles.formErrorText}>{errors.status}</p>
        )}
      </div>
      <div>
        <label style={formStyles.formLabel}>Admin Response</label>
        <textarea
          name="adminResponse"
          value={formData.adminResponse}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...formStyles.formInput,
            ...formStyles.formTextarea,
            ...(errors.adminResponse && formStyles.formInputError),
          }}
          placeholder="Provide a response (optional for Pending)"
        />
        {errors.adminResponse && (
          <p style={formStyles.formErrorText}>{errors.adminResponse}</p>
        )}
      </div>
    </div>
  );
};

const StudentComplaintManagement = () => {
  const [complaintsData, setComplaintsData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [createFormData, setCreateFormData] = useState({
    userId: "",
    userName: "",
    regNo: "",
    userEmail: "",
    subject: "",
    description: "",
    category: "",
  });
  const [updateStatusFormData, setUpdateStatusFormData] = useState({
    status: "pending",
    adminResponse: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [expandedMessages, setExpandedMessages] = useState({}); // To toggle full message view

  // Hover states
  const [isBackButtonHovered, setIsBackButtonHovered] = useState(false);
  const [isAddButtonHovered, setIsAddButtonHovered] = useState(false);
  const [isModalActionButtonHovered, setIsModalActionButtonHovered] =
    useState(false); // Generic for modal action buttons
  const [hoveredRowId, setHoveredRowId] = useState(null);

  const limit = 10;

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage, limit });
      if (filterStatus) params.append("status", filterStatus);
      const response = await axios.get(
        `/api/complaint/all?${params.toString()}`,
      );
      setComplaintsData(response.data.complaints);
      setTotalPages(response.data.totalPages);
      setTotalRecords(response.data.totalCount);
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      setSuccessMessage(
        error.response?.data?.message || "Error fetching complaints.",
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  const toggleMessageExpansion = (id) => {
    setExpandedMessages((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- Create Complaint ---
  const validateCreateForm = () => {
    const newErrors = {};
    if (!createFormData.userId.trim()) newErrors.userId = "User ID is required";
    // Basic ObjectId check (24 hex chars)
    if (
      createFormData.userId.trim() &&
      !/^[0-9a-fA-F]{24}$/.test(createFormData.userId.trim())
    )
      newErrors.userId = "Invalid User ID format (must be 24 hex characters)";
    if (!createFormData.userName.trim())
      newErrors.userName = "Name is required";
    if (!createFormData.regNo.trim())
      newErrors.regNo = "Student register number is required";
    if (!createFormData.userEmail.trim())
      newErrors.userEmail = "Email is required";
    if (
      createFormData.userEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createFormData.userEmail.trim())
    )
      newErrors.userEmail = "Invalid email format";
    if (!createFormData.subject.trim())
      newErrors.subject = "Subject is required";
    if (!createFormData.category.trim())
      newErrors.category = "Category is required";
    if (!createFormData.description.trim())
      newErrors.description = "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const resetCreateForm = () => {
    setCreateFormData({
      userId: "",
      userName: "",
      regNo: "",
      userEmail: "",
      subject: "",
      description: "",
      category: "",
    });
    setErrors({});
  };
  const handleCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleCreateComplaint = async () => {
    if (!validateCreateForm()) return;
    setLoading(true);
    try {
      await axios.post("/api/complaint/create", createFormData);
      setSuccessMessage("Complaint submitted successfully!");
      setShowCreateModal(false);
      resetCreateForm();
      fetchComplaints();
    } catch (error) {
      console.error("Failed to create complaint:", error);
      setSuccessMessage(
        error.response?.data?.message || "Failed to submit complaint.",
      );
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // --- Update Status ---
  const openUpdateStatusModal = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateStatusFormData({
      status: complaint.status,
      adminResponse: complaint.adminResponse || "",
    });
    setErrors({}); // Clear previous errors
    setShowUpdateStatusModal(true);
  };
  const validateUpdateStatusForm = () => {
    const newErrors = {};
    if (!updateStatusFormData.status) newErrors.status = "Status is required";
    // adminReply can be optional unless status is Resolved/Rejected where it might be encouraged
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleUpdateStatusFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateStatusFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleUpdateStatus = async () => {
    if (!validateUpdateStatusForm() || !selectedComplaint) return;
    setLoading(true);
    try {
      await axios.put(
        `/api/complaint/update-status/${selectedComplaint._id}`,
        updateStatusFormData,
      );
      setSuccessMessage("Complaint status updated successfully!");
      setShowUpdateStatusModal(false);
      fetchComplaints();
    } catch (error) {
      console.error("Failed to update status:", error);
      setSuccessMessage(
        error.response?.data?.message || "Failed to update status.",
      );
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // --- Delete Complaint ---
  const handleDeleteComplaint = async (complaintId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this complaint? This action cannot be undone.",
      )
    ) {
      setLoading(true);
      try {
        await axios.delete(`/api/complaint/delete/${complaintId}`);
        setSuccessMessage("Complaint deleted successfully!");
        fetchComplaints(); // Refresh list
      } catch (error) {
        console.error("Failed to delete complaint:", error);
        setSuccessMessage(
          error.response?.data?.message || "Failed to delete complaint.",
        );
      } finally {
        setLoading(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    }
  };

  // Styles
  const styles = {
    pageContainer: {
      minHeight: "100vh",
      background: colors.bgRoot,
      padding: "32px",
      fontFamily: typography.fontFamily,
    },
    successMessage: {
      position: "fixed",
      top: "16px",
      right: "16px",
      zIndex: 1050,
      padding: "12px 24px",
      borderRadius: "8px",
      boxShadow: shadows.lg,
      animation: "bounce-custom 1s ease-in-out",
      color: colors.white,
    },
    headerContainer: { maxWidth: "1600px", margin: "0 auto 32px auto" },
    headerFlex: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      flexWrap: "wrap",
      marginBottom: "24px",
    },
    headerTitleGroup: { display: "flex", alignItems: "center", gap: "24px" },
    headerTitle: {
      fontSize: "28px",
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    headerSubtitle: {
      color: colors.textSecondary,
      marginTop: "4px",
      fontSize: "15px",
    },
    headerActions: {
      display: "flex",
      gap: "12px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    button: {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      fontWeight: "500",
      transition: "all 0.2s ease-in-out",
      outline: "none",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    buttonPrimary: {
      backgroundColor: colors.primary,
      color: colors.white,
      boxShadow: shadows.md,
    },
    buttonPrimaryHover: {
      backgroundColor: colors.primaryDark,
      transform: "translateY(-2px)",
    },
    buttonSecondary: {
      backgroundColor: colors.white,
      color: colors.textSecondary,
      border: `1px solid ${colors.borderDefault}`,
      boxShadow: shadows.sm,
    },
    buttonSecondaryHover: {
      backgroundColor: colors.bgLighter,
      borderColor: colors.textLight,
      color: colors.textPrimary,
      transform: "translateY(-1px)",
    },
    backButtonIcon: { width: "18px", height: "18px", strokeWidth: "2.5" },
    filterBar: {
      display: "flex",
      gap: "16px",
      marginBottom: "24px",
      padding: "20px",
      backgroundColor: colors.white,
      borderRadius: "12px",
      boxShadow: shadows.md,
      alignItems: "center",
    },
    filterLabel: {
      fontSize: "14px",
      fontWeight: "500",
      color: colors.textSecondary,
    },
    filterSelect: {
      padding: "10px 16px",
      borderRadius: "8px",
      border: `1px solid ${colors.borderDefault}`,
      fontSize: "14px",
      outline: "none",
      minWidth: "200px",
    },
    mainContentContainer: {
      maxWidth: "1600px",
      margin: "0 auto",
      backgroundColor: colors.white,
      borderRadius: "16px",
      boxShadow: shadows.xl,
      overflow: "hidden",
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "384px",
    },
    spinner: {
      borderRadius: "50%",
      height: "48px",
      width: "48px",
      borderTop: `3px solid ${colors.primary}`,
      borderRight: `3px solid ${colors.primary}`,
      borderBottom: `3px solid ${colors.primary}`,
      borderLeft: "3px solid transparent",
      animation: "spin 1s linear infinite",
    },
    tableOverflow: { overflowX: "auto" },
    table: { width: "100%", borderCollapse: "collapse" },
    tableHead: { backgroundColor: colors.bgLight },
    tableTh: {
      padding: "14px 20px",
      textAlign: "left",
      fontSize: "13px",
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      borderBottom: `1px solid ${colors.borderLight}`,
      whiteSpace: "nowrap",
    },
    tableTd: {
      padding: "14px 20px",
      fontSize: "14px",
      color: colors.textPrimary,
      borderBottom: `1px solid ${colors.borderLight}`,
      verticalAlign: "top",
    },
    messageCell: {
      whiteSpace: "pre-wrap",
      maxWidth: "300px",
      overflow: "hidden",
      textOverflow: "ellipsis",
    },
    viewMoreLink: {
      color: colors.primary,
      cursor: "pointer",
      textDecoration: "underline",
      fontSize: "12px",
      display: "block",
      marginTop: "4px",
    },
    actionButton: {
      cursor: "pointer",
      background: "none",
      border: "none",
      fontWeight: "500",
      transition: "all 0.2s",
      padding: "6px 10px",
      borderRadius: "6px",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    updateStatusButton: { color: colors.primary, marginRight: "10px" },
    updateStatusButtonHover: {
      color: colors.primaryDark,
      backgroundColor: colors.bgLighter,
    },
    deleteButtonSmall: { color: colors.deleteColor },
    deleteButtonSmallHover: {
      color: colors.deleteDark,
      backgroundColor: colors.bgLighter,
    },
    paginationContainer: {
      backgroundColor: colors.white,
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderTop: `1px solid ${colors.borderLight}`,
      flexWrap: "wrap",
      gap: "16px",
    },
    paginationInfo: { fontSize: "14px", color: colors.textSecondary },
    paginationNav: {
      display: "inline-flex",
      borderRadius: "6px",
      boxShadow: shadows.sm,
      overflow: "hidden",
    },
    paginationButton: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 16px",
      border: `1px solid ${colors.borderDefault}`,
      borderLeftWidth: "0",
      backgroundColor: colors.white,
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      color: colors.textLight,
      transition: "background-color 0.2s, color 0.2s",
    },
    paginationButtonFirst: {
      borderLeftWidth: "1px",
      borderTopLeftRadius: "6px",
      borderBottomLeftRadius: "6px",
    },
    paginationButtonLast: {
      borderTopRightRadius: "6px",
      borderBottomRightRadius: "6px",
    },
    paginationButtonActive: {
      zIndex: 10,
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      color: colors.white,
    },
    paginationButtonDisabled: {
      color: colors.borderDefault,
      cursor: "not-allowed",
      backgroundColor: colors.bgLight,
    },
    paginationIcon: { height: "20px", width: "20px" },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "16px",
    },
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: "16px",
      boxShadow: shadows.modal,
      width: "100%",
      maxWidth: "600px",
      maxHeight: "90vh",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
    },
    modalInnerPadding: { padding: "24px" },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${colors.borderLight}`,
      paddingBottom: "12px",
      marginBottom: "24px",
    },
    modalTitle: {
      fontSize: "22px",
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    modalCloseButton: {
      color: colors.textLight,
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "4px",
    },
    modalCloseButtonIcon: { height: "24px", width: "24px" },
    modalActions: {
      marginTop: "24px",
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      paddingTop: "16px",
      borderTop: `1px solid ${colors.borderLight}`,
    },
    badge: (status) => ({
      padding: "5px 12px",
      fontSize: "12px",
      fontWeight: "600",
      borderRadius: "16px",
      color: colors.white,
      backgroundColor: colors.statusColors[status] || colors.textLight,
      textTransform: "caxiostalize",
      minWidth: "80px",
      textAlign: "center",
      display: "inline-block",
    }),
  };
  const statusOptionsForFilter = ["pending", "resolved", "rejected"];

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes bounce-custom { 0%, 100% { transform: translateY(-10%); animation-timing-function: cubic-bezier(0.8,0,1,1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0,0,0.2,1); } }
      `}</style>
      <div style={styles.pageContainer}>
        {successMessage && (
          <div
            style={{
              ...styles.successMessage,
              backgroundColor:
                successMessage.toLowerCase().includes("error") ||
                successMessage.toLowerCase().includes("failed") ||
                successMessage.toLowerCase().includes("unauthorized")
                  ? colors.error
                  : colors.success,
            }}
          >
            {successMessage}
          </div>
        )}

        <div style={styles.headerContainer}>
          <div style={styles.headerFlex}>
            <div style={styles.headerTitleGroup}>
              <button
                onClick={() => window.history.back()}
                style={{
                  ...styles.button,
                  ...styles.buttonSecondary,
                  ...(isBackButtonHovered && styles.buttonSecondaryHover),
                }}
                onMouseEnter={() => setIsBackButtonHovered(true)}
                onMouseLeave={() => setIsBackButtonHovered(false)}
                disabled={loading}
              >
                <svg
                  style={styles.backButtonIcon}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                <span>Back</span>
              </button>
              <div>
                <h1 style={styles.headerTitle}>Student Complaint Records</h1>
                <p style={styles.headerSubtitle}>
                  Track and manage student complaints and resolutions.
                </p>
              </div>
            </div>
            <div style={styles.headerActions}>
              {/* Submit New Complaint button removed */}
            </div>
          </div>

          <div style={styles.filterBar}>
            <label htmlFor="statusFilter" style={styles.filterLabel}>
              Filter by Status:
            </label>
            <select
              id="statusFilter"
              value={filterStatus}
              onChange={handleFilterChange}
              style={styles.filterSelect}
              disabled={loading}
            >
              <option value="">All Statuses</option>
              {statusOptionsForFilter.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.mainContentContainer}>
          {loading && !complaintsData.length ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
            </div>
          ) : (
            <>
              <div style={styles.tableOverflow}>
                <table style={styles.table}>
                  <thead style={styles.tableHead}>
                    <tr>
                      <th style={styles.tableTh}>Student Name</th>
                      <th style={styles.tableTh}>Register Number</th>
                      <th style={styles.tableTh}>Email</th>
                      <th style={styles.tableTh}>Subject</th>
                      <th style={styles.tableTh}>Category</th>
                      <th style={styles.tableTh}>Description</th>
                      <th style={styles.tableTh}>Status</th>
                      <th style={styles.tableTh}>Admin Response</th>
                      <th style={styles.tableTh}>Submitted</th>
                      <th style={styles.tableTh}>Resolved On</th>
                      <th style={{ ...styles.tableTh, textAlign: "center" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaintsData.length === 0 && !loading ? (
                      <tr>
                        <td
                          colSpan="11"
                          style={{
                            ...styles.tableTd,
                            textAlign: "center",
                            fontStyle: "italic",
                            color: colors.textLight,
                          }}
                        >
                          No complaints found.
                        </td>
                      </tr>
                    ) : (
                      complaintsData.map((complaint) => (
                        <tr
                          key={complaint._id}
                          style={{
                            ...(hoveredRowId === complaint._id && {
                              backgroundColor: colors.bgLighter,
                            }),
                          }}
                          onMouseEnter={() => setHoveredRowId(complaint._id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                        >
                          <td style={styles.tableTd}>{complaint.userName}</td>
                          <td style={styles.tableTd}>
                            {complaint.regNo || "N/A"}
                          </td>
                          <td style={styles.tableTd}>{complaint.userEmail}</td>
                          <td style={styles.tableTd}>{complaint.subject}</td>
                          <td style={styles.tableTd}>{complaint.category}</td>
                          <td style={styles.tableTd}>
                            <div
                              style={{
                                ...styles.messageCell,
                                maxHeight: expandedMessages[complaint._id]
                                  ? "none"
                                  : "60px" /* 3 lines approx */,
                              }}
                            >
                              {complaint.description}
                            </div>
                            {complaint.description.length >
                              100 /* Approx char count for 3 lines */ && (
                              <span
                                style={styles.viewMoreLink}
                                onClick={() =>
                                  toggleMessageExpansion(complaint._id)
                                }
                              >
                                {expandedMessages[complaint._id]
                                  ? "View Less"
                                  : "View More"}
                              </span>
                            )}
                          </td>
                          <td style={styles.tableTd}>
                            <span style={styles.badge(complaint.status)}>
                              {complaint.status.charAt(0).toUpperCase() +
                                complaint.status.slice(1)}
                            </span>
                          </td>
                          <td style={styles.tableTd}>
                            {complaint.adminResponse ? (
                              <>
                                <div
                                  style={{
                                    ...styles.messageCell,
                                    maxHeight: expandedMessages[
                                      `reply-${complaint._id}`
                                    ]
                                      ? "none"
                                      : "60px",
                                  }}
                                >
                                  {complaint.adminResponse}
                                </div>
                                {complaint.adminResponse.length > 100 && (
                                  <span
                                    style={styles.viewMoreLink}
                                    onClick={() =>
                                      toggleMessageExpansion(
                                        `reply-${complaint._id}`,
                                      )
                                    }
                                  >
                                    {expandedMessages[`reply-${complaint._id}`]
                                      ? "View Less"
                                      : "View More"}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span
                                style={{
                                  color: colors.textLight,
                                  fontStyle: "italic",
                                }}
                              >
                                N/A
                              </span>
                            )}
                          </td>
                          <td style={styles.tableTd}>
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </td>
                          <td style={styles.tableTd}>
                            {complaint.resolvedAt
                              ? new Date(
                                  complaint.resolvedAt,
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td
                            style={{ ...styles.tableTd, textAlign: "center" }}
                          >
                            <button
                              onClick={() => openUpdateStatusModal(complaint)}
                              style={{
                                ...styles.actionButton,
                                ...styles.updateStatusButton,
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  colors.bgLighter)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "transparent")
                              }
                              disabled={loading}
                            >
                              <svg
                                style={{ width: "16px", height: "16px" }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                ></path>
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteComplaint(complaint._id)
                              }
                              style={{
                                ...styles.actionButton,
                                ...styles.deleteButtonSmall,
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  colors.bgLighter)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  "transparent")
                              }
                              disabled={loading}
                            >
                              <svg
                                style={{ width: "16px", height: "16px" }}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                ></path>
                              </svg>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 0 && (
                <div style={styles.paginationContainer}>
                  <p style={styles.paginationInfo}>
                    Showing{" "}
                    <span style={{ fontWeight: "600" }}>
                      {Math.min((currentPage - 1) * limit + 1, totalRecords)}
                    </span>{" "}
                    to{" "}
                    <span style={{ fontWeight: "600" }}>
                      {Math.min(currentPage * limit, totalRecords)}
                    </span>{" "}
                    of <span style={{ fontWeight: "600" }}>{totalRecords}</span>{" "}
                    results
                  </p>
                  {totalPages > 1 && (
                    <nav style={styles.paginationNav} aria-label="Pagination">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1 || loading}
                        style={{
                          ...styles.paginationButton,
                          ...styles.paginationButtonFirst,
                          ...((currentPage === 1 || loading) &&
                            styles.paginationButtonDisabled),
                        }}
                      >
                        <svg
                          style={styles.paginationIcon}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                          disabled={loading}
                          style={{
                            ...styles.paginationButton,
                            ...(currentPage === i + 1 &&
                              styles.paginationButtonActive),
                            ...(loading && styles.paginationButtonDisabled),
                          }}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages || loading}
                        style={{
                          ...styles.paginationButton,
                          ...styles.paginationButtonLast,
                          ...((currentPage === totalPages || loading) &&
                            styles.paginationButtonDisabled),
                        }}
                      >
                        <svg
                          style={styles.paginationIcon}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </nav>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Create Complaint Modal */}
        {showCreateModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalInnerPadding}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Submit New Complaint</h3>
                  <button
                    onClick={() => {
                      if (!loading) {
                        setShowCreateModal(false);
                        resetCreateForm();
                      }
                    }}
                    style={styles.modalCloseButton}
                    disabled={loading}
                  >
                    <svg
                      style={styles.modalCloseButtonIcon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
                <CreateComplaintFormFields
                  formData={createFormData}
                  handleChange={handleCreateFormChange}
                  errors={errors}
                />
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!loading) {
                        setShowCreateModal(false);
                        resetCreateForm();
                      }
                    }}
                    style={{
                      ...styles.button,
                      ...styles.buttonSecondary,
                      ...(loading && { opacity: 0.7, cursor: "not-allowed" }),
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateComplaint}
                    style={{
                      ...styles.button,
                      ...styles.buttonPrimary,
                      ...(isModalActionButtonHovered &&
                        styles.buttonPrimaryHover),
                      ...(loading && {
                        backgroundColor: colors.primaryDark,
                        cursor: "not-allowed",
                      }),
                    }}
                    onMouseEnter={() => setIsModalActionButtonHovered(true)}
                    onMouseLeave={() => setIsModalActionButtonHovered(false)}
                    disabled={loading}
                  >
                    {loading ? "Submitting..." : "Submit Complaint"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Status Modal */}
        {showUpdateStatusModal && selectedComplaint && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalInnerPadding}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Update Complaint Status</h3>
                  <button
                    onClick={() => {
                      if (!loading) {
                        setShowUpdateStatusModal(false);
                        setErrors({});
                      }
                    }}
                    style={styles.modalCloseButton}
                    disabled={loading}
                  >
                    <svg
                      style={styles.modalCloseButtonIcon}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "12px",
                    backgroundColor: colors.bgLighter,
                    borderRadius: "8px",
                  }}
                >
                  <p style={{ fontSize: "14px", color: colors.textSecondary }}>
                    <strong>Student:</strong> {selectedComplaint.userName}
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: colors.textSecondary,
                      marginTop: "4px",
                    }}
                  >
                    <strong>Register No:</strong> {selectedComplaint.regNo}
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      color: colors.textSecondary,
                      marginTop: "4px",
                    }}
                  >
                    <strong>Subject:</strong> {selectedComplaint.subject}
                  </p>
                </div>
                <UpdateStatusFormFields
                  formData={updateStatusFormData}
                  handleChange={handleUpdateStatusFormChange}
                  errors={errors}
                />
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!loading) {
                        setShowUpdateStatusModal(false);
                        setErrors({});
                      }
                    }}
                    style={{
                      ...styles.button,
                      ...styles.buttonSecondary,
                      ...(loading && { opacity: 0.7, cursor: "not-allowed" }),
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateStatus}
                    style={{
                      ...styles.button,
                      ...styles.buttonPrimary,
                      ...(isModalActionButtonHovered &&
                        styles.buttonPrimaryHover),
                      ...(loading && {
                        backgroundColor: colors.primaryDark,
                        cursor: "not-allowed",
                      }),
                    }}
                    onMouseEnter={() => setIsModalActionButtonHovered(true)}
                    onMouseLeave={() => setIsModalActionButtonHovered(false)}
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Status"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentComplaintManagement;
