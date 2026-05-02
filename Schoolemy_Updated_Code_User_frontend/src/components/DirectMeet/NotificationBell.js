import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { markAsRead } from "../../service/notificationApi";
import useSmartNotifications from "../../hooks/useSmartNotifications";
import { FiBell, FiAlertCircle } from "react-icons/fi";

/**
 * NotificationBell Component
 *
 * Features:
 * - Smart polling with visibility API (pauses when tab not focused)
 * - Reduced polling interval (30s → 5 minutes)
 * - Connection status indicator
 * - Real-time notification display
 * - Exponential backoff on errors
 */

const NotificationBell = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  const dropdownRef = useRef(null);

  const userId = localStorage.getItem("userId");

  // Use smart notifications hook with visibility API and smart polling
  const {
    unreadCount,
    notifications,
    isLoading,
    isPolling,
    connectionStatus,
    lastFetchTime,
    fetchRecentNotifications,
  } = useSmartNotifications(userId);

  // SECURITY FIX 3.29.1: Inject styles safely via useEffect
  useEffect(() => {
    injectNotificationBellStyles();
  }, []);

  // Handle window resize for responsive dropdown positioning
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      }
      setIsOpen(false);
      if (notification.action_url) {
        navigate(notification.action_url);
      }
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  // Get connection status display
  const getConnectionStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connected':
        return { icon: '', text: 'Connected', color: '#10b981' };
      case 'paused':
        return { icon: '||', text: 'Paused (tab inactive)', color: '#f59e0b' };
      case 'error':
        return { icon: '', text: 'Connection error', color: '#ef4444' };
      case 'offline':
        return { icon: '', text: 'Offline', color: '#f59e0b' };
      default:
        return { icon: '...', text: 'Connecting', color: '#6366f1' };
    }
  };

  const statusDisplay = getConnectionStatusDisplay();

  const getTypeIcon = (type) => {
    switch (type) {
      case "meet_assigned":
        return "";
      case "meet_reminder":
        return "";
      case "meet_started":
        return "▶";
      case "meet_cancelled":
        return "";
      case "meet_completed":
        return "";
      case "material_uploaded":
        return "";
      case "user_joined":
        return "";
      case "payment_success":
        return "";
      case "course_enrolled":
        return "";
      default:
        return "";
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
        top: "calc(64px + env(safe-area-inset-top, 0px) + 10px)",
        left: "50%",
        right: "auto",
        transform: "translateX(-50%)",
        width: "min(calc(100vw - 24px), 400px)",
        maxWidth: "400px",
        maxHeight: "min(520px, calc(100dvh - 96px - env(safe-area-inset-bottom, 0px)))",
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
        type="button"
        onClick={handleBellClick}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowConnectionStatus(!showConnectionStatus);
        }}
        style={styles.bellButton}
        title={`${statusDisplay.text} — right-click for details`}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Connection Status Tooltip */}
      {showConnectionStatus && (
        <div style={styles.connectionStatusTooltip}>
          <div style={styles.connectionStatusContent}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '20px', marginRight: '8px' }}>
                {statusDisplay.icon}
              </span>
              <span style={{ fontWeight: '600' }}>
                {statusDisplay.text}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <div>Polling: {isPolling ? 'Active (5 min interval)' : 'Inactive'}</div>
              <div>Last update: {lastFetchTime ? new Date(lastFetchTime).toLocaleTimeString() : 'Never'}</div>
            </div>
          </div>
        </div>
      )}

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
            {isLoading ? (
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
              notifications.map((notification) => {
                const isUnread = !notification.is_read;
                return (
                  <div
                    key={notification._id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                    style={{
                      ...styles.notificationItem,
                      ...(isUnread
                        ? styles.notificationItemUnread
                        : styles.notificationItemRead),
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div style={styles.notificationIcon}>
                      {isUnread ? (
                        <FiAlertCircle
                          size={22}
                          style={{ color: "#d97706" }}
                          aria-hidden
                        />
                      ) : (
                        getTypeIcon(notification.notification_type)
                      )}
                    </div>
                    <div style={styles.notificationContent}>
                      {isUnread && (
                        <span style={styles.unreadAlertLabel}>
                          <FiAlertCircle size={12} aria-hidden />
                          Alert — unread
                        </span>
                      )}
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
                  </div>
                );
              })
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
    minWidth: "44px",
    minHeight: "44px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#334155",
    transition: "all 0.2s",
    WebkitTapHighlightColor: "transparent",
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
  connectionStatusTooltip: {
    position: "absolute",
    top: "calc(100% + 8px)",
    right: "0",
    backgroundColor: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    zIndex: "1001",
    padding: "12px",
    minWidth: "220px",
  },
  connectionStatusContent: {
    fontSize: "13px",
    color: "#1e293b",
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
    padding: "14px 16px",
    cursor: "pointer",
    borderBottom: "1px solid #f1f5f9",
    transition: "background 0.2s, border-color 0.2s",
    position: "relative",
    alignItems: "flex-start",
  },
  notificationItemRead: {
    backgroundColor: "#f8fafc",
    borderLeft: "4px solid transparent",
  },
  notificationItemUnread: {
    backgroundColor: "#fffbeb",
    borderLeft: "4px solid #d97706",
    boxShadow: "inset 0 0 0 1px rgba(217, 119, 6, 0.12)",
  },
  unreadAlertLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#b45309",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: "6px",
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

/**
 * SECURITY FIX 3.29.1: Move style injection to component level
 * Removed: Direct document.head.appendChild() at module scope
 * Changed to: Lazy injection via useEffect hook with proper cleanup
 * This ensures styles are only added when component mounts
 */
const NOTIFICATION_BELL_STYLES = `
  @keyframes notification-bell-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes notification-bell-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

// Lazy-inject styles only once per session (not at module scope)
let stylesInjected = false;
const injectNotificationBellStyles = () => {
  if (stylesInjected || typeof document === 'undefined') return;

  const existingStyle = document.getElementById('notification-bell-styles');
  if (existingStyle) {
    stylesInjected = true;
    return;
  }

  const style = document.createElement('style');
  style.id = 'notification-bell-styles';
  style.textContent = NOTIFICATION_BELL_STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
};

export default NotificationBell;
