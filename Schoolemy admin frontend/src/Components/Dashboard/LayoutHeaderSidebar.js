import React, { useState, useEffect } from "react";
import { Layout, Menu, Avatar, message } from "antd";
import io from "socket.io-client";
import { SOCKET_URL, SOCKET_ENABLED } from "../../Utils/api";
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  // FileTextOutlined,
  ProfileOutlined,
  DatabaseOutlined,
  // AuditOutlined,
  IdcardOutlined,
  CheckCircleOutlined,
  BellOutlined,
  VideoCameraOutlined,
  CrownOutlined,
  SnippetsOutlined,
  ShoppingOutlined,
  ContactsOutlined,
  FormOutlined,
  DollarOutlined ,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../Auth/AuthProvider";
import axios from "../../Utils/api";
import icon from "../../assets/icon.png";
import { Tooltip } from "antd";
import { Badge } from "antd";
import { hasAccess } from "../../Utils/roleBasedAccess";
import ScrollToTop from "../Common/ScrollToTop";
import { secureStorage } from "../../Utils/security";

const { Header, Sider } = Layout;

// Define menu items with role-based access
const menuItems = [
  {
    key: "1",
    label: "Dashboard",
    icon: <DashboardOutlined />,
    path: "/schoolemy",
    roles: [
      "superadmin",
      "admin",
      "committeeoftrustees",
      "boscontroller",
      "bosmembers",
      "coursemanagement",
      "usermanagement",
      "documentverification",
      "marketing",
      "auditor",
    ],
  },
  {
    key: "2",
    label: "Committee of Trustees",
    icon: <CrownOutlined />,
    path: "/schoolemy/admin-users",
    roles: ["superadmin", "admin","committeeoftrustees",],
  },
  {
    key: "3",
    label: "Users",
    icon: <UserOutlined />,
    path: "/schoolemy/users",
    roles: ["admin", "superadmin","committeeoftrustees",],
  },
  {
    key: "4",
    label: "Courses",
    icon: <BookOutlined />,
    path: "/schoolemy/courses",
    roles: ["coursecontroller", "admin", "superadmin"],
  },
  {
    key: "5",
    label: "BOS (Board of Studies)",
    icon: <ProfileOutlined />,
    path: "/schoolemy/bos",
    roles: ["boscontroller", "bosmembers", "superadmin","admin"],
  },
  {
    key: "6",
    label: "Data Maintenance",
    icon: <DatabaseOutlined />,
    path: "/schoolemy/data-maintenance",
    roles: ["datamaintenance", "superadmin","admin"],
  },
{
  key: "7",
  label: "Financial",
  icon: <DollarOutlined />,
  path: "/schoolemy/Financial",
  roles: ["datamaintenance", "superadmin","Financial",],
},
  {
    key: "8",
    label: "PCM Dashboard",
    icon: <VideoCameraOutlined />,
    path: "/schoolemy/pcm-dashboard",
    roles: [
      "superadmin",
      "admin",
      "boscontroller",
      "bosmembers",
      "datamaintenance",
      "coursecontroller",
      "markettingcontroller",
    ],
  },
  {
    key: "9",
    label: "Tutor Dashboard",
    icon: <ContactsOutlined />,
    path: "/schoolemy/tutor-data-management",
    roles: [
      "superadmin",
      "admin",      
    ],
  },
  {
    key: "10",
    label: "DirectMeet Management",
    icon: <SnippetsOutlined />,
    path: "/schoolemy/DM_Dashboard",
    roles: ["superadmin", "admin", "committeeoftrustees", "coursemanagement"],
  },
 {
    key: "18",
    label: "Auditing",
    icon: <FormOutlined />,
    path: "/schoolemy/financial-auditing",
    roles: ["superadmin", "admin", "auditor"],
  },
  {
    key: "12",
    label: "Marketing",
    icon: <ShoppingOutlined />,
    path: "/schoolemy/marketing-dashboard",
    roles: ["markettingcontroller", "superadmin"],
  },
  // {
  //   key: "13",
  //   label: "Certificate Maintenance",
  //   icon: <IdcardOutlined />,
  //   path: "/schoolemy/certificate-maintenance",
  //   roles: ["admin", "superadmin"],
  // },
  {
    key: "14",
    label: "Vote",
    icon: <CheckCircleOutlined />,
    path: "/schoolemy/vote",
    roles: ["boscontroller", "bosmembers", "superadmin"],
  },
  {
    key: "15",
    label: "User Landing Page",
    icon: <UserOutlined />,
    path: "/schoolemy/user-landing-page",
    roles: ["superadmin", "admin","datamaintenance", "coursecontroller", "markettingcontroller"],
  },
  // {
  //   key: "16",
  //   label: "Notifications",
  //   icon: <BellOutlined />,
  //   path: "/schoolemy/notifications",
  //   roles: [
  //     "superadmin",
  //     "admin",
  //     "boscontroller",
  //     "bosmembers",
  //     "datamaintenance",
  //     "coursecontroller",
  //     "markettingcontroller",
  //   ],
  // },

  {
    key: "17",
    label: "Dashboard",
    icon: <DashboardOutlined />,
    path: "/schoolemy/tutor/dashboard",
    roles: ["tutormanagement"],
  },
  {
    key: "19",
    label: "Courses Management",
    icon: <BookOutlined />,
    path: "/schoolemy/tutors-management",
    roles: ["tutormanagement"],
  },
  
];

