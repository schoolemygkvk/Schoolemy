import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";
import { secureStorage } from "../../../Utils/security";
import { getToken } from "../../../Hooks/useToken";
import {
  FiArrowLeft,
  FiUpload,
  FiFileText,
  FiDownload,
  FiTrash2,
  FiCheck,
  FiX,
} from "react-icons/fi";

const MeetMaterials = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meet, setMeet] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    access_type: "attended_only",
    material_date: "",
    day_number: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  useEffect(() => {
    fetchMeetDetails();
    fetchMaterials();
  }, [id]);

  const fetchMeetDetails = async () => {
    try {
      const token = getToken();
      const response = await axios.get(`/api/course-meets/meets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setMeet(response.data.meet);
        setFormData((prev) => ({
          ...prev,
          access_type: response.data.meet.material_access_type || "attended_only",
        }));
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadToS3 = async (file) => {
    try {
      const token = getToken();
      
      // Step 1: Get pre-signed URL
      const urlResponse = await axios.post(
        "/api/course-meets/materials/s3/upload-url",
        {
          meet_id: id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!urlResponse.data.success) {
        throw new Error(urlResponse.data.message || "Failed to get upload URL");
      }

      const { uploadUrl, key } = urlResponse.data;

      // Step 2: Upload to S3 using fetch - PUT with file body and Content-Type header
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type
        }
      });


      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      // Construct S3 URL
      const s3Url = `https://student-meet-materials.s3.ap-south-1.amazonaws.com/${key}`;

      return { fileUrl: s3Url, key: key };
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("Please select a file to upload");
      return;
    }

    if (!formData.title) {
      alert("Please enter a title");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Upload file to S3
      const { fileUrl, key } = await uploadToS3(selectedFile);

      // Convert MIME type to backend enum format
      const fileTypeCategory = getFileTypeCategory(selectedFile.type);

      // Get current user ID from secureStorage (used by AuthProvider)
      const userId = secureStorage.getItem("_id");

      if (!userId) {
        alert("User ID not found. Please log in again.");
        navigate("/login");
        return;
      }

      // Save material record
      const token = getToken();
      const response = await axios.post(
        "/api/course-meets/materials/s3/save",
        {
          meet_id: id,
          title: formData.title,
          description: formData.description,
          file_name: selectedFile.name,
          s3_url: fileUrl,
          s3_key: key,
          file_type: fileTypeCategory,
          file_size: selectedFile.size,
          access_type: formData.access_type,
          material_date: formData.material_date,
          day_number: formData.day_number ? parseInt(formData.day_number) : undefined,
          uploaded_by: userId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        alert("Material uploaded successfully!");
        setFormData({
          title: "",
          description: "",
          access_type: meet?.material_access_type || "attended_only",
          material_date: "",
          day_number: "",
        });
        setSelectedFile(null);
        setShowUploadForm(false);
        fetchMaterials();
      }
    } catch (error) {
      console.error("Error uploading material:", error);
      alert(error.response?.data?.message || "Failed to upload material");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm("Are you sure you want to delete this material?")) {
      return;
    }

    try {
      const token = getToken();
      const response = await axios.delete(`/api/course-meets/materials/${materialId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        alert("Material deleted successfully!");
        fetchMaterials();
      }
    } catch (error) {
      console.error("Error deleting material:", error);
      alert("Failed to delete material");
    }
  };

  const getFileTypeCategory = (mimeType) => {
    if (!mimeType) return "other";
    
    // Map MIME types to the enum values expected by backend
    if (mimeType.includes("pdf")) return "pdf";
    if (mimeType.includes("video")) return "video";
    if (mimeType.includes("audio")) return "audio";
    if (mimeType.includes("image")) return "image";
    if (
      mimeType.includes("word") ||
      mimeType.includes("document") ||
      mimeType.includes("msword") ||
      mimeType.includes("officedocument") ||
      mimeType.includes("text") ||
      mimeType.includes("excel") ||
      mimeType.includes("spreadsheet") ||
      mimeType.includes("powerpoint") ||
      mimeType.includes("presentation")
    ) {
      return "document";
    }
    return "other";
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes("pdf")) return "PDF";
    if (fileType?.includes("word") || fileType?.includes("document")) return "DOC";
    if (fileType?.includes("excel") || fileType?.includes("spreadsheet")) return "XLS";
    if (fileType?.includes("powerpoint") || fileType?.includes("presentation")) return "PPT";
    if (fileType?.includes("image")) return "IMG";
    if (fileType?.includes("video")) return "VID";
    if (fileType?.includes("audio")) return "AUD";
    return "FILE";
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner} />
        <p>Loading meet materials...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(`/schoolemy/course-meet-details/${id}`)} style={styles.backButton}>
          <FiArrowLeft /> Back to Details
        </button>
        <button onClick={() => setShowUploadForm(!showUploadForm)} style={styles.uploadButton}>
          {showUploadForm ? <FiX /> : <FiUpload />}
          {showUploadForm ? "Cancel" : "Upload Material"}
        </button>
      </div>

      {/* Meet Info */}
      {meet && (
        <div style={styles.meetCard}>
          <div>
            <h2 style={styles.meetTitle}>{meet.title}</h2>
            <p style={styles.meetInfo}>
              {meet.course_name} • {new Date(meet.meet_date).toLocaleDateString()}
            </p>
          </div>
          <div style={styles.accessInfo}>
            <span style={styles.accessLabel}>Material Access:</span>
            <span style={styles.accessValue}>
              {meet.material_access_type === "attended_only"
                ? "Attended Only"
                : "All Assigned Users"}
            </span>
          </div>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && (
        <div style={styles.uploadCard}>
          <h3 style={styles.uploadTitle}>Upload Study Material</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Title <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                style={styles.input}
                placeholder="e.g., Week 1 Study Notes"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                style={styles.textarea}
                placeholder="Brief description of the material..."
                rows="3"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Access Type</label>
              <select
                value={formData.access_type}
                onChange={(e) => setFormData({ ...formData, access_type: e.target.value })}
                style={styles.select}
              >
                <option value="attended_only">Attended Only</option>
                <option value="all">All Assigned Users</option>
              </select>
              <small style={styles.hint}>
                {formData.access_type === "attended_only"
                  ? "Only users who attended can access this material"
                  : "All assigned users can access this material"}
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Material Date <span style={styles.required}>*</span>
              </label>
              <input
                type="date"
                value={formData.material_date}
                onChange={(e) => setFormData({ ...formData, material_date: e.target.value })}
                style={styles.input}
                required
              />
              <small style={styles.hint}>
                Select the date this material is for. Users must have attended on this date to access it.
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Day Number (Optional)
              </label>
              <input
                type="number"
                min="1"
                value={formData.day_number}
                onChange={(e) => setFormData({ ...formData, day_number: e.target.value })}
                style={styles.input}
                placeholder="e.g., 1, 2, 3..."
              />
              <small style={styles.hint}>
                Optional: Specify which day of the course this material is for (Day 1, Day 2, etc.)
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                File <span style={styles.required}>*</span>
              </label>
              <input
                type="file"
                onChange={handleFileSelect}
                style={styles.fileInput}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.jpg,.jpeg,.png"
                required
              />
              {selectedFile && (
                <div style={styles.fileInfo}>
                  <span>{getFileIcon(selectedFile.type)}</span>
                  <span>{selectedFile.name}</span>
                  <span>({formatFileSize(selectedFile.size)})</span>
                </div>
              )}
              <small style={styles.hint}>
                Accepted formats: PDF, Word, Excel, PowerPoint, Images, ZIP (Max 50MB)
              </small>
            </div>

            {uploading && (
              <div style={styles.progressContainer}>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
                <span style={styles.progressText}>{uploadProgress}%</span>
              </div>
            )}

            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={() => setShowUploadForm(false)}
                style={styles.cancelButton}
                disabled={uploading}
              >
                Cancel
              </button>
              <button type="submit" style={styles.submitButton} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Material"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Materials List */}
      <div style={styles.materialsCard}>
        <h3 style={styles.materialsTitle}>
          Study Materials ({materials.length})
        </h3>
        {materials.length === 0 ? (
          <div style={styles.emptyState}>
            <FiFileText style={styles.emptyIcon} />
            <p>No materials uploaded yet</p>
            <button onClick={() => setShowUploadForm(true)} style={styles.uploadButton}>
              <FiUpload /> Upload First Material
            </button>
          </div>
        ) : (
          <div style={styles.materialsList}>
            {materials.map((material) => (
              <div key={material._id} style={styles.materialCard}>
                <div style={styles.materialIcon}>{getFileIcon(material.file_type)}</div>
                <div style={styles.materialInfo}>
                  <h4 style={styles.materialTitle}>{material.title}</h4>
                  <p style={styles.materialDescription}>{material.description}</p>
                  <div style={styles.materialMeta}>
                    <span>{material.file_name}</span>
                    <span>•</span>
                    <span>{formatFileSize(material.file_size)}</span>
                    <span>•</span>
                    <span>{new Date(material.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span
                      style={{
                        ...styles.accessBadge,
                        background:
                          material.access_type === "attended_only" ? "#f59e0b" : "#10b981",
                      }}
                    >
                      {material.access_type === "attended_only" ? "Attended Only" : "All Users"}
                    </span>
                  </div>
                </div>
                <div style={styles.materialActions}>
                  <a
                    href={material.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.downloadButton}
                    title="Download"
                  >
                    <FiDownload />
                  </a>
                  <button
                    onClick={() => handleDelete(material._id)}
                    style={styles.deleteButton}
                    title="Delete"
                  >
                    <FiTrash2 />
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
  meetCard: {
    maxWidth: "1200px",
    margin: "0 auto 2rem",
    background: "white",
    padding: "1.5rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1rem",
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
  accessInfo: {
    textAlign: "right",
  },
  accessLabel: {
    display: "block",
    fontSize: "0.875rem",
    color: "#94a3b8",
    marginBottom: "0.25rem",
  },
  accessValue: {
    display: "block",
    fontSize: "1rem",
    color: "#1e293b",
    fontWeight: 600,
  },
  uploadCard: {
    maxWidth: "1200px",
    margin: "0 auto 2rem",
    background: "white",
    padding: "2rem",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  uploadTitle: {
    fontSize: "1.5rem",
    color: "#1e293b",
    marginBottom: "1.5rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "1rem",
    color: "#1e293b",
    fontWeight: 600,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
  },
  textarea: {
    padding: "0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
    fontFamily: "inherit",
    resize: "vertical",
  },
  select: {
    padding: "0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
    background: "white",
    cursor: "pointer",
  },
  hint: {
    fontSize: "0.875rem",
    color: "#64748b",
  },
  fileInput: {
    padding: "0.75rem",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "1rem",
    cursor: "pointer",
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem",
    background: "#f8fafc",
    borderRadius: "8px",
    fontSize: "0.875rem",
    color: "#64748b",
  },
  progressContainer: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  progressBar: {
    flex: 1,
    height: "8px",
    background: "#e2e8f0",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
    transition: "width 0.3s",
  },
  progressText: {
    fontSize: "0.875rem",
    color: "#64748b",
    fontWeight: 600,
    minWidth: "45px",
  },
  buttonGroup: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: "0.75rem 1.5rem",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    color: "#64748b",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
  },
  submitButton: {
    padding: "0.75rem 1.5rem",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
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
  materialTitle: {
    fontSize: "1.125rem",
    color: "#1e293b",
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
  accessBadge: {
    padding: "0.25rem 0.5rem",
    color: "white",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  materialActions: {
    display: "flex",
    gap: "0.5rem",
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
  deleteButton: {
    padding: "0.75rem",
    background: "#ef4444",
    border: "none",
    borderRadius: "8px",
    color: "white",
    fontSize: "1.25rem",
    cursor: "pointer",
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
};

export default MeetMaterials;
