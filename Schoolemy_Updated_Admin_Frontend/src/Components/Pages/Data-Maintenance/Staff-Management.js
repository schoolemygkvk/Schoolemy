import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";

// Define style constants for better organization and reusability
const colors = {
  primary: "#4F46E5", // indigo-600
  primaryDark: "#4338CA", // indigo-700
  textPrimary: "#1F2937", // gray-800
  textSecondary: "#4B5563", // gray-600
  textLight: "#6B7280", // gray-500
  borderLight: "#E5E7EB", // gray-200
  borderDefault: "#D1D5DB", // gray-300
  bgRoot: "linear-gradient(to bottom right, #F9FAFB, #F3F4F6)", // from-gray-50 to-gray-100
  bgLight: "#F9FAFB", // gray-50
  bgLighter: "#F3F4F6", // gray-100
  white: "#FFFFFF",
  black: "#000000",
  success: "#10B981", // green-500
  error: "#EF4444", // red-500
  delete: "#DC2626", // red-600
  pinkLight: "#FCE7F3",
  pinkDark: "#9D174D",
  blueLight: "#DBEAFE",
  blueDark: "#1E40AF",
  purpleLight: "#F3E8FF",
  purpleDark: "#6B21A8",
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
  baseSize: "16px",
};

// --- Reusable Staff Form Fields Component ---
const StaffFormFields = ({
  formData,
  handleChange,
  handleFileChange,
  errors,
}) => {
  const styles = {
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
      gap: "24px",
    },
    formGridFullSpan: {
      gridColumn: "span 2 / span 2",
    },
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
    formInputFocus: {
      borderColor: colors.primary,
      boxShadow: `0 0 0 1px ${colors.primary}`,
    },
    formInputError: {
      borderColor: colors.error,
    },
    formErrorText: {
      marginTop: "4px",
      fontSize: "12px",
      color: colors.error,
    },
    fileInputLabel: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      height: "128px",
      border: `2px dashed ${colors.borderDefault}`,
      borderRadius: "8px",
      cursor: "pointer",
      backgroundColor: colors.bgLight,
      transition: "border-color 0.2s",
    },
    fileInputLabelHover: {
      borderColor: colors.primary,
    },
    fileInputIcon: {
      width: "32px",
      height: "32px",
      marginBottom: "8px",
      color: colors.textLight,
    },
    fileInputText: {
      fontSize: "14px",
      color: colors.textLight,
      textAlign: "center",
    },
    addressSectionTitle: {
      fontSize: "18px",
      fontWeight: "500",
      color: colors.textPrimary,
      marginBottom: "12px",
      marginTop: "16px",
    },
  };

  const [isFileInputHovered, setIsFileInputHovered] = useState(false);

  const handleFocus = (e) => {
    e.target.style.borderColor = colors.primary;
    e.target.style.boxShadow = styles.formInputFocus.boxShadow;
  };
  const handleBlur = (e) => {
    e.target.style.boxShadow = "none";
    const errorKey = e.target.name;
    if (errors[errorKey]) {
      e.target.style.borderColor = colors.error;
    } else {
      e.target.style.borderColor = colors.borderDefault;
    }
  };

  return (
    <div style={styles.formGrid}>
      <div>
        <label style={styles.formLabel}>Full Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...styles.formInput,
            ...(errors.name && styles.formInputError),
          }}
          placeholder="John Doe"
        />
        {errors.name && <p style={styles.formErrorText}>{errors.name}</p>}
      </div>

      <div>
        <label style={styles.formLabel}>Gender *</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...styles.formInput,
            ...(errors.gender && styles.formInputError),
          }}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        {errors.gender && <p style={styles.formErrorText}>{errors.gender}</p>}
      </div>

      <div>
        <label style={styles.formLabel}>Age *</label>
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...styles.formInput,
            ...(errors.age && styles.formInputError),
          }}
          placeholder="30"
          min="18"
        />
        {errors.age && <p style={styles.formErrorText}>{errors.age}</p>}
      </div>

      <div>
        <label style={styles.formLabel}>Aadhar Number *</label>
        <input
          type="text"
          name="aadharNumber"
          value={formData.aadharNumber}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...styles.formInput,
            ...(errors.aadharNumber && styles.formInputError),
          }}
          placeholder="123412341234"
        />
        {errors.aadharNumber && (
          <p style={styles.formErrorText}>{errors.aadharNumber}</p>
        )}
      </div>

      <div>
        <label style={styles.formLabel}>Designation *</label>
        <input
          type="text"
          name="designation"
          value={formData.designation}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            ...styles.formInput,
            ...(errors.designation && styles.formInputError),
          }}
          placeholder="Software Engineer"
        />
        {errors.designation && (
          <p style={styles.formErrorText}>{errors.designation}</p>
        )}
      </div>

      <div>
        <label style={styles.formLabel}>Profile Picture</label>
        <label
          style={{
            ...styles.fileInputLabel,
            ...(isFileInputHovered && styles.fileInputLabelHover),
          }}
          onMouseEnter={() => setIsFileInputHovered(true)}
          onMouseLeave={() => setIsFileInputHovered(false)}
        >
          <svg
            style={styles.fileInputIcon}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path>
          </svg>
          <p style={styles.fileInputText}>
            {formData.profilePicture &&
            typeof formData.profilePicture !== "string"
              ? formData.profilePicture.name
              : "Click to upload image"}
          </p>
          <input
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
            accept="image/*"
          />
        </label>
      </div>

      <div style={styles.formGridFullSpan}>
        <h4 style={styles.addressSectionTitle}>Address Details</h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "16px",
          }}
        >
          <div>
            <label style={styles.formLabel}>Street *</label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={{
                ...styles.formInput,
                ...(errors["address.street"] && styles.formInputError),
              }}
              placeholder="123 Main St"
            />
            {errors["address.street"] && (
              <p style={styles.formErrorText}>{errors["address.street"]}</p>
            )}
          </div>
          <div>
            <label style={styles.formLabel}>City *</label>
            <input
              type="text"
              name="address.city"
              value={formData.address.city}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={{
                ...styles.formInput,
                ...(errors["address.city"] && styles.formInputError),
              }}
              placeholder="New York"
            />
            {errors["address.city"] && (
              <p style={styles.formErrorText}>{errors["address.city"]}</p>
            )}
          </div>
          <div>
            <label style={styles.formLabel}>State *</label>
            <input
              type="text"
              name="address.state"
              value={formData.address.state}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={{
                ...styles.formInput,
                ...(errors["address.state"] && styles.formInputError),
              }}
              placeholder="NY"
            />
            {errors["address.state"] && (
              <p style={styles.formErrorText}>{errors["address.state"]}</p>
            )}
          </div>
          <div>
            <label style={styles.formLabel}>Postal Code *</label>
            <input
              type="text"
              name="address.postalCode"
              value={formData.address.postalCode}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={{
                ...styles.formInput,
                ...(errors["address.postalCode"] && styles.formInputError),
              }}
              placeholder="10001"
            />
            {errors["address.postalCode"] && (
              <p style={styles.formErrorText}>{errors["address.postalCode"]}</p>
            )}
          </div>
          <div style={{ gridColumn: "span 2 / span 2" }}>
            <label style={styles.formLabel}>Country *</label>
            <input
              type="text"
              name="address.country"
              value={formData.address.country}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={{
                ...styles.formInput,
                ...(errors["address.country"] && styles.formInputError),
              }}
              placeholder="United States"
            />
            {errors["address.country"] && (
              <p style={styles.formErrorText}>{errors["address.country"]}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StaffManagement = () => {
  const navigate = useNavigate();
  const [staffData, setStaffData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    age: "",
    address: { street: "", city: "", state: "", postalCode: "", country: "" },
    aadharNumber: "",
    designation: "",
    profilePicture: null,
  });
  const [errors, setErrors] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [isAddButtonHovered, setIsAddButtonHovered] = useState(false);
  const [isCreateModalButtonHovered, setIsCreateModalButtonHovered] =
    useState(false);
  const [isUpdateModalButtonHovered, setIsUpdateModalButtonHovered] =
    useState(false);
  const [isBackButtonHovered, setIsBackButtonHovered] = useState(false);
  const [hoveredCardId, setHoveredCardId] = useState(null);

  const limit = 10;

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `/get-staff-all?page=${currentPage}&limit=${limit}&search=${searchTerm}`
      );
      setStaffData(response.data.staff);
      setTotalPages(response.data.pagination.pages);
      setTotalCount(response.data.pagination.total || 0);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      if (error.response?.status === 401) {
        setSuccessMessage("Unauthorized: Please log in again.");
      } else {
        setSuccessMessage("Error fetching staff data.");
      }
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]); // dependencies used inside fetchStaff

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, profilePicture: e.target.files[0] }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.gender) newErrors.gender = "Gender is required";
    if (!formData.age || formData.age < 18)
      newErrors.age = "Age must be at least 18";
    if (!formData.address.street)
      newErrors["address.street"] = "Street is required";
    if (!formData.address.city) newErrors["address.city"] = "City is required";
    if (!formData.address.state)
      newErrors["address.state"] = "State is required";
    if (!formData.address.postalCode)
      newErrors["address.postalCode"] = "Postal code is required";
    if (!formData.address.country)
      newErrors["address.country"] = "Country is required";
    if (!formData.aadharNumber || !/^\d{12}$/.test(formData.aadharNumber))
      newErrors.aadharNumber = "Valid 12-digit Aadhar required";
    if (!formData.designation)
      newErrors.designation = "Designation is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createStaff = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "address")
          formPayload.append(key, JSON.stringify(formData[key]));
        else if (key === "profilePicture" && formData[key])
          formPayload.append(key, formData[key]);
        else if (formData[key] !== null && formData[key] !== "")
          formPayload.append(key, formData[key]);
      });

      await axios.post("/post-create-staff", formPayload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccessMessage("Staff created successfully!");
      setShowCreateModal(false);
      resetForm();
      await fetchStaff();
    } catch (error) {
      console.error("Failed to create staff:", error);
      setSuccessMessage(
        error.response?.data?.message || "Failed to create staff."
      );
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const updateStaff = async () => {
    if (!validateForm() || !selectedStaff) return;
    setLoading(true);
    try {
      const formPayload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === "address")
          formPayload.append(key, JSON.stringify(formData[key]));
        else if (key === "profilePicture" && formData[key])
          formPayload.append(key, formData[key]);
        else if (formData[key] !== null && formData[key] !== "")
          formPayload.append(key, formData[key]);
      });

      await axios.put(
        `/update-staff/${selectedStaff._id}/image`,
        formPayload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setSuccessMessage("Staff updated successfully!");
      setShowEditModal(false);
      resetForm();
      await fetchStaff();
    } catch (error) {
      console.error("Failed to update staff:", error);
      setSuccessMessage(
        error.response?.data?.message || "Failed to update staff."
      );
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  const deleteStaff = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      setLoading(true);
      try {
        await axios.delete(`/delete-staff/${id}`);
        setSuccessMessage("Staff deleted successfully!");
        await fetchStaff();
      } catch (error) {
        console.error("Failed to delete staff:", error);
        setSuccessMessage(
          error.response?.data?.message || "Failed to delete staff."
        );
      } finally {
        setLoading(false);
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      gender: "",
      age: "",
      address: { street: "", city: "", state: "", postalCode: "", country: "" },
      aadharNumber: "",
      designation: "",
      profilePicture: null,
    });
    setErrors({});
  };

  const openEditModal = (staff) => {
    setSelectedStaff(staff);
    setFormData({
      name: staff.name,
      gender: staff.gender,
      age: staff.age,
      address: staff.address
        ? { ...staff.address }
        : { street: "", city: "", state: "", postalCode: "", country: "" },
      aadharNumber: staff.aadharNumber,
      designation: staff.designation,
      profilePicture: null,
    });
    setShowEditModal(true);
  };

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
      zIndex: 50,
      backgroundColor: colors.success,
      color: colors.white,
      padding: "12px 24px",
      borderRadius: "8px",
      boxShadow: shadows.lg,
      animation: "bounce-custom 1s ease-in-out",
    },
    headerContainer: { maxWidth: "1280px", margin: "0 auto 32px auto" },
    headerFlex: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      flexWrap: "wrap",
    },
    headerTitleGroup: { display: "flex", alignItems: "center", gap: "24px" }, // For Back button and Title
    headerTitle: {
      fontSize: "28px",
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    headerSubtitle: { color: colors.textSecondary, marginTop: "8px" },
    headerActions: {
      display: "flex",
      gap: "12px",
      alignItems: "center",
      flexWrap: "wrap",
    },
    buttonPrimary: {
      backgroundColor: colors.primary,
      color: colors.white,
      fontWeight: "500",
      padding: "10px 24px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      boxShadow: shadows.md,
      transition: "background-color 0.2s, transform 0.1s",
      outline: "none",
    },
    buttonPrimaryHover: {
      backgroundColor: colors.primaryDark,
      transform: "translateY(-2px)",
    },
    // Back Button Styles
    backButton: {
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 16px",
      backgroundColor: colors.white,
      color: colors.textSecondary,
      border: `1px solid ${colors.borderDefault}`,
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      boxShadow: shadows.sm,
      transition: "all 0.2s ease-in-out",
      outline: "none",
    },
    backButtonHover: {
      backgroundColor: colors.bgLighter,
      borderColor: colors.textLight,
      color: colors.textPrimary,
      boxShadow: shadows.md,
      transform: "translateY(-1px)",
    },
    backButtonIcon: {
      width: "18px",
      height: "18px",
      marginRight: "8px",
      strokeWidth: "2.5",
    },
    searchInputContainer: { position: "relative" },
    searchInput: {
      padding: "10px 40px 10px 16px",
      borderRadius: "8px",
      border: `1px solid ${colors.borderDefault}`,
      boxShadow: shadows.sm,
      fontSize: "14px",
      width: "250px",
      outline: "none",
      transition: "border-color 0.2s, box-shadow 0.2s",
    },
    searchInputFocus: {
      borderColor: colors.primary,
      boxShadow: `0 0 0 2px ${colors.primary}`,
    },
    searchIcon: {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      color: colors.textLight,
      width: "20px",
      height: "20px",
    },
    mainContentContainer: {
      maxWidth: "1280px",
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
    cardsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: "24px",
      padding: "24px",
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: "12px",
      border: `1px solid ${colors.borderLight}`,
      boxShadow: shadows.sm,
      padding: "20px",
      transition: "all 0.2s ease-in-out",
      cursor: "pointer",
    },
    cardHover: {
      boxShadow: shadows.lg,
      transform: "translateY(-4px)",
      borderColor: colors.primary,
    },
    cardHeader: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "16px",
      paddingBottom: "16px",
      borderBottom: `1px solid ${colors.borderLight}`,
    },
    cardProfilePic: {
      height: "64px",
      width: "64px",
      borderRadius: "50%",
      objectFit: "cover",
      border: `3px solid ${colors.borderLight}`,
      flexShrink: 0,
    },
    cardProfilePicPlaceholder: {
      backgroundColor: colors.bgLighter,
      border: `2px dashed ${colors.borderDefault}`,
      borderRadius: "50%",
      width: "64px",
      height: "64px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    cardProfilePicPlaceholderIcon: {
      width: "32px",
      height: "32px",
      color: colors.textLight,
    },
    cardHeaderInfo: {
      flex: 1,
      minWidth: 0,
    },
    cardName: {
      fontSize: "18px",
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: "4px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    cardDesignation: {
      fontSize: "14px",
      color: colors.textSecondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    cardBody: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    cardInfoRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
    },
    cardInfoLabel: {
      color: colors.textSecondary,
      fontWeight: "500",
      minWidth: "80px",
    },
    cardInfoValue: {
      color: colors.textPrimary,
      flex: 1,
    },
    cardAddress: {
      color: colors.textPrimary,
      fontSize: "14px",
      lineHeight: "1.5",
    },
    cardActions: {
      display: "flex",
      gap: "12px",
      marginTop: "16px",
      paddingTop: "16px",
      borderTop: `1px solid ${colors.borderLight}`,
    },
    cardActionButton: {
      flex: 1,
      padding: "10px 16px",
      borderRadius: "8px",
      border: "none",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s",
      outline: "none",
    },
    cardEditButton: {
      backgroundColor: colors.primary,
      color: colors.white,
    },
    cardEditButtonHover: {
      backgroundColor: colors.primaryDark,
      transform: "translateY(-1px)",
      boxShadow: shadows.md,
    },
    cardDeleteButton: {
      backgroundColor: colors.white,
      color: colors.delete,
      border: `1px solid ${colors.delete}`,
    },
    cardDeleteButtonHover: {
      backgroundColor: colors.delete,
      color: colors.white,
      transform: "translateY(-1px)",
      boxShadow: shadows.md,
    },
    emptyState: {
      padding: "64px 24px",
      textAlign: "center",
      color: colors.textLight,
      fontSize: "16px",
      fontStyle: "italic",
    },
    genderBadge: (gender) => ({
      padding: "4px 10px",
      fontSize: "12px",
      fontWeight: "500",
      borderRadius: "9999px",
      display: "inline-flex",
      backgroundColor:
        gender === "Male"
          ? colors.blueLight
          : gender === "Female"
          ? colors.pinkLight
          : colors.purpleLight,
      color:
        gender === "Male"
          ? colors.blueDark
          : gender === "Female"
          ? colors.pinkDark
          : colors.purpleDark,
    }),
    designationBadge: {
      padding: "4px 12px",
      fontSize: "12px",
      fontWeight: "500",
      borderRadius: "9999px",
      backgroundColor: "#E0E7FF",
      color: "#3730A3",
    },
    paginationContainer: {
      backgroundColor: colors.white,
      padding: "24px",
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
      zIndex: 50,
      padding: "16px",
    },
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: "16px",
      boxShadow: shadows.modal,
      width: "100%",
      maxWidth: "672px",
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
    modalEditProfileContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginBottom: "24px",
    },
    modalEditProfileImage: {
      height: "96px",
      width: "96px",
      borderRadius: "50%",
      objectFit: "cover",
      border: `4px solid ${colors.white}`,
      boxShadow: shadows.lg,
    },
    modalEditProfilePlaceholder: {
      backgroundColor: colors.bgLighter,
      border: `2px dashed ${colors.borderDefault}`,
      borderRadius: "50%",
      width: "96px",
      height: "96px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    modalEditProfileName: {
      marginTop: "12px",
      fontSize: "18px",
      fontWeight: "600",
      color: colors.textPrimary,
    },
    modalEditProfileDesignation: {
      color: colors.textSecondary,
      fontSize: "14px",
    },
    modalActions: {
      marginTop: "24px",
      display: "flex",
      justifyContent: "flex-end",
      gap: "12px",
      paddingTop: "16px",
      borderTop: `1px solid ${colors.borderLight}`,
    },
    buttonSecondary: {
      padding: "10px 16px",
      border: `1px solid ${colors.borderDefault}`,
      borderRadius: "8px",
      color: colors.textSecondary,
      backgroundColor: colors.white,
      cursor: "pointer",
      transition: "background-color 0.2s, border-color 0.2s",
    },
    buttonSecondaryHover: {
      backgroundColor: colors.bgLight,
      borderColor: colors.textLight,
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes bounce-custom {
            0%, 100% {
              transform: translateY(-10%);
              animation-timing-function: cubic-bezier(0.8,0,1,1);
            }
            50% {
              transform: translateY(0);
              animation-timing-function: cubic-bezier(0,0,0.2,1);
            }
          }
        `}
      </style>
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
              {" "}
              {/* Group for Back button and Title */}
              <button
                onClick={() => navigate(-1)}
                style={{
                  ...styles.backButton,
                  ...(isBackButtonHovered && styles.backButtonHover),
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
                <h1 style={styles.headerTitle}>Staff Management</h1>
                <p style={styles.headerSubtitle}>
                  Manage your organization's staff members
                </p>
              </div>
            </div>
            <div style={styles.headerActions}>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  ...styles.buttonPrimary,
                  ...(isAddButtonHovered && styles.buttonPrimaryHover),
                }}
                onMouseEnter={() => setIsAddButtonHovered(true)}
                onMouseLeave={() => setIsAddButtonHovered(false)}
                disabled={loading}
              >
                Add New Staff
              </button>
              <div style={styles.searchInputContainer}>
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                  onFocus={(e) => {
                    e.target.style.borderColor = colors.primary;
                    e.target.style.boxShadow =
                      styles.searchInputFocus.boxShadow;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = colors.borderDefault;
                    e.target.style.boxShadow = "none";
                  }}
                />
                <svg
                  style={styles.searchIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div style={styles.mainContentContainer}>
          {loading && !staffData.length ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
            </div>
          ) : (
            <>
              {staffData.length === 0 && !loading ? (
                <div style={styles.emptyState}>
                  No staff members found.
                </div>
              ) : (
                <div style={styles.cardsGrid}>
                  {staffData.map((staff) => (
                    <div
                      key={staff._id}
                      style={{
                        ...styles.card,
                        ...(hoveredCardId === staff._id && styles.cardHover),
                      }}
                      onMouseEnter={() => setHoveredCardId(staff._id)}
                      onMouseLeave={() => setHoveredCardId(null)}
                    >
                      <div style={styles.cardHeader}>
                        {staff.profilePicture?.url ? (
                          <img
                            src={staff.profilePicture.url}
                            alt={staff.name}
                            style={styles.cardProfilePic}
                          />
                        ) : (
                          <div style={styles.cardProfilePicPlaceholder}>
                            <svg
                              style={styles.cardProfilePicPlaceholderIcon}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              ></path>
                            </svg>
                          </div>
                        )}
                        <div style={styles.cardHeaderInfo}>
                          <div style={styles.cardName}>{staff.name}</div>
                          <div style={styles.cardDesignation}>
                            <span style={styles.designationBadge}>
                              {staff.designation}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={styles.cardBody}>
                        <div style={styles.cardInfoRow}>
                          <span style={styles.cardInfoLabel}>Gender:</span>
                          <span style={styles.cardInfoValue}>
                            <span style={styles.genderBadge(staff.gender)}>
                              {staff.gender}
                            </span>
                          </span>
                        </div>
                        <div style={styles.cardInfoRow}>
                          <span style={styles.cardInfoLabel}>Age:</span>
                          <span style={styles.cardInfoValue}>{staff.age}</span>
                        </div>
                        <div style={styles.cardInfoRow}>
                          <span style={styles.cardInfoLabel}>Aadhar:</span>
                          <span style={styles.cardInfoValue}>
                            {staff.aadharNumber ? `****-****-${String(staff.aadharNumber).slice(-4)}` : 'N/A'}
                          </span>
                        </div>
                        <div style={styles.cardInfoRow}>
                          <span style={styles.cardInfoLabel}>Address:</span>
                        </div>
                        <div style={styles.cardAddress}>
                          {staff.address?.street}, {staff.address?.city},{" "}
                          {staff.address?.state} - {staff.address?.postalCode}
                          , {staff.address?.country}
                        </div>
                      </div>
                      <div style={styles.cardActions}>
                        <button
                          onClick={() => openEditModal(staff)}
                          style={{
                            ...styles.cardActionButton,
                            ...styles.cardEditButton,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              styles.cardEditButtonHover.backgroundColor;
                            e.currentTarget.style.transform =
                              styles.cardEditButtonHover.transform;
                            e.currentTarget.style.boxShadow =
                              styles.cardEditButtonHover.boxShadow;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              styles.cardEditButton.backgroundColor;
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                          disabled={loading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteStaff(staff._id)}
                          style={{
                            ...styles.cardActionButton,
                            ...styles.cardDeleteButton,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              styles.cardDeleteButtonHover.backgroundColor;
                            e.currentTarget.style.color =
                              styles.cardDeleteButtonHover.color;
                            e.currentTarget.style.transform =
                              styles.cardDeleteButtonHover.transform;
                            e.currentTarget.style.boxShadow =
                              styles.cardDeleteButtonHover.boxShadow;
                            e.currentTarget.style.borderColor =
                              styles.cardDeleteButtonHover.backgroundColor;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              styles.cardDeleteButton.backgroundColor;
                            e.currentTarget.style.color =
                              styles.cardDeleteButton.color;
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.borderColor = colors.delete;
                          }}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 0 && (
                <div style={styles.paginationContainer}>
                  <p style={styles.paginationInfo}>
                    Showing{" "}
                    <span style={{ fontWeight: "600" }}>
                      {Math.min(
                        (currentPage - 1) * limit + 1,
                        staffData.length
                          ? (currentPage - 1) * limit + staffData.length
                          : 0
                      )}
                    </span>{" "}
                    to{" "}
                    <span style={{ fontWeight: "600" }}>
                      {staffData.length
                        ? (currentPage - 1) * limit + staffData.length
                        : 0}
                    </span>{" "}
                    of{" "}
                    <span style={{ fontWeight: "600" }}>
                      {totalCount}
                    </span>{" "}
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
                        <span style={{ display: "none" }}>Previous</span>
                        <svg
                          style={styles.paginationIcon}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
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
                        <span style={{ display: "none" }}>Next</span>
                        <svg
                          style={styles.paginationIcon}
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
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

        {showCreateModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalInnerPadding}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Add New Staff Member</h3>
                  <button
                    onClick={() => {
                      if (!loading) {
                        setShowCreateModal(false);
                        resetForm();
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
                      xmlns="http://www.w3.org/2000/svg"
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
                <StaffFormFields
                  formData={formData}
                  handleChange={handleChange}
                  handleFileChange={handleFileChange}
                  errors={errors}
                />
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!loading) {
                        setShowCreateModal(false);
                        resetForm();
                      }
                    }}
                    style={styles.buttonSecondary}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        styles.buttonSecondaryHover.backgroundColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = colors.white)
                    }
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={createStaff}
                    style={{
                      ...styles.buttonPrimary,
                      ...(isCreateModalButtonHovered &&
                        styles.buttonPrimaryHover),
                      ...(loading && {
                        backgroundColor: colors.primaryDark,
                        cursor: "not-allowed",
                      }),
                    }}
                    onMouseEnter={() => setIsCreateModalButtonHovered(true)}
                    onMouseLeave={() => setIsCreateModalButtonHovered(false)}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Staff"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && selectedStaff && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalInnerPadding}>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Edit Staff Member</h3>
                  <button
                    onClick={() => {
                      if (!loading) {
                        setShowEditModal(false);
                        resetForm();
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
                      xmlns="http://www.w3.org/2000/svg"
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
                <div style={styles.modalEditProfileContainer}>
                  {selectedStaff.profilePicture?.url ? (
                    <img
                      src={selectedStaff.profilePicture.url}
                      alt={selectedStaff.name}
                      style={styles.modalEditProfileImage}
                    />
                  ) : (
                    <div style={styles.modalEditProfilePlaceholder}>
                      <svg
                        style={{
                          ...styles.profilePicPlaceholderIcon,
                          width: "48px",
                          height: "48px",
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        ></path>
                      </svg>
                    </div>
                  )}
                  <h4 style={styles.modalEditProfileName}>
                    {selectedStaff.name}
                  </h4>
                  <p style={styles.modalEditProfileDesignation}>
                    {selectedStaff.designation}
                  </p>
                </div>
                <StaffFormFields
                  formData={formData}
                  handleChange={handleChange}
                  handleFileChange={handleFileChange}
                  errors={errors}
                />
                <div style={styles.modalActions}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!loading) {
                        setShowEditModal(false);
                        resetForm();
                      }
                    }}
                    style={styles.buttonSecondary}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        styles.buttonSecondaryHover.backgroundColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = colors.white)
                    }
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={updateStaff}
                    style={{
                      ...styles.buttonPrimary,
                      ...(isUpdateModalButtonHovered &&
                        styles.buttonPrimaryHover),
                      ...(loading && {
                        backgroundColor: colors.primaryDark,
                        cursor: "not-allowed",
                      }),
                    }}
                    onMouseEnter={() => setIsUpdateModalButtonHovered(true)}
                    onMouseLeave={() => setIsUpdateModalButtonHovered(false)}
                    disabled={loading}
                  >
                    {loading ? "Updating..." : "Update Staff"}
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

export default StaffManagement;
