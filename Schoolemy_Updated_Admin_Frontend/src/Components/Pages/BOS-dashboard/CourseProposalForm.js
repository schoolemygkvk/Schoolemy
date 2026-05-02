import React, { useState } from "react";
import axios from "../../../Utils/api";
import { useNavigate } from "react-router-dom";
import { FiUpload, FiX, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { getProposalPresignedUrl, uploadToS3 } from "../../../Utils/s3ProposalUpload";

const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB

const CourseProposalForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    department: "",
    syllabus: "",
    Proposal_by: "",
    document_link: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfRawFile, setPdfRawFile] = useState(null);
  const [s3Url, setS3Url] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file only");
      return;
    }

    if (file.size > MAX_PDF_BYTES) {
      setError("PDF file size must not exceed 20MB");
      return;
    }

    setPdfFileName(file.name);
    setPdfRawFile(file);
    setError("");
    e.target.value = "";
  };

  const removePdf = () => {
    setPdfFileName("");
    setPdfRawFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      let pdfFileUrl = "";

      // Step 1: Upload PDF to S3 if provided
      if (pdfRawFile) {
        try {
          setUploadProgress(25);
          // Get presigned URL from backend
          const presignedData = await getProposalPresignedUrl(
            pdfRawFile.name,
            pdfRawFile.type || "application/pdf"
          );

          setUploadProgress(50);
          // Upload file directly to S3
          await uploadToS3(
            presignedData.uploadUrl,
            pdfRawFile,
            pdfRawFile.type || "application/pdf"
          );

          setUploadProgress(75);
          pdfFileUrl = presignedData.s3Url; // Use the S3 URL for the proposal
        } catch (uploadErr) {
          setError(
            uploadErr.response?.data?.error ||
            uploadErr.response?.data?.message ||
              uploadErr.message ||
              "Failed to upload PDF to S3. Please try again."
          );
          setIsSubmitting(false);
          return;
        }
      }

      setUploadProgress(90);
      // Step 2: Create proposal with S3 URL
      const proposalPayload = {
        title: formData.title,
        description: formData.description,
        department: formData.department,
        syllabus: formData.syllabus || "",
        Proposal_by: formData.Proposal_by,
        document_link: formData.document_link || "",
        pdf_file: pdfFileUrl, // Send S3 URL instead of file
      };

      await axios.post("/createproposal", proposalPayload);
      setUploadProgress(100);
      setSuccess(true);
      setTimeout(() => {
        navigate("/schoolemy/pending-proposals");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
          err.message ||
          "Failed to submit proposal. Please try again."
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  // Styles
  const styles = {
    container: {
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
      padding: "3rem 1rem",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    },
    wrapper: {
      maxWidth: "800px",
      margin: "0 auto",
    },
    header: {
      textAlign: "center",
      marginBottom: "3rem",
      position: "relative",
    },
    title: {
      textAlign: "center",
      marginBottom: "2rem",
      color: "#2c3e50",
      fontSize: "2rem",
      fontWeight: "700",
      textShadow: "1px 1px 3px rgba(0, 0, 0, 0.1)",
    },
    subtitle: {
      fontSize: "1.25rem",
      color: "#64748b",
      fontWeight: "400",
    },
    card: {
      backgroundColor: "white",
      borderRadius: "1.5rem",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      overflow: "hidden",
    },
    alertError: {
      backgroundColor: "#fef2f2",
      color: "#b91c1c",
      padding: "1rem 1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      fontSize: "0.95rem",
      fontWeight: "500",
    },
    alertSuccess: {
      backgroundColor: "#ecfdf5",
      color: "#065f46",
      padding: "1rem 1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      fontSize: "0.95rem",
      fontWeight: "500",
    },
    formSection: {
      padding: "2rem 2.5rem",
    },
    formGroup: {
      marginBottom: "1.75rem",
    },
    label: {
      display: "block",
      marginBottom: "0.5rem",
      fontSize: "0.95rem",
      fontWeight: "500",
      color: "#334155",
    },
    required: {
      color: "#ef4444",
      marginLeft: "0.25rem",
    },
    input: {
      width: "100%",
      padding: "0.875rem 1.25rem",
      borderRadius: "0.75rem",
      border: "1px solid #e2e8f0",
      fontSize: "1rem",
      transition: "all 0.2s ease",
      boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.05)",
    },
    inputFocus: {
      outline: "none",
      borderColor: "#3b82f6",
      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.15)",
    },
    textarea: {
      minHeight: "120px",
      resize: "vertical",
    },
    select: {
      appearance: "none",
      backgroundImage:
        "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e\")",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "right 1rem center",
      backgroundSize: "1.25rem",
    },
    uploadContainer: {
      display: "flex",
      justifyContent: "center",
      padding: "2rem",
      border: "2px dashed #e2e8f0",
      borderRadius: "1rem",
      backgroundColor: "#f8fafc",
      transition: "all 0.2s ease",
      cursor: "pointer",
    },
    uploadContent: {
      textAlign: "center",
    },
    uploadIcon: {
      color: "#94a3b8",
      marginBottom: "0.75rem",
    },
    uploadText: {
      display: "flex",
      fontSize: "0.95rem",
      color: "#64748b",
      justifyContent: "center",
    },
    uploadLink: {
      color: "#3b82f6",
      fontWeight: "500",
      marginLeft: "0.25rem",
    },
    uploadHint: {
      fontSize: "0.75rem",
      color: "#94a3b8",
      marginTop: "0.5rem",
    },
    filePreview: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#dbeafe",
      borderRadius: "0.75rem",
      padding: "0.75rem 1rem",
      color: "#1e40af",
    },
    fileName: {
      fontSize: "0.9rem",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      maxWidth: "300px",
    },
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "1rem",
      padding: "1.5rem 2.5rem",
      backgroundColor: "#f8fafc",
      borderTop: "1px solid #e2e8f0",
    },
    cancelButton: {
      padding: "0.75rem 1.5rem",
      borderRadius: "0.75rem",
      border: "1px solid #e2e8f0",
      backgroundColor: "white",
      color: "#64748b",
      fontWeight: "500",
      fontSize: "0.95rem",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
    },
    backButton: {
      position: "absolute",
      left: "16px",
      top: "50%",
      transform: "translateY(-50%)",
      padding: "0.6rem 0.9rem",
      backgroundColor: "#95a5a6",
      color: "#fff",
      border: "none",
      borderRadius: "0.75rem",
      cursor: "pointer",
      fontWeight: 600,
    },
    cancelButtonHover: {
      backgroundColor: "#f1f5f9",
    },
    submitButton: {
      padding: "0.75rem 1.5rem",
      borderRadius: "0.75rem",
      border: "none",
      background: "linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)",
      color: "white",
      fontWeight: "500",
      fontSize: "0.95rem",
      cursor: "pointer",
      transition: "all 0.2s ease",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    submitButtonHover: {
      background: "linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)",
    },
    submitButtonDisabled: {
      opacity: "0.7",
      cursor: "not-allowed",
    },
    progressBar: {
      width: "100%",
      height: "4px",
      backgroundColor: "#e2e8f0",
      borderRadius: "2px",
      overflow: "hidden",
      marginTop: "8px",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#3b82f6",
      width: `${uploadProgress}%`,
      transition: "width 0.3s ease",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <button
            type="button"
            style={styles.backButton}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            &#8592; Back
          </button>
          <h1 style={styles.title}>New Course Proposal</h1>
          <p style={styles.subtitle}>
            Submit your course proposal for academic review
          </p>
        </div>

        <div style={styles.card}>
          {/* Status Messages */}
          {error && (
            <div style={styles.alertError}>
              <FiAlertCircle style={{ fontSize: "1.25rem" }} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div style={styles.alertSuccess}>
              <FiCheckCircle style={{ fontSize: "1.25rem" }} />
              <span>Proposal submitted successfully! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={styles.formSection}>
              {/* Course Title */}
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="title">
                  Course Title<span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  style={{ ...styles.input, ...styles.inputFocus }}
                  placeholder="Advanced Data Structures"
                />
              </div>

              {/* Department */}
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="department">
                  Department<span style={styles.required}>*</span>
                </label>
                <input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  style={{ ...styles.input, ...styles.inputFocus }}
                  placeholder="Department"
                />
              </div>

              {/* Description */}
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="description">
                  Brief Description<span style={styles.required}>*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  style={{
                    ...styles.input,
                    ...styles.inputFocus,
                    ...styles.textarea,
                  }}
                  placeholder="Describe the course objectives, learning outcomes, and target audience..."
                />
              </div>

              {/* Syllabus */}
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="syllabus">
                  Syllabus Outline
                </label>
                <textarea
                  id="syllabus"
                  name="syllabus"
                  value={formData.syllabus}
                  onChange={handleChange}
                  style={{
                    ...styles.input,
                    ...styles.inputFocus,
                    ...styles.textarea,
                  }}
                  placeholder="Week 1: Introduction, Week 2: Core Concepts..."
                />
              </div>

              {/* Proposal By */}
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="Proposal_by">
                  Proposed By<span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="Proposal_by"
                  name="Proposal_by"
                  value={formData.Proposal_by}
                  onChange={handleChange}
                  required
                  style={{ ...styles.input, ...styles.inputFocus }}
                  placeholder="Dr. Jane Doe"
                />
              </div>

              {/* Document Link */}
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="document_link">
                  Supporting Document Link
                </label>
                <input
                  type="url"
                  id="document_link"
                  name="document_link"
                  value={formData.document_link}
                  onChange={handleChange}
                  style={{ ...styles.input, ...styles.inputFocus }}
                  placeholder="https://example.com/course-outline"
                />
              </div>

              {/* PDF Upload */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Upload Proposal PDF (Max 20MB)
                </label>
                <div style={styles.uploadContainer}>
                  {pdfFileName ? (
                    <div style={styles.filePreview}>
                      <span style={styles.fileName}>{pdfFileName}</span>
                      <button
                        type="button"
                        onClick={removePdf}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                        }}
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                  ) : (
                    <div style={styles.uploadContent}>
                      <FiUpload size={40} style={styles.uploadIcon} />
                      <div style={styles.uploadText}>
                        <span>Drag and drop or</span>
                        <label htmlFor="pdf-upload" style={styles.uploadLink}>
                          browse files
                        </label>
                      </div>
                      <p style={styles.uploadHint}>PDF format, max 20MB</p>
                      <input
                        id="pdf-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        style={{ display: "none" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ padding: "0 2.5rem" }}>
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>
                  Uploading... {uploadProgress}%
                </p>
                <div style={styles.progressBar}>
                  <div style={styles.progressFill}></div>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div style={styles.actions}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={styles.cancelButton}
                disabled={isSubmitting}
                onMouseEnter={(e) =>
                  !isSubmitting && (e.target.style.backgroundColor = "#f1f5f9")
                }
                onMouseLeave={(e) =>
                  !isSubmitting && (e.target.style.backgroundColor = "white")
                }
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  ...styles.submitButton,
                  ...(isSubmitting ? styles.submitButtonDisabled : {}),
                }}
                onMouseEnter={(e) =>
                  !isSubmitting && e.target.style.backgroundColor
                }
                onMouseLeave={(e) =>
                  !isSubmitting && e.target.style.backgroundColor
                }
              >
                {isSubmitting ? `Uploading... ${uploadProgress}%` : "Submit Proposal"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CourseProposalForm;
