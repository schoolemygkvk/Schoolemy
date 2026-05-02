import React, { useState, useEffect, useRef } from "react";
import { Card, Avatar, Typography, Spin, message, Divider, Button } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CalendarOutlined,
  ManOutlined,
  WomanOutlined,
  CameraOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import axios from "../../Utils/api";
import { uploadToS3 } from "../../Utils/s3Upload";
import {
  resolveProfilePictureSrc,
  getDisplayInitials,
  PROFILE_PICTURE_UPDATED_EVENT,
} from "../../Utils/profilePictureSrc";

const { Title, Text } = Typography;

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  const [pendingPhotoDataUrl, setPendingPhotoDataUrl] = useState(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);

      const response = await axios.get("/profile");

      if (response.data.success) {
        // Backend sendSuccess() wraps payload in `data` property
        // Response: { success, message, data: { userType, role, profile } }
        const profileData = response.data.data?.profile || response.data.profile;
        const type = response.data.data?.userType || null;
        setUserType(type);
        setProfile(profileData);
      } else {
        message.error(response.data.message || "Failed to fetch profile data");
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      message.error(
        error.response?.data?.message || "Failed to fetch profile data"
      );
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      superadmin: "Super Admin",
      admin: "Admin",
      boscontroller: "BOS Controller",
      bosmembers: "BOS Member",
      datamaintenance: "Data Maintenance",
      coursecontroller: "Course Controller",
      marketing: "Marketing",
    };
    return roleMap[role] || role;
  };

  const getGenderIcon = (gender) => {
    if (gender === "male") {
      return <ManOutlined style={{ color: "#1890ff" }} />;
    } else if (gender === "female") {
      return <WomanOutlined style={{ color: "#f759ab" }} />;
    } else {
      return <UserOutlined style={{ color: "#adb5bd" }} />;
    }
  };

  const getGenderDisplay = (gender) => {
    if (gender === "male") return "Male";
    if (gender === "female") return "Female";
    return "Not provided";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const resetPhotoPicker = () => {
    if (pendingPhotoDataUrl) URL.revokeObjectURL(pendingPhotoDataUrl);
    setPendingPhotoDataUrl(null);
    setPendingPhotoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleProfilePhotoFileChosen = (e) => {
    const file = e.target?.files?.[0];
    if (!file || !profile?._id) {
      if (e.target) e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      message.error("Please choose an image file");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      message.error("Image must be 5 MB or smaller");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingPhotoDataUrl(previewUrl);
    setPendingPhotoFile(file);
  };

  const handleCancelPendingPhoto = () => {
    resetPhotoPicker();
  };

  const handleUploadProfilePhoto = async () => {
    if (!profile?._id || !pendingPhotoFile) return;

    const type = (userType || "").toLowerCase();
    setUploadingPhoto(true);
    try {
      // Upload file directly to S3 using presigned URL
      const { s3Url } = await uploadToS3(pendingPhotoFile, "profile-pictures");

      if (type === "tutor") {
        const res = await axios.patch(`/tutor/${profile._id}`, {
          profilePictureUpload: s3Url,
        });
        if (!res.data?.success) {
          message.error(res.data?.message || "Failed to update profile photo");
          return;
        }
        const updated = res.data.data;
        if (updated) setProfile(updated);
      } else {
        const res = await axios.put(`/update/${profile._id}`, {
          profilePictureUrl: s3Url,
        });
        if (res.data?.admin) {
          setProfile(res.data.admin);
        } else {
          await fetchProfile();
        }
      }
      resetPhotoPicker();
      message.success("Profile photo updated");
      window.dispatchEvent(new CustomEvent(PROFILE_PICTURE_UPDATED_EVENT));
    } catch (err) {
      message.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to update profile photo"
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
        }}
      >
        <Spin size="large" />
        <Text style={{ marginLeft: 16, color: "#6c757d" }}>
          Loading your profile...
        </Text>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          backgroundColor: "#f8f9fa",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text type="secondary" style={{ fontSize: "1.2rem" }}>
          Profile data not available
        </Text>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f8f9fa",
        padding: "2rem",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          width: "100%",
        }}
      >
        <Card
          style={{
            border: "none",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
            overflow: "hidden",
          }}
          bodyStyle={{ padding: 0 }}
        >
          {/* Profile Header */}
          <div
            style={{
              background:
                "linear-gradient(135deg, #3b82f6 0%, #06b6d4 50%, #ec4899 100%)",
              padding: "2.5rem",
              color: "white",
              position: "relative",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1.5rem",
              }}
            >
              <div style={{ position: "relative" }}>
                <Avatar
                  size={100}
                  src={
                    pendingPhotoDataUrl ||
                    resolveProfilePictureSrc(profile.profilePictureUpload)
                  }
                  style={{
                    backgroundColor:
                      !pendingPhotoDataUrl &&
                      !profile.profilePictureUpload
                        ? "rgba(255, 255, 255, 0.2)"
                        : "transparent",
                    backdropFilter: "blur(5px)",
                    border: pendingPhotoDataUrl
                      ? "2px solid #ffd666"
                      : "2px solid white",
                    objectFit: "cover",
                  }}
                >
                  {!pendingPhotoDataUrl &&
                    !resolveProfilePictureSrc(
                      profile.profilePictureUpload
                    ) &&
                    (getDisplayInitials(profile.name) || <UserOutlined />)}
                </Avatar>
                {pendingPhotoDataUrl && (
                  <Text
                    style={{
                      display: "block",
                      marginTop: 6,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.95)",
                    }}
                  >
                    Preview — not saved yet
                  </Text>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={handleProfilePhotoFileChosen}
                />
                {!pendingPhotoDataUrl ? (
                  <Button
                    type="default"
                    size="small"
                    icon={<CameraOutlined />}
                    disabled={uploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      marginTop: 10,
                      display: "block",
                      width: "100%",
                    }}
                  >
                    Choose photo
                  </Button>
                ) : (
                  <div
                    style={{
                      marginTop: 10,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      width: "100%",
                      maxWidth: 160,
                    }}
                  >
                    <Button
                      type="primary"
                      size="small"
                      icon={<UploadOutlined />}
                      loading={uploadingPhoto}
                      disabled={uploadingPhoto}
                      onClick={handleUploadProfilePhoto}
                      block
                    >
                      Upload
                    </Button>
                    <Button
                      type="default"
                      size="small"
                      disabled={uploadingPhoto}
                      onClick={handleCancelPendingPhoto}
                      block
                    >
                      Cancel
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      disabled={uploadingPhoto}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ color: "rgba(255,255,255,0.95)", padding: 0 }}
                    >
                      Pick another image
                    </Button>
                  </div>
                )}
                {!pendingPhotoDataUrl && (
                  <Text
                    style={{
                      display: "block",
                      marginTop: 6,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    
                  </Text>
                )}
              </div>

              <div>
                <Title
                  level={2}
                  style={{
                    margin: 0,
                    color: "white",
                    fontWeight: 600,
                    fontSize: "2rem",
                  }}
                >
                  {profile.name}
                </Title>
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    padding: "0.25rem 0.75rem",
                    borderRadius: "20px",
                    display: "inline-block",
                    marginTop: "0.5rem",
                    backdropFilter: "blur(5px)",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: "0.9rem",
                      fontWeight: 500,
                    }}
                  >
                    {getRoleDisplayName(profile.role)}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div style={{ padding: "2.5rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "2rem",
              }}
            >
              {/* Personal Information */}
              <div>
                <Title
                  level={4}
                  style={{
                    marginBottom: "1.5rem",
                    color: "#495057",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <UserOutlined /> Personal Information
                </Title>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Email
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <MailOutlined style={{ color: "#adb5bd" }} />
                      <Text>{profile.email}</Text>
                    </div>
                  </div>

                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Mobile Number
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <PhoneOutlined style={{ color: "#adb5bd" }} />
                      <Text>{profile.mobilenumber || "Not provided"}</Text>
                    </div>
                  </div>

                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Gender
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      {getGenderIcon(profile.gender)}
                      <Text>{getGenderDisplay(profile.gender)}</Text>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <Title
                  level={4}
                  style={{
                    marginBottom: "1.5rem",
                    color: "#495057",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <IdcardOutlined /> Account Information
                </Title>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                  }}
                >
                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Role
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <Text>{getRoleDisplayName(profile.role)}</Text>
                    </div>
                  </div>

                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Account Created
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <CalendarOutlined style={{ color: "#adb5bd" }} />
                      <Text>{formatDate(profile.createdAt)}</Text>
                    </div>
                  </div>

                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Last Updated
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <CalendarOutlined style={{ color: "#adb5bd" }} />
                      <Text>{formatDate(profile.updatedAt)}</Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* BOS Details Section */}
            {profile.bosDetails && (
              <>
                <Divider style={{ margin: "2rem 0" }} />

                <Title
                  level={4}
                  style={{
                    marginBottom: "1.5rem",
                    color: "#495057",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <IdcardOutlined /> BOS Member Details
                </Title>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "2rem",
                  }}
                >
                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Member ID
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <Text>{profile.bosDetails.member_id || "N/A"}</Text>
                    </div>
                  </div>

                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Designation
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <Text>{profile.bosDetails.designation || "N/A"}</Text>
                    </div>
                  </div>

                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Joining Date
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <CalendarOutlined style={{ color: "#adb5bd" }} />
                      <Text>{formatDate(profile.bosDetails.joining_date)}</Text>
                    </div>
                  </div>

                  <div>
                    <Text
                      strong
                      style={{
                        display: "block",
                        color: "#6c757d",
                        marginBottom: "0.25rem",
                        fontSize: "0.85rem",
                      }}
                    >
                      Term End Date
                    </Text>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <CalendarOutlined style={{ color: "#adb5bd" }} />
                      <Text>{formatDate(profile.bosDetails.term_end)}</Text>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Login History */}
            {profile.loginHistory && profile.loginHistory.length > 0 && (
              <>
                <Divider style={{ margin: "2rem 0" }} />

                <div>
                  <Title
                    level={4}
                    style={{
                      marginBottom: "1.5rem",
                      color: "#495057",
                      fontWeight: 600,
                    }}
                  >
                    Login Activity
                  </Title>

                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                      padding: "1rem 1.5rem",
                    }}
                  >
                    <Text strong style={{ fontSize: "1rem" }}>
                      Total Logins:{" "}
                      <span style={{ color: "#495057" }}>
                        {profile.loginHistory.length}
                      </span>
                    </Text>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
