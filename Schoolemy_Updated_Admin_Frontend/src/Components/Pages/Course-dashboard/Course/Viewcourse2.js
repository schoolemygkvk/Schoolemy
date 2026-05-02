import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../../../Utils/api";
import { FaArrowLeft } from "react-icons/fa";

const normalizeMediaUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const input = rawUrl.trim();
  if (!input) return "";
  if (input.startsWith("blob:") || input.startsWith("data:")) return input;

  const normalizePath = (pathname) =>
    pathname
      .split("/")
      .map((segment) => {
        if (!segment) return "";
        try {
          return encodeURIComponent(decodeURIComponent(segment));
        } catch {
          return encodeURIComponent(segment);
        }
      })
      .join("/");

  try {
    const parsed = new URL(input);
    parsed.pathname = normalizePath(parsed.pathname);
    return parsed.toString();
  } catch {
    try {
      return encodeURI(input);
    } catch {
      return input;
    }
  }
};

const CourseDetail = () => {
  const { coursename } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState({});
  const [expandedLessons, setExpandedLessons] = useState({});
  const [expandedPdfs, setExpandedPdfs] = useState({});
  const [pdfViewerMode, setPdfViewerMode] = useState({}); // Track which viewer to use for each PDF
  const [pdfViewerErrors, setPdfViewerErrors] = useState({}); // Track viewer errors
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await axios.get(
          `/api/courses/courses/${encodeURIComponent(coursename)}`,
        );
        
        // Parse any JSON strings in lesson files
        const parsedCourse = {
          ...res.data,
          chapters: res.data.chapters?.map((chapter) => {
            return {
              ...chapter,
              lessons: chapter.lessons?.map((lesson) => {
                const parsedLesson = { ...lesson };
                
                // Normalize media URLs to avoid broken playback from malformed encoding.
                const fixFileArrayUrls = (files) => {
                  if (!Array.isArray(files)) return files;
                  return files.map(file => {
                    if (file && file.url) {
                      return {
                        ...file,
                        url: normalizeMediaUrl(file.url)
                      };
                    }
                    if (typeof file === "string") {
                      return normalizeMediaUrl(file);
                    }
                    return file;
                  });
                };
                
                // Parse audioFile if it's a string
                if (typeof parsedLesson.audioFile === 'string') {
                  try {
                    parsedLesson.audioFile = JSON.parse(parsedLesson.audioFile);
                  } catch (e) {
                    parsedLesson.audioFile = [];
                  }
                } else if (!Array.isArray(parsedLesson.audioFile)) {
                  parsedLesson.audioFile = [];
                }
                
                // Parse videoFile if it's a string
                if (typeof parsedLesson.videoFile === 'string') {
                  try {
                    parsedLesson.videoFile = JSON.parse(parsedLesson.videoFile);
                  } catch (e) {
                    parsedLesson.videoFile = [];
                  }
                } else if (!Array.isArray(parsedLesson.videoFile)) {
                  parsedLesson.videoFile = [];
                }
                
                // Parse pdfFile if it's a string
                if (typeof parsedLesson.pdfFile === 'string') {
                  try {
                    parsedLesson.pdfFile = JSON.parse(parsedLesson.pdfFile);
                  } catch (e) {
                    parsedLesson.pdfFile = [];
                  }
                } else if (!Array.isArray(parsedLesson.pdfFile)) {
                  parsedLesson.pdfFile = [];
                }
                
                // Fix double-encoded URLs in all file arrays
                parsedLesson.audioFile = fixFileArrayUrls(parsedLesson.audioFile);
                parsedLesson.videoFile = fixFileArrayUrls(parsedLesson.videoFile);
                parsedLesson.pdfFile = fixFileArrayUrls(parsedLesson.pdfFile);

                // Mongoose schema uses lessonName; UI expects lessonname
                const title =
                  parsedLesson.lessonname ?? parsedLesson.lessonName ?? "";
                parsedLesson.lessonname = title;
                parsedLesson.lessonName = parsedLesson.lessonName ?? title;

                return parsedLesson;
              }) || [],
            };
          }) || [],
        };
        
        setCourse(parsedCourse);
      } catch (err) {
        console.error("Error fetching course:", err.message);
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

  const switchPdfViewer = (chapterIndex, lessonIndex, pdfIndex, mode) => {
    setPdfViewerMode((prev) => ({
      ...prev,
      [`${chapterIndex}-${lessonIndex}-${pdfIndex}`]: mode,
    }));
    // Clear any previous errors for this PDF
    setPdfViewerErrors((prev) => ({
      ...prev,
      [`${chapterIndex}-${lessonIndex}-${pdfIndex}`]: null,
    }));
  };

  const handlePdfViewerError = (chapterIndex, lessonIndex, pdfIndex, viewerType, error) => {
    console.error(`${viewerType} PDF viewer failed for ${chapterIndex}-${lessonIndex}-${pdfIndex}:`, error);

    setPdfViewerErrors((prev) => ({
      ...prev,
      [`${chapterIndex}-${lessonIndex}-${pdfIndex}`]: {
        type: viewerType,
        error: error.message || 'Unknown error',
        timestamp: Date.now()
      },
    }));

    // Auto-switch to alternative viewer if Google fails
    if (viewerType === 'Google Docs') {
      console.log('Auto-switching to Direct PDF viewer due to Google Docs failure');
      setTimeout(() => {
        switchPdfViewer(chapterIndex, lessonIndex, pdfIndex, 'direct');
      }, 1000); // Small delay to show error first
    } else if (viewerType === 'Direct Iframe') {
      console.log('Direct PDF viewer also failed. Showing download options only.');
      // No auto-switch needed, the error overlay will show download instructions
    }
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
    videoItem: {
      marginBottom: "1.5rem",
      padding: "1rem",
      backgroundColor: "#f8f9fa",
      borderRadius: "8px",
    },
    videoName: {
      fontWeight: "500",
      marginBottom: "0.5rem",
      color: "#343a40",
    },
    videoPlayer: {
      width: "100%",
      maxWidth: "600px",
      height: "auto",
      borderRadius: "8px",
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
              `/schoolemy/edit-course/${encodeURIComponent(course.coursename)}`
            )
          }
        >
          Edit Course
        </button>
      </h1>

      <div style={styles.courseMeta}>
        <span style={styles.metaItem}>Category: {course.category}</span>
        <span style={styles.metaItem}>Duration: {course.courseduration}</span>
        <span style={styles.metaItem}>Level: {course.level}</span>
        <span style={styles.metaItem}>Language: {course.language}</span>
        <span style={styles.metaItem}>Certificate: {course.certificates}</span>
      </div>

      {/* Thumbnail Display */}
      {course.thumbnail && (
        <div
          style={{
            marginTop: "1.5rem",
            marginBottom: "1.5rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            padding: "1.5rem",
            border: "1px solid #e0e0e0",
          }}
        >
          <h4 style={{ color: "#3730a3", marginBottom: "1rem" }}>
            📸 Course Thumbnail
          </h4>
          <img
            src={normalizeMediaUrl(course.thumbnail)}
            alt="Course Thumbnail"
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              borderRadius: "8px",
              objectFit: "cover",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          />
        </div>
      )}

      {/* Preview Video Display */}
      {course.previewVideo && (
        <div
          style={{
            marginTop: "1.5rem",
            marginBottom: "1.5rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "12px",
            padding: "1.5rem",
            border: "1px solid #e0e0e0",
          }}
        >
          <h4 style={{ color: "#3730a3", marginBottom: "1rem" }}>
            ▶ Preview Video
          </h4>
          <video
            style={{
              maxWidth: "100%",
              maxHeight: "400px",
              borderRadius: "8px",
              backgroundColor: "#000",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
            controls
            src={normalizeMediaUrl(course.previewVideo)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      <div style={styles.priceTag}>
        Price: ₹{course.price?.finalPrice}
        {course.price?.discount > 0 && (
          <span> (Discount: {course.price?.discount}%)</span>
        )}
      </div>

      {/* Price Breakdown */}
      {course.price?.breakdown && (
        <div
          style={{
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            padding: "1.5rem",
            marginTop: "1rem",
            marginBottom: "1rem",
            border: "1px solid #e0e0e0",
          }}
        >
          <h4
            style={{
              color: "#3730a3",
              marginBottom: "1rem",
              fontSize: "1.1rem",
            }}
          >
            Price Breakdown (All-Inclusive)
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#666",
                  marginBottom: "0.25rem",
                }}
              >
                Course Value
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                ₹{course.price.breakdown.courseValue?.toFixed(2)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#666",
                  marginBottom: "0.25rem",
                }}
              >
                CGST (9%)
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                ₹{course.price.breakdown.gst?.cgst?.toFixed(2)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#666",
                  marginBottom: "0.25rem",
                }}
              >
                SGST (9%)
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                ₹{course.price.breakdown.gst?.sgst?.toFixed(2)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "#666",
                  marginBottom: "0.25rem",
                }}
              >
                Transaction Fee (2%)
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "600" }}>
                ₹{course.price.breakdown.transactionFee?.toFixed(2)}
              </div>
            </div>
          </div>
          <div style={{ borderTop: "1px solid #ddd", paddingTop: "0.75rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "0.9rem", color: "#666" }}>
                Total GST (18%)
              </span>
              <span
                style={{
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  color: "#4f46e5",
                }}
              >
                ₹{course.price.breakdown.gst?.total?.toFixed(2)}
              </span>
            </div>
          </div>
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
                          {lesson.lessonname || lesson.lessonName || "Lesson"}
                        </div>

                        {expandedLessons[`${chapterIndex}-${lessonIndex}`] && (
                          <div style={styles.lessonContent}>
                            {/* Audio Files */}
                            {Array.isArray(lesson.audioFile) && lesson.audioFile.length > 0 && (
                              <div style={styles.mediaSection}>
                                <h4 style={styles.mediaTitle}>
                                  Audio Files ({lesson.audioFile.length})
                                </h4>
                                {lesson.audioFile.map((audio, audioIndex) => {
                                  // Handle both object and string formats
                                  const audioData = typeof audio === 'string' ? { name: 'Audio File', url: audio } : audio;
                                  const audioUrl = normalizeMediaUrl(audioData?.url);
                                  
                                  console.log(`Audio ${audioIndex}:`, audioData);
                                  
                                  if (!audioUrl) {
                                    console.error('No URL found for audio:', audioData);
                                    return (
                                      <div key={audioIndex} style={{...styles.audioItem, backgroundColor: '#fee'}}>
                                        <div style={styles.audioName}>
                                          {audioData.name || 'Audio File'}
                                        </div>
                                        <div style={{color: 'red', fontSize: '0.9rem'}}>
                                          Error: No URL found for this audio file
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <div
                                      key={audioIndex}
                                      style={styles.audioItem}
                                    >
                                      <div style={styles.audioName}>
                                        {audioData.name || audioData.originalName || 'Audio File'}
                                      </div>
                                      <audio 
                                        controls 
                                        style={styles.audioPlayer}
                                        preload="metadata"
                                        onLoadedMetadata={() => console.log('Audio loaded:', audioData.url)}
                                        onError={(e) => {
                                          console.error('Audio load error:', audioUrl);
                                          console.error('Error details:', e.target.error);
                                        }}
                                      >
                                        <source
                                          src={audioUrl}
                                          type="audio/mpeg"
                                        />
                                        Your browser does not support the audio element.
                                      </audio>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Video Files */}
                            {Array.isArray(lesson.videoFile) && lesson.videoFile.length > 0 && (
                              <div style={styles.mediaSection}>
                                <h4 style={styles.mediaTitle}>
                                  Video Files ({lesson.videoFile.length})
                                </h4>
                                {lesson.videoFile.map((video, videoIndex) => {
                                  // Handle both object and string formats
                                  const videoData = typeof video === 'string' ? { name: 'Video File', url: video } : video;
                                  const videoUrl = normalizeMediaUrl(videoData?.url);
                                  
                                  console.log(`Video ${videoIndex}:`, videoData);
                                  
                                  if (!videoUrl) {
                                    console.error('No URL found for video:', videoData);
                                    return (
                                      <div key={videoIndex} style={{...styles.videoItem, backgroundColor: '#fee'}}>
                                        <div style={styles.videoName}>
                                          {videoData.name || 'Video File'}
                                        </div>
                                        <div style={{color: 'red', fontSize: '0.9rem'}}>
                                          Error: No URL found for this video file
                                        </div>
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <div
                                      key={videoIndex}
                                      style={styles.videoItem}
                                    >
                                      <div style={styles.videoName}>
                                        {videoData.name || videoData.originalName || 'Video File'}
                                      </div>
                                      <video 
                                        controls 
                                        style={styles.videoPlayer}
                                        preload="metadata"
                                        onLoadedMetadata={() => console.log('✅ Video loaded:', videoData.url)}
                                        onError={(e) => {
                                          console.error('❌ Video load error:', videoUrl);
                                          console.error('Error details:', e.target.error);
                                        }}
                                        src={videoUrl}
                                      >
                                        Your browser does not support the video element.
                                      </video>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* PDF Files */}
                            {lesson.pdfFile?.length > 0 && (
                              <div style={styles.mediaSection}>
                                <h4 style={styles.mediaTitle}>
                                  PDF Files 
                                  <span style={{fontSize: '0.8rem', color: '#666', fontWeight: 'normal'}}>
                                    (Click to expand • Choose viewer below)
                                  </span>
                                </h4>
                                <ul style={styles.pdfList}>
                                  {lesson.pdfFile.map((pdf, pdfIndex) => {
                                    // Handle both object and string formats
                                    const pdfData = typeof pdf === 'string' ? { name: 'PDF File', url: pdf } : pdf;
                                    const pdfUrl = normalizeMediaUrl(pdfData?.url);
                                    
                                    console.log(`PDF ${pdfIndex}:`, pdfData);
                                    
                                    if (!pdfUrl) {
                                      console.error('No URL found for PDF:', pdfData);
                                      return (
                                        <li key={pdfIndex}>
                                          <div style={{...styles.pdfName, backgroundColor: '#fee'}}>
                                            <span></span> {pdfData.name || 'PDF File'}
                                            <div style={{color: 'red', fontSize: '0.8rem', marginTop: '0.25rem'}}>
                                              Error: No URL found for this PDF file
                                            </div>
                                          </div>
                                        </li>
                                      );
                                    }
                                    
                                    return (
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
                                              ? "📂"
                                              : "📄"}
                                          </span>{" "}
                                          {pdfData.name || pdfData.originalName || 'PDF File'}
                                        </div>
                                        {expandedPdfs[
                                          `${chapterIndex}-${lessonIndex}-${pdfIndex}`
                                        ] && (
                                          <div>
                                            <iframe
                                              src={pdfUrl}
                                              style={styles.pdfViewer}
                                              title={`PDF-${pdfIndex}`}
                                            />
                                          </div>
                                        )}
                                            
                                        {/* Download Links */}
                                        <div style={{marginTop: '0.5rem', textAlign: 'center'}}>
                                         
                                          <a
                                            href={pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              color: '#722ed1',
                                              textDecoration: 'none',
                                              fontSize: '0.9rem',
                                              padding: '0.5rem 1rem',
                                              border: '1px solid #722ed1',
                                              borderRadius: '4px',
                                              display: 'inline-block',
                                              marginRight: '0.5rem'
                                            }}
                                          >
                                            📥 Open PDF in New Tab
                                          </a>
                                          
                                        </div>
                                        
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
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
