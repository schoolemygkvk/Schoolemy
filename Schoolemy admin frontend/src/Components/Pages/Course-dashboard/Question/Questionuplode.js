import React, { useState, useEffect } from "react";
import axios from "../../../../Utils/api";

const CreateExamForm = () => {
  const [formData, setFormData] = useState({
    coursename: "",
    chapterTitle: "",
    examinationName: "",
    subject: "",
    totalMarks: "",
    examQuestions: [
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        marks: 2,
      },
    ],
  });

  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get("/api/courses/getcoursesname");
        setCourses(response.data);
      } catch (error) {
        console.error("Error fetching course names:", error);
      }
    };
    fetchCourses();
  }, []);

  const handleCourseChange = (e) => {
    const selectedCourse = e.target.value;
    const foundCourse = courses.find((c) => c.coursename === selectedCourse);
    setFormData({ ...formData, coursename: selectedCourse, chapterTitle: "" });
    setChapters(foundCourse?.chapters || []);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleQuestionChange = (index, field, value) => {
    const questions = [...formData.examQuestions];
    questions[index][field] = value;
    setFormData({ ...formData, examQuestions: questions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const questions = [...formData.examQuestions];
    questions[qIndex].options[oIndex] = value;
    setFormData({ ...formData, examQuestions: questions });
  };

  const addQuestion = () => {
    setFormData({
      ...formData,
      examQuestions: [
        ...formData.examQuestions,
        {
          question: "",
          options: ["", "", "", ""],
          correctAnswer: "",
          marks: 1,
        },
      ],
    });
  };

  const removeQuestion = (index) => {
    if (formData.examQuestions.length <= 1) return;
    const questions = [...formData.examQuestions];
    questions.splice(index, 1);
    setFormData({ ...formData, examQuestions: questions });
  };

  const validateForm = () => {
    const newErrors = {};
    formData.examQuestions.forEach((q, qIndex) => {
      const filledOptions = q.options.filter((opt) => opt.trim() !== "").length;
      if (filledOptions < 2) {
        newErrors[`question-${qIndex}-options`] = `At least 2 options required for question ${qIndex + 1}`;
      }
      if (!q.correctAnswer) {
        newErrors[`question-${qIndex}-correct`] = `Correct answer required for question ${qIndex + 1}`;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        examQuestions: formData.examQuestions.map((q) => ({
          ...q,
          options: q.options.filter((opt) => opt.trim() !== ""),
        })),
      };

      const token = localStorage.getItem("token");
      if (!token) {
        alert("No token found. Please login.");
        return;
      }

      await axios.post("/api/exam/upload", submissionData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Exam created successfully!");
      setFormData({
        coursename: "",
        chapterTitle: "",
        examinationName: "",
        subject: "",
        totalMarks: "",
        examQuestions: [
          {
            question: "",
            options: ["", "", "", ""],
            correctAnswer: "",
            marks: 2,
          },
        ],
      });
      setErrors({});
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.message || "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Premium styling with CSS-in-JS
  const styles = {
    container: {
      maxWidth: "1200px",
      margin: "3rem auto",
      padding: "3rem",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      boxShadow: "0 12px 48px rgba(0, 0, 0, 0.08)",
      border: "1px solid rgba(0, 0, 0, 0.04)",
    },
    header: {
      color: "#1a1a1a",
      textAlign: "center",
      marginBottom: "3rem",
      fontSize: "2.5rem",
      fontWeight: "800",
      letterSpacing: "-0.025em",
      background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      position: "relative",
      paddingBottom: "1rem",
      "&:after": {
        content: '""',
        position: "absolute",
        bottom: "0",
        left: "50%",
        transform: "translateX(-50%)",
        width: "80px",
        height: "4px",
        background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
        borderRadius: "2px",
      },
    },
    form: {
      display: "flex",
      flexDirection: "column",
      gap: "2.5rem",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "2rem",
    },
    formGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "0.75rem",
      position: "relative",
    },
    label: {
      fontSize: "0.95rem",
      fontWeight: "600",
      color: "#374151",
      marginLeft: "0.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
    },
    requiredIndicator: {
      color: "#ef4444",
      fontSize: "1.2rem",
      lineHeight: "1",
    },
    input: {
      padding: "1rem 1.25rem",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      fontSize: "1rem",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      backgroundColor: "#f9fafb",
      width: "90%",
      "&:focus": {
        outline: "none",
        borderColor: "#6366f1",
        boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.2)",
        backgroundColor: "#ffffff",
      },
      "&:hover": {
        borderColor: "#d1d5db",
      },
    },
    textarea: {
      minHeight: "100px",
      resize: "vertical",
    },
    select: {
      padding: "1rem 1.25rem",
      border: "1px solid #e5e7eb",
      borderRadius: "10px",
      fontSize: "1rem",
      backgroundColor: "#f9fafb",
      cursor: "pointer",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      appearance: "none",
      backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 1rem center",
      backgroundSize: "1rem",
      "&:focus": {
        outline: "none",
        borderColor: "#6366f1",
        boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.2)",
        backgroundColor: "#ffffff",
      },
      "&:hover": {
        borderColor: "#d1d5db",
      },
    },
    questionCard: {
      border: "1px solid #e5e7eb",
      padding: "2rem",
      borderRadius: "12px",
      backgroundColor: "#ffffff",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.03)",
      marginBottom: "2rem",
      position: "relative",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": {
        borderColor: "#e0e7ff",
        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.05)",
      },
    },
    questionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "1.5rem",
    },
    questionTitle: {
      fontSize: "1.25rem",
      fontWeight: "700",
      color: "#111827",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    },
    questionNumber: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "28px",
      height: "28px",
      backgroundColor: "#4f46e5",
      color: "white",
      borderRadius: "8px",
      fontSize: "0.875rem",
      fontWeight: "700",
    },
    removeButton: {
      backgroundColor: "transparent",
      color: "#ef4444",
      border: "1px solid #ef4444",
      borderRadius: "8px",
      padding: "0.5rem 1rem",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "600",
      transition: "all 0.2s ease",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      "&:hover": {
        backgroundColor: "#fee2e2",
      },
      "&:disabled": {
        opacity: "0.5",
        cursor: "not-allowed",
        backgroundColor: "transparent",
      },
    },
    optionInputContainer: {
      marginBottom: "1rem",
    },
    optionRow: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      marginBottom: "0.75rem",
    },
    optionIndicator: {
      width: "24px",
      height: "24px",
      borderRadius: "6px",
      border: "2px solid #e5e7eb",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transition: "all 0.2s",
      cursor: "pointer",
      "&.correct": {
        backgroundColor: "#4f46e5",
        borderColor: "#4f46e5",
      },
    },
    optionInput: {
      flex: 1,
    },
    markCorrectButton: {
      padding: "0.625rem 1rem",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "0.875rem",
      fontWeight: "600",
      whiteSpace: "nowrap",
      transition: "all 0.2s",
      backgroundColor: "#e0e7ff",
      color: "#4f46e5",
      "&:hover": {
        backgroundColor: "#c7d2fe",
      },
      "&.active": {
        backgroundColor: "#4f46e5",
        color: "white",
      },
      "&:disabled": {
        opacity: "0.5",
        cursor: "not-allowed",
      },
    },
    buttonGroup: {
      display: "flex",
      gap: "1.5rem",
      marginTop: "2rem",
      justifyContent: "flex-end",
    },
    primaryButton: {
      padding: "1rem 2rem",
      borderRadius: "10px",
      border: "none",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
      backgroundColor: "#4f46e5",
      color: "white",
      boxShadow: "0 4px 6px rgba(79, 70, 229, 0.2)",
      "&:hover": {
        backgroundColor: "#4338ca",
        boxShadow: "0 6px 8px rgba(79, 70, 229, 0.3)",
      },
      "&:disabled": {
        backgroundColor: "#a5b4fc",
        cursor: "not-allowed",
        boxShadow: "none",
      },
    },
    secondaryButton: {
      padding: "1rem 2rem",
      borderRadius: "10px",
      border: "1px solid #4f46e5",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.75rem",
      backgroundColor: "white",
      color: "#4f46e5",
      "&:hover": {
        backgroundColor: "#eef2ff",
      },
    },
    sectionHeader: {
      fontSize: "1.5rem",
      fontWeight: "700",
      color: "#111827",
      margin: "3rem 0 1.5rem",
      position: "relative",
      paddingBottom: "0.75rem",
      "&:after": {
        content: '""',
        position: "absolute",
        bottom: "0",
        left: "0",
        width: "60px",
        height: "4px",
        background: "linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%)",
        borderRadius: "2px",
      },
    },
    loadingSpinner: {
      display: "inline-block",
      width: "20px",
      height: "20px",
      border: "3px solid rgba(255,255,255,0.3)",
      borderRadius: "50%",
      borderTopColor: "white",
      animation: "spin 1s ease-in-out infinite",
    },
    "@keyframes spin": {
      to: { transform: "rotate(360deg)" },
    },
    optionHeader: {
      display: "flex",
      alignItems: "center",
      gap: "1rem",
      marginBottom: "1rem",
    },
    miniHint: {
      fontSize: "0.875rem",
      color: "#6b7280",
      fontStyle: "italic",
    },
    errorText: {
      color: "#ef4444",
      fontSize: "0.875rem",
      marginTop: "0.5rem",
      fontWeight: "500",
    },
    icon: {
      width: "20px",
      height: "20px",
    },
    marksInputContainer: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "1.5rem",
      marginTop: "1.5rem",
    },
    selectArrow: {
      position: "absolute",
      right: "1rem",
      top: "50%",
      transform: "translateY(-50%)",
      pointerEvents: "none",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Create New Examination</h1>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Course <span style={styles.requiredIndicator}>*</span>
            </label>
            <select
              name="coursename"
              value={formData.coursename}
              onChange={handleCourseChange}
              required
              style={styles.select}
            >
              <option value="">Select a course</option>
              {courses.map((course, idx) => (
                <option key={idx} value={course.coursename}>
                  {course.coursename}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Chapter <span style={styles.requiredIndicator}>*</span>
            </label>
            <select
              name="chapterTitle"
              value={formData.chapterTitle}
              onChange={handleInputChange}
              required
              disabled={!formData.coursename}
              style={styles.select}
            >
              <option value="">
                {formData.coursename ? "Select chapter" : "Select course first"}
              </option>
              {chapters.map((title, idx) => (
                <option key={idx} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              Exam Name <span style={styles.requiredIndicator}>*</span>
            </label>
            <input
              type="text"
              name="examinationName"
              placeholder="Exam-Name"
              value={formData.examinationName}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Subject <span style={styles.requiredIndicator}>*</span>
            </label>
            <input
              type="text"
              name="subject"
              placeholder="Subject-Name"
              value={formData.subject}
              onChange={handleInputChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Total Marks <span style={styles.requiredIndicator}>*</span>
            </label>
            <input
              type="number"
              name="totalMarks"
              placeholder="e.g. 100"
              value={formData.totalMarks}
              onChange={handleInputChange}
              required
              min="2"
              style={styles.input}
            />
          </div>
        </div>

        <h3 style={styles.sectionHeader}>Exam Questions</h3>

        {formData.examQuestions.map((q, idx) => (
          <div key={idx} style={styles.questionCard}>
            <div style={styles.questionHeader}>
              <div style={styles.questionTitle}>
                <span style={styles.questionNumber}>{idx + 1}</span>
                Question
              </div>
              <button
                type="button"
                onClick={() => removeQuestion(idx)}
                style={styles.removeButton}
                disabled={formData.examQuestions.length <= 1}
              >
                <svg
                  style={styles.icon}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Remove
              </button>
            </div>

            <div style={styles.formGroup}>
              <textarea
                placeholder="Enter your question here..."
                value={q.question}
                onChange={(e) =>
                  handleQuestionChange(idx, "question", e.target.value)
                }
                required
                style={{ ...styles.input, ...styles.textarea }}
              />
            </div>
            <br/>
            <div style={styles.formGroup}>
              <div style={styles.optionHeader}>
                <label style={styles.label}>
                  Options <span style={styles.requiredIndicator}>*</span>
                </label>
                <div style={styles.miniHint}>(Minimum 2 Options required)</div>
              </div>

              {errors[`question-${idx}-options`] && (
                <div style={styles.errorText}>
                  {errors[`question-${idx}-options`]}
                </div>
              )}

              {q.options.map((opt, oIdx) => (
                <div key={oIdx} style={styles.optionInputContainer}>
                  <div style={styles.optionRow}>
                    <div
                      className={q.correctAnswer === opt ? "correct" : ""}
                      style={styles.optionIndicator}
                      onClick={() =>
                        opt.trim() &&
                        handleQuestionChange(idx, "correctAnswer", opt)
                      }
                    >
                      {q.correctAnswer === opt && (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M20 6L9 17L4 12"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder={`Option ${oIdx + 1}${
                        oIdx >= 2 ? "" : ""
                      }`}
                      value={opt}
                      onChange={(e) =>
                        handleOptionChange(idx, oIdx, e.target.value)
                      }
                      style={{ ...styles.input, ...styles.optionInput }}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleQuestionChange(idx, "correctAnswer", opt)
                      }
                      style={{
                        ...styles.markCorrectButton,
                        ...(q.correctAnswer === opt ? { className: "active" } : {}),
                      }}
                      disabled={!opt.trim()}
                    >
                      {q.correctAnswer === opt ? "Correct" : "Mark Correct"}
                    </button>
                  </div>
                </div>
              ))}

              {errors[`question-${idx}-correct`] && (
                <div style={styles.errorText}>
                  {errors[`question-${idx}-correct`]}
                </div>
              )}
            </div>

            <div style={styles.marksInputContainer}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Marks <span style={styles.requiredIndicator}>*</span>
                </label>
                <input
                  type="number"
                  placeholder="Points"
                  value={q.marks}
                  onChange={(e) =>
                    handleQuestionChange(idx, "marks", e.target.value)
                  }
                  required
                  min="2"
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        ))}

        <div style={styles.buttonGroup}>
          <button
            type="button"
            onClick={addQuestion}
            style={styles.secondaryButton}
          >
            <svg
              style={styles.icon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5 12H19"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Add Question
          </button>
          <button
            type="submit"
            style={styles.primaryButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span style={styles.loadingSpinner}></span>
                Creating Exam...
              </>
            ) : (
              <>
                <svg
                  style={styles.icon}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 21V13H7V21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 3V8H15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Create Exam
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateExamForm;