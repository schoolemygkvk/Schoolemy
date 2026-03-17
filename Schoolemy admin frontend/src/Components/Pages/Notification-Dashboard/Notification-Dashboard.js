import React, { useEffect, useState, useCallback } from "react";
import axios from "../../../Utils/api";
import { Spin, message } from "antd";
import { formatDistanceToNow } from "date-fns";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [hoveredCard, setHoveredCard] = useState(null);
  const role = localStorage.getItem("role");

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/notifications?role=${role}`);
      setNotifications(res.data);
    } catch (err) {
      message.error("Failed to fetch notifications.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      message.error("Failed to mark as read.");
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`/notifications/mark-all-read?role=${role}`);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      message.success("All notifications marked as read");
    } catch (err) {
      message.error("Failed to mark all as read.");
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "unread") return !notification.isRead;
    if (activeTab === "read") return notification.isRead;
    return true;
  });

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.headerContent}>
            <div style={styles.headerIconWrapper}>
              <span style={styles.headerIcon}>🔔</span>
              {notifications.some((n) => !n.isRead) && (
                <div style={styles.unreadBadge}>
                  {notifications.filter((n) => !n.isRead).length}
                </div>
              )}
            </div>
            <h2 style={styles.headerTitle}>Notifications Center</h2>
          </div>

          <div style={styles.tabs}>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "all" && styles.activeTab),
              }}
              onClick={() => setActiveTab("all")}
            >
              All Notifications
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "unread" && styles.activeTab),
              }}
              onClick={() => setActiveTab("unread")}
            >
              Unread
            </button>
            <button
              style={{
                ...styles.tabButton,
                ...(activeTab === "read" && styles.activeTab),
              }}
              onClick={() => setActiveTab("read")}
            >
              Read
            </button>
            <button
              style={{
                ...styles.markAllButton,
                ...(!notifications.some((n) => !n.isRead) && styles.markAllButtonDisabled)
              }}
              onClick={markAllAsRead}
              disabled={!notifications.some((n) => !n.isRead)}
            >
              ✓ Mark All Read
            </button>
          </div>
        </div>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loadingContainer}>
              <Spin size="large" />
              <p style={styles.loadingText}>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📭</span>
              <p style={styles.emptyText}>
                {activeTab === "unread"
                  ? "No unread notifications"
                  : activeTab === "read"
                  ? "No read notifications"
                  : "No notifications yet"}
              </p>
              <p style={styles.emptySubtext}>
                {activeTab === "all" && "You'll see new notifications here when they arrive"}
              </p>
            </div>
          ) : (
            <div style={styles.notificationsList}>
              {filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  style={{
                    ...styles.notificationItem,
                    ...(!notification.isRead && styles.unreadNotification),
                    ...(hoveredCard === notification._id && styles.notificationItemHover)
                  }}
                  onMouseEnter={() => setHoveredCard(notification._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div style={{
                    ...styles.notificationDot,
                    ...(notification.isRead && styles.notificationDotRead)
                  }}></div>
                  <div style={styles.notificationContent}>
                    <div style={styles.notificationHeader}>
                      <h3 style={styles.notificationTitle}>
                        {notification.title}
                      </h3>
                      <span style={styles.notificationTime}>
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p style={styles.notificationMessage}>
                      {notification.message}
                    </p>
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        style={styles.readButton}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#667eea'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        <span style={styles.readIcon}>✓</span>
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '3rem 1.5rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  container: {
    maxWidth: '900px',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
  header: {
    padding: '2rem 2rem 1.5rem 2rem',
    borderBottom: '2px solid #e2e8f0',
    background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1.5rem',
    justifyContent: 'center',
  },
  headerIconWrapper: {
    position: 'relative',
    display: 'inline-block',
    marginRight: '1rem',
  },
  headerIcon: {
    fontSize: '2.5rem',
  },
  unreadBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '700',
    minWidth: '22px',
    height: '22px',
    padding: '0 6px',
    borderRadius: '9999px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 0 3px white, 0 4px 8px rgba(239, 68, 68, 0.5)',
  },
  headerTitle: {
    fontSize: '2rem',
    fontWeight: '800',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0',
    letterSpacing: '-0.5px',
  },
  tabs: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  tabButton: {
    padding: '0.65rem 1.25rem',
    borderRadius: '12px',
    border: '2px solid transparent',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap',
  },
  activeTab: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
  },
  markAllButton: {
    marginLeft: 'auto',
    padding: '0.65rem 1.25rem',
    borderRadius: '12px',
    border: '2px solid #667eea',
    backgroundColor: 'transparent',
    color: '#667eea',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.3s ease',
  },
  markAllButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  content: {
    padding: '1.5rem 0',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    gap: '1rem',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '1rem',
    fontWeight: '500',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '4rem 2rem',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1.5rem',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: '0 0 0.5rem 0',
  },
  emptySubtext: {
    color: '#94a3b8',
    fontSize: '0.95rem',
    margin: '0',
  },
  notificationsList: {
    maxHeight: '700px',
    overflowY: 'auto',
    padding: '0.5rem',
  },
  notificationItem: {
    display: 'flex',
    padding: '1.5rem 2rem',
    transition: 'all 0.3s ease',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
  },
  notificationItemHover: {
    backgroundColor: '#f8fafc',
  },
  unreadNotification: {
    backgroundColor: '#f0f4ff',
    borderLeft: '4px solid #667eea',
  },
  notificationDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    marginTop: '8px',
    marginRight: '1.25rem',
    flexShrink: '0',
    boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.2)',
  },
  notificationDotRead: {
    background: '#cbd5e1',
    boxShadow: 'none',
  },
  notificationContent: {
    flex: '1',
  },
  notificationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    gap: '1rem',
  },
  notificationTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0',
    lineHeight: '1.4',
  },
  notificationTime: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
    fontWeight: '500',
  },
  notificationMessage: {
    fontSize: '0.95rem',
    color: '#475569',
    margin: '0 0 1rem 0',
    lineHeight: '1.6',
  },
  readButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    border: '2px solid #667eea',
    borderRadius: '10px',
    color: '#667eea',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    gap: '0.5rem',
  },
  readIcon: {
    fontSize: '0.9rem',
  },
};

export default Notifications;
