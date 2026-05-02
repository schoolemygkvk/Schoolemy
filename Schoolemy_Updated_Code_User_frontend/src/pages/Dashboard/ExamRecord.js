import React, { useEffect, useState, useCallback } from "react";
import api from "../../service/api"; // Use centralized API instance
import { FiArrowLeft } from "react-icons/fi";
import PropTypes from "prop-types";

const theme = {
  colors: {
    primary: "#0862F7",
    secondary: "#1E3A8A",
    success: "#16A34A",
    error: "#DC2626",
    text: "#1E293B",
    textSecondary: "#475569",
    background: "#F8FAFC",
    cardBackground: "#FFFFFF",
    lightBlueBg: "#F0F6FF",
    border: "#E2E8F0",
    successLight: "#DCFCE7",
    errorLight: "#FEE2E2",
  },
  spacing: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    h1: { fontSize: "28px", fontWeight: 700 },
    h2: { fontSize: "18px", fontWeight: 600 },
    body: { fontSize: "16px", fontWeight: 400 },
    caption: { fontSize: "14px", fontWeight: 500 },
  },
};

const ExamRecord = ({ courseId = "", examId = "" }) => {
  const [attempts, setAttempts] = useState([]);
  const [message, setMessage] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 5,
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [expandedAttempt, setExpandedAttempt] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchExamAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/api/v1/exam-questions/user/exam/result", {
        params: { courseId, examId, page, limit },
      });
      const { data, message, pagination } = response.data;
      setAttempts(data);
      setMessage(message);
      setPagination(pagination);
    } catch (error) {
      console.error("Error fetching exam attempts:", error);
      setMessage(
        error.response?.data?.message ||
          "Failed to fetch exam attempts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [courseId, examId, page, limit]);

  useEffect(() => {
    fetchExamAttempts();
  }, [fetchExamAttempts]);

  const toggleAnswers = (index) => {
    setExpandedAttempt(expandedAttempt === index ? null : index);
  };

  const styles = {
    container: {
      maxWidth: "800px",
      margin: `${theme.spacing.lg} auto`,
      padding: isMobile ? theme.spacing.md : theme.spacing.xl,
      borderRadius: "12px",
      background: theme.colors.cardBackground,
      boxShadow: "0 4px 24px rgba(30, 58, 138, 0.1)",
      fontFamily: theme.typography.fontFamily,
    },
    header: {
      display: "flex",
      alignItems: "center",
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    backButton: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "transparent",
      border: `1px solid ${theme.colors.border}`,
      color: theme.colors.textSecondary,
      borderRadius: "50%",
      width: isMobile ? "40px" : "48px",
      height: isMobile ? "40px" : "48px",
      cursor: "pointer",
      transition: "all 0.2s ease-in-out",
    },
    title: {
      ...theme.typography.h1,
      color: theme.colors.secondary,
      textAlign: "center",
      flex: 1,
    },
    card: {
      borderRadius: "12px",
      padding: isMobile ? theme.spacing.md : theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      background: theme.colors.cardBackground,
      boxShadow: "0 2px 12px rgba(8, 98, 247, 0.08)",
      transition: "box-shadow 0.2s ease-in-out",
    },
    cardHover: {
      boxShadow: "0 6px 24px rgba(8, 98, 247, 0.15)",
    },
    attemptHeader: {
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      gap: isMobile ? theme.spacing.xs : theme.spacing.md,
      alignItems: isMobile ? "flex-start" : "center",
      marginBottom: theme.spacing.sm,
      color: theme.colors.text,
      ...theme.typography.body,
    },
    marks: {
      ...theme.typography.caption,
      fontWeight: 600,
      color: theme.colors.success,
      background: theme.colors.successLight,
      borderRadius: "8px",
      padding: "4px 12px",
      marginLeft: isMobile ? 0 : "auto",
    },
    toggleButton: {
      marginTop: theme.spacing.sm,
      padding: isMobile ? "8px 12px" : "10px 20px",
      fontSize: theme.typography.body.fontSize,
      fontWeight: 600,
      border: "none",
      background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
      color: theme.colors.cardBackground,
      borderRadius: "8px",
      cursor: "pointer",
      transition: "background 0.2s, transform 0.1s",
      boxShadow: "0 2px 8px rgba(30, 58, 138, 0.1)",
    },
    answerContainer: {
      maxHeight: 0,
      overflow: "hidden",
      transition: "max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    answerContainerOpen: {
      maxHeight: "9999px",
    },
    answerItem: {
      marginTop: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: "10px",
      background: theme.colors.background,
      border: `1px solid ${theme.colors.border}`,
    },
    questionText: {
      ...theme.typography.h2,
      color: theme.colors.text,
      marginBottom: theme.spacing.sm,
      lineHeight: 1.5,
    },
    optionsList: {
      display: "flex",
      flexDirection: "column",
      gap: theme.spacing.xs,
    },
    optionBase: {
      padding: isMobile ? theme.spacing.sm : theme.spacing.md,
      borderRadius: "8px",
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.cardBackground,
      ...theme.typography.body,
      display: "flex",
      alignItems: "center",
      gap: theme.spacing.xs,
      transition: "all 0.2s ease-in-out",
    },
    correctOption: {
      background: theme.colors.successLight,
      borderColor: theme.colors.success,
    },
    incorrectOption: {
      background: theme.colors.errorLight,
      borderColor: theme.colors.error,
    },
    badge: {
      ...theme.typography.caption,
      borderRadius: "6px",
      padding: "3px 8px",
      fontWeight: 600,
      marginLeft: "auto",
      background: theme.colors.lightBlueBg,
      color: theme.colors.primary,
    },
    marksAwarded: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.sm,
    },
    pagination: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: theme.spacing.md,
      marginTop: theme.spacing.lg,
      flexWrap: "wrap",
    },
    paginationButton: {
      padding: isMobile ? "8px 12px" : "10px 16px",
      borderRadius: "8px",
      border: "none",
      background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
      color: theme.colors.cardBackground,
      ...theme.typography.body,
      fontWeight: 600,
      cursor: "pointer",
      transition: "background 0.2s",
    },
    disabledButton: {
      background: theme.colors.border,
      cursor: "not-allowed",
      color: theme.colors.textSecondary,
    },
    message: {
      ...theme.typography.body,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginTop: theme.spacing.lg,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          style={styles.backButton}
          onClick={() => window.history.back()}
          onMouseOver={(e) => {
            e.currentTarget.style.background = theme.colors.lightBlueBg;
            e.currentTarget.style.borderColor = theme.colors.primary;
            e.currentTarget.style.color = theme.colors.primary;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = theme.colors.border;
            e.currentTarget.style.color = theme.colors.textSecondary;
          }}
          aria-label="Go back to previous page"
        >
          <FiArrowLeft size={isMobile ? 20 : 24} />
        </button>
        <h1 style={styles.title}>Exam Attempt History</h1>
      </div>

      {loading ? (
        <p style={styles.message}>Loading exam attempts...</p>
      ) : attempts.length > 0 ? (
        attempts.map((attempt, index) => (
          <div
            key={attempt._id}
            style={styles.card}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = styles.cardHover.boxShadow)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = styles.card.boxShadow)
            }
          >
            <div style={styles.attemptHeader}>
              <span>
                <strong>Chapter:</strong> {attempt.chapterTitle}
              </span>
              <span>
                <strong>Date:</strong>{" "}
                {new Date(attempt.attemptedAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <span style={styles.marks}>
                {attempt.obtainedMarks} / {attempt.totalMarks}
              </span>
            </div>
            <button
              style={styles.toggleButton}
              onClick={() => toggleAnswers(index)}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "scale(1.02)")
              }
              onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
              aria-expanded={expandedAttempt === index}
              aria-controls={`answers-${index}`}
            >
              {expandedAttempt === index ? "Hide Answers" : "View Answers"}
            </button>
            <div
              id={`answers-${index}`}
              style={{
                ...styles.answerContainer,
                ...(expandedAttempt === index
                  ? styles.answerContainerOpen
                  : {}),
              }}
            >
              {attempt.answers.map((answer, idx) => {
                // Check if the new data structure is available
                if (
                  !answer.questionDetails ||
                  !answer.questionDetails.options
                ) {
                  return (
                    <div key={answer._id || idx} style={styles.answerItem}>
                      <p style={{ color: theme.colors.error }}>
                        Error: Full question data not available from the API.
                      </p>
                    </div>
                  );
                }

                return (
                  <div key={answer._id} style={styles.answerItem}>
                    {/* Reading from the new data structure */}
                    <div style={styles.questionText}>
                      {idx + 1}. {answer.questionDetails.question}
                    </div>

                    {/* ========================================================== */}
                    {/* THIS IS THE UPDATED LOGIC TO RENDER ALL OPTIONS            */}
                    {/* ========================================================== */}
                    <div style={styles.optionsList}>
                      {answer.questionDetails.options.map(
                        (option, optionIndex) => {
                          const isCorrectAnswer =
                            option === answer.questionDetails.correctAnswer;
                          const isSelectedAnswer =
                            option === answer.selectedAnswer;

                          let finalStyle = { ...styles.optionBase };

                          if (isCorrectAnswer) {
                            // Style for the correct answer (always green)
                            finalStyle = {
                              ...finalStyle,
                              ...styles.correctOption,
                            };
                          } else if (isSelectedAnswer && !isCorrectAnswer) {
                            // Style for the selected answer ONLY IF it's wrong (red)
                            finalStyle = {
                              ...finalStyle,
                              ...styles.incorrectOption,
                            };
                          }

                          return (
                            <div key={optionIndex} style={finalStyle}>
                              <span>{option}</span>
                              {isSelectedAnswer && (
                                <span style={styles.badge}>Your Answer</span>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                    {/* ========================================================== */}

                    <div style={styles.marksAwarded}>
                      <strong>Marks Awarded:</strong> {answer.marksAwarded}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <p style={styles.message}>{message}</p>
      )}

      {pagination.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{
              ...styles.paginationButton,
              ...(page === 1 ? styles.disabledButton : {}),
            }}
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            aria-label="Previous page"
          >
            Previous
          </button>
          <span style={theme.typography.body}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            style={{
              ...styles.paginationButton,
              ...(page === pagination.totalPages ? styles.disabledButton : {}),
            }}
            disabled={page === pagination.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

ExamRecord.propTypes = {
  courseId: PropTypes.string,
  examId: PropTypes.string,
};

export default ExamRecord;
