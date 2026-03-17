import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserMeets } from "../../service/userCourseMeetApi";
import { FiCalendar, FiClock, FiVideo, FiMapPin, FiArrowRight } from "react-icons/fi";

const CourseUpcomingMeets = ({ courseId }) => {
  const navigate = useNavigate();
  const [meets, setMeets] = useState([]);
  const [loading, setLoading] = useState(true);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (courseId && userId) {
      fetchCourseMeets();
    }
  }, [courseId, userId]);

  const fetchCourseMeets = async () => {
    try {
      setLoading(true);
      const result = await getUserMeets(userId, {
        limit: 5,
        status: "" // Get all upcoming/ongoing meets
      });

      if (result.success) {
        // Filter meets for this specific course
        const courseMeets = result.meets.filter(
          meet => meet.course_id?._id === courseId
        );
        setMeets(courseMeets);
      } else if (result.fallback) {
        // Handle fallback case when backend is not available
        console.warn('⚠️ Using fallback mode - backend not available');
        setMeets([]);
      }
    } catch (error) {
      console.error("Error fetching course meets:", error);
      setMeets([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "not_joined": return "#94a3b8";
      case "joined": return "#3b82f6";
      case "completed": return "#10b981";
      default: return "#64748b";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "not_joined": return "Not Joined";
      case "joined": return "In Progress";
      case "completed": return "Completed";
      default: return status;
    }
  };

  if (!userId) return null;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p>Loading meets...</p>
      </div>
    );
  }

  if (meets.length === 0) {
    return (
      <div style={styles.emptyState}>
        <FiCalendar size={40} style={{ opacity: 0.3 }} />
        <p style={styles.emptyText}>No upcoming meets scheduled for this course</p>
        {process.env.NODE_ENV === 'development' && (
          <div style={styles.devNote}>
            <small style={styles.devText}>
              💡 Development Mode: If you're expecting meets to appear, check that your backend server is running on the configured port.
            </small>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Upcoming Meets</h3>
        <button
          onClick={() => navigate("/user/meets")}
          style={styles.viewAllButton}
        >
          View All <FiArrowRight />
        </button>
      </div>

      <div style={styles.meetsList}>
        {meets.map((meet) => (
          <div
            key={meet._id}
            style={styles.meetCard}
            onClick={() => navigate(`/user/meets/${meet._id}`)}
          >
            <div style={styles.meetHeader}>
              <h4 style={styles.meetTitle}>{meet.title}</h4>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor: getStatusColor(meet.participation_status)
                }}
              >
                {getStatusLabel(meet.participation_status)}
              </span>
            </div>

            <div style={styles.meetInfo}>
              <div style={styles.infoItem}>
                <FiCalendar style={styles.icon} />
                <span>{formatDate(meet.scheduled_date)}</span>
              </div>
              <div style={styles.infoItem}>
                <FiClock style={styles.icon} />
                <span>{formatTime(meet.scheduled_date)}</span>
              </div>
              <div style={styles.infoItem}>
                {meet.meet_type === 'online' ? (
                  <>
                    <FiVideo style={styles.icon} />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <FiMapPin style={styles.icon} />
                    <span>Offline</span>
                  </>
                )}
              </div>
            </div>

            {meet.description && (
              <p style={styles.description}>{meet.description}</p>
            )}

            <button
              style={styles.joinButton}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/meets/${meet._id}`);
              }}
            >
              {meet.participation_status === 'completed'
                ? 'View Details'
                : meet.participation_status === 'joined'
                ? 'Continue'
                : 'Join Meet'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginTop: "2rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
  },
  viewAllButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    color: "#3b82f6",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  meetsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  meetCard: {
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "1.5rem",
    cursor: "pointer",
    transition: "all 0.2s",
    ":hover": {
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      transform: "translateY(-2px)",
    }
  },
  meetHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
  },
  meetTitle: {
    fontSize: "1.125rem",
    fontWeight: "600",
    color: "#1e293b",
    margin: 0,
    flex: 1,
  },
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.75rem",
    fontWeight: "600",
    marginLeft: "1rem",
  },
  meetInfo: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    marginBottom: "1rem",
  },
  infoItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#64748b",
    fontSize: "0.875rem",
  },
  icon: {
    fontSize: "1rem",
  },
  description: {
    color: "#64748b",
    fontSize: "0.875rem",
    marginBottom: "1rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
  },
  joinButton: {
    width: "100%",
    padding: "0.75rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.2s",
  },
  loadingContainer: {
    padding: "2rem",
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
    padding: "2rem",
    textAlign: "center",
    color: "#94a3b8",
    background: "#f8fafc",
    borderRadius: "12px",
  },
  emptyText: {
    marginTop: "1rem",
    fontSize: "0.875rem",
  },
  devNote: {
    marginTop: "1rem",
    padding: "0.75rem",
    background: "#fef3c7",
    border: "1px solid #f59e0b",
    borderRadius: "8px",
    textAlign: "left"
  },
  devText: {
    color: "#92400e",
    fontSize: "0.75rem",
    lineHeight: "1.4"
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
if (styleSheet) {
  try {
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
  } catch (e) {
    // Keyframe already exists
  }
}

export default CourseUpcomingMeets;
