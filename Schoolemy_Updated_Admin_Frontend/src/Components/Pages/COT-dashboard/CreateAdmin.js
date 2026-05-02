import React, { useState } from "react";
import axios from "../../../Utils/api";
import { secureStorage, hasStoredSession } from "../../../Utils/security";
import { notify, handleErrorNotification } from "../../../Utils/notificationHelper";
import { getToken } from "../../../Hooks/useToken";
import { FaEye, FaEyeSlash, FaUserShield, FaSpinner, FaIdCard, FaCamera, FaCopy } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { uploadToS3 } from "../../../Utils/s3Upload";

const CreateAdminForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobilenumber: "",
    password: "",
    confirmPassword: "",
    gender: "",
    age: "",
    permanentAddress: "",
    tempAddress: "",
    role: "admin",
    bosDetails: {
      designation: "",
      joining_date: "",
      term_end: "",
    },
    designationInBoard: "",
    designation: "",
    tenureStart: "",
    tenureEnd: "",
    govtIdProofs: [{ idType: "", idNumber: "", documentFileName: "", documentPreview: "" }],
    profilePicturePreview: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileFile, setProfileFile] = useState(null);
  const [govtDocFiles, setGovtDocFiles] = useState({});
  const navigate = useNavigate();

  const allRoles = [
      "superadmin",
      "admin",
      "committeeoftrustees",
      "boscontroller",
      "bosmembers",
      "coursemanagement",
      "tutormanagement",
      "usermanagement",
      "documentverification",
      "marketing",
      "auditor",
      "financial",
  ];

  // Get current user's role from secureStorage (not localStorage!)
  const currentUserRole = (secureStorage.getItem("role") || "").toLowerCase().trim();
  const isSuperAdmin = currentUserRole === "superadmin";

  // Filter roles: only show superadmin option if current user is superadmin
  const roles = isSuperAdmin
    ? allRoles 
    : allRoles.filter(role => role.toLowerCase() !== "superadmin");
  
  // Prevent form submission if trying to create superadmin without permission
  React.useEffect(() => {
    if (!isSuperAdmin && formData.role.toLowerCase() === "superadmin") {
      setError("You do not have permission to create superadmin accounts");
      setFormData(prev => ({ ...prev, role: "admin" }));
    }
  }, [formData.role, isSuperAdmin]);

  const idTypes = ["Aadhar", "PAN", "Passport", "VoterID", "DrivingLicense"];

  const cotOfficialDesignations = [
    "Chairman",
    "Vice-Chairman",
    "Member",
    "Secretary",
    "Treasurer",
    "Chief Executive Officer",
    "Principal",
    "Dean",
  ];

  // 🔹 Handle basic input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("bosDetails.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        bosDetails: { ...prev.bosDetails, [key]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // 🔹 Copy Permanent Address to Temporary Address
  const copyPermanentToTemporary = () => {
    if (formData.permanentAddress.trim()) {
      setFormData((prev) => ({
        ...prev,
        tempAddress: prev.permanentAddress,
      }));
    }
  };

  // 🔹 Handle Profile Picture — store File for direct S3 upload at submit time
  const handleProfilePicture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setProfileFile(file);
    setFormData((prev) => ({
      ...prev,
      profilePicturePreview: URL.createObjectURL(file),
    }));
  };

  // 🔹 Handle Govt ID Proof upload — store File for direct S3 upload at submit time
  const handleGovtIdProofUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    setGovtDocFiles((prev) => ({ ...prev, [index]: file }));
    setFormData((prev) => {
      const updatedProofs = [...prev.govtIdProofs];
      updatedProofs[index].documentFileName = file.name;
      updatedProofs[index].documentPreview = URL.createObjectURL(file);
      return { ...prev, govtIdProofs: updatedProofs };
    });
  };

  // 🔹 Add new Govt ID Proof field
  const addGovtIdProof = () => {
    setFormData((prev) => ({
      ...prev,
      govtIdProofs: [
        ...prev.govtIdProofs,
        { idType: "", idNumber: "", documentFileName: "", documentPreview: "" },
      ],
    }));
  };

  // 🔹 Remove Govt ID Proof field
  const removeGovtIdProof = (index) => {
    if (formData.govtIdProofs.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      govtIdProofs: prev.govtIdProofs.filter((_, i) => i !== index),
    }));
  };

  // 🔹 Handle Govt ID proof value change
  const handleGovtProofChange = (e, index) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updatedProofs = [...prev.govtIdProofs];
      updatedProofs[index][name] = value;
      return { ...prev, govtIdProofs: updatedProofs };
    });
  };

  // 🔹 Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }

    if (formData.role === "committeeoftrustees") {
      if (
        !formData.designationInBoard?.trim() ||
        !formData.tenureStart ||
        !formData.tenureEnd
      ) {
        return setError(
          "Committee of Trustees: board designation, tenure start, and tenure end are required"
        );
      }
      if (new Date(formData.tenureEnd) < new Date(formData.tenureStart)) {
        return setError("Tenure end must be on or after tenure start");
      }
    }

    // Prevent non-superadmin from creating superadmin accounts
    if (formData.role === "superadmin" && currentUserRole !== "superadmin") {
      return setError("You do not have permission to create SuperAdmin accounts!");
    }

    if (!hasStoredSession()) {
      return setError("Your session has expired. Please log in again.");
    }

    // Check for duplicate role (Committee of Trustees can only have one representative)
    if (formData.role === "committeeoftrustees") {
      try {
        const token = getToken();
        const response = await axios.get("/get-admins", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const existingAdmins = Array.isArray(response.data) ? response.data :
                              Array.isArray(response.data?.admins) ? response.data.admins :
                              Array.isArray(response.data?.data) ? response.data.data : [];

        const cotAdminExists = existingAdmins.some(
          admin => (admin.role || "").toLowerCase() === "committeeoftrustees"
        );

        if (cotAdminExists) {
          return setError("A Committee of Trustees representative already exists in the system. Please update the existing one instead.");
        }
      } catch (err) {
        console.error("Error checking for duplicate role:", err);
        // Continue anyway - the backend will catch this if it happens
      }
    }

    setLoading(true);

    try {
      // Step 1: Upload profile picture directly to S3 (if provided)
      let profilePictureUrl = null;
      if (profileFile) {
        try {
          const result = await uploadToS3(profileFile, "profile-pictures");
          profilePictureUrl = result.s3Url;
        } catch (uploadErr) {
          setError("Failed to upload profile picture: " + uploadErr.message);
          setLoading(false);
          return;
        }
      }

      // Step 2: Upload govt ID docs directly to S3 (if any files chosen)
      const govtIdProofsWithUrls = await Promise.all(
        formData.govtIdProofs.map(async (proof, index) => {
          const file = govtDocFiles[index];
          if (!file) {
            return { idType: proof.idType, idNumber: proof.idNumber, documentImage: proof.documentImage || "" };
          }
          try {
            const result = await uploadToS3(file, "govt-documents");
            return { idType: proof.idType, idNumber: proof.idNumber, documentImage: result.s3Url };
          } catch (uploadErr) {
            throw new Error(`Failed to upload ${proof.idType || "ID"} document: ${uploadErr.message}`);
          }
        })
      );

    
      const payload = {
        ...formData,
        govtIdProofs: govtIdProofsWithUrls,
      };
      if (profilePictureUrl) {
        payload.profilePictureUrl = profilePictureUrl;
      }
      
      delete payload.profilePictureBase64;
      delete payload.profilePicturePreview;

      // Remove BOS details if not needed
      if (!["bosmembers", "boscontroller"].includes(formData.role)) {
        delete payload.bosDetails;
      }

      if (formData.role !== "committeeoftrustees") {
        delete payload.designationInBoard;
        delete payload.designation;
        delete payload.tenureStart;
        delete payload.tenureEnd;
      } else if (!payload.designation?.trim()) {
        delete payload.designation;
      }

      // Step 4: Submit form to backend
      const response = await axios.post("/createadmin", payload);

      notify.success(response.data.message || "Admin created successfully!");
      setMessage("");
      setError("");

      // Reset form and file state
      setProfileFile(null);
      setGovtDocFiles({});
      setFormData({
        name: "",
        email: "",
        mobilenumber: "",
        password: "",
        confirmPassword: "",
        gender: "",
        age: "",
        permanentAddress: "",
        tempAddress: "",
        role: "admin",
        bosDetails: { designation: "", joining_date: "", term_end: "" },
        designationInBoard: "",
        designation: "",
        tenureStart: "",
        tenureEnd: "",
        govtIdProofs: [{ idType: "", idNumber: "", documentFileName: "", documentPreview: "" }],
        profilePicturePreview: "",
      });

      setTimeout(() => {
        navigate("/schoolemy/admin-details");
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "An error occurred while creating admin";
      setError(errorMsg);
      handleErrorNotification(err, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Vibrant color theme styles
  const styles = {
    pageContainer: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f0f8ff 0%, #fff5f5 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
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
      backgroundImage: "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
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
    copyAddressButton: {
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "white",
      border: "none",
      borderRadius: "10px",
      padding: "0.75rem 1.25rem",
      fontSize: "0.875rem",
      fontWeight: "600",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      transition: "all 0.2s ease",
      marginTop: "0.5rem",
      width: "fit-content",
    },
    copyAddressButtonHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 8px rgba(16, 185, 129, 0.3)",
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
      boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.3), 0 2px 4px -1px rgba(236, 72, 153, 0.2)",
    },
    submitButtonHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.4), 0 4px 6px -2px rgba(236, 72, 153, 0.3)",
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
    bosDetailsSection: {
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
    backButton: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.5rem",
      padding: "0.75rem 1.5rem",
      marginBottom: "1.5rem",
      backgroundColor: "white",
      color: "#374151",
      border: "2px solid #e0e7ff",
      borderRadius: "12px",
      fontSize: "0.9375rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    },
    backIcon: {
      fontSize: "1.25rem",
    },
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.contentWrapper}>
        <button 
          onClick={() => navigate(-1)} 
          style={styles.backButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-4px)';
            e.currentTarget.style.backgroundColor = '#f0f9ff';
            e.currentTarget.style.borderColor = '#69c0ff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(0)';
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#e0e7ff';
          }}
        >
          <svg style={styles.backIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={styles.iconWrapper}>
              <FaUserShield size={24} />
            </div>
            <h2 style={styles.cardTitle}>Create New Administrator</h2>
          </div>
          
          <div style={styles.cardBody}>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGrid}>
                {/* Basic Information */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Full Name</label>
                  <input
                    name="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Email Address</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Mobile Number</label>
                  <input
                    name="mobilenumber"
                    placeholder="+91 0000000000"
                    value={formData.mobilenumber}
                    onChange={handleChange}
                    required
                    style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
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
                    style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
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
                    style={styles.select} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    style={styles.select} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                  >
                    {roles.map((role) => (
                      <option value={role} key={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Address Section */}
                <div style={styles.addressSection}>
                  <h3 style={styles.sectionTitle}>
                    <span style={styles.iconWrapper}>
                      <FaCopy size={16} />
                    </span>
                    Address Information
                  </h3>
                  
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Permanent Address</label>
                      <textarea
                        name="permanentAddress"
                        placeholder="Enter permanent address"
                        value={formData.permanentAddress}
                        onChange={handleChange}
                        required
                        style={styles.textarea} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Temporary Address</label>
                      <textarea
                        name="tempAddress"
                        placeholder="Enter temporary address (if different)"
                        value={formData.tempAddress}
                        onChange={handleChange}
                        style={styles.textarea} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                      />
                      
                      {/* Copy Address Button */}
                      {formData.permanentAddress && (
                        <button
                          type="button"
                          onClick={copyPermanentToTemporary}
                          style={styles.copyAddressButton}
                          onMouseEnter={(e) => e.target.style.transform = styles.copyAddressButtonHover.transform}
                          onMouseLeave={(e) => e.target.style.transform = 'none'}
                        >
                          <FaCopy /> Use Permanent Address
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOS Details Section */}
                {formData.role === "committeeoftrustees" && (
                  <div style={{ ...styles.bosDetailsSection }}>
                    <h3 style={styles.sectionTitle}>
                      <span style={styles.iconWrapper}>
                        <FaUserShield size={16} />
                      </span>
                      Committee of Trustees
                    </h3>
                    <div style={styles.formGrid}>
                      <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                        <label style={styles.label}>
                          Board designation (required)
                        </label>
                        <input
                          name="designationInBoard"
                          placeholder="e.g. Trustee — Academic Affairs"
                          value={formData.designationInBoard}
                          onChange={handleChange}
                          required
                          style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>
                          Official title (optional)
                        </label>
                        <select
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          style={styles.select} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                        >
                          <option value="">— Select —</option>
                          {cotOfficialDesignations.map((d) => (
                            <option value={d} key={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Tenure start</label>
                        <input
                          type="date"
                          name="tenureStart"
                          value={formData.tenureStart}
                          onChange={handleChange}
                          required
                          style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Tenure end</label>
                        <input
                          type="date"
                          name="tenureEnd"
                          value={formData.tenureEnd}
                          onChange={handleChange}
                          required
                          style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {["bosmembers", "boscontroller"].includes(formData.role) && (
                  <div style={{...styles.bosDetailsSection}}>
                    <h3 style={styles.sectionTitle}>
                      <span style={styles.iconWrapper}>
                        <FaUserShield size={16} />
                      </span>
                      Board of Studies Details
                    </h3>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Designation</label>
                        <input
                          name="bosDetails.designation"
                          placeholder="Professor / Industry Expert"
                          value={formData.bosDetails.designation}
                          onChange={handleChange}
                          required
                          style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Joining Date</label>
                        <input
                          type="date"
                          name="bosDetails.joining_date"
                          value={formData.bosDetails.joining_date}
                          onChange={handleChange}
                          required
                          style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                        />
                      </div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>Term End Date</label>
                        <input
                          type="date"
                          name="bosDetails.term_end"
                          value={formData.bosDetails.term_end}
                          onChange={handleChange}
                          required
                          style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Fields */}
                <div style={{...styles.formGroup, ...styles.fullWidth}}>
                  <label style={styles.label}>Password</label>
                  <div style={styles.passwordContainer}>
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                    />
                    <span
                      style={styles.passwordToggle}
                      onClick={() => setShowPassword(!showPassword)}
                      onMouseEnter={(e) => e.target.style.color = styles.passwordToggleHover.color}
                      onMouseLeave={(e) => e.target.style.color = styles.passwordToggle.color}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </div>

                <div style={{...styles.formGroup, ...styles.fullWidth}}>
                  <label style={styles.label}>Confirm Password</label>
                  <div style={styles.passwordContainer}>
                    <input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                    />
                    <span
                      style={styles.passwordToggle}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      onMouseEnter={(e) => e.target.style.color = styles.passwordToggleHover.color}
                      onMouseLeave={(e) => e.target.style.color = styles.passwordToggle.color}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                </div>

                {/* Government ID Proofs Section */}
                <div style={styles.govtIdSection}>
                  <h3 style={styles.sectionTitle}>
                    <span style={styles.iconWrapper}>
                      <FaIdCard size={16} />
                    </span>
                    Government ID Proofs
                  </h3>
                  
                  {formData.govtIdProofs.map((proof, index) => (
                    <div key={index} style={styles.idProofItem}>
                      {formData.govtIdProofs.length > 1 && (
                        <button
                          type="button"
                          style={styles.removeButton}
                          onClick={() => removeGovtIdProof(index)}
                        >
                          ×
                        </button>
                      )}
                      
                      <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>ID Type</label>
                          <select
                            name="idType"
                            value={proof.idType}
                            onChange={(e) => handleGovtProofChange(e, index)}
                            required
                            style={styles.select} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                          >
                            <option value="">Select ID Type</option>
                            {idTypes.map((type) => (
                              <option value={type} key={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        <div style={styles.formGroup}>
                          <label style={styles.label}>ID Number</label>
                          <input
                            name="idNumber"
                            placeholder="Enter ID number"
                            value={proof.idNumber}
                            onChange={(e) => handleGovtProofChange(e, index)}
                            required
                            style={styles.input} onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)} onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; e.target.style.backgroundColor = ''; }}
                          />
                        </div>

                        <div style={{...styles.formGroup, ...styles.fullWidth}}>
                          <label style={styles.label}>Upload Document</label>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleGovtIdProofUpload(e, index)}
                            style={styles.fileInput}
                          />
                          {proof.documentFileName && (
                            <p style={{ fontSize: "0.8rem", color: "#10b981", marginTop: "6px" }}>
                              ✓ {proof.documentFileName} — ready to upload
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addGovtIdProof}
                    style={styles.addButton}
                  >
                    <FaIdCard /> Add Another ID Proof
                  </button>
                </div>

                {/* Profile Picture Section */}
                <div style={{...styles.formGroup, ...styles.fullWidth}}>
                  <label style={styles.label}>
                    <FaCamera style={{ marginRight: "0.5rem" }} />
                    Profile Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicture}
                    style={styles.fileInput}
                  />
                  {formData.profilePicturePreview && (
                    <img
                      src={formData.profilePicturePreview}
                      alt="Profile Preview"
                      style={styles.profilePicturePreview}
                    />
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  ...styles.submitButton,
                  ...(loading ? styles.submitButtonDisabled : {}),
                  ':hover': !loading ? styles.submitButtonHover : {},
                  ':active': !loading ? styles.submitButtonActive : {}
                }}
                disabled={loading}
                onMouseEnter={(e) => !loading && (e.target.style.transform = styles.submitButtonHover.transform)}
                onMouseLeave={(e) => !loading && (e.target.style.transform = 'none')}
                onMouseDown={(e) => !loading && (e.target.style.transform = styles.submitButtonActive.transform)}
                onMouseUp={(e) => !loading && (e.target.style.transform = styles.submitButtonHover.transform)}
              >
                {loading ? (
                  <>
                    <FaSpinner style={styles.spinner} /> Creating Admin...
                  </>
                ) : (
                  "Create Administrator"
                )}
              </button>

              {/* Feedback Messages */}
              {message && (
                <div style={{...styles.message, ...styles.successMessage}}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z" fill="#10B981"/>
                  </svg>
                  {message}
                </div>
              )}
              {error && (
                <div style={{...styles.message, ...styles.errorMessage}}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="#EF4444"/>
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

export default CreateAdminForm;