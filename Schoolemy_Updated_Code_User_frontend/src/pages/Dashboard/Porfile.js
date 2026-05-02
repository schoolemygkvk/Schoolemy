import React, { useState, useEffect, useRef } from "react";
import api from "../../service/api"; // Use centralized API instance
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Context/AuthContext";
import {
  getProfilePictureUrl,
  resolveMediaUrl,
} from "../../utils/profileImageUrl";
import "./ProfilePage.css"; // We'll create a separate CSS file

/**
 * SECURITY FIX 3.32.1: Memory Leak Prevention for Profile Image URLs
 *
 * CRITICAL: URL.createObjectURL() creates blob URLs that MUST be revoked
 * - Blob URLs are stored in browser memory
 * - If not revoked with URL.revokeObjectURL(), memory is leaked
 * - Each profile image upload creates a new blob URL
 * - Without cleanup, memory grows with each upload
 * - Result: Browser becomes slow, eventually crashes
 */
const ProfilePage = () => {
  const navigate = useNavigate();
  const { updateUserData } = useAuth();
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({});
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [activeTab, setActiveTab] = useState("personal");
  const [isUploading, setIsUploading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  const fileInputRef = useRef(null);
  // SECURITY FIX 3.32.1: Track created blob URLs for cleanup
  const blobUrlsRef = useRef([]);

  useEffect(() => {
    setImageLoadError(false);
  }, [profilePicturePreview]);

  /**
   * SECURITY FIX 3.32.1: Clean up blob URLs on component unmount
   * Prevents memory leaks from unreleased blob URLs
   */
  useEffect(() => {
    return () => {
      // Clean up any blob URLs when component unmounts
      blobUrlsRef.current.forEach((url) => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      blobUrlsRef.current = [];
    };
  }, []);

  /**
   * SECURITY FIX 3.32.1: Helper function to create and track blob URLs
   * Ensures all blob URLs are stored for cleanup
   */
  const createAndTrackBlobUrl = (file) => {
    const url = URL.createObjectURL(file);
    blobUrlsRef.current.push(url);
    return url;
  };

  /**
   * SECURITY FIX 3.32.1: Helper function to revoke old blob URLs
   * Called before creating new URLs to prevent memory leaks
   */
  const revokeOldBlobUrls = () => {
    blobUrlsRef.current.forEach((url) => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    blobUrlsRef.current = [];
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      setError("");

      try {
        // SECURITY FIX 3.32.1: Tokens in cookies - API call automatically includes them
        const response = await api.get(`/api/v1/user-profile/profiles`);

        setUserData(response.data);
        setFormData({
          username: response.data.username || "",
          email: response.data.email || "",
          mobile: response.data.mobile || "",
          fatherName: response.data.fatherName || "",
          dateofBirth: response.data.dateofBirth
            ? new Date(response.data.dateofBirth).toISOString().split("T")[0]
            : "",
          gender: response.data.gender || "",
          bloodGroup: response.data.bloodGroup || "",
          Nationality: response.data.Nationality || "",
          Occupation: response.data.Occupation || "",
          address: {
            street: response.data.address?.street || "",
            city: response.data.address?.city || "",
            state: response.data.address?.state || "",
            country: response.data.address?.country || "",
            zipCode: response.data.address?.zipCode || "",
          },
        });

        setProfilePicturePreview(getProfilePictureUrl(response.data));
      } catch (err) {
        console.error("Fetch profile error:", err);
        setError(err.response?.data?.message || "Failed to fetch profile data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const addressField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [addressField]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        return;
      }
      setProfilePictureFile(file);
      // SECURITY FIX 3.32.1: Revoke old blob URLs before creating new one
      revokeOldBlobUrls();
      const blobUrl = createAndTrackBlobUrl(file);
      setProfilePicturePreview(blobUrl);
      setError("");
    }
  };

  const handleUpdateProfileDetails = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    // SECURITY FIX 3.32.1: Tokens in cookies - no need to check localStorage
    const payload = { ...formData };
    
    // Clean up empty values
    Object.keys(payload).forEach((key) => {
      if (payload[key] === "" || payload[key] === undefined) {
        delete payload[key];
      }
    });

    if (payload.address) {
      payload.address = Object.fromEntries(
        Object.entries(payload.address).filter(
          ([_, value]) => value !== "" && value !== null && value !== undefined
        )
      );
      if (Object.keys(payload.address).length === 0) {
        delete payload.address;
      }
    }

    try {
      const response = await api.put(`/api/v1/user-profile/putprofile`, payload);

      // Handle both response formats: response.data.user or response.data directly
      const updatedUser = response.data.user || response.data;

      // Fetch fresh profile to ensure all changes are reflected
      try {
        const freshResponse = await api.get(`/api/v1/user-profile/profiles`);
        const freshData = freshResponse.data;
        setUserData(freshData);
        updateUserData(freshData);
        setFormData({
          username: freshData.username || "",
          email: freshData.email || "",
          mobile: freshData.mobile || "",
          fatherName: freshData.fatherName || "",
          dateofBirth: freshData.dateofBirth
            ? new Date(freshData.dateofBirth).toISOString().split("T")[0]
            : "",
          gender: freshData.gender || "",
          bloodGroup: freshData.bloodGroup || "",
          Nationality: freshData.Nationality || "",
          Occupation: freshData.Occupation || "",
          address: {
            street: freshData.address?.street || "",
            city: freshData.address?.city || "",
            state: freshData.address?.state || "",
            country: freshData.address?.country || "",
            zipCode: freshData.address?.zipCode || "",
          },
        });
      } catch (refetchErr) {
        // If fresh fetch fails, use response data
        setUserData(updatedUser);
        updateUserData(updatedUser);
      }

      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch (err) {
      console.error("Update details error:", err);
      let errorMessage = "Failed to update profile details.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        errorMessage = Array.isArray(errors)
          ? errors.map((e) => e.message).join(", ")
          : JSON.stringify(errors);
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfilePicture = async () => {
    if (!profilePictureFile) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Step 1: Get presigned upload URL from backend
      console.log("Requesting presigned upload URL...");
      const presignRes = await api.post(`/api/v1/user-profile/upload-url`, {
        fileName: profilePictureFile.name,
        fileType: profilePictureFile.type || "image/jpeg",
      });

      const { uploadUrl, fileUrl, uploadHeaders, expiresIn } = presignRes.data.data;
      console.log("Presigned URL received, expires in:", expiresIn, "seconds");

      // Step 2: Upload file directly to S3 using presigned URL
      console.log("Uploading to S3...");
      const s3Response = await fetch(uploadUrl, {
        method: "PUT",
        headers: uploadHeaders,
        body: profilePictureFile,
      });

      if (!s3Response.ok) {
        const errorText = await s3Response.text().catch(() => "Unknown error");
        throw new Error(`S3 upload failed: ${s3Response.status} ${errorText}`);
      }

      console.log("S3 upload successful");

      // Step 3: Tell backend to store the S3 URL in user profile
      console.log("Storing S3 URL in profile...");
      const response = await api.put(`/api/v1/user-profile/profile-picture`, {
        fileUrl: fileUrl,
      });

      // Immediately refetch profile to get updated image data
      try {
        const profileRes = await api.get("/api/v1/user-profile/profiles");
        const updatedData = profileRes.data;

        setUserData(updatedData);
        updateUserData(updatedData);

        // SECURITY FIX 3.40.2: Properly handle Base64 image data from response
        revokeOldBlobUrls();
        const imageUrl = getProfilePictureUrl(updatedData);

        if (imageUrl) {
          setProfilePicturePreview(imageUrl);
        } else {
          // Fallback to blob preview if image URL extraction failed
          setProfilePicturePreview(createAndTrackBlobUrl(profilePictureFile));
        }

        setProfilePictureFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSuccessMessage("Profile picture updated successfully!");
      } catch (refetchErr) {
        console.error("Failed to refetch profile after upload:", refetchErr);

        // Fallback: try to extract image data from upload response
        const responseUser = response.data.user || response.data;

        // SECURITY FIX 3.40.2: Handle Base64 data from response
        let imagePreview = null;

        if (responseUser.profilePicture) {
          imagePreview = getProfilePictureUrl(responseUser);
        } else if (responseUser.profileImageUrl) {
          imagePreview = resolveMediaUrl(responseUser.profileImageUrl);
        }

        // If still no image, use blob preview
        if (!imagePreview) {
          imagePreview = createAndTrackBlobUrl(profilePictureFile);
        }

        revokeOldBlobUrls();
        setProfilePicturePreview(imagePreview);

        const updatedUserData = {
          ...userData,
          ...responseUser,
        };

        setUserData(updatedUserData);
        updateUserData(updatedUserData);

        setProfilePictureFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSuccessMessage("Profile picture updated successfully!");
      }
    } catch (err) {
      console.error("Update picture error:", err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to update profile picture.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGoBack = () => {
    if (isEditing) {
      const confirmLeave = window.confirm(
        "You have unsaved changes. Are you sure you want to go back?"
      );
      if (confirmLeave) {
        setIsEditing(false);
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const tabs = [
    { id: "personal", label: "Personal Info", icon: "" },
    { id: "contact", label: "Contact Info", icon: "" },
    { id: "address", label: "Address", icon: "" },
  ];

  if (isLoading && !userData) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-error">
        <div className="error-icon"></div>
        <h3>No Profile Data</h3>
        <p>Unable to load user profile information.</p>
        <button onClick={() => navigate(-1)} className="btn-secondary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <button className="back-btn" onClick={handleGoBack}>
          <span className="back-icon">←</span>
          Back
        </button>
        <div className="header-content">
          <h1>My Profile</h1>
          <p className="header-subtitle">Manage your personal information</p>
        </div>
        {!isEditing && (
          <button className="edit-toggle-btn" onClick={() => setIsEditing(true)}>
            <span className="edit-icon"></span>
            Edit Profile
          </button>
        )}
      </header>

      {/* Messages */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon"></span>
          {error}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success">
          <span className="alert-icon"></span>
          {successMessage}
        </div>
      )}

      <div className="profile-container">
        {/* Profile Card */}
        <div className="profile-card">
          {/* Profile Header with Image */}
          <div className="profile-header-section">
            <div className="profile-image-container">
              <div className="profile-image-wrapper">
                {profilePicturePreview && !imageLoadError ? (
                  <img
                    src={profilePicturePreview}
                    alt="Profile"
                    className="profile-image"
                    onError={() => setImageLoadError(true)}
                  />
                ) : (
                  <div
                    className="profile-image"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#6366f1",
                      color: "#fff",
                      fontSize: "2.5rem",
                      fontWeight: "bold",
                    }}
                  >
                    {(formData.username || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                {isEditing && (
                  <button
                    className="change-photo-btn"
                    onClick={() => fileInputRef.current?.click()}
                    title="Change photo"
                  >
                    <span className="camera-icon"></span>
                  </button>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="file-input"
              />
            </div>

            <div className="profile-info-header">
              <h2 className="profile-name">{userData.username || "User"}</h2>
              <p className="profile-email">{userData.email || "No email"}</p>
              {userData.studentRegisterNumber && (
                <div className="student-id-badge">
                  <span className="badge-icon"></span>
                  Student ID: {userData.studentRegisterNumber}
                </div>
              )}
            </div>

            {isEditing && profilePictureFile && (
              <div className="upload-actions">
                <button
                  onClick={handleUpdateProfilePicture}
                  className="upload-btn"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <span className="upload-spinner"></span>
                      Uploading...
                    </>
                  ) : (
                    "Upload Photo"
                  )}
                </button>
                <button
                  onClick={() => {
                    setProfilePictureFile(null);
                    setProfilePicturePreview(getProfilePictureUrl(userData));
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="cancel-upload-btn"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Form/Info Content */}
          <form onSubmit={handleUpdateProfileDetails}>
            <div className="profile-content">
              {isEditing ? (
                <>
                  {/* Personal Info Tab */}
                  {activeTab === "personal" && (
                    <div className="tab-content">
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor="username">Username *</label>
                          <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            required
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="fatherName">Father's Name</label>
                          <input
                            type="text"
                            id="fatherName"
                            name="fatherName"
                            value={formData.fatherName}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="dateofBirth">Date of Birth</label>
                          <input
                            type="date"
                            id="dateofBirth"
                            name="dateofBirth"
                            value={formData.dateofBirth}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="gender">Gender</label>
                          <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            className="form-select"
                          >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor="bloodGroup">Blood Group</label>
                          <input
                            type="text"
                            id="bloodGroup"
                            name="bloodGroup"
                            value={formData.bloodGroup}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="Nationality">Nationality</label>
                          <input
                            type="text"
                            id="Nationality"
                            name="Nationality"
                            value={formData.Nationality}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="Occupation">Occupation</label>
                          <input
                            type="text"
                            id="Occupation"
                            name="Occupation"
                            value={formData.Occupation}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Info Tab */}
                  {activeTab === "contact" && (
                    <div className="tab-content">
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor="email">Email *</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="mobile">Mobile Number</label>
                          <input
                            type="tel"
                            id="mobile"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address Tab */}
                  {activeTab === "address" && (
                    <div className="tab-content">
                      <div className="form-grid">
                        <div className="form-group full-width">
                          <label htmlFor="address.street">Street Address</label>
                          <input
                            type="text"
                            id="address.street"
                            name="address.street"
                            value={formData.address?.street}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="address.city">City</label>
                          <input
                            type="text"
                            id="address.city"
                            name="address.city"
                            value={formData.address?.city}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="address.state">State</label>
                          <input
                            type="text"
                            id="address.state"
                            name="address.state"
                            value={formData.address?.state}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="address.country">Country</label>
                          <input
                            type="text"
                            id="address.country"
                            name="address.country"
                            value={formData.address?.country}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="address.zipCode">ZIP Code</label>
                          <input
                            type="text"
                            id="address.zipCode"
                            name="address.zipCode"
                            value={formData.address?.zipCode}
                            onChange={handleInputChange}
                            className="form-input"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* View Mode - Personal Info */}
                  {activeTab === "personal" && (
                    <div className="tab-content">
                      <div className="info-grid">
                        <InfoItem label="Username" value={userData.username} />
                        <InfoItem label="Father's Name" value={userData.fatherName} />
                        <InfoItem 
                          label="Date of Birth" 
                          value={userData.dateofBirth ? new Date(userData.dateofBirth).toLocaleDateString() : null} 
                        />
                        <InfoItem label="Gender" value={userData.gender} />
                        <InfoItem label="Blood Group" value={userData.bloodGroup} />
                        <InfoItem label="Nationality" value={userData.Nationality} />
                        <InfoItem label="Occupation" value={userData.Occupation} />
                      </div>
                    </div>
                  )}

                  {/* View Mode - Contact Info */}
                  {activeTab === "contact" && (
                    <div className="tab-content">
                      <div className="info-grid">
                        <InfoItem label="Email" value={userData.email} />
                        <InfoItem label="Mobile" value={userData.mobile} />
                      </div>
                    </div>
                  )}

                  {/* View Mode - Address */}
                  {activeTab === "address" && (
                    <div className="tab-content">
                      <div className="info-grid">
                        <InfoItem label="Street" value={userData.address?.street} />
                        <InfoItem label="City" value={userData.address?.city} />
                        <InfoItem label="State" value={userData.address?.state} />
                        <InfoItem label="Country" value={userData.address?.country} />
                        <InfoItem label="ZIP Code" value={userData.address?.zipCode} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="action-buttons">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      username: userData.username || "",
                      email: userData.email || "",
                      mobile: userData.mobile || "",
                      fatherName: userData.fatherName || "",
                      dateofBirth: userData.dateofBirth
                        ? new Date(userData.dateofBirth).toISOString().split("T")[0]
                        : "",
                      gender: userData.gender || "",
                      bloodGroup: userData.bloodGroup || "",
                      Nationality: userData.Nationality || "",
                      Occupation: userData.Occupation || "",
                      address: {
                        street: userData.address?.street || "",
                        city: userData.address?.city || "",
                        state: userData.address?.state || "",
                        country: userData.address?.country || "",
                        zipCode: userData.address?.zipCode || "",
                      },
                    });
                    setProfilePicturePreview(getProfilePictureUrl(userData));
                    setProfilePictureFile(null);
                    setError("");
                  }}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="save-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper component for displaying info items
const InfoItem = ({ label, value, icon }) => (
  <div className="info-item">
    <div className="info-label">
      {icon && <span className="info-icon">{icon}</span>}
      {label}
    </div>
    <div className="info-value">{value || <span className="na-text">Not provided</span>}</div>
  </div>
);

export default ProfilePage;