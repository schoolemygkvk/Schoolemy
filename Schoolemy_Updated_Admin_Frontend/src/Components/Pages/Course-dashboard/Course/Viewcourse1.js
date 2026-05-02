import React, { useEffect, useState } from "react";
import axios from "../../../../Utils/api";
import { hasStoredSession } from "../../../../Utils/security";
import {
  FaChartLine,
  FaFolderOpen,
  FaArrowLeft,
  FaClock,
} from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useNavigate } from "react-router-dom";

// Generate dynamic gradient header color using HSL
const getDynamicColor = (index) => {
  const hue = (index * 57) % 360;
  return `linear-gradient(to right, hsl(${hue}, 70%, 50%), hsl(${
    (hue + 30) % 360
  }, 70%, 60%))`;
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
};

// Get course age string: "X days old" | "X months old" | "X years, Y days old"
const getCourseAge = (createdAt) => {
  if (!createdAt) return null;
  try {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} old`;
    }
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} old`;
    }
    const years = Math.floor(diffDays / 365);
    const remainingDays = diffDays % 365;
    if (remainingDays === 0) {
      return `${years} year${years !== 1 ? "s" : ""} old`;
    }
    return `${years} year${years !== 1 ? "s" : ""}, ${remainingDays} day${remainingDays !== 1 ? "s" : ""} old`;
  } catch {
    return null;
  }
};

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [navigating, setNavigating] = useState(false);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [confirmCourseName, setConfirmCourseName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [successMessage, setSuccessMessage] = useState(null);

  const navigate = useNavigate();

  const fetchCourses = async () => {
    if (!hasStoredSession()) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    try {
      const response = await axios.get("/api/courses/getcoursesname");

      // Handle both array and object responses
      let coursesData = response.data;

      if (!Array.isArray(coursesData)) {
        // If it's an object, try to extract the courses array
        if (coursesData.courses && Array.isArray(coursesData.courses)) {
          coursesData = coursesData.courses;
        } else if (typeof coursesData === "object") {
          // Convert object to array if needed
          coursesData = Object.values(coursesData);
        } else {
          coursesData = [];
        }
      }

      setCourses(coursesData);
      setError(""); // Clear any previous errors
    } catch (err) {
      console.error("Fetch courses error:", err.message);

      let errorMsg = "Failed to fetch courses. ";
      if (err.response?.status === 404) {
        errorMsg +=
          "API endpoint not found. Check if backend is running and route is mounted at /api";
      } else if (err.response?.status === 401) {
        errorMsg += "Unauthorized. Please login again.";
      } else if (err.code === "ERR_NETWORK") {
        errorMsg +=
          "Cannot connect to backend. Check REACT_APP_API_URL in .env.development";
      } else {
        errorMsg += err.message || "Unknown error";
      }

      setError(errorMsg);
      setCourses([]); // Set empty array on error
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleOpenDeleteModal = (course, e) => {
    // prevent card click navigation
    if (e) {
      e.stopPropagation();
    }
    setCourseToDelete(course);
    setConfirmCourseName("");
    setDeleteError("");
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    if (deleteLoading) return;
    setShowDeleteModal(false);
    setCourseToDelete(null);
    setConfirmCourseName("");
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    if (confirmCourseName !== courseToDelete.coursename) {
      setDeleteError(
        "Course name does not match exactly. Please type it exactly as shown.",
      );
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError("");

      // Delete course using coursename in URL
      const response = await axios.delete(
        `/api/course/delete/${encodeURIComponent(courseToDelete.coursename)}`,
      );

      // Check if deletion was successful
      if (response.data && response.data.success) {
        // Get deletion details
        const details = response.data.details || {};

        // Close modal first
        handleCloseDeleteModal();

        // Refresh the course list to show remaining courses
        await fetchCourses();

        // Show success message with deletion details
        setSuccessMessage({
          title: "Course Deleted Successfully!",
          details: {
            questionPapers: details.questionPapersDeleted || 0,
            s3Files: details.s3FilesDeleted || 0,
          },
        });

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        throw new Error(response.data?.error || "Failed to delete course");
      }
    } catch (err) {
      console.error(err);
      // Extract error message from response
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Failed to delete course. Please try again.";
      setDeleteError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (navigating) {
    return (
      <div
        style={{
          textAlign: "center",
          marginTop: "100px",
          fontSize: "18px",
          color: "#3498db",
        }}
      >
        Loading course details...
      </div>
    );
  }

  const isDeleteDisabled =
    !courseToDelete ||
    confirmCourseName !== courseToDelete.coursename ||
    deleteLoading;

  return (
    <div
      style={{
        padding: "20px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "sans-serif",
      }}
    >
      <button
        onClick={() => navigate("/")}
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

      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          fontSize: "28px",
          color: "#2c3e50",
        }}
      >
        Courses - List
      </h2>

      {error && (
        <p
          style={{
            color: "#e74c3c",
            backgroundColor: "#f9d6d5",
            padding: "10px",
            borderRadius: "6px",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          {error}
        </p>
      )}

      {successMessage && (
        <div
          style={{
            backgroundColor: "#d4edda",
            border: "2px solid #28a745",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "20px",
            boxShadow: "0 2px 8px rgba(40, 167, 69, 0.2)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "24px",
                    lineHeight: 1,
                  }}
                >
                  
                </span>
                <h3
                  style={{
                    margin: 0,
                    color: "#155724",
                    fontSize: "18px",
                    fontWeight: 600,
                  }}
                >
                  {successMessage.title}
                </h3>
              </div>
              <div
                style={{
                  color: "#155724",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  marginLeft: "34px",
                }}
              >
                <div style={{ marginBottom: "4px" }}>
                  <strong>Deleted:</strong>
                </div>
                <div style={{ marginLeft: "12px" }}>
                  • {successMessage.details.questionPapers} question paper(s)
                </div>
                <div style={{ marginLeft: "12px" }}>
                  • {successMessage.details.s3Files} file(s) from S3
                </div>
              </div>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#155724",
                fontSize: "20px",
                cursor: "pointer",
                padding: "0",
                width: "24px",
                height: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "4px",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(21, 87, 36, 0.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        {Array.isArray(courses) && courses.length > 0 ? (
          courses.map((course, index) => (
            <div
              key={course._id}
              onClick={() => {
                setNavigating(true);
                navigate(
                  `/schoolemy/course-list/${encodeURIComponent(course.coursename)}`,
                );
              }}
              style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                minHeight: "220px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  background: course.thumbnail
                    ? `url(${course.thumbnail}) center/cover`
                    : getDynamicColor(index),
                  padding: "16px",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  minHeight: "100px",
                  position: "relative",
                  backgroundBlendMode: "overlay",
                  backgroundColor: "rgba(0,0,0,0.4)",
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "16px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "200px",
                      textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    {course.coursename}
                  </h3>
                  {course.previewVideo && (
                    <div
                      style={{
                        fontSize: "11px",
                        marginTop: "8px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        width: "fit-content",
                      }}
                    >
                      ▶ Preview available
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => handleOpenDeleteModal(course, e)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    margin: 0,
                    cursor: "pointer",
                    color: "#fdfdfd",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="More options"
                >
                  <BsThreeDotsVertical size={18} />
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    fontSize: "11px",
                    color: "#64748b",
                    letterSpacing: "0.01em",
                  }}
                >
                  {course.chapters && course.chapters.length > 0 && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 10px",
                        backgroundColor: "#f0f4f8",
                        borderRadius: "6px",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ fontWeight: 500, color: "#475569" }}>
                        📚 Chapters & Lessons
                      </span>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>
                        {course.chapters.length} chapter
                        {course.chapters.length !== 1 ? "s" : ""} •{" "}
                        {course.chapters.reduce(
                          (total, ch) => total + (ch.lessons?.length || 0),
                          0,
                        )}{" "}
                        lesson
                        {course.chapters.reduce(
                          (total, ch) => total + (ch.lessons?.length || 0),
                          0,
                        ) !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>
                  )}
                  {course.createdAt && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: 500, color: "#94a3b8" }}>
                        Created
                      </span>
                      <span style={{ fontWeight: 600, color: "#334155" }}>
                        {formatDate(course.createdAt)}
                      </span>
                    </div>
                  )}
                  {course.updatedAt && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: 500, color: "#94a3b8" }}>
                        Updated
                      </span>
                      <span style={{ fontWeight: 600, color: "#334155" }}>
                        {formatDate(course.updatedAt)}
                      </span>
                    </div>
                  )}
                </div>
                {getCourseAge(course.createdAt) && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      background:
                        "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "6px",
                        background:
                          "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        flexShrink: 0,
                        boxShadow: "0 2px 4px rgba(37, 99, 235, 0.3)",
                      }}
                    >
                      <FaClock size={12} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: 600,
                          color: "#64748b",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          marginBottom: "1px",
                        }}
                      >
                        Course Age
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 700,
                          color: "#1e293b",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {getCourseAge(course.createdAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  padding: "10px 16px",
                  gap: "10px",
                  borderTop: "1px solid #eee",
                }}
              >
                <FaChartLine style={{ cursor: "pointer", color: "#7f8c8d" }} />
                <FaFolderOpen style={{ cursor: "pointer", color: "#7f8c8d" }} />
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              color: "#999",
              gridColumn: "1 / -1",
            }}
          >
            {error ? error : "No courses available"}
          </div>
        )}
      </div>

      {showDeleteModal && courseToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={handleCloseDeleteModal}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              width: "100%",
              maxWidth: "520px",
              padding: "24px 28px 20px",
              boxShadow: "0 20px 45px rgba(0, 0, 0, 0.25)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "999px",
                background:
                  "radial-gradient(circle at 30% 30%, #ffecec, #ffe0e0 45%, #f8b3b3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "18px",
              }}
            >
              <span
                style={{
                  color: "#c0392b",
                  fontSize: "30px",
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                !
              </span>
            </div>

            <h3
              style={{
                margin: 0,
                marginBottom: "8px",
                fontSize: "22px",
                fontWeight: 700,
                color: "#2c3e50",
              }}
            >
              Delete this course permanently?
            </h3>

            <p
              style={{
                margin: 0,
                marginBottom: "16px",
                fontSize: "14px",
                lineHeight: 1.5,
                color: "#5f6c79",
              }}
            >
              This action will{" "}
              <span style={{ fontWeight: 600, color: "#c0392b" }}>
                permanently erase all data
              </span>{" "}
              for the course{" "}
              <span style={{ fontWeight: 600 }}>
                {courseToDelete.coursename}
              </span>
              . This cannot be undone.
            </p>

            {courseToDelete.chapters && courseToDelete.chapters.length > 0 && (
              <div
                style={{
                  padding: "14px 16px",
                  marginBottom: "16px",
                  borderRadius: "10px",
                  backgroundColor: "#fff5f5",
                  border: "1px solid #f8c9c9",
                }}
              >
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#c0392b",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span>Warning:</span>
                  <span>
                    All chapters and their Questions will be permanently
                    deleted:
                  </span>
                </div>
                <div
                  style={{
                    maxHeight: "180px",
                    overflowY: "auto",
                    padding: "8px",
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px dashed #f0b1b1",
                  }}
                >
                  {courseToDelete.chapters.map((chapter, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "8px 10px",
                        marginBottom:
                          idx < courseToDelete.chapters.length - 1
                            ? "6px"
                            : "0",
                        backgroundColor: "#fff5f5",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "#8e3b3b",
                        border: "1px solid #f8c9c9",
                      }}
                    >
                      • {chapter}
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: "10px",
                    fontSize: "12px",
                    color: "#8e3b3b",
                    fontStyle: "italic",
                  }}
                >
                  Total chapters: {courseToDelete.chapters.length}
                </div>
              </div>
            )}

            <div
              style={{
                padding: "12px 14px",
                marginBottom: "12px",
                borderRadius: "10px",
                backgroundColor: "#fff5f5",
                border: "1px solid #f8c9c9",
                fontSize: "13px",
                color: "#8e3b3b",
              }}
            >
              To confirm, please type the course name exactly as shown,
              including spaces and letter case:
              <div
                style={{
                  marginTop: "6px",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  border: "1px dashed #f0b1b1",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "#c0392b",
                }}
              >
                {courseToDelete.coursename}
              </div>
            </div>

            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#34495e",
                marginBottom: "6px",
              }}
            >
              Course name confirmation
            </label>
            <input
              type="text"
              value={confirmCourseName}
              onChange={(e) => {
                setConfirmCourseName(e.target.value);
                if (deleteError) setDeleteError("");
              }}
              placeholder="Re-type the course name exactly"
              style={{
                width: "100%",
                padding: "9px 11px",
                borderRadius: "8px",
                border: "1px solid #d0d7de",
                fontSize: "14px",
                outline: "none",
                marginBottom: deleteError ? "4px" : "14px",
              }}
            />

            {deleteError && (
              <div
                style={{
                  color: "#c0392b",
                  fontSize: "12px",
                  marginBottom: "10px",
                }}
              >
                {deleteError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <button
                onClick={handleCloseDeleteModal}
                disabled={deleteLoading}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #d0d7de",
                  backgroundColor: "#ffffff",
                  color: "#34495e",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                  minWidth: "90px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleteDisabled}
                style={{
                  padding: "8px 18px",
                  borderRadius: "8px",
                  border: "none",
                  background: isDeleteDisabled
                    ? "linear-gradient(90deg, #f5b7b1, #f5b7b1)"
                    : "linear-gradient(90deg, #e74c3c, #c0392b)",
                  boxShadow: isDeleteDisabled
                    ? "none"
                    : "0 8px 18px rgba(192, 57, 43, 0.35)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: isDeleteDisabled ? "not-allowed" : "pointer",
                  minWidth: "130px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                {deleteLoading ? "Deleting..." : "Delete course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseList;
