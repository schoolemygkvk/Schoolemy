import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../service/notificationApi";
import { FiCheck, FiTrash2, FiFilter, FiCheckCircle } from "react-icons/fi";

const UserNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = { page: currentPage, limit: 20 };
      
      if (filter === "unread") params.is_read = false;
      if (filter === "read") params.is_read = true;

      const result = await getUserNotifications(userId, params);
      if (result.success) {
        setNotifications(result.notifications);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(userId);
      fetchNotifications();
      alert("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleDelete = async (notificationId) => {
    if (window.confirm("Delete this notification?")) {
      try {
        await deleteNotification(notificationId);
        fetchNotifications();
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification._id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent": return "#ef4444";
      case "high": return "#f59e0b";
      case "medium": return "#3b82f6";
      case "low": return "#94a3b8";
      default: return "#64748b";
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "meet_assigned": return "📅";
      case "meet_reminder": return "⏰";
      case "meet_started": return "▶️";
      case "meet_cancelled": return "❌";
      case "meet_rescheduled": return "🔄";
      case "meet_completed": return "✅";
      case "material_uploaded": return "📁";
      case "user_joined": return "🎯";
      case "payment_success": return "💳";
      case "course_enrolled": return "🎓";
      default: return "🔔";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && notifications.length === 0) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Notifications</h1>
          <p style={styles.subtitle}>Stay updated with your course meets</p>
        </div>
        <button onClick={handleMarkAllAsRead} style={styles.markAllButton}>
          <FiCheckCircle /> Mark All as Read
        </button>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <FiFilter style={styles.filterIcon} />
        <div style={styles.filterButtons}>
          <button
            onClick={() => setFilter("all")}
            style={{
              ...styles.filterButton,
              ...(filter === "all" && styles.activeFilter),
            }}
          >
            All ({pagination.total_notifications || 0})
          </button>
          <button
            onClick={() => setFilter("unread")}
            style={{
              ...styles.filterButton,
              ...(filter === "unread" && styles.activeFilter),
            }}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter("read")}
            style={{
              ...styles.filterButton,
              ...(filter === "read" && styles.activeFilter),
            }}
          >
            Read
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🔔</div>
          <h3 style={styles.emptyTitle}>No notifications</h3>
          <p style={styles.emptyText}>
            {filter === "unread" 
              ? "You're all caught up!" 
              : "You don't have any notifications yet"}
          </p>
        </div>
      ) : (
        <div style={styles.notificationsList}>
          {notifications.map((notification) => (
            <div
              key={notification._id}
              style={{
                ...styles.notificationCard,
                ...(notification.is_read && styles.readCard),
              }}
            >
              {/* Priority Bar */}
              <div
                style={{
                  ...styles.priorityBar,
                  background: getPriorityColor(notification.priority),
                }}
              />

              {/* Content */}
              <div style={styles.cardContent} onClick={() => handleNotificationClick(notification)}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconTitle}>
                    <span style={styles.typeIcon}>{getTypeIcon(notification.notification_type)}</span>
                    <h3 style={styles.notificationTitle}>{notification.title}</h3>
                  </div>
                  {!notification.is_read && <div style={styles.unreadDot} />}
                </div>

                <p style={styles.message}>{notification.message}</p>

                {notification.meet_id && (
                  <div style={styles.meetTag}>
                    📚 {notification.meet_id.title}
                    {notification.meet_id.course_id && (
                      <span style={styles.courseName}>
                        • {notification.meet_id.course_id.coursename}
                      </span>
                    )}
                  </div>
                )}

                <div style={styles.cardFooter}>
                  <span style={styles.timestamp}>{formatDate(notification.createdAt)}</span>
                  <span style={{...styles.priorityBadge, background: getPriorityColor(notification.priority)}}>
                    {notification.priority}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={styles.actions}>
                {!notification.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(notification._id)}
                    style={styles.actionButton}
                    title="Mark as read"
                  >
                    <FiCheck />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notification._id)}
                  style={styles.deleteButton}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div style={styles.pagination}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{
              ...styles.pageButton,
              ...(currentPage === 1 && styles.disabledButton),
            }}
          >
            Previous
          </button>

          <span style={styles.pageInfo}>
            Page {currentPage} of {pagination.total_pages}
          </span>

          <button
            disabled={currentPage === pagination.total_pages}
            onClick={() => setCurrentPage(currentPage + 1)}
            style={{
              ...styles.pageButton,
              ...(currentPage === pagination.total_pages && styles.disabledButton),
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "2rem 1rem",
  },
  header: {
    maxWidth: "1000px",
    margin: "0 auto 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
  },
  title: {
    fontSize: "2rem",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#64748b",
  },
  markAllButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
  },
  filterBar: {
    maxWidth: "1000px",
    margin: "0 auto 2rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  filterIcon: {
    fontSize: "1.25rem",
    color: "#64748b",
  },
  filterButtons: {
    display: "flex",
    gap: "0.5rem",
  },
  filterButton: {
    padding: "0.5rem 1rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 500,
  },
  activeFilter: {
    background: "#667eea",
    color: "white",
    borderColor: "#667eea",
  },
  notificationsList: {
    maxWidth: "1000px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  notificationCard: {
    display: "flex",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    position: "relative",
    overflow: "hidden",
    transition: "transform 0.2s",
  },
  readCard: {
    opacity: 0.7,
  },
  priorityBar: {
    width: "4px",
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    padding: "1.25rem",
    cursor: "pointer",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "0.75rem",
  },
  iconTitle: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  typeIcon: {
    fontSize: "1.5rem",
  },
  notificationTitle: {
    fontSize: "1.125rem",
    color: "#1e293b",
    fontWeight: 600,
  },
  unreadDot: {
    width: "10px",
    height: "10px",
    background: "#3b82f6",
    borderRadius: "50%",
    flexShrink: 0,
  },
  message: {
    color: "#64748b",
    marginBottom: "1rem",
    lineHeight: "1.6",
  },
  meetTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "#f8fafc",
    borderRadius: "6px",
    fontSize: "0.875rem",
    color: "#667eea",
    marginBottom: "1rem",
  },
  courseName: {
    color: "#94a3b8",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timestamp: {
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  priorityBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    padding: "1rem",
    borderLeft: "1px solid #f1f5f9",
  },
  actionButton: {
    padding: "0.5rem",
    background: "#f1f5f9",
    border: "none",
    borderRadius: "6px",
    color: "#64748b",
    cursor: "pointer",
    fontSize: "1rem",
  },
  deleteButton: {
    padding: "0.5rem",
    background: "#fee2e2",
    border: "none",
    borderRadius: "6px",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "1rem",
  },
  empty: {
    maxWidth: "500px",
    margin: "4rem auto",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: "4rem",
    marginBottom: "1rem",
  },
  emptyTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  emptyText: {
    color: "#64748b",
  },
  pagination: {
    maxWidth: "1000px",
    margin: "2rem auto 0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
  },
  pageButton: {
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "pointer",
    fontWeight: 600,
  },
  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  pageInfo: {
    color: "#64748b",
    fontWeight: 600,
  },
  loading: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },
};

export default UserNotifications;