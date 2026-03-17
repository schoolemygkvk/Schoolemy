import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../../Utils/api";
import tutorCourseApi from "../../../../Utils/tutorCourseApi";
import { FaArrowLeft, FaCheck, FaTimes, FaEdit, FaTrash } from "react-icons/fa";

const TutorCourseDetail = () => {
  const { coursename } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [expandedLessons, setExpandedLessons] = useState({});
  const [expandedPdfs, setExpandedPdfs] = useState({});
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [actionModal, setActionModal] = useState({ open: false, type: null });
  const [reviewComment, setReviewComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token =
          localStorage.getItem("token") || localStorage.getItem("accessToken");
        if (!token) {
          setLoading(false);
          return;
        }

        const headers = token
          ? {
              Authorization: token.startsWith("Bearer")
                ? token
                : `Bearer ${token}`,
            }
          : {};

        const res = await api.get(
          `/courses-tutors/${encodeURIComponent(coursename)}`,
          { headers },
        );

        // Normalize lesson media structure (audioFile / videoFile / pdfFile)
        const normalizedCourse = {
          ...res.data,
          chapters: (res.data.chapters || []).map((chapter) => ({
            ...chapter,
            lessons: (chapter.lessons || []).map((lesson) => {
              const normalizedLesson = { ...lesson };

              const ensureArray = (value) => {
                if (!value) return [];
                if (Array.isArray(value)) return value;
                // If backend sent JSON string, try to parse
                if (typeof value === "string") {
                  try {
                    const parsed = JSON.parse(value);
                    return Array.isArray(parsed) ? parsed : [];
                  } catch {
                    return [];
                  }
                }
                return [];
              };

              normalizedLesson.audioFile = ensureArray(lesson.audioFile);
              normalizedLesson.videoFile = ensureArray(lesson.videoFile);
              normalizedLesson.pdfFile = ensureArray(lesson.pdfFile);

              return normalizedLesson;
            }),
          })),
        };

        setCourse(normalizedCourse);
      } catch (err) {
        console.error("Error fetching course:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();

    // Get user role from token
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (token) {
      try {
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          setUserRole(payload.role);
        }
      } catch (err) {
        console.error("Error parsing token:", err);
      }
    }
  }, [coursename]);

  // Helper function to get status badge info
  const getStatusBadge = (status) => {
    const statusMap = {
      pending_review: {
        color: "#856404",
        bgColor: "#fff3cd",
        text: "Under Review",
      },
      approved: { color: "#155724", bgColor: "#d4edda", text: "Approved" },
      changes_requested: {
        color: "#856404",
        bgColor: "#ffe0b2",
        text: "Changes Needed",
      },
      rejected: { color: "#721c24", bgColor: "#f8d7da", text: "Rejected" },
      draft: { color: "#6c757d", bgColor: "#e9ecef", text: "Draft" },
      pending: { color: "#856404", bgColor: "#fff3cd", text: "Pending" }, // Legacy support
    };
    return (
      statusMap[status] || {
        color: "#6c757d",
        bgColor: "#e9ecef",
        text: status || "Unknown",
      }
    );
  };

  // Check if user is admin
  const isAdmin = () => {
    return (
      userRole === "superadmin" ||
      userRole === "admin" ||
      userRole === "coursemanagement"
    );
  };

  // Handle admin actions
  const handleOpenActionModal = (type) => {
    setActionModal({ open: true, type });
    setReviewComment("");
    setMessage({ type: "", text: "" });
  };

  const handleCloseActionModal = () => {
    setActionModal({ open: false, type: null });
    setReviewComment("");
    setMessage({ type: "", text: "" });
  };

  const handleDeleteCourse = async () => {
    if (!course || !window.confirm(`Are you sure you want to delete "${course.coursename}"? This action cannot be undone.`)) return;
    try {
      const res = await tutorCourseApi.deleteTutorCourse(course._id, true);
      if (res.data?.success) {
        setMessage({ type: "success", text: "Course deleted successfully" });
        setTimeout(() => navigate(-1), 1500);
      }
    } catch (err) {
      console.error("Error deleting course:", err);
      setMessage({ type: "error", text: err.response?.data?.error || err.message || "Failed to delete course" });
    }
  };

  const handleAdminAction = async () => {
    if (!course) return;

    // Validate required comment for request-changes and reject
    if (
      (actionModal.type === "request-changes" ||
        actionModal.type === "reject") &&
      !reviewComment.trim()
    ) {
      setMessage({
        type: "error",
        text: "Review comment is required for this action.",
      });
      return;
    }

    setActionLoading(true);
    setMessage({ type: "", text: "" });

    try {
      let response;
      switch (actionModal.type) {
        case "approve":
          response = await tutorCourseApi.approveTutorCourse(
            course._id,
            reviewComment,
          );
          break;
        case "request-changes":
          response = await tutorCourseApi.requestChanges(
            course._id,
            reviewComment,
          );
          break;
        case "reject":
          response = await tutorCourseApi.rejectTutorCourse(
            course._id,
            reviewComment,
          );
          break;
        default:
          throw new Error("Invalid action type");
      }

      if (response.data?.success) {
        setMessage({
          type: "success",
          text: `Course ${actionModal.type === "approve" ? "approved" : actionModal.type === "request-changes" ? "changes requested" : "rejected"} successfully!`,
        });
        // Refresh course data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error(`Error ${actionModal.type}ing course:`, err);
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        `Failed to ${actionModal.type} course`;
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleChapter = (chapterIndex) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterIndex]: !prev[chapterIndex],
    }));
  };

  const toggleLesson = (chapterIndex, lessonIndex) => {
    setExpandedLessons((prev) => ({
      ...prev,
      [`${chapterIndex}-${lessonIndex}`]:
        !prev[`${chapterIndex}-${lessonIndex}`],
    }));
  };

  const togglePdf = (chapterIndex, lessonIndex, pdfIndex) => {
    setExpandedPdfs((prev) => ({
      ...prev,
      [`${chapterIndex}-${lessonIndex}-${pdfIndex}`]:
        !prev[`${chapterIndex}-${lessonIndex}-${pdfIndex}`],
    }));
  };

  // Styles
  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "2rem 1rem",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    header: {
      color: "#2c3e50",
      marginBottom: "2rem",
      fontSize: "2rem",
      fontWeight: "600",
      textAlign: "center",
    },
    loading: {
      textAlign: "center",
      fontSize: "1.2rem",
      color: "#7f8c8d",
      margin: "2rem 0",
    },
    courseCard: {
      backgroundColor: "#ffffff",
      borderRadius: "12px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      padding: "1.5rem",
      marginBottom: "2rem",
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    courseTitle: {
      color: "#3498db",
      marginBottom: "1rem",
      fontSize: "1.5rem",
      fontWeight: "600",
    },
    courseMeta: {
      display: "flex",
      flexWrap: "wrap",
      gap: "1rem",
      marginBottom: "1rem",
    },
    metaItem: {
      backgroundColor: "#f8f9fa",
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      fontSize: "0.9rem",
      color: "#34495e",
    },
    priceTag: {
      backgroundColor: "#e8f4fc",
      color: "#2980b9",
      fontWeight: "bold",
      padding: "0.5rem 1rem",
      borderRadius: "20px",
      display: "inline-block",
      margin: "0.5rem 0",
    },
    emiInfo: {
      backgroundColor: "#f0f8ff",
      padding: "1rem",
      borderRadius: "8px",
      margin: "0.5rem 0",
      border: "1px solid #b3d9ff",
    },
    emiTitle: {
      color: "#1e40af",
      fontSize: "1.1rem",
      fontWeight: "600",
      marginBottom: "0.5rem",
    },
    emiDetails: {
      display: "flex",
      flexDirection: "column",
      gap: "0.3rem",
      fontSize: "0.9rem",
      color: "#374151",
    },
    description: {
      color: "#34495e",
      lineHeight: "1.6",
      margin: "1rem 0",
    },
    instructor: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      margin: "1rem 0",
      color: "#7f8c8d",
      fontSize: "0.9rem",
    },
    chapterContainer: {
      marginTop: "1.5rem",
      borderTop: "1px solid #ecf0f1",
      paddingTop: "1rem",
    },
    chapterTitle: {
      color: "#2c3e50",
      margin: "1rem 0",
      fontSize: "1.2rem",
      fontWeight: "500",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      cursor: "pointer",
      padding: "0.8rem",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
      transition: "background-color 0.2s",
    },
    lessonItem: {
      marginLeft: "1.5rem",
      padding: "0.8rem",
      backgroundColor: "#f1f3f5",
      borderRadius: "8px",
      marginBottom: "0.8rem",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    lessonContent: {
      marginTop: "0.8rem",
      padding: "1rem",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      border: "1px solid #dee2e6",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
    mediaSection: {
      marginBottom: "1.5rem",
    },
    mediaTitle: {
      fontSize: "1rem",
      fontWeight: "600",
      marginBottom: "0.8rem",
      color: "#495057",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    audioItem: {
      marginBottom: "1.5rem",
      padding: "1rem",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
    },
    audioName: {
      fontWeight: "500",
      marginBottom: "0.5rem",
      color: "#343a40",
    },
    audioPlayer: {
      width: "100%",
      height: "40px",
      borderRadius: "20px",
      outline: "none",
    },
    pdfItem: {
      marginBottom: "1.5rem",
    },
    pdfList: {
      listStyle: "none",
      paddingLeft: "0",
    },
    pdfName: {
      fontWeight: "500",
      marginBottom: "0.5rem",
      color: "#343a40",
      cursor: "pointer",
      padding: "0.5rem",
      borderRadius: "4px",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    pdfViewer: {
      width: "100%",
      height: "500px",
      border: "1px solid #dee2e6",
      borderRadius: "8px",
    },
    noContent: {
      color: "#6c757d",
      fontStyle: "italic",
      textAlign: "center",
      padding: "1rem",
    },
    whatYoullLearn: {
      margin: "1.5rem 0",
      padding: "1rem",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
    },
    whatYoullLearnTitle: {
      color: "#2c3e50",
      marginBottom: "1rem",
      fontSize: "1.2rem",
      fontWeight: "600",
    },
    learnItem: {
      marginBottom: "0.5rem",
      paddingLeft: "1rem",
      position: "relative",
    },
  };

  if (loading) return <p style={styles.loading}>Loading course...</p>;
  if (!course)
    return (
      <p style={{ textAlign: "center", color: "red" }}>Course not found.</p>
    );

  return (
    <div style={styles.container}>
      <button
        onClick={() => navigate(-1)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px 16px",
          backgroundColor: "#f8f9fa",
          border: "none",
          borderRadius: "8px",
          color: "#2c3e50",
          cursor: "pointer",
          marginBottom: "20px",
          transition: "all 0.3s ease",
          fontSize: "14px",
          fontWeight: "500",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = "#e9ecef";
          e.currentTarget.style.transform = "translateX(-4px)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = "#f8f9fa";
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        <FaArrowLeft /> Back
      </button>

      {message.text && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: "16px",
            borderRadius: "8px",
            backgroundColor: message.type === "error" ? "#f8d7da" : "#d4edda",
            color: message.type === "error" ? "#721c24" : "#155724",
          }}
        >
          {message.text}
        </div>
      )}

      <h1
        style={{
          fontSize: "26px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 0",
          borderBottom: "2px solid #eee",
        }}
      >
        <span>{course.coursename}</span>
        {course.CourseMotherId && (
          <>
            <span>-</span>
            <span
              style={{
                position: "relative",
                color: "red",
                cursor: "pointer",
                display: "inline-block",
              }}
              onMouseEnter={(e) => {
                const tooltip = e.currentTarget.querySelector(".tooltip");
                if (tooltip) {
                  tooltip.style.visibility = "visible";
                  tooltip.style.opacity = 1;
                }
              }}
              onMouseLeave={(e) => {
                const tooltip = e.currentTarget.querySelector(".tooltip");
                if (tooltip) {
                  tooltip.style.visibility = "hidden";
                  tooltip.style.opacity = 0;
                }
              }}
            >
              {course.CourseMotherId}
              <span
                className="tooltip"
                style={{
                  visibility: "hidden",
                  opacity: 0,
                  transition: "opacity 0.3s",
                  position: "absolute",
                  bottom: "125%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  backgroundColor: "#333",
                  color: "#fff",
                  padding: "5px 8px",
                  borderRadius: "4px",
                  whiteSpace: "nowrap",
                  zIndex: 100,
                  fontSize: "12px",
                  pointerEvents: "none",
                }}
              >
                Mother ID
              </span>
            </span>
          </>
        )}
      </h1>

      <div style={styles.courseMeta}>
        {course.category && (
          <span style={styles.metaItem}>Category: {course.category}</span>
        )}
        {course.courseduration && (
          <span style={styles.metaItem}>Duration: {course.courseduration}</span>
        )}
        {course.level && (
          <span style={styles.metaItem}>Level: {course.level}</span>
        )}
        {course.language && (
          <span style={styles.metaItem}>Language: {course.language}</span>
        )}
        {course.certificates && (
          <span style={styles.metaItem}>
            Certificate: {course.certificates}
          </span>
        )}
        {course.status &&
          (() => {
            const statusBadge = getStatusBadge(course.status);
            return (
              <span
                style={{
                  ...styles.metaItem,
                  backgroundColor: statusBadge.bgColor,
                  color: statusBadge.color,
                }}
              >
                Status: {statusBadge.text}
              </span>
            );
          })()}
      </div>

      {course.price?.finalPrice && (
        <div style={styles.priceTag}>
          Price: ₹{course.price.finalPrice}
          {course.price?.discount > 0 && (
            <span> (Discount: {course.price.discount}%)</span>
          )}
        </div>
      )}

      {course.emi?.isAvailable && (
        <div style={styles.emiInfo}>
          <h4 style={styles.emiTitle}>EMI Available</h4>
          <div style={styles.emiDetails}>
            <span>Duration: {course.emi.emiDurationMonths} months</span>
            <span>Total Amount: ₹{course.emi.totalAmount}</span>
            <span>Monthly Amount: ₹{course.emi.monthlyAmount}</span>
            {course.emi.notes && <span>Notes: {course.emi.notes}</span>}
          </div>
        </div>
      )}

      {course.tutor && (
        <div style={styles.instructor}>
          <span>👨‍🏫 Tutor:</span>{" "}
          <strong>{course.tutor.name || course.tutor}</strong>
          {course.tutor.email && <span>({course.tutor.email})</span>}
        </div>
      )}

      {/* Review Information */}
      {(course.reviewComment || course.reviewedAt || course.reviewedBy) && (
        <div
          style={{
            margin: "1rem 0",
            padding: "1rem",
            backgroundColor:
              course.status === "rejected"
                ? "#fee"
                : course.status === "changes_requested"
                  ? "#fff3cd"
                  : "#d4edda",
            borderRadius: "8px",
            border: `1px solid ${course.status === "rejected" ? "#f5c6cb" : course.status === "changes_requested" ? "#ffeaa7" : "#c3e6cb"}`,
          }}
        >
          {course.reviewComment && (
            <div style={{ marginBottom: "0.5rem" }}>
              <strong
                style={{
                  color:
                    course.status === "rejected"
                      ? "#721c24"
                      : course.status === "changes_requested"
                        ? "#856404"
                        : "#155724",
                }}
              >
                Admin Feedback:
              </strong>
              <p
                style={{
                  margin: "0.5rem 0 0 0",
                  color:
                    course.status === "rejected"
                      ? "#721c24"
                      : course.status === "changes_requested"
                        ? "#856404"
                        : "#155724",
                  whiteSpace: "pre-wrap",
                }}
              >
                {course.reviewComment}
              </p>
            </div>
          )}
          {course.reviewedAt && (
            <div
              style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}
            >
              Reviewed:{" "}
              {new Date(course.reviewedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
          {course.reviewedBy && (
            <div style={{ fontSize: "0.9rem", color: "#666" }}>
              Reviewed by:{" "}
              {course.reviewedBy.name || course.reviewedBy.email || "Admin"}
            </div>
          )}
        </div>
      )}

      {/* Admin Action Buttons */}
      {isAdmin() && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            margin: "1rem 0",
            padding: "1rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            flexWrap: "wrap",
          }}
        >
          {course.status === "pending_review" && (
            <>
          <button
            onClick={() => handleOpenActionModal("approve")}
            style={{
              flex: 1,
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <FaCheck /> Approve Course
          </button>
          <button
            onClick={() => handleOpenActionModal("request-changes")}
            style={{
              flex: 1,
              padding: "10px 20px",
              backgroundColor: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <FaEdit /> Request Changes
          </button>
          <button
            onClick={() => handleOpenActionModal("reject")}
            style={{
              flex: 1,
              padding: "10px 20px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <FaTimes /> Reject Course
          </button>
            </>
          )}
          <button
            onClick={handleDeleteCourse}
            style={{
              padding: "10px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <FaTrash /> Delete Course
          </button>
        </div>
      )}

      {course.description && (
        <p style={styles.description}>{course.description}</p>
      )}

      {course.whatYoullLearn?.length > 0 && (
        <div style={styles.whatYoullLearn}>
          <h3 style={styles.whatYoullLearnTitle}>What You'll Learn</h3>
          <ul style={{ listStyle: "none", paddingLeft: "1rem" }}>
            {course.whatYoullLearn.map((item, index) => (
              <li key={index} style={styles.learnItem}>
                ✅ {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {course.chapters?.length > 0 && (
        <div style={styles.chapterContainer}>
          <h3>Course Content</h3>

          {course.chapters.map((chapter, chapterIndex) => (
            <div key={chapterIndex}>
              <div
                style={{
                  ...styles.chapterTitle,
                  backgroundColor: expandedChapters[chapterIndex]
                    ? "#e9ecef"
                    : "#f8f9fa",
                }}
                onClick={() => toggleChapter(chapterIndex)}
                onMouseEnter={(e) => {
                  if (!expandedChapters[chapterIndex]) {
                    e.currentTarget.style.backgroundColor = "#e9ecef";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!expandedChapters[chapterIndex]) {
                    e.currentTarget.style.backgroundColor = "#f8f9fa";
                  }
                }}
              >
                <span>{expandedChapters[chapterIndex] ? "📖" : "📘"}</span>{" "}
                {chapter.title}
              </div>

              {expandedChapters[chapterIndex] && (
                <div>
                  {chapter.lessons?.length > 0 ? (
                    chapter.lessons.map((lesson, lessonIndex) => (
                      <div key={lessonIndex}>
                        <div
                          style={{
                            ...styles.lessonItem,
                            backgroundColor: expandedLessons[
                              `${chapterIndex}-${lessonIndex}`
                            ]
                              ? "#e9ecef"
                              : "#f1f3f5",
                          }}
                          onClick={() =>
                            toggleLesson(chapterIndex, lessonIndex)
                          }
                          onMouseEnter={(e) => {
                            if (
                              !expandedLessons[`${chapterIndex}-${lessonIndex}`]
                            ) {
                              e.currentTarget.style.backgroundColor = "#e9ecef";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (
                              !expandedLessons[`${chapterIndex}-${lessonIndex}`]
                            ) {
                              e.currentTarget.style.backgroundColor = "#f1f3f5";
                            }
                          }}
                        >
                          <span>
                            {expandedLessons[`${chapterIndex}-${lessonIndex}`]
                              ? "🔽"
                              : "▶️"}
                          </span>{" "}
                          {lesson.lessonname}
                        </div>

                        {expandedLessons[`${chapterIndex}-${lessonIndex}`] && (
                          <div style={styles.lessonContent}>
                            {/* Audio Files */}
                            {lesson.audioFile?.length > 0 ? (
                              <div style={styles.mediaSection}>
                                <h4 style={styles.mediaTitle}>
                                  🔊 Audio Files
                                </h4>
                                {lesson.audioFile.map((audio, audioIndex) => (
                                  <div
                                    key={audioIndex}
                                    style={styles.audioItem}
                                  >
                                    <div style={styles.audioName}>
                                      {audio.name || `Audio ${audioIndex + 1}`}
                                    </div>
                                    <audio controls style={styles.audioPlayer}>
                                      <source
                                        src={audio.url}
                                        type="audio/mpeg"
                                      />
                                      Your browser does not support the audio
                                      element.
                                    </audio>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p style={styles.noContent}>
                                No audio files for this lesson
                              </p>
                            )}

                            {/* Video Files */}
                            {lesson.videoFile?.length > 0 && (
                              <div style={styles.mediaSection}>
                                <h4 style={styles.mediaTitle}>
                                  🎥 Video Files
                                </h4>
                                {lesson.videoFile.map((video, videoIndex) => (
                                  <div
                                    key={videoIndex}
                                    style={styles.audioItem}
                                  >
                                    <div style={styles.audioName}>
                                      {video.name || `Video ${videoIndex + 1}`}
                                    </div>
                                    <video
                                      controls
                                      style={{
                                        width: "100%",
                                        maxHeight: "400px",
                                        borderRadius: "8px",
                                      }}
                                    >
                                      <source
                                        src={video.url}
                                        type="video/mp4"
                                      />
                                      Your browser does not support the video
                                      element.
                                    </video>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* PDF Files */}
                            {lesson.pdfFile?.length > 0 ? (
                              <div style={styles.mediaSection}>
                                <h4 style={styles.mediaTitle}>📄 PDF Files</h4>
                                <ul style={styles.pdfList}>
                                  {lesson.pdfFile.map((pdf, pdfIndex) => (
                                    <li key={pdfIndex}>
                                      <div
                                        style={{
                                          ...styles.pdfName,
                                          backgroundColor: expandedPdfs[
                                            `${chapterIndex}-${lessonIndex}-${pdfIndex}`
                                          ]
                                            ? "#e9ecef"
                                            : "transparent",
                                        }}
                                        onClick={() =>
                                          togglePdf(
                                            chapterIndex,
                                            lessonIndex,
                                            pdfIndex,
                                          )
                                        }
                                        onMouseEnter={(e) => {
                                          if (
                                            !expandedPdfs[
                                              `${chapterIndex}-${lessonIndex}-${pdfIndex}`
                                            ]
                                          ) {
                                            e.currentTarget.style.backgroundColor =
                                              "#f1f3f5";
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (
                                            !expandedPdfs[
                                              `${chapterIndex}-${lessonIndex}-${pdfIndex}`
                                            ]
                                          ) {
                                            e.currentTarget.style.backgroundColor =
                                              "transparent";
                                          }
                                        }}
                                      >
                                        <span>
                                          {expandedPdfs[
                                            `${chapterIndex}-${lessonIndex}-${pdfIndex}`
                                          ]
                                            ? "📂"
                                            : "📄"}
                                        </span>{" "}
                                        {pdf.name || `PDF ${pdfIndex + 1}`}
                                      </div>
                                      {expandedPdfs[
                                        `${chapterIndex}-${lessonIndex}-${pdfIndex}`
                                      ] && (
                                        <iframe
                                          src={pdf.url}
                                          title={`PDF-${pdfIndex}`}
                                          style={styles.pdfViewer}
                                        />
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p style={styles.noContent}>
                                No PDF files for this lesson
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={styles.noContent}>No lessons in this chapter</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Admin Action Modal */}
      {actionModal.open && course && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleCloseActionModal}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
              {actionModal.type === "approve" && "Approve Course"}
              {actionModal.type === "request-changes" && "Request Changes"}
              {actionModal.type === "reject" && "Reject Course"}
            </h3>
            <p style={{ marginBottom: "16px", color: "#666" }}>
              Course: <strong>{course.coursename}</strong>
            </p>
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                Review Comment
                {(actionModal.type === "request-changes" ||
                  actionModal.type === "reject") && (
                  <span style={{ color: "red" }}> *</span>
                )}
              </label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={
                  actionModal.type === "approve"
                    ? "Optional: Add a comment..."
                    : "Required: Please provide feedback..."
                }
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                }}
                required={
                  actionModal.type === "request-changes" ||
                  actionModal.type === "reject"
                }
              />
            </div>
            {message.text && (
              <div
                style={{
                  padding: "12px",
                  marginBottom: "16px",
                  borderRadius: "4px",
                  backgroundColor:
                    message.type === "error" ? "#f8d7da" : "#d4edda",
                  color: message.type === "error" ? "#721c24" : "#155724",
                }}
              >
                {message.text}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={handleCloseActionModal}
                disabled={actionLoading}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: actionLoading ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAdminAction}
                disabled={
                  actionLoading ||
                  ((actionModal.type === "request-changes" ||
                    actionModal.type === "reject") &&
                    !reviewComment.trim())
                }
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    actionModal.type === "approve"
                      ? "#28a745"
                      : actionModal.type === "request-changes"
                        ? "#ff9800"
                        : "#dc3545",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    actionLoading ||
                    ((actionModal.type === "request-changes" ||
                      actionModal.type === "reject") &&
                      !reviewComment.trim())
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    actionLoading ||
                    ((actionModal.type === "request-changes" ||
                      actionModal.type === "reject") &&
                      !reviewComment.trim())
                      ? 0.6
                      : 1,
                }}
              >
                {actionLoading ? (
                  "Processing..."
                ) : (
                  <>
                    {actionModal.type === "approve" && "Approve"}
                    {actionModal.type === "request-changes" &&
                      "Request Changes"}
                    {actionModal.type === "reject" && "Reject"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorCourseDetail;
