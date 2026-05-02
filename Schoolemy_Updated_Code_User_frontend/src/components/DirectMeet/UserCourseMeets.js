import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserMeets } from "../../service/userCourseMeetApi";
import { 
  FiCalendar, 
  FiClock, 
  FiVideo, 
  FiMapPin, 
  FiSearch,
  FiFilter,
  FiArrowLeft
} from "react-icons/fi";

const UserCourseMeets = () => {
  const navigate = useNavigate();
  const [meets, setMeets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchMeets();
  }, [currentPage, search, statusFilter]);

  const fetchMeets = async () => {
    try {
      setLoading(true);
      const result = await getUserMeets(userId, {
        page: currentPage,
        limit: 12,
        search,
        status: statusFilter
      });

      if (result.success) {
        setMeets(result.meets);
        setPagination(result.pagination);
      }
    } catch (error) {
      console.error("Error fetching meets:", error);
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading your meets...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <button onClick={() => navigate('/Dashboard')} style={styles.backButton}>
        <FiArrowLeft /> Back to Dashboard
      </button>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>My Course Meets</h1>
          <p style={styles.subtitle}>Join live sessions for your enrolled courses</p>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <FiSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search meets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <FiFilter style={styles.filterIcon} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="not_joined">Not Joined</option>
            <option value="joined">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Meets Grid */}
      {meets.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}></div>
          <h3 style={styles.emptyTitle}>No meets found</h3>
          <p style={styles.emptyText}>
            {search || statusFilter 
              ? "Try adjusting your filters" 
              : "Your upcoming course meets will appear here"}
          </p>
        </div>
      ) : (
        <div style={styles.meetsGrid}>
          {meets.map((meet) => (
            <div
              key={meet._id}
              style={styles.meetCard}
              onClick={() => navigate(`/user/meets/${meet._id}`)}
            >
              {/* Header */}
              <div style={styles.cardHeader}>
                <span style={styles.courseCategory}>
                  {meet.course_id?.category || 'Course'}
                </span>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: getStatusColor(meet.participation_status)
                  }}
                >
                  {getStatusLabel(meet.participation_status)}
                </span>
              </div>

              {/* Title */}
              <h3 style={styles.meetTitle}>{meet.title}</h3>
              <p style={styles.courseName}>{meet.course_id?.coursename}</p>

              {/* Date & Time */}
              <div style={styles.dateTimeRow}>
                <div style={styles.dateTime}>
                  <FiCalendar style={styles.icon} />
                  <span>
                    {(meet.scheduled_date || meet.meet_date) 
                      ? formatDate(meet.scheduled_date || meet.meet_date)
                      : 'Not scheduled'}
                  </span>
                </div>
                <div style={styles.dateTime}>
                  <FiClock style={styles.icon} />
                  <span>
                    {(meet.scheduled_date || meet.meet_date)
                      ? formatTime(meet.scheduled_date || meet.meet_date)
                      : 'Not set'}
                  </span>
                </div>
              </div>

              {/* Meet Type */}
              <div style={styles.meetType}>
                {meet.meet_type === 'online' ? (
                  <>
                    <FiVideo style={styles.icon} />
                    <span>Online Meet</span>
                  </>
                ) : (
                  <>
                    <FiMapPin style={styles.icon} />
                    <span>{meet.location}</span>
                  </>
                )}
              </div>

              {/* Duration */}
              <div style={styles.duration}>
                Duration: {(meet.duration || meet.duration_minutes) 
                  ? `${meet.duration || meet.duration_minutes} minutes`
                  : 'Not set'}
              </div>

              {/* Action Button */}
              <button
                style={{
                  ...styles.actionButton,
                  ...(meet.participation_status === 'completed' && styles.completedButton)
                }}
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
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div style={styles.pagination}>
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            style={{
              ...styles.pageButton,
              ...(currentPage === 1 && styles.disabledButton)
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
              ...(currentPage === pagination.total_pages && styles.disabledButton)
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
  backButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "pointer",
    marginBottom: "2rem",
    fontWeight: 600,
    maxWidth: "1400px",
    margin: "0 auto 2rem auto",
  },
  header: {
    maxWidth: "1400px",
    margin: "0 auto 2rem",
  },
  title: {
    fontSize: "2rem",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#64748b",
    fontSize: "1rem",
  },
  filterBar: {
    maxWidth: "1400px",
    margin: "0 auto 2rem",
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  searchBox: {
    flex: "1",
    minWidth: "300px",
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#94a3b8",
    fontSize: "1.25rem",
  },
  searchInput: {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 3rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "white",
    fontSize: "1rem",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  filterIcon: {
    fontSize: "1.25rem",
    color: "#64748b",
  },
  filterSelect: {
    padding: "0.75rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
  },
  meetsGrid: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "1.5rem",
  },
  meetCard: {
    background: "white",
    borderRadius: "12px",
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    cursor: "pointer",
    transition: "all 0.3s",
    border: "1px solid #e2e8f0",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  courseCategory: {
    fontSize: "0.75rem",
    color: "#667eea",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  statusBadge: {
    padding: "0.25rem 0.75rem",
    borderRadius: "12px",
    color: "white",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  meetTitle: {
    fontSize: "1.25rem",
    color: "#1e293b",
    marginBottom: "0.5rem",
    fontWeight: 600,
  },
  courseName: {
    color: "#64748b",
    fontSize: "0.875rem",
    marginBottom: "1rem",
  },
  dateTimeRow: {
    display: "flex",
    gap: "1rem",
    marginBottom: "0.75rem",
  },
  dateTime: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#64748b",
    fontSize: "0.875rem",
  },
  meetType: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "#64748b",
    fontSize: "0.875rem",
    marginBottom: "0.75rem",
  },
  icon: {
    fontSize: "1rem",
  },
  duration: {
    fontSize: "0.875rem",
    color: "#94a3b8",
    marginBottom: "1rem",
  },
  actionButton: {
    width: "100%",
    padding: "0.75rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.3s",
  },
  completedButton: {
    background: "#10b981",
  },
  emptyState: {
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
    maxWidth: "1400px",
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

export default UserCourseMeets;