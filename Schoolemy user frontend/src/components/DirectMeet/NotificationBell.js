import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUnreadCount,
  getUserNotifications,
  markAsRead,
} from "../../service/notificationApi";
import { FiBell, FiX } from "react-icons/fi";

const NotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dropdownRef = useRef(null);

  const userId = localStorage.getItem("userId");

  // Handle window resize for responsive dropdown positioning
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  console.log("🔔 NotificationBell mounted, userId:", userId);

  useEffect(() => {
    if (userId) {
      fetchUnreadCount();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      console.log("🔔 Fetching unread count for userId:", userId);
      const result = await getUnreadCount(userId);
      console.log("🔔 Unread count result:", result);
      if (result.success) {
        setUnreadCount(result.unread_count);
      }
    } catch (error) {
      console.error("🔔 Error fetching unread count:", error);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      setLoading(true);
      console.log("🔔 Fetching notifications for userId:", userId);
      const result = await getUserNotifications(userId, { limit: 5 });
      console.log("🔔 Notifications result:", result);
      if (result.success) {
        setNotifications(result.notifications);
      }
    } catch (error) {
      console.error("🔔 Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = () => {
    if (!isOpen) {
      fetchRecentNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await markAsRead(notification._id);
        fetchUnreadCount();
      }
      setIsOpen(false);
      if (notification.action_url) {
        navigate(notification.action_url);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "meet_assigned":
        return "📅";
      case "meet_reminder":
        return "⏰";
      case "meet_started":
        return "▶️";
      case "meet_cancelled":
        return "❌";
      case "meet_completed":
        return "✅";
      case "material_uploaded":
        return "📄";
      case "user_joined":
        return "🎯";
      case "payment_success":
        return "💳";
      case "course_enrolled":
        return "🎓";
      default:
        return "🔔";
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!userId) return null;

  // Dynamic dropdown positioning based on screen size
  const getDropdownStyle = () => {
    if (isMobile) {
      return {
        ...styles.dropdown,
        position: "fixed",
        top: "100px",
        left: "50%",
        right: "auto",
        transform: "translateX(-50%)",
        width: "90vw",
        maxWidth: "400px",
        maxHeight: "calc(100vh - 140px)",
        zIndex: 1050,
        overflowY: "auto",
      };
    }
    return styles.dropdown;
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div style={styles.backdrop} onClick={() => setIsOpen(false)} />
      )}

      <button
        onClick={handleBellClick}
        style={styles.bellButton}
        aria-label="Notifications"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={getDropdownStyle()}>
          <div style={styles.dropdownHeader}>
            <h3 style={styles.dropdownTitle}>Notifications</h3>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/user/notifications");
              }}
              style={styles.viewAllButton}
            >
              View All
            </button>
          </div>

          <div style={styles.notificationList}>
            {loading ? (
              <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p>Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div style={styles.emptyState}>
                <FiBell size={40} style={{ opacity: 0.3 }} />
                <p style={styles.emptyText}>No new notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    ...styles.notificationItem,
                    backgroundColor: notification.is_read
                      ? "#f8fafc"
                      : "#ffffff",
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div style={styles.notificationIcon}>
                    {getTypeIcon(notification.notification_type)}
                  </div>
                  <div style={styles.notificationContent}>
                    <h4 style={styles.notificationTitle}>
                      {notification.title}
                    </h4>
                    <p style={styles.notificationMessage}>
                      {notification.message}
                    </p>
                    <span style={styles.notificationTime}>
                      {formatTime(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.is_read && <div style={styles.unreadDot} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    display: "inline-block",
  },
  bellButton: {
    position: "relative",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#334155",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "#f1f5f9",
    },
  },
  badge: {
    position: "absolute",
    top: "2px",
    right: "2px",
    backgroundColor: "#ef4444",
    color: "white",
    borderRadius: "10px",
    padding: "2px 6px",
    fontSize: "10px",
    fontWeight: "bold",
    minWidth: "18px",
    textAlign: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  dropdown: {
    position: "absolute",
    top: "calc(100% + 48px)",
    right: "0",
    width: "380px",
    maxHeight: "500px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
    zIndex: 1000,
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  dropdownHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #e2e8f0",
    backgroundColor: "#f8fafc",
  },
  dropdownTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#1e293b",
  },
  viewAllButton: {
    background: "transparent",
    border: "none",
    color: "#3b82f6",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "4px",
    transition: "background 0.2s",
  },
  notificationList: {
    maxHeight: "400px",
    overflowY: "auto",
  },
  loadingContainer: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#64748b",
  },
  spinner: {
    width: "30px",
    height: "30px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 12px",
  },
  emptyState: {
    padding: "40px 20px",
    textAlign: "center",
    color: "#94a3b8",
  },
  emptyText: {
    margin: "12px 0 0",
    fontSize: "14px",
  },
  notificationItem: {
    display: "flex",
    gap: "12px",
    padding: "16px 20px",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s",
    position: "relative",
  },
  notificationIcon: {
    fontSize: "24px",
    flexShrink: 0,
  },
  notificationContent: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    margin: "0 0 4px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
  },
  notificationMessage: {
    margin: "0 0 6px",
    fontSize: "13px",
    color: "#64748b",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  notificationTime: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  unreadDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#3b82f6",
    borderRadius: "50%",
    flexShrink: 0,
    marginTop: "6px",
  },
  backdrop: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1049,
    cursor: "pointer",
  },
};

// Add keyframes for spinner animation
const styleSheet = document.styleSheets[0];
const keyframes = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;
styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

export default NotificationBell;
