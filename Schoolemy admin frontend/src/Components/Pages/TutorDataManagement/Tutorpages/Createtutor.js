import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "../../../../Utils/api";
import {
  FaEye,
  FaEyeSlash,
  FaUserShield,
  FaSpinner,
  FaIdCard,
  FaCamera,
  FaGraduationCap,
  FaMapMarkerAlt,
  FaArrowLeft,
} from "react-icons/fa";

const TutorRegistration = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobilenumber: "",
    qualification: "",
    subject: "",
    experience: "",
    gender: "",
    age: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    govtIdProofs: [
      {
        idType: "",
        idNumber: "",
        documentImage: "",
      },
    ],
    profilePictureUpload: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [idProofCount, setIdProofCount] = useState(1);

  const { tutorId } = useParams();
  const location = useLocation();
  const isEdit = Boolean(tutorId || (location.state && location.state.tutor));

  // when editing, load tutor data either from state or from API
  useEffect(() => {
    const loadTutor = async () => {
      try {
        if (location.state && location.state.tutor) {
          const tutorFromState = { ...location.state.tutor };
          delete tutorFromState.password;
          setFormData((prev) => ({
            ...prev,
            ...tutorFromState,
          }));
        } else if (tutorId) {
          const response = await axios.get(`/tutor/${tutorId}`);
          if (response.data?.success && response.data.data) {
            const data = { ...response.data.data };
            delete data.password; // never prefill hashed password
            setFormData((prev) => ({
              ...prev,
              ...data,
            }));
          }
        }
      } catch (err) {
        console.error("Failed to load tutor for editing", err);
        setError("Could not load tutor details");
      }
    };
    if (isEdit) loadTutor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorId, location.state]);

  const idTypes = ["Aadhar", "PAN", "Passport", "VoterID", "DrivingLicense"];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else if (name.includes("govtIdProofs.")) {
      const parts = name.split(".");
      const index = parseInt(parts[1]);
      const field = parts[2];

      setFormData((prev) => ({
        ...prev,
        govtIdProofs: prev.govtIdProofs.map((proof, i) =>
          i === index ? { ...proof, [field]: value } : proof,
        ),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e, fieldName, index = null) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;

      if (fieldName === "profilePictureUpload") {
        setFormData((prev) => ({ ...prev, [fieldName]: base64 }));
      } else if (fieldName === "documentImage" && index !== null) {
        setFormData((prev) => ({
          ...prev,
          govtIdProofs: prev.govtIdProofs.map((proof, i) =>
            i === index ? { ...proof, documentImage: base64 } : proof,
          ),
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const addIdProof = () => {
    if (idProofCount < 3) {
      setFormData((prev) => ({
        ...prev,
        govtIdProofs: [
          ...prev.govtIdProofs,
          { idType: "", idNumber: "", documentImage: "" },
        ],
      }));
      setIdProofCount((prev) => prev + 1);
    }
  };

  const removeIdProof = (index) => {
    if (idProofCount > 1) {
      setFormData((prev) => ({
        ...prev,
        govtIdProofs: prev.govtIdProofs.filter((_, i) => i !== index),
      }));
      setIdProofCount((prev) => prev - 1);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Email is invalid");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    } else if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (!formData.mobilenumber.trim()) {
      setError("Mobile number is required");
      return false;
    } else if (!/^[0-9]{10}$/.test(formData.mobilenumber)) {
      setError("Please enter a valid 10-digit mobile number");
      return false;
    }
    if (!formData.qualification.trim()) {
      setError("Qualification is required");
      return false;
    }
    if (!formData.subject.trim()) {
      setError("Subject is required");
      return false;
    }
    if (!formData.experience.trim()) {
      setError("Experience is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const submissionData = {
        ...formData,
        govtIdProofs: formData.govtIdProofs.filter(
          (proof) => proof.idType && proof.idNumber,
        ),
      };

      let response;
      if (isEdit && tutorId) {
        response = await axios.patch(`/tutor/${tutorId}`, submissionData);
      } else {
        response = await axios.post("/create-tutor", submissionData);
      }

      if (response.data?.success) {
        setMessage(
          isEdit
            ? "Tutor account updated successfully!"
            : "Tutor account created successfully!",
        );

        if (!isEdit) {
          // Reset form only for creates
          setFormData({
            name: "",
            email: "",
            password: "",
            mobilenumber: "",
            qualification: "",
            subject: "",
            experience: "",
            gender: "",
            age: "",
            address: { street: "", city: "", state: "", zipCode: "" },
            govtIdProofs: [{ idType: "", idNumber: "", documentImage: "" }],
            profilePictureUpload: "",
          });
          setIdProofCount(1);
        }
        // navigate back after a short delay to let user read message
        setTimeout(() => navigate("/schoolemy/tutor-data-management"), 1500);
      } else {
        setError(
          response.data?.message ||
            (isEdit
              ? "Failed to update tutor account"
              : "Failed to create tutor account"),
        );
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "An error occurred while processing the request",
      );
    } finally {
      setLoading(false);
    }
  };

  // Vibrant color theme styles (same as previous components)
  const styles = {
    pageContainer: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f8ff 0%, #fff5f5 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      padding: "2rem",
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
      position: "relative",
    },
    contentWrapper: {
      width: "100%",
      maxWidth: "1200px",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "20px",
      boxShadow: "0 15px 40px rgba(0, 0, 0, 0.08)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      border: "2px solid #e0e7ff",
    },
    cardHeader: {
      background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
      color: "white",
      padding: "1.75rem 2rem",
      display: "flex",
      alignItems: "center",
      gap: "1.25rem",
      borderBottom: "3px solid #fcd34d",
    },
    cardTitle: {
      fontSize: "1.75rem",
      fontWeight: "700",
      margin: 0,
      letterSpacing: "-0.5px",
      textShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    cardSubtitle: {
      fontSize: "1rem",
      opacity: 0.9,
      margin: "0.5rem 0 0 0",
      fontWeight: "400",
    },
    cardBody: {
      padding: "2.5rem",
      background: "linear-gradient(to bottom right, #f9fafb, #fdf2f8)",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "1.75rem",
    },
    fullWidth: {
      gridColumn: "1 / -1",
    },
    formGroup: {
      marginBottom: "1.5rem",
      position: "relative",
    },
    label: {
      display: "block",
      fontSize: "0.9375rem",
      fontWeight: "600",
      color: "#1e293b",
      marginBottom: "0.75rem",
      paddingLeft: "0.5rem",
      borderLeft: "3px solid #f59e0b",
    },
    input: {
      width: "100%",
      padding: "0.875rem 1.25rem",
      borderRadius: "12px",
      border: "2px solid #e0e7ff",
      fontSize: "0.9375rem",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      backgroundColor: "#f8fafc",
      color: "#334155",
    },
    textarea: {
      width: "100%",
      padding: "0.875rem 1.25rem",
      borderRadius: "12px",
      border: "2px solid #e0e7ff",
      fontSize: "0.9375rem",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      backgroundColor: "#f8fafc",
      color: "#334155",
      minHeight: "100px",
      resize: "vertical",
      fontFamily: "inherit",
    },
    inputFocus: {
      outline: "none",
      borderColor: "#818cf8",
      boxShadow: "0 0 0 4px rgba(129, 140, 248, 0.15)",
      backgroundColor: "white",
    },
    select: {
      width: "100%",
      padding: "0.875rem 1.25rem",
      borderRadius: "12px",
      border: "2px solid #e0e7ff",
      fontSize: "0.9375rem",
      backgroundColor: "#f8fafc",
      cursor: "pointer",
      appearance: "none",
      backgroundImage:
        "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 1rem center",
      backgroundSize: "1.25em",
    },
    passwordContainer: {
      position: "relative",
    },
    passwordToggle: {
      position: "absolute",
      right: "1rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: "#94a3b8",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    passwordToggleHover: {
      color: "#ec4899",
    },
    submitButton: {
      width: "100%",
      padding: "1rem 1.5rem",
      borderRadius: "12px",
      border: "none",
      background: "linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)",
      color: "white",
      fontSize: "1.0625rem",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
      marginTop: "1rem",
      boxShadow:
        "0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(236, 72, 153, 0.2)",
    },
    submitButtonHover: {
      transform: "translateY(-2px)",
      boxShadow:
        "0 10px 15px -3px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(236, 72, 153, 0.3)",
    },
    submitButtonActive: {
      transform: "translateY(0)",
      boxShadow: "0 2px 4px 0px rgba(59, 130, 246, 0.3)",
    },
    submitButtonDisabled: {
      opacity: "0.8",
      cursor: "not-allowed",
      transform: "none",
      boxShadow: "none",
      background: "linear-gradient(135deg, #93c5fd 0%, #f9a8d4 100%)",
    },
    spinner: {
      animation: "spin 1s linear infinite",
    },
    "@keyframes spin": {
      "0%": { transform: "rotate(0deg)" },
      "100%": { transform: "rotate(360deg)" },
    },
    message: {
      padding: "1rem 1.25rem",
      borderRadius: "12px",
      fontSize: "0.9375rem",
      marginTop: "1.5rem",
      fontWeight: "500",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    successMessage: {
      backgroundColor: "rgba(187, 247, 208, 0.3)",
      color: "#065f46",
      border: "2px solid #6ee7b7",
    },
    errorMessage: {
      backgroundColor: "rgba(254, 202, 202, 0.3)",
      color: "#991b1b",
      border: "2px solid #fca5a5",
    },
    section: {
      gridColumn: "1 / -1",
      borderTop: "2px dashed #e0e7ff",
      paddingTop: "1.75rem",
      marginTop: "1rem",
    },
    sectionTitle: {
      fontSize: "1.25rem",
      fontWeight: "700",
      color: "#3b82f6",
      marginBottom: "1.25rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    iconWrapper: {
      background: "#fef3c7",
      borderRadius: "50%",
      padding: "0.5rem",
      display: "inline-flex",
      color: "#d97706",
    },
    govtIdSection: {
      gridColumn: "1 / -1",
      border: "2px solid #e0e7ff",
      borderRadius: "16px",
      padding: "1.75rem",
      backgroundColor: "rgba(248, 250, 252, 0.7)",
      marginTop: "1rem",
    },
    idProofItem: {
      border: "2px dashed #cbd5e1",
      borderRadius: "12px",
      padding: "1.25rem",
      marginBottom: "1.25rem",
      backgroundColor: "white",
      position: "relative",
    },
    removeButton: {
      position: "absolute",
      top: "0.75rem",
      right: "0.75rem",
      background: "#ef4444",
      color: "white",
      border: "none",
      borderRadius: "8px",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "bold",
    },
    addButton: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "0.75rem 1.5rem",
      fontSize: "0.9375rem",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      transition: "all 0.2s ease",
    },
    profilePicturePreview: {
      width: "120px",
      height: "120px",
      borderRadius: "50%",
      objectFit: "cover",
      border: "3px solid #3b82f6",
      marginTop: "1rem",
      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
    },
    fileInput: {
      width: "100%",
      padding: "0.875rem 1.25rem",
      borderRadius: "12px",
      border: "2px solid #e0e7ff",
      fontSize: "0.9375rem",
      backgroundColor: "#f8fafc",
      color: "#334155",
      cursor: "pointer",
    },
    addressSection: {
      gridColumn: "1 / -1",
      border: "2px solid #e0e7ff",
      borderRadius: "16px",
      padding: "1.75rem",
      backgroundColor: "rgba(248, 250, 252, 0.7)",
      marginBottom: "1.5rem",
    },
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1.5rem",
    },
  };

  return (
    <div style={styles.pageContainer}>
      {/* Back Button */}
      <button
        onClick={() => navigate("/schoolemy/tutor-data-management")}
        style={{
          alignSelf: "flex-start",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          transition: "all 0.3s ease",
          zIndex: 10,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#0056b3";
          e.currentTarget.style.transform = "translateX(-4px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#007bff";
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        <FaArrowLeft /> Back to Tutor Dashboard
      </button>

      <div style={styles.contentWrapper}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.iconWrapper}>
              <FaGraduationCap size={24} />
            </div>
            <div>
              <h2 style={styles.cardTitle}>
                {isEdit ? "Edit Tutor" : "Create a Tutor"}
              </h2>
              <p style={styles.cardSubtitle}>
                {isEdit
                  ? "Modify the tutor information below"
                  : "Join our platform and share your knowledge with students worldwide"}
              </p>
            </div>
          </div>

          <div style={styles.cardBody}>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                {/* Personal Information */}
                <div
                  style={{
                    ...styles.section,
                    borderTop: "none",
                    paddingTop: 0,
                  }}
                >
                  <h3 style={styles.sectionTitle}>
                    <span style={styles.iconWrapper}>
                      <FaUserShield size={16} />
                    </span>
                    Personal Information
                  </h3>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Full Name *</label>
                      <input
                        name="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ ...styles.input, ":focus": styles.inputFocus }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Email Address *</label>
                      <input
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ ...styles.input, ":focus": styles.inputFocus }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Mobile Number *</label>
                      <input
                        name="mobilenumber"
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={formData.mobilenumber}
                        onChange={handleChange}
                        required
                        style={{ ...styles.input, ":focus": styles.inputFocus }}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Age</label>
                      <input
                        name="age"
                        type="number"
                        placeholder="25"
                        value={formData.age}
                        onChange={handleChange}
                        required
                        style={{ ...styles.input, ":focus": styles.inputFocus }}
                      />
                    </div>

                    {/* Gender and Role */}
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        style={{
                          ...styles.select,
                          ":focus": styles.inputFocus,
                        }}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Password *</label>
                      <div style={styles.passwordContainer}>
                        <input
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 8 characters"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          style={{
                            ...styles.input,
                            ":focus": styles.inputFocus,
                          }}
                        />
                        <span
                          style={styles.passwordToggle}
                          onClick={() => setShowPassword(!showPassword)}
                          onMouseEnter={(e) =>
                            (e.target.style.color =
                              styles.passwordToggleHover.color)
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.color = styles.passwordToggle.color)
                          }
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Picture */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>
                    <span style={styles.iconWrapper}>
                      <FaCamera size={16} />
                    </span>
                    Profile Picture
                  </h3>
                  <div style={styles.formGroup}>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={(e) =>
                        handleFileChange(e, "profilePictureUpload")
                      }
                      style={styles.fileInput}
                    />
                    {formData.profilePictureUpload && (
                      <img
                        src={formData.profilePictureUpload}
                        alt="Profile preview"
                        style={styles.profilePicturePreview}
                      />
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>
                    <span style={styles.iconWrapper}>
                      <FaGraduationCap size={16} />
                    </span>
                    Professional Information
                  </h3>
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Qualifications *</label>
                      <input
                        name="qualification"
                        type="text"
                        placeholder="e.g., M.Sc. in Mathematics"
                        value={formData.qualification}
                        onChange={handleChange}
                        required
                        style={{ ...styles.input, ":focus": styles.inputFocus }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Subject *</label>
                      <input
                        name="subject"
                        type="text"
                        placeholder="e.g., Mathematics, Physics, etc."
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        style={{ ...styles.input, ":focus": styles.inputFocus }}
                      />
                    </div>

                    <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                      <label style={styles.label}>Teaching Experience *</label>
                      <textarea
                        name="experience"
                        placeholder="e.g., 5 years of teaching experience"
                        value={formData.experience}
                        onChange={handleChange}
                        required
                        style={{
                          ...styles.textarea,
                          ":focus": styles.inputFocus,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div style={styles.addressSection}>
                  <h3 style={styles.sectionTitle}>
                    <span style={styles.iconWrapper}>
                      <FaMapMarkerAlt size={16} />
                    </span>
                    Address Information
                  </h3>
                  <div style={styles.formGrid}>
                    <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                      <label style={styles.label}>Street Address</label>
                      <textarea
                        name="address.street"
                        placeholder="Enter street address"
                        value={formData.address.street}
                        onChange={handleChange}
                        style={{
                          ...styles.textarea,
                          ":focus": styles.inputFocus,
                        }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>City</label>
                      <input
                        name="address.city"
                        type="text"
                        placeholder="Enter city"
                        value={formData.address.city}
                        onChange={handleChange}
                        style={{ ...styles.input, ":focus": styles.inputFocus }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>State</label>
                      <input
                        name="address.state"
                        type="text"
                        placeholder="Enter state"
                        value={formData.address.state}
                        onChange={handleChange}
                        style={{ ...styles.input, ":focus": styles.inputFocus }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>ZIP Code</label>
                      <input
                        name="address.zipCode"
                        type="text"
                        placeholder="Enter ZIP code"
                        value={formData.address.zipCode}
                        onChange={handleChange}
                        style={{ ...styles.input, ":focus": styles.inputFocus }}
                      />
                    </div>
                  </div>
                </div>

                {/* Government ID Proofs */}
                <div style={styles.govtIdSection}>
                  <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>
                      <span style={styles.iconWrapper}>
                        <FaIdCard size={16} />
                      </span>
                      Government ID Proofs
                    </h3>
                    {idProofCount < 3 && (
                      <button
                        type="button"
                        onClick={addIdProof}
                        style={styles.addButton}
                      >
                        <FaIdCard /> Add Another ID
                      </button>
                    )}
                  </div>

                  {formData.govtIdProofs.map((proof, index) => (
                    <div key={index} style={styles.idProofItem}>
                      {idProofCount > 1 && (
                        <button
                          type="button"
                          style={styles.removeButton}
                          onClick={() => removeIdProof(index)}
                        >
                          ×
                        </button>
                      )}

                      <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>
                            ID Type {index === 0 && "*"}
                          </label>
                          <select
                            name={`govtIdProofs.${index}.idType`}
                            value={proof.idType}
                            onChange={handleChange}
                            required={index === 0}
                            style={{
                              ...styles.select,
                              ":focus": styles.inputFocus,
                            }}
                          >
                            <option value="">Select ID Type</option>
                            {idTypes.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>
                            ID Number {index === 0 && "*"}
                          </label>
                          <input
                            name={`govtIdProofs.${index}.idNumber`}
                            type="text"
                            placeholder="Enter ID number"
                            value={proof.idNumber}
                            onChange={handleChange}
                            required={index === 0}
                            style={{
                              ...styles.input,
                              ":focus": styles.inputFocus,
                            }}
                          />
                        </div>

                        <div
                          style={{ ...styles.formGroup, ...styles.fullWidth }}
                        >
                          <label style={styles.label}>Document Image</label>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif"
                            onChange={(e) =>
                              handleFileChange(e, "documentImage", index)
                            }
                            style={styles.fileInput}
                          />
                          {proof.documentImage && (
                            <img
                              src={proof.documentImage}
                              alt={`ID proof ${index + 1} preview`}
                              style={styles.profilePicturePreview}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  ...styles.submitButton,
                  ...(loading ? styles.submitButtonDisabled : {}),
                  ":hover": !loading ? styles.submitButtonHover : {},
                  ":active": !loading ? styles.submitButtonActive : {},
                }}
                disabled={loading}
                onMouseEnter={(e) =>
                  !loading &&
                  (e.target.style.transform =
                    styles.submitButtonHover.transform)
                }
                onMouseLeave={(e) =>
                  !loading && (e.target.style.transform = "none")
                }
                onMouseDown={(e) =>
                  !loading &&
                  (e.target.style.transform =
                    styles.submitButtonActive.transform)
                }
                onMouseUp={(e) =>
                  !loading &&
                  (e.target.style.transform =
                    styles.submitButtonHover.transform)
                }
              >
                {loading ? (
                  <>
                    <FaSpinner style={styles.spinner} /> Creating Tutor
                    Account...
                  </>
                ) : (
                  "Create Tutor Account"
                )}
              </button>

              {/* Feedback Messages */}
              {message && (
                <div style={{ ...styles.message, ...styles.successMessage }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
                      fill="#10B981"
                    />
                  </svg>
                  {message}
                </div>
              )}
              {error && (
                <div style={{ ...styles.message, ...styles.errorMessage }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
                      fill="#EF4444"
                    />
                  </svg>
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorRegistration;
