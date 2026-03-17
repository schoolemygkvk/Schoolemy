import React, { useState, useEffect } from "react";
import { Card, Avatar, Typography, Spin, message, Divider } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CalendarOutlined,
  ManOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import axios from "../../Utils/api";

const { Title, Text } = Typography;

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      if (!token) {
        message.error("No authentication token found. Please login again.");
        setLoading(false);
        return;
      }

      const response = await axios.get("/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        // Backend now returns `{ success, message, userType, role, profile }`
        // use the `profile` payload as the user object
        setProfile(response.data.profile);
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
      markettingcontroller: "Marketing Controller",
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

  // Helpers for avatar handling: support full data URI, remote URL, or raw base64
  const getInitials = (name) => {
    if (!name) return null;
    return name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const resolveAvatarSrc = (img) => {
    if (!img) return null;
    const trimmed = String(img).trim();
    // already a data URI
    if (trimmed.startsWith("data:")) return trimmed;
    // remote URL
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    // otherwise assume it's base64 (raw) and prefix with data URI
    // small safeguard: if it's short, treat as invalid
    if (trimmed.length < 50) return null;
    return `data:image/jpeg;base64,${trimmed}`;
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
              <Avatar
                size={100}
                src={resolveAvatarSrc(profile.profilePictureUpload)}
                style={{
                  backgroundColor: !profile.profilePictureUpload
                    ? "rgba(255, 255, 255, 0.2)"
                    : "transparent",
                  backdropFilter: "blur(5px)",
                  border: "2px solid white",
                  objectFit: "cover",
                }}
              >
                {!resolveAvatarSrc(profile.profilePictureUpload) &&
                  (getInitials(profile.name) || <UserOutlined />)}
              </Avatar>

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
