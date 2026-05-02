import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAllMeets, deleteCourseMeet } from "../../../Utils/courseMeetApi";
import { 
  FiPlus, 
  FiSearch, 
  FiEdit3, 
  FiTrash2, 
  FiEye, 
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiMapPin,
  FiVideo,
  FiFileText,
  FiArrowLeft,
} from "react-icons/fi";

const ViewCourseMeets = () => {
  const navigate = useNavigate();
  const [meets, setMeets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchMeets = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter,
      };

      const result = await getAllMeets(params);
      if (result.success) {
        setMeets(result.meets);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error("Error fetching meets:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchMeets();
  }, [fetchMeets]);

  const handleDelete = async (meetId) => {
    try {
      const result = await deleteCourseMeet(meetId);
      if (result.success) {
        fetchMeets();
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error("Error deleting meet:", error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled": return "#3b82f6";
      case "ongoing": return "#10b981";
      case "completed": return "#6b7280";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <div style={styles.backButtonContainer}>
        <button onClick={() => navigate("/schoolemy/DM_Dashboard")} style={styles.backButton}>
          <FiArrowLeft /> Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Course Meets</h1>
          <p style={styles.subtitle}>Manage all course-based meetings</p>
        </div>
        <button
          onClick={() => navigate("/schoolemy/create-course-meet")}
          style={styles.createButton}
        >
          <FiPlus /> Create Meet
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filtersCard}>
        <div style={styles.searchBox}>
          <FiSearch style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by title, course, or ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={styles.filterSelect}
        >
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="text"
          placeholder="Filter by category..."
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setCurrentPage(1);
          }}
          style={styles.filterSelect}
        />
      </div>

      {/* Meets List */}
      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner} />
          <p>Loading meets...</p>
        </div>
      ) : meets.length === 0 ? (
        <div style={styles.emptyState}>
          <FiCalendar style={styles.emptyIcon} />
          <h3>No meets found</h3>
          <p>Create your first course meet to get started</p>
          <button
            onClick={() => navigate("/schoolemy/create-course-meet")}
            style={styles.createButton}
          >
            <FiPlus /> Create Meet
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {meets.map((meet) => (
            <div key={meet._id} style={styles.meetCard}>
              {/* Card Header */}
              <div style={styles.cardHeader}>
                <div>
                  <h3 style={styles.meetTitle}>{meet.title}</h3>
                  <p style={styles.courseName}>{meet.course_name}</p>
                  <span style={styles.categoryBadge}>{meet.category}</span>
                </div>
                <span
                  style={{
                    ...styles.statusBadge,
                    background: getStatusColor(meet.status),
                  }}
                >
                  {meet.status}
                </span>
              </div>

              {/* Card Body */}
              <div style={styles.cardBody}>
                <div style={styles.infoRow}>
                  <FiCalendar style={styles.infoIcon} />
                  <span>{formatDate(meet.meet_date)} at {meet.meet_time}</span>
                </div>
                
                {/* Meet Type and Location/Link */}
                <div style={styles.infoRow}>
                  {meet.meet_type === "online" ? (
                    <>
                      <FiVideo style={styles.infoIcon} />
                      <span>Online Meet</span>
                    </>
                  ) : (
                    <>
                      <FiMapPin style={styles.infoIcon} />
                      <span>Offline - {meet.location || "Location TBA"}</span>
                    </>
                  )}
                </div>
                
                <div style={styles.infoRow}>
                  <FiUsers style={styles.infoIcon} />
                  <span>
                    {meet.participant_count || 0} participants •{" "}
                    {meet.attended_count || 0} attended
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <FiDollarSign style={styles.infoIcon} />
                  <span>
                    {meet.price > 0 ? `₹${meet.price}` : "Free"}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div style={styles.cardFooter}>
                <button
                  onClick={() => navigate(`/schoolemy/course-meet-details/${meet._id}`)}
                  style={styles.actionButton}
                  title="View Details"
                >
                  <FiEye style={styles.actionIcon} />
                </button>
                <button
                  onClick={() => navigate(`/schoolemy/edit-course-meet/${meet._id}`)}
                  style={styles.actionButton}
                  title="Edit"
                >
                  <FiEdit3 style={styles.actionIcon} />
                </button>
                <button
                  onClick={() => navigate(`/schoolemy/course-meet-attendance/${meet._id}`)}
                  style={{...styles.actionButton, color: "#10b981"}}
                  title="Attendance"
                >
                  <FiUsers style={styles.actionIcon} />
                </button>
                <button
                  onClick={() => navigate(`/schoolemy/course-meet-materials/${meet._id}`)}
                  style={{...styles.actionButton, color: "#3b82f6"}}
                  title="Materials"
                >
                  <FiFileText style={styles.actionIcon} />
                </button>
                <button
                  onClick={() => setDeleteConfirm(meet._id)}
                  style={{...styles.actionButton, color: "#ef4444"}}
                  title="Delete"
                >
                  <FiTrash2 style={styles.actionIcon} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={styles.paginationButton}
          >
            Previous
          </button>
          <span style={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Confirm Deletion</h3>
            <p style={styles.modalText}>
              Are you sure you want to delete this meet? This will cancel the meet and notify all participants.
            </p>
            <div style={styles.modalActions}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={styles.modalCancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={styles.modalDeleteButton}
              >
                Delete
              </button>
            </div>
          </div>
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
  backButtonContainer: {
    maxWidth: "1400px",
    margin: "0 auto 1rem",
  },
  backButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  header: {
    maxWidth: "1400px",
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
    marginBottom: "0.25rem",
  },
  subtitle: {
    color: "#64748b",
    fontSize: "1rem",
  },
  createButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.2s",
  },
  filtersCard: {
    maxWidth: "1400px",
    margin: "0 auto 2rem",
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    gap: "1rem",
    flexWrap: "wrap",
  },
  searchBox: {
    position: "relative",
    flex: 1,
    minWidth: "200px",
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
    fontSize: "1rem",
  },
  filterSelect: {
    padding: "0.75rem 1rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
    background: "white",
    cursor: "pointer",
  },
  grid: {
    maxWidth: "1400px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "1.5rem",
  },
  meetCard: {
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    overflow: "hidden",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  cardHeader: {
    padding: "1.5rem",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  meetTitle: {
    fontSize: "1.25rem",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  courseName: {
    color: "#64748b",
    fontSize: "0.875rem",
    marginBottom: "0.5rem",
  },
  categoryBadge: {
    display: "inline-block",
    padding: "0.25rem 0.75rem",
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  statusBadge: {
    padding: "0.25rem 0.75rem",
    color: "white",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  cardBody: {
    padding: "1.5rem",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.75rem",
    color: "#64748b",
    fontSize: "0.875rem",
  },
  infoIcon: {
    fontSize: "1.125rem",
    color: "#94a3b8",
  },
  cardFooter: {
    padding: "1rem 1.5rem",
    borderTop: "1px solid #e2e8f0",
    display: "flex",
    gap: "0.5rem",
  },
  actionButton: {
    padding: "0.5rem",
    background: "transparent",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    color: "#64748b",
    fontSize: "1.125rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  actionIcon: {
    fontSize: "1.5rem",
  },
  loading: {
    maxWidth: "1400px",
    margin: "4rem auto",
    textAlign: "center",
    color: "#64748b",
  },
  spinner: {
    width: "50px",
    height: "50px",
    border: "3px solid #e2e8f0",
    borderTop: "3px solid #667eea",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto 1rem",
  },
  emptyState: {
    maxWidth: "1400px",
    margin: "4rem auto",
    textAlign: "center",
    color: "#64748b",
  },
  emptyIcon: {
    fontSize: "4rem",
    color: "#cbd5e1",
    marginBottom: "1rem",
  },
  pagination: {
    maxWidth: "1400px",
    margin: "2rem auto 0",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
  },
  paginationButton: {
    padding: "0.5rem 1rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    color: "#64748b",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  pageInfo: {
    color: "#64748b",
    fontSize: "0.875rem",
  },
  modal: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    maxWidth: "400px",
    width: "90%",
  },
  modalTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    marginBottom: "1rem",
  },
  modalText: {
    color: "#64748b",
    marginBottom: "1.5rem",
  },
  modalActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  },
  modalCancelButton: {
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "pointer",
  },
  modalDeleteButton: {
    padding: "0.75rem 1.5rem",
    background: "#ef4444",
    border: "none",
    borderRadius: "8px",
    color: "white",
    cursor: "pointer",
  },
};

export default ViewCourseMeets;
