import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";
import { FaArrowLeft } from "react-icons/fa";
import { getToken } from "../../../Hooks/useToken";

const CourseDetail = () => {
  const { coursename } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [expandedLessons, setExpandedLessons] = useState({});
  const [expandedPdfs, setExpandedPdfs] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const token = getToken();
        const res = await axios.get(
          `/courses-tutors/${encodeURIComponent(coursename)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Normalize Mongoose/API shape: lessonName, courseDuration, previewvideo, etc.
        const ensureArray = (value) => {
          if (!value) return [];
          if (Array.isArray(value)) return value;
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

        const normalizedCourse = {
          ...res.data,
          courseduration:
            res.data.courseduration ||
            res.data.courseDuration ||
            "",
          courseDuration:
            res.data.courseDuration ||
            res.data.courseduration ||
            "",
          thumbnail: res.data.thumbnail || null,
          previewvideo:
            res.data.previewvideo ||
            res.data.previewVideo ||
            null,
          chapters: (res.data.chapters || []).map((chapter) => ({
            ...chapter,
            lessons: (chapter.lessons || []).map((lesson) => {
              const normalizedLesson = { ...lesson };

              normalizedLesson.audioFile = ensureArray(lesson.audioFile);
              normalizedLesson.videoFile = ensureArray(lesson.videoFile);
              normalizedLesson.pdfFile = ensureArray(lesson.pdfFile);

              const title =
                lesson.lessonname ?? lesson.lessonName ?? "";
              normalizedLesson.lessonname = title;
              normalizedLesson.lessonName = lesson.lessonName ?? title;

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
  }, [coursename]);

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
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
      },
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
      "&:hover": {
        backgroundColor: "#e9ecef",
      },
    },
    lessonItem: {
      marginLeft: "1.5rem",
      padding: "0.8rem",
      backgroundColor: "#f1f3f5",
      borderRadius: "8px",
      marginBottom: "0.8rem",
      cursor: "pointer",
      transition: "background-color 0.2s",
      "&:hover": {
        backgroundColor: "#e9ecef",
      },
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
      "&:hover": {
        backgroundColor: "#f1f3f5",
      },
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
      "&:before": {
        content: "'✓'",
        position: "absolute",
        left: "0",
        color: "#27ae60",
      },
    },
    editButton: {
      marginLeft: "1rem",
      padding: "0.5rem 1rem",
      backgroundColor: "#007bff",
      color: "white",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
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
        <span>{course.coursename} - </span>

        <span
          style={{
            position: "relative",
            color: "red",
            cursor: "pointer",
            display: "inline-block",
          }}
          onMouseEnter={(e) => {
            const tooltip = e.currentTarget.querySelector(".tooltip");
            tooltip.style.visibility = "visible";
            tooltip.style.opacity = 1;
          }}
          onMouseLeave={(e) => {
            const tooltip = e.currentTarget.querySelector(".tooltip");
            tooltip.style.visibility = "hidden";
            tooltip.style.opacity = 0;
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

        <button
          style={{
            marginLeft: "auto",
            backgroundColor: "#1890ff",
            color: "#fff",
            border: "none",
            padding: "6px 14px",
            borderRadius: "5px",
            fontSize: "14px",
            cursor: "pointer",
          }}
          onClick={() =>
            navigate(
              `/schoolemy/tutor-edit-course/${encodeURIComponent(course.coursename)}`
            )
          }
        >
          ✏️ Edit Course
        </button>
      </h1>

      <div style={styles.courseMeta}>
        <span style={styles.metaItem}>Category: {course.category}</span>
        <span style={styles.metaItem}>
          Duration:{" "}
          {course.courseduration || course.courseDuration || "—"}
        </span>
        <span style={styles.metaItem}>Level: {course.level}</span>
        <span style={styles.metaItem}>Language: {course.language}</span>
        <span style={styles.metaItem}>Certificate: {course.certificates}</span>
      </div>

      <div style={styles.priceTag}>
        Price: ₹{course.price?.finalPrice}
        {course.price?.discount > 0 && (
          <span> (Discount: {course.price?.discount}%)</span>
        )}
      </div>

      {(course.thumbnail || course.previewvideo) && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.25rem",
            marginBottom: "1.5rem",
            padding: "1rem",
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
          }}
        >
          {course.thumbnail && (
            <div>
              <p
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: "0.5rem",
                }}
              >
                Course thumbnail
              </p>
              <img
                src={course.thumbnail}
                alt="Course thumbnail"
                style={{
                  maxWidth: "min(100%, 360px)",
                  maxHeight: "200px",
                  borderRadius: "10px",
                  objectFit: "cover",
                  border: "1px solid #e2e8f0",
                }}
              />
            </div>
          )}
          {course.previewvideo && (
            <div>
              <p
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: "0.5rem",
                }}
              >
                Preview video
              </p>
              <video
                src={course.previewvideo}
                controls
                style={{
                  maxWidth: "min(100%, 420px)",
                  maxHeight: "240px",
                  borderRadius: "10px",
                  backgroundColor: "#000",
                }}
              />
            </div>
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

      {course.instructor && (
        <div style={styles.instructor}>
          <span>Instructor:</span> <strong>{course.instructor.name}</strong>{" "}
          {course.instructor.role && <span>({course.instructor.role})</span>}
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
                {item}
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
                style={styles.chapterTitle}
                onClick={() => toggleChapter(chapterIndex)}
              >
                <span>{expandedChapters[chapterIndex] ? "[-]" : "[+]"}</span>{" "}
                {chapter.title}
              </div>

              {expandedChapters[chapterIndex] && (
                <div>
                  {chapter.lessons?.length > 0 ? (
                    chapter.lessons.map((lesson, lessonIndex) => (
                      <div key={lessonIndex}>
                        <div
                          style={styles.lessonItem}
                          onClick={() =>
                            toggleLesson(chapterIndex, lessonIndex)
                          }
                        >
                          <span>
                            {expandedLessons[`${chapterIndex}-${lessonIndex}`]
                              ? "[-]"
                              : "[+]"}
                          </span>{" "}
                          {lesson.lessonname ||
                            lesson.lessonName ||
                            "Lesson"}
                        </div>

                        {expandedLessons[`${chapterIndex}-${lessonIndex}`] && (
                          <div style={styles.lessonContent}>
                            {/* Audio Files */}
                            {lesson.audioFile?.length > 0 ? (
                              <div style={styles.mediaSection}>
                                <h4 style={styles.mediaTitle}>
                                  Audio Files
                                </h4>
                                {lesson.audioFile.map((audio, audioIndex) => (
                                  <div
                                    key={audioIndex}
                                    style={styles.audioItem}
                                  >
                                    <div style={styles.audioName}>
                                      {audio.name}
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

                            {/* Video files */}
                            {lesson.videoFile?.length > 0 && (
                              <div style={styles.mediaSection}>
                                <h4 style={styles.mediaTitle}>
                                  Video files ({lesson.videoFile.length})
                                </h4>
                                {lesson.videoFile.map((video, videoIndex) => {
                                  const videoData =
                                    typeof video === "string"
                                      ? { name: "Video", url: video }
                                      : video;
                                  if (!videoData?.url) return null;
                                  return (
                                    <div
                                      key={videoIndex}
                                      style={styles.audioItem}
                                    >
                                      <div style={styles.audioName}>
                                        {videoData.name || "Video"}
                                      </div>
                                      <video
                                        controls
                                        style={{
                                          width: "100%",
                                          maxWidth: "640px",
                                          borderRadius: "8px",
                                          backgroundColor: "#000",
                                        }}
                                        preload="metadata"
                                      >
                                        <source
                                          src={videoData.url}
                                          type="video/mp4"
                                        />
                                        Your browser does not support video.
                                      </video>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* PDF Files */}
                            {lesson.pdfFile?.length > 0 ? (
                              <div style={styles.mediaSection}>
                                <h4 style={styles.mediaTitle}>PDF Files</h4>
                                <ul style={styles.pdfList}>
                                  {lesson.pdfFile.map((pdf, pdfIndex) => (
                                    <li key={pdfIndex}>
                                      <div
                                        style={styles.pdfName}
                                        onClick={() =>
                                          togglePdf(
                                            chapterIndex,
                                            lessonIndex,
                                            pdfIndex
                                          )
                                        }
                                      >
                                        <span>
                                          {expandedPdfs[
                                            `${chapterIndex}-${lessonIndex}-${pdfIndex}`
                                          ]
                                            ? "[-]"
                                            : "[+]"}
                                        </span>{" "}
                                        {pdf.name}
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
    </div>
  );
};

export default CourseDetail;
