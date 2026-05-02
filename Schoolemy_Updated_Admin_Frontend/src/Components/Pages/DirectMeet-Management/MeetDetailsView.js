import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMeetById } from "../../../Utils/courseMeetApi";
import axios from "../../../Utils/api";
import { getToken } from "../../../Hooks/useToken";
import {
  FiArrowLeft,
  FiCalendar,
  FiClock,
  FiUsers,
  FiDollarSign,
  FiMapPin,
  FiVideo,
  FiFileText,
  FiUpload,
  FiEye,
  FiDownload,
  FiCheckCircle,
} from "react-icons/fi";

const MeetDetailsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meet, setMeet] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details"); // details, participants, materials

  useEffect(() => {
    fetchMeetDetails();
    fetchMaterials();
    fetchParticipants();
  }, [id]);

  const fetchMeetDetails = async () => {
    try {
      const result = await getMeetById(id);
      if (result.success) {
        setMeet(result.meet);
      }
    } catch (error) {
      console.error("Error fetching meet details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`/api/course-meets/materials/meet/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setMaterials(response.data.materials);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`/api/course-meets/attendance/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setParticipants(response.data.participants);
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching participants:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMeetStartTime = () => {
    if (!meet?.meet_date) return "N/A";
    return formatTime(meet.meet_date);
  };

  const getMeetEndTime = () => {
    if (!meet?.meet_date || !meet?.duration_minutes) return "N/A";
    const endTime = new Date(new Date(meet.meet_date).getTime() + meet.duration_minutes * 60000);
    return formatTime(endTime);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "scheduled":
        return "#3b82f6";
      case "ongoing":
        return "#10b981";
      case "completed":
        return "#6b7280";
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getAttendanceColor = (status) => {
    switch (status) {
      case "joined":
        return "#10b981";
      case "completed":
        return "#3b82f6";
      case "absent":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading meet details...</p>
      </div>
    );
  }

  if (!meet) {
    return (
      <div style={styles.container}>
        <div style={styles.errorCard}>
          <h2>Meet not found</h2>
          <button onClick={() => navigate("/schoolemy/course-meets")} style={styles.backButton}>
            <FiArrowLeft /> Back to Meets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate("/schoolemy/course-meets")} style={styles.backButton}>
          <FiArrowLeft /> Back
        </button>
        <div style={styles.headerActions}>
          <button
            onClick={() => navigate(`/schoolemy/edit-course-meet/${id}`)}
            style={styles.editButton}
          >
            Edit Meet
          </button>
          <button
            onClick={() => navigate(`/schoolemy/course-meet-materials/${id}`)}
            style={styles.uploadButton}
          >
            <FiUpload /> Upload Material
          </button>
        </div>
      </div>

      {/* Meet Title Card */}
      <div style={styles.titleCard}>
        <div style={styles.titleSection}>
          <h1 style={styles.meetTitle}>{meet.title}</h1>
          <p style={styles.courseName}>{meet.course_name}</p>
          <div style={styles.badgeContainer}>
            <span style={styles.categoryBadge}>{meet.category}</span>
            <span
              style={{
                ...styles.statusBadge,
                background: getStatusColor(meet.status),
              }}
            >
              {meet.status}
            </span>
          </div>
        </div>
        <div style={styles.meetIdContainer}>
          <span style={styles.meetIdLabel}>Meet ID</span>
          <span style={styles.meetId}>{meet.meet_id}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("details")}
          style={{
            ...styles.tab,
            ...(activeTab === "details" ? styles.activeTab : {}),
          }}
        >
          <FiFileText /> Details
        </button>
        <button
          onClick={() => setActiveTab("participants")}
          style={{
            ...styles.tab,
            ...(activeTab === "participants" ? styles.activeTab : {}),
          }}
        >
          <FiUsers /> Participants ({stats.total || 0})
        </button>
        <button
          onClick={() => setActiveTab("materials")}
          style={{
            ...styles.tab,
            ...(activeTab === "materials" ? styles.activeTab : {}),
          }}
        >
          <FiFileText /> Materials ({materials.length})
        </button>
      </div>

      {/* Tab Content */}
      <div style={styles.content}>
        {activeTab === "details" && (
          <div style={styles.detailsGrid}>
            {/* Basic Info */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>Meeting Information</h3>
              <div style={styles.infoRow}>
                <FiCalendar style={styles.icon} />
                <div>
                  <span style={styles.infoLabel}>Date</span>
                  <span style={styles.infoValue}>{formatDate(meet.meet_date)}</span>
                </div>
              </div>
              <div style={styles.infoRow}>
                <FiClock style={styles.icon} />
                <div>
                  <span style={styles.infoLabel}>Time</span>
                  <span style={styles.infoValue}>
                    {meet.meet_time} ({meet.duration_minutes} minutes)
                  </span>
                </div>
              </div>
              <div style={styles.infoRow}>
                <FiClock style={styles.icon} />
                <div>
                  <span style={styles.infoLabel}>Start - End Time</span>
                  <span style={styles.infoValue}>
                    {getMeetStartTime()} - {getMeetEndTime()}
                  </span>
                </div>
              </div>
              <div style={styles.infoRow}>
                <FiCalendar style={styles.icon} />
                <div>
                  <span style={styles.infoLabel}>Attendance Window</span>
                  <span style={styles.infoValue}>
                    {meet.attendance_days_limit || 7} days
                  </span>
                </div>
              </div>
              <div style={styles.infoRow}>
                {meet.meet_type === "online" ? <FiVideo style={styles.icon} /> : <FiMapPin style={styles.icon} />}
                <div>
                  <span style={styles.infoLabel}>
                    {meet.meet_type === "online" ? "Meeting Link" : "Location"}
                  </span>
                  {meet.meet_type === "online" ? (
                    <a href={meet.meet_link} target="_blank" rel="noopener noreferrer" style={styles.link}>
                      {meet.meet_link}
                    </a>
                  ) : (
                    <span style={styles.infoValue}>{meet.location}</span>
                  )}
                </div>
              </div>
              <div style={styles.infoRow}>
                <FiDollarSign style={styles.icon} />
                <div>
                  <span style={styles.infoLabel}>Price</span>
                  <span style={styles.infoValue}>
                    {meet.price > 0 ? `₹${meet.price}` : "Free"}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>Description</h3>
              <p style={styles.description}>{meet.description}</p>
            </div>

            {/* Statistics */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>Attendance Statistics</h3>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <div style={styles.statValue}>{stats.total || 0}</div>
                  <div style={styles.statLabel}>Total Assigned</div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statValue, color: "#10b981" }}>{stats.joined || 0}</div>
                  <div style={styles.statLabel}>Joined</div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statValue, color: "#3b82f6" }}>{stats.completed || 0}</div>
                  <div style={styles.statLabel}>Completed</div>
                </div>
                <div style={styles.statCard}>
                  <div style={{ ...styles.statValue, color: "#ef4444" }}>{stats.absent || 0}</div>
                  <div style={styles.statLabel}>Absent</div>
                </div>
              </div>
            </div>

            {/* Material Access Policy */}
            <div style={styles.infoCard}>
              <h3 style={styles.cardTitle}>Material Access Policy</h3>
              <p style={styles.description}>
                {meet.material_access_type === "attended_only"
                  ? "Only users who attended can access study materials"
                  : "All assigned users can access study materials"}
              </p>
            </div>
          </div>
        )}

        {activeTab === "participants" && (
          <div style={styles.participantsContainer}>
            <div style={styles.participantsHeader}>
              <h3 style={styles.cardTitle}>Participant List</h3>
              <button
                onClick={() => navigate(`/schoolemy/course-meet-attendance/${id}`)}
                style={styles.viewButton}
              >
                <FiEye /> View Full Attendance
              </button>
            </div>
            {participants.length === 0 ? (
              <div style={styles.emptyState}>
                <FiUsers style={styles.emptyIcon} />
                <p>No participants assigned yet</p>
              </div>
            ) : (
              <div style={styles.participantsList}>
                {participants.slice(0, 10).map((participant) => (
                  <div key={participant._id} style={styles.participantCard}>
                    <div>
                      <div style={styles.participantName}>{participant.user_id?.name || "N/A"}</div>
                      <div style={styles.participantEmail}>{participant.user_id?.email}</div>
                    </div>
                    <span
                      style={{
                        ...styles.attendanceBadge,
                        background: getAttendanceColor(participant.attendance_status),
                      }}
                    >
                      {participant.attendance_status}
                    </span>
                  </div>
                ))}
                {participants.length > 10 && (
                  <button
                    onClick={() => navigate(`/schoolemy/course-meet-attendance/${id}`)}
                    style={styles.viewAllButton}
                  >
                    View All {participants.length} Participants
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "materials" && (
          <div style={styles.materialsContainer}>
            <div style={styles.materialsHeader}>
              <h3 style={styles.cardTitle}>Study Materials</h3>
              <button
                onClick={() => navigate(`/schoolemy/course-meet-materials/${id}`)}
                style={styles.uploadButton}
              >
                <FiUpload /> Upload New Material
              </button>
            </div>
            {materials.length === 0 ? (
              <div style={styles.emptyState}>
                <FiFileText style={styles.emptyIcon} />
                <p>No materials uploaded yet</p>
                <button
                  onClick={() => navigate(`/schoolemy/course-meet-materials/${id}`)}
                  style={styles.uploadButton}
                >
                  <FiUpload /> Upload First Material
                </button>
              </div>
            ) : (
              <div style={styles.materialsList}>
                {materials.map((material) => (
                  <div key={material._id} style={styles.materialCard}>
                    <div style={styles.materialIcon}>
                      <FiFileText />
                    </div>
                    <div style={styles.materialInfo}>
                      <h4 style={styles.materialTitle}>{material.title}</h4>
                      <p style={styles.materialDescription}>{material.description}</p>
                      <div style={styles.materialMeta}>
                        <span>{material.file_name}</span>
                        <span>•</span>
                        <span>{(material.file_size / 1024 / 1024).toFixed(2)} MB</span>
                        <span>•</span>
                        <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={styles.downloadButton}
                      title="Download"
                    >
                      <FiDownload />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
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
    maxWidth: "1200px",
    margin: "0 auto 2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
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
  headerActions: {
    display: "flex",
    gap: "1rem",
  },
  editButton: {
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  uploadButton: {
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
  },
  titleCard: {
    maxWidth: "1200px",
    margin: "0 auto 2rem",
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "1rem",
  },
  titleSection: {
    flex: 1,
  },
  meetTitle: {
    fontSize: "2rem",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  courseName: {
    fontSize: "1.1rem",
    color: "#64748b",
    marginBottom: "1rem",
  },
  badgeContainer: {
    display: "flex",
    gap: "0.5rem",
  },
  categoryBadge: {
    padding: "0.5rem 1rem",
    background: "#f1f5f9",
    color: "#475569",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 600,
  },
  statusBadge: {
    padding: "0.5rem 1rem",
    color: "white",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  meetIdContainer: {
    textAlign: "right",
  },
  meetIdLabel: {
    display: "block",
    fontSize: "0.875rem",
    color: "#94a3b8",
    marginBottom: "0.25rem",
  },
  meetId: {
    display: "block",
    fontSize: "1.5rem",
    color: "#1e293b",
    fontWeight: 700,
  },
  tabs: {
    maxWidth: "1200px",
    margin: "0 auto 2rem",
    display: "flex",
    gap: "1rem",
    background: "white",
    padding: "1rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "transparent",
    border: "none",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  activeTab: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
  },
  content: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  detailsGrid: {
    display: "grid",
    gap: "1.5rem",
  },
  infoCard: {
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  cardTitle: {
    fontSize: "1.25rem",
    color: "#1e293b",
    marginBottom: "1.5rem",
    fontWeight: 600,
  },
  infoRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  icon: {
    fontSize: "1.5rem",
    color: "#667eea",
    marginTop: "0.25rem",
  },
  infoLabel: {
    display: "block",
    fontSize: "0.875rem",
    color: "#94a3b8",
    marginBottom: "0.25rem",
  },
  infoValue: {
    display: "block",
    fontSize: "1rem",
    color: "#1e293b",
    fontWeight: 500,
  },
  link: {
    display: "block",
    fontSize: "1rem",
    color: "#667eea",
    textDecoration: "none",
    wordBreak: "break-all",
  },
  description: {
    fontSize: "1rem",
    color: "#64748b",
    lineHeight: 1.6,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "1rem",
  },
  statCard: {
    textAlign: "center",
    padding: "1.5rem",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  statValue: {
    fontSize: "2rem",
    color: "#1e293b",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  statLabel: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  participantsContainer: {
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  participantsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  viewButton: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 1rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "pointer",
  },
  participantsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  participantCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  participantName: {
    fontSize: "1rem",
    color: "#1e293b",
    fontWeight: 500,
    marginBottom: "0.25rem",
  },
  participantEmail: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  attendanceBadge: {
    padding: "0.25rem 0.75rem",
    color: "white",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "capitalize",
  },
  viewAllButton: {
    width: "100%",
    padding: "0.75rem",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  materialsContainer: {
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  materialsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  materialsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  materialCard: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1rem",
    background: "#f8fafc",
    borderRadius: "8px",
  },
  materialIcon: {
    fontSize: "2rem",
    color: "#667eea",
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    fontSize: "1rem",
    color: "#1e293b",
    fontWeight: 600,
    marginBottom: "0.25rem",
  },
  materialDescription: {
    fontSize: "0.875rem",
    color: "#64748b",
    marginBottom: "0.5rem",
  },
  materialMeta: {
    display: "flex",
    gap: "0.5rem",
    fontSize: "0.75rem",
    color: "#94a3b8",
  },
  downloadButton: {
    padding: "0.75rem",
    background: "#667eea",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "1.25rem",
    cursor: "pointer",
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    color: "#64748b",
  },
  emptyIcon: {
    fontSize: "4rem",
    color: "#cbd5e1",
    marginBottom: "1rem",
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
  errorCard: {
    maxWidth: "600px",
    margin: "4rem auto",
    background: "white",
    padding: "3rem",
    borderRadius: "12px",
    textAlign: "center",
  },
};

export default MeetDetailsView;
