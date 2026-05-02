import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../service/api";
import {
  FiArrowLeft,
  FiFileText,
  FiDownload,
  FiLock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:8000";
const ADMIN_API_URL =
  process.env.REACT_APP_ADMIN_API_URL ||
  "http://localhost:8000";

const UserMeetMaterials = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meet, setMeet] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [attendanceInfo, setAttendanceInfo] = useState(null);

  useEffect(() => {
    console.log("Meet ID from URL params:", id);
    if (id && id !== ":id") {
      fetchMeetAndMaterials();
    } else {
      console.error("Invalid meet ID:", id);
      setLoading(false);
    }
  }, [id]);

  const fetchMeetAndMaterials = async () => {
    try {
      // SECURITY FIX 3.32.1: Tokens in cookies - no localStorage needed
      const userId = localStorage.getItem("userId");

      console.log("Fetching materials for meet ID:", id, "User ID:", userId);

      // Fetch materials with access check from admin backend (S3 materials)
      const materialsResponse = await api.get(
        `/api/course-meets/materials/s3/${id}?user_id=${userId}`,
      );

      if (materialsResponse.data.success) {
        setMaterials(materialsResponse.data.materials);
        setHasAccess(materialsResponse.data.has_access);
        setAttendanceInfo(materialsResponse.data.attendance_info);
      }

      // Fetch meet details from admin backend
      try {
        const meetResponse = await api.get(
          `/api/course-meets/meets/${id}`,
        );

        if (meetResponse.data.success) {
          setMeet(meetResponse.data.meet);
        }
      } catch (meetError) {
        console.log(
          "Could not fetch meet details, continuing with materials only",
        );
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      if (error.response?.status === 403) {
        setHasAccess(false);
        setAttendanceInfo(error.response.data.attendance_info);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getFileIcon = (fileType) => {
    if (fileType === "pdf") return "";
    if (fileType === "video") return "";
    if (fileType === "audio") return "";
    if (fileType === "image") return "";
    if (fileType === "document") return "";
    return "";
  };

  const handleDownload = async (material) => {
    try {
      // Fetch the file as a blob
      const response = await fetch(material.download_url);
      const blob = await response.blob();

      // SECURITY FIX 3.29.1: Trigger download without DOM manipulation
      // Removed: document.body.appendChild/removeChild (unsafe DOM manipulation)
      // Using: Synthetic MouseEvent dispatch instead
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = material.file_name || "download";
      const clickEvent = new MouseEvent("click", { bubbles: true });
      link.dispatchEvent(clickEvent);

      // Cleanup
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Download error:", error);
      // Fallback: open in new tab
      window.open(material.download_url, "_blank");
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading materials...</p>
      </div>
    );
  }

  if (!id || id === ":id") {
    return (
      <div style={styles.error}>
        <h2>Invalid Meet ID</h2>
        <p>Please navigate to this page from a valid meet details page.</p>
        <button
          onClick={() => navigate("/user/meets")}
          style={styles.backButton}
        >
          Go to Meets List
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button
          onClick={() => navigate(`/user/meets/${id}`)}
          style={styles.backButton}
        >
          <FiArrowLeft /> Back to Meet Details
        </button>
      </div>

      {/* Meet Info */}
      {meet && (
        <div style={styles.meetCard}>
          <h2 style={styles.meetTitle}>{meet.title}</h2>
          <p style={styles.meetInfo}>
            {meet.course_name} • {new Date(meet.meet_date).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Access Status - Hidden since all enrolled users have access */}

      {/* Materials List */}
      <div style={styles.materialsCard}>
        <h3 style={styles.materialsTitle}>
          Study Materials ({materials.length})
        </h3>

        {materials.length === 0 ? (
          <div style={styles.emptyState}>
            <FiFileText style={styles.emptyIcon} />
            <p>No materials uploaded yet</p>
          </div>
        ) : (
          <div style={styles.materialsList}>
            {materials.map((material) => (
              <div
                key={material._id || material.id}
                style={styles.materialCard}
              >
                <div style={styles.materialIcon}>
                  {getFileIcon(material.file_type)}
                </div>
                <div style={styles.materialInfo}>
                  <div style={styles.materialHeader}>
                    <h4 style={styles.materialTitle}>{material.title}</h4>
                    {material.day_number && (
                      <span style={styles.dayBadge}>
                        Day {material.day_number}
                      </span>
                    )}
                  </div>
                  {material.description && (
                    <p style={styles.materialDescription}>
                      {material.description}
                    </p>
                  )}
                  {material.material_date && (
                    <p style={styles.materialDate}>
                       Material for:{" "}
                      {new Date(material.material_date).toLocaleDateString()}
                    </p>
                  )}
                  <div style={styles.materialMeta}>
                    <span>{material.file_name}</span>
                    <span>•</span>
                    <span>{formatFileSize(material.file_size)}</span>
                    <span>•</span>
                    <span>
                      Uploaded:{" "}
                      {new Date(
                        material.uploaded_at || material.createdAt,
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div style={styles.materialActions}>
                  <a
                    href={material.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.viewButton}
                    title="View Material"
                  >
                    <FiFileText />
                    View
                  </a>
                  <button
                    onClick={() => handleDownload(material)}
                    style={styles.downloadButton}
                    title="Download Material"
                  >
                    <FiDownload />
                    Download
                  </button>
                </div>
              </div>
            ))}
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
  },
  meetCard: {
    maxWidth: "1200px",
    margin: "0 auto 2rem",
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  meetTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    marginBottom: "0.5rem",
  },
  meetInfo: {
    color: "#64748b",
    fontSize: "1rem",
  },
  noAccessCard: {
    maxWidth: "1200px",
    margin: "0 auto 2rem",
    background: "#fef3c7",
    border: "2px solid #fbbf24",
    padding: "2rem",
    borderRadius: "12px",
    textAlign: "center",
  },
  noAccessIcon: {
    fontSize: "3rem",
    color: "#f59e0b",
    marginBottom: "1rem",
  },
  noAccessTitle: {
    fontSize: "1.5rem",
    color: "#92400e",
    marginBottom: "0.5rem",
  },
  noAccessMessage: {
    fontSize: "1rem",
    color: "#78350f",
    marginBottom: "1rem",
  },
  attendanceStatus: {
    background: "white",
    padding: "1rem",
    borderRadius: "8px",
    textAlign: "left",
    marginTop: "1rem",
  },
  successText: {
    color: "#10b981",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  errorText: {
    color: "#ef4444",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  materialsCard: {
    maxWidth: "1200px",
    margin: "0 auto",
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  materialsTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    marginBottom: "1.5rem",
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
  materialsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  materialCard: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1.5rem",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  materialIcon: {
    fontSize: "2.5rem",
  },
  materialInfo: {
    flex: 1,
  },
  materialHeader: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "0.5rem",
  },
  materialTitle: {
    fontSize: "1.125rem",
    color: "#1e293b",
    fontWeight: 600,
    margin: 0,
  },
  dayBadge: {
    padding: "0.25rem 0.75rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    borderRadius: "12px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  materialDate: {
    fontSize: "0.875rem",
    color: "#10b981",
    fontWeight: 600,
    marginBottom: "0.5rem",
  },
  materialDescription: {
    fontSize: "0.875rem",
    color: "#64748b",
    marginBottom: "0.5rem",
  },
  materialMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    fontSize: "0.75rem",
    color: "#94a3b8",
    alignItems: "center",
  },
  materialActions: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    minWidth: "120px",
  },
  viewButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "#3b82f6",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.2s ease",
  },
  downloadButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.5rem",
    background: "#10b981",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    transition: "all 0.2s ease",
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
    borderTop: "3px solid #10b981",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "1rem",
  },
  error: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#ef4444",
    padding: "2rem",
    textAlign: "center",
  },
};

export default UserMeetMaterials;