const LayoutHeaderSidebar = ({ collapsed, setCollapsed, children }) => {
  const [selectedKey, setSelectedKey] = useState("1");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Initialize socket connection (only if WebSocket server is available)
  useEffect(() => {
    // Skip socket connection if not enabled (AWS REST API doesn't support WebSocket)
    if (!SOCKET_ENABLED || !SOCKET_URL) {
      console.log('[Socket] Disabled - using polling for notifications');
      return;
    }

    const token = secureStorage.getItem("token");
    const socket = io(SOCKET_URL, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
      timeout: 10000,
    });

    socket.on("connect", () => {
      console.log('[Socket] Connected');
    });

    socket.on("connect_error", (err) => {
      console.warn('[Socket] Connection failed:', err.message);
    });

    // Listen for new notifications
    socket.on("newNotification", () => {
      fetchUnreadNotifications();
    });

    // Cleanup on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const role = localStorage.getItem("role");
      const res = await axios.get(`/notifications?role=${role}`);
      const unread = res.data.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    fetchUnreadNotifications();

    // Set up polling every 30 seconds to check for new notifications
    const interval = setInterval(() => {
      fetchUnreadNotifications();
    }, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Add global style to hide scrollbars
  useEffect(() => {
    const styleId = "scrollbar-hidden-style";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
      .scrollbar-hidden::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hidden {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    const routeKeys = {
      "/schoolemy": "1",
      "/schoolemy/admin-users": "2",
      "/schoolemy/users": "3",
      "/schoolemy/courses": "4",
      "/schoolemy/bos": "5",
      "/schoolemy/data-maintenance": "6",
      "/schoolemy/pcm-dashboard": "8",
      "/schoolemy/tutor-data-management": "9",
      "/schoolemy/direct-meet": "10",
      // "/schoolemy/document-verification": "11",
      "/schoolemy/marketing-dashboard": "12",
      "/schoolemy/certificate-maintenance": "13",
      "/schoolemy/vote": "14",
      "/schoolemy/user-landing-page": "15",
      "/schoolemy/notifications": "16",
      "/schoolemy/tutor/dashboard": "17",
      "/schoolemy/tutors-management": "19",
      // "/schoolemy/feedback": "19",
    };

    const path = location.pathname;
    const key = routeKeys[path] || "1";
    setSelectedKey(key);
  }, [location]);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const token = user?.token || localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Call logout API
      await axios.post(
        "/adminlogout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Use AuthProvider logout function
      logout();
      message.success("Logout successful!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);

      // Even if API fails, force local logout using AuthProvider
      logout();
      navigate("/");

      message.error(
        error.response?.data?.message ||
          "Logout completed locally. Server session might not be recorded."
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleMenuClick = (item) => {
    const selected = menuItems.find((menu) => menu.key === item.key);
    if (selected) {
      navigate(selected.path);
      // Close sidebar when menu item is clicked
      setCollapsed(true);
    }
  };

  // Get user role for filtering menu items
  const role = user?.role || localStorage.getItem("role");

  // Filter menu items based on user role using utility function
  const accessibleMenuItems = menuItems.filter((item) =>
    hasAccess(role, item.roles)
  );

  // Debug: Log role and accessible items (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("User Role:", role);
      console.log(
        "Accessible Menu Items:",
        accessibleMenuItems.map((item) => item.label)
      );
    }
  }, [role, accessibleMenuItems]);

  // If user has no accessible menu items, show only dashboard
  const finalMenuItems =
    accessibleMenuItems.length > 0 ? accessibleMenuItems : [menuItems[0]];

  // Check if current route is accessible to user
  useEffect(() => {
    const currentPath = location.pathname;
    const currentMenuItem = menuItems.find((item) => item.path === currentPath);

    if (currentMenuItem && !hasAccess(role, currentMenuItem.roles)) {
      // User doesn't have access to current route, redirect to a role-appropriate dashboard
      console.warn(`Access denied to ${currentPath} for role ${role}`);
      if (role === "tutormanagement") {
        navigate("/schoolemy/tutor/dashboard");
      } else {
        navigate("/schoolemy");
      }
    }
  }, [location.pathname, role, navigate]);

  return (
    <>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        style={{
          background: "#fff",
          boxShadow: "2px 0 8px 0 rgba(29, 35, 41, 0.05)",
          height: "100vh",
          position: "fixed",
          left: 0,
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
        }}
      >
        {/* Fixed Logo Section */}
        <div
          onClick={() => {
            // Navigate to a role-appropriate landing page when clicking the logo
            const logoRole = user?.role || localStorage.getItem("role");
            if (logoRole === "tutormanagement") {
              navigate("/schoolemy/tutor/dashboard");
            } else {
              navigate("/schoolemy");
            }
          }}
          style={{
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 16px",
            background: "#001529",
            color: "white",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {collapsed ? (
            <div
              style={{
                backgroundColor: "white",
                padding: "4px 8px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                height: "44px",
                width: "54px",
                minWidth: "44px",
                position: "relative",
                zIndex: 2,
                transition: "all 0.3s ease",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <img
                src={icon}
                alt="schoolemy Icon"
                style={{
                  height: "48px", // Increased from 44px to 48px
                  width: "auto",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          ) : (
            <span
              style={{
                color: "white",
                fontWeight: "bold",
                fontSize: "16px",
                textAlign: "center",
                width: "100%",
              }}
            >
              Schoolemy Admin
            </span>
          )}
        </div>

        {/* Scrollable Menu Container */}
        <div
          className="scrollbar-hidden"
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            height: "calc(100vh - 64px)",
          }}
        >
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[selectedKey]}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
          >
            {finalMenuItems.map((item) => (
              <Menu.Item key={item.key} icon={item.icon}>
                {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </div>
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? 80 : 250,
          transition: "margin-left 0.2s",
          minHeight: "100vh",
        }}
      >
        <Header
          style={{
            background: "#001529",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 90,
            height: 64,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
            }}
          >
            <Tooltip
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              placement="bottom"
            >
              {React.createElement(
                collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
                {
                  className: "trigger",
                  onClick: toggleSidebar,
                  style: { color: "#fff", fontSize: "18px" },
                  "aria-label": collapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar",
                }
              )}
            </Tooltip>
            <span
              style={{
                color: "white",
                marginLeft: "16px",
                fontWeight: "bold",
                fontSize: "16px",
              }}
            >
              {(() => {
                const currentItem = finalMenuItems.find(
                  (item) => item.key === selectedKey
                );
                return currentItem ? currentItem.label : "Dashboard";
              })()}
            </span>
          </div>

          {/* Center Logo */}
          {/* Logo removed */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: "white",
            }}
          >
            {user ? (
              <>
                <Tooltip title="Notifications">
                  <div style={{ position: "relative", marginRight: "10px" }}>
                    <Badge
                      count={unreadCount}
                      size="small"
                      offset={[-2, 2]} // Adjust badge position slightly
                      style={{
                        backgroundColor: "#ef4444", // Tailwind's red-500
                        color: "white",
                        fontSize: "10px",
                        fontWeight: "bold",
                        boxShadow: "0 0 0 1px white", // white border
                      }}
                    >
                      <Avatar
                        style={{
                          backgroundColor: "#1890ff",
                          cursor: "pointer",
                        }}
                        icon={<BellOutlined />}
                        onClick={() => {
                          // Check if user has access to notifications
                          const notificationsItem = menuItems.find(
                            (item) => item.path === "/schoolemy/notifications"
                          );
                          if (
                            notificationsItem &&
                            hasAccess(role, notificationsItem.roles)
                          ) {
                            navigate("/schoolemy/notifications");
                          }
                        }}
                      />
                    </Badge>
                  </div>
                </Tooltip>

                <Tooltip title="View Profile">
                  <Avatar
                    style={{
                      backgroundColor: "#1890ff",
                      marginRight: "10px",
                      cursor: "pointer",
                    }}
                    icon={<UserOutlined />}
                    onClick={() => navigate("/schoolemy/profile")}
                  />
                </Tooltip>

                <span style={{ marginRight: "8px" }}>
                  {user?.name} - {user?.role}
                </span>

                <Tooltip title="Logout">
                  <div
                    style={{
                      backgroundColor: "white",
                      borderRadius: "6px",
                      padding: "6px 8px",
                      marginLeft: "20px",
                      cursor: isLoggingOut ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      transition: "all 0.2s ease",
                    }}
                    onClick={handleLogout}
                  >
                    <LogoutOutlined
                      style={{
                        color: isLoggingOut ? "#ccc" : "#ff4d4f",
                        fontSize: "16px",
                      }}
                    />
                  </div>
                </Tooltip>
              </>
            ) : (
              <a href="/login" style={{ color: "white" }}>
                Login
              </a>
            )}
          </div>
        </Header>

        <div style={{ padding: 24, minHeight: 360 }}>{children}</div>
      </Layout>
      <ScrollToTop />
    </>
  );
};

export default LayoutHeaderSidebar;
