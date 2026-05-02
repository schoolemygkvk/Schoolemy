import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  message,
  Space,
  Typography,
} from "antd";
import {
  UploadOutlined,
} from "@ant-design/icons";
import api from "../../../Utils/api";
import { getToken } from "../../../Hooks/useToken";

const { Text } = Typography;

const InstructorManagement = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState(null);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [selectedInstructorForImage, setSelectedInstructorForImage] = useState(null);
  const [imageFileForUpdate, setImageFileForUpdate] = useState(null);
  const [imagePreviewForUpdate, setImagePreviewForUpdate] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [failedImageIds, setFailedImageIds] = useState(new Set());
  const retriedImageIdsRef = React.useRef(new Set());

  // Fetch instructors
  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = token ? { Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}` } : {};

      const response = await api.get('/get-instructors-all', { headers });

      if (response.data?.success && response.data.instructors) {
        const sortedInstructors = response.data.instructors
          .map(instructor => ({
            ...instructor,
            image: instructor.imageUrl || instructor.image || '',
          }))
          .sort((a, b) => {
            const orderA = a.order !== undefined && a.order !== null ? a.order : Number.MAX_SAFE_INTEGER;
            const orderB = b.order !== undefined && b.order !== null ? b.order : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
          });
        setInstructors(sortedInstructors);
        setFailedImageIds(new Set());
        retriedImageIdsRef.current = new Set();
      }
    } catch (err) {
      console.error('Error fetching instructors:', err);
      message.error('Failed to fetch instructors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  // Handle form submission
  const handleSubmit = async (values) => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}` } : {};

      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('designation', values.designation);
      formData.append('tenure', values.tenure);
      formData.append('remuneration', values.remuneration);
      formData.append('qualification', values.qualification);
      if (values.order) {
        formData.append('order', values.order);
      }
      if (imageFile) {
        // Ant Design Upload wraps File in info.file - use originFileObj for actual File
        const fileToUpload = imageFile.originFileObj || imageFile;
        formData.append('image', fileToUpload);
      }

      if (editingInstructor) {
        // Update instructor - use correct endpoint based on whether new image is selected
        if (imageFile) {
          // Updating with new image: use image endpoint (FormData with image)
          // IMPORTANT: Do NOT set Content-Type - axios sets multipart/form-data with boundary automatically
          const response = await api.put(`/update-instructor/${editingInstructor._id}`, formData, {
            headers: {
              ...headers,
              // Let axios set Content-Type for FormData (includes boundary)
            },
          });
          // Update state immediately with new imageUrl so it displays without waiting for refetch
          if (response.data?.success && response.data?.instructor) {
            const updated = {
              ...response.data.instructor,
              image: response.data.instructor.imageUrl || response.data.instructor.image || '',
              _imgVersion: Date.now(), // Force browser to bypass cache for new image
            };
            setInstructors((prev) =>
              prev.map((inst) => (inst._id === updated._id ? updated : inst))
            );
            setFailedImageIds((prev) => {
              const next = new Set(prev);
              next.delete(editingInstructor._id);
              return next;
            });
          }
        } else {
          // Updating without new image: use JSON body
          await api.put(`/update-instructor/${editingInstructor._id}`, {
            name: values.name,
            designation: values.designation,
            tenure: values.tenure,
            remuneration: values.remuneration,
            qualification: values.qualification,
            order: values.order,
          }, {
            headers: { ...headers },
          });
        }
        message.success('Instructor updated successfully');
      } else {
        // Create new instructor
        // IMPORTANT: Do NOT set Content-Type - axios sets multipart/form-data with boundary automatically
        await api.post('/post-create-instructor', formData, {
          headers: { ...headers },
        });
        message.success('Instructor created successfully');
      }
      
      setIsModalVisible(false);
      setEditingInstructor(null);
      setImageFile(null);
      setImagePreview(null);
      form.resetFields();
      fetchInstructors();
    } catch (err) {
      console.error('Error saving instructor:', err);
      message.error(err.response?.data?.message || 'Failed to save instructor');
    }
  };

  // Handle edit
  const handleEdit = (instructor) => {
    setEditingInstructor(instructor);
    form.setFieldsValue({
      name: instructor.name,
      designation: instructor.designation,
      tenure: instructor.tenure,
      remuneration: instructor.remuneration,
      qualification: instructor.qualification,
      order: instructor.order,
    });
    setImagePreview(instructor.imageUrl || instructor.image || null);
    setIsModalVisible(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      const token = getToken();
      const headers = token ? { Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}` } : {};

      await api.delete(`/delete-instructor/${id}`, { headers });
      message.success('Instructor deleted successfully');
      fetchInstructors();
    } catch (err) {
      console.error('Error deleting instructor:', err);
      message.error(err.response?.data?.message || 'Failed to delete instructor');
    }
  };

  // Handle image upload
  const handleImageChange = (info) => {
    if (info.file) {
      const file = info.file;
      if (file.size > 2 * 1024 * 1024) {
        message.error('Image size should be less than 2MB. Use a smaller image or compress it.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle modal close
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingInstructor(null);
    setImageFile(null);
    setImagePreview(null);
    form.resetFields();
  };

  // Handle add new instructor
  const handleAdd = () => {
    setEditingInstructor(null);
    setImagePreview(null);
    setImageFile(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  // Handle open image management modal
  const handleOpenImageModal = (instructor) => {
    setSelectedInstructorForImage(instructor);
    setImagePreviewForUpdate(instructor.imageUrl || instructor.image || null);
    setImageFileForUpdate(null);
    setIsImageModalVisible(true);
  };

  // Handle close image management modal
  const handleCloseImageModal = () => {
    setIsImageModalVisible(false);
    setSelectedInstructorForImage(null);
    setImageFileForUpdate(null);
    setImagePreviewForUpdate(null);
  };

  // Handle image file selection for update
  const handleImageFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        message.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 2MB - API Gateway default limit ~6MB, keep safe margin)
      if (file.size > 2 * 1024 * 1024) {
        message.error('Image size should be less than 2MB. Use a smaller image or compress it.');
        return;
      }

      setImageFileForUpdate(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewForUpdate(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Update instructor image only
  const handleUpdateImageOnly = async () => {
    if (!imageFileForUpdate) {
      message.error('Please select an image file');
      return;
    }

    if (!selectedInstructorForImage) {
      message.error('No instructor selected');
      return;
    }

    setImageLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}` } : {};

      const formData = new FormData();
      formData.append('image', imageFileForUpdate);

      // Do NOT set Content-Type - axios sets multipart/form-data with boundary automatically
      const response = await api.put(
        `/update-instructor/${selectedInstructorForImage._id}/image`,
        formData,
        { headers: { ...headers } }
      );

      if (response.data?.success && response.data?.instructor) {
        message.success('Instructor image updated successfully');
        const updatedInstructor = {
          ...response.data.instructor,
          image: response.data.instructor.imageUrl || response.data.instructor.image || '',
          _imgVersion: Date.now(), // Force browser to bypass cache for new image
        };
        setInstructors((prev) =>
          prev.map((inst) =>
            inst._id === updatedInstructor._id ? updatedInstructor : inst
          )
        );
        setFailedImageIds((prev) => {
          const next = new Set(prev);
          next.delete(selectedInstructorForImage._id);
          return next;
        });
        retriedImageIdsRef.current.delete(selectedInstructorForImage._id);
        handleCloseImageModal();
        // Do NOT refetch - we have correct data from response; refetch can overwrite with stale data
      } else {
        message.error(response.data?.message || 'Failed to update image');
      }
    } catch (err) {
      console.error('Error updating instructor image:', err);
      message.error(err.response?.data?.message || 'Failed to update image');
    } finally {
      setImageLoading(false);
    }
  };

  // Remove instructor image only
  const handleRemoveImage = async () => {
    if (!selectedInstructorForImage) {
      message.error('No instructor selected');
      return;
    }

    if (!selectedInstructorForImage.imageUrl && !selectedInstructorForImage.image) {
      message.error('Instructor does not have an image to remove');
      return;
    }

    if (!window.confirm('Are you sure you want to remove this image?')) {
      return;
    }

    setImageLoading(true);
    try {
      const token = getToken();
      const headers = token ? { Authorization: token.startsWith('Bearer') ? token : `Bearer ${token}` } : {};

      const response = await api.delete(
        `/remove-instructor/${selectedInstructorForImage._id}/image`,
        { headers }
      );

      if (response.data?.success) {
        message.success('Instructor image removed successfully');
        handleCloseImageModal();
        fetchInstructors();
      } else {
        message.error(response.data?.message || 'Failed to remove image');
      }
    } catch (err) {
      console.error('Error removing instructor image:', err);
      message.error(err.response?.data?.message || 'Failed to remove image');
    } finally {
      setImageLoading(false);
    }
  };

  // Define style constants matching Staff-Management.js
  const colors = {
    primary: "#4F46E5",
    primaryDark: "#4338CA",
    textPrimary: "#1F2937",
    textSecondary: "#4B5563",
    textLight: "#6B7280",
    borderLight: "#E5E7EB",
    borderDefault: "#D1D5DB",
    bgRoot: "linear-gradient(to bottom right, #F9FAFB, #F3F4F6)",
    bgLight: "#F9FAFB",
    bgLighter: "#F3F4F6",
    white: "#FFFFFF",
    success: "#10B981",
    error: "#EF4444",
    delete: "#DC2626",
  };

  const shadows = {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  };

  const styles = {
    pageContainer: {
      minHeight: "100vh",
      background: colors.bgRoot,
      padding: "32px",
    },
    headerContainer: {
      maxWidth: "1280px",
      margin: "0 auto 32px auto",
    },
    headerFlex: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
      flexWrap: "wrap",
    },
    headerTitle: {
      fontSize: "28px",
      fontWeight: "bold",
      color: colors.textPrimary,
      margin: 0,
    },
    headerSubtitle: {
      color: colors.textSecondary,
      marginTop: "8px",
      margin: 0,
    },
    buttonPrimary: {
      backgroundColor: colors.primary,
      color: colors.white,
      fontWeight: "500",
      padding: "10px 24px",
      borderRadius: "8px",
      border: "none",
      cursor: "pointer",
      boxShadow: shadows.md,
      transition: "background-color 0.2s, transform 0.1s",
      outline: "none",
    },
    buttonPrimaryHover: {
      backgroundColor: colors.primaryDark,
      transform: "translateY(-2px)",
    },
    mainContentContainer: {
      maxWidth: "1280px",
      margin: "0 auto",
      backgroundColor: colors.white,
      borderRadius: "16px",
      boxShadow: shadows.xl,
      overflow: "hidden",
    },
    loadingContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "384px",
    },
    spinner: {
      borderRadius: "50%",
      height: "48px",
      width: "48px",
      borderTop: `3px solid ${colors.primary}`,
      borderRight: `3px solid ${colors.primary}`,
      borderBottom: `3px solid ${colors.primary}`,
      borderLeft: "3px solid transparent",
      animation: "spin 1s linear infinite",
    },
    cardsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
      gap: "24px",
      padding: "24px",
    },
    card: {
      backgroundColor: colors.white,
      borderRadius: "12px",
      border: `1px solid ${colors.borderLight}`,
      boxShadow: shadows.sm,
      padding: "20px",
      transition: "all 0.2s ease-in-out",
    },
    cardHover: {
      boxShadow: shadows.lg,
      transform: "translateY(-4px)",
      borderColor: colors.primary,
    },
    cardHeader: {
      display: "flex",
      alignItems: "center",
      gap: "16px",
      marginBottom: "16px",
      paddingBottom: "16px",
      borderBottom: `1px solid ${colors.borderLight}`,
    },
    cardProfilePic: {
      height: "64px",
      width: "64px",
      borderRadius: "50%",
      objectFit: "cover",
      border: `3px solid ${colors.borderLight}`,
      flexShrink: 0,
    },
    cardProfilePicPlaceholder: {
      backgroundColor: colors.bgLighter,
      border: `2px dashed ${colors.borderDefault}`,
      borderRadius: "50%",
      width: "64px",
      height: "64px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      fontSize: "24px",
      fontWeight: "600",
      color: colors.primary,
    },
    cardHeaderInfo: {
      flex: 1,
      minWidth: 0,
    },
    cardName: {
      fontSize: "18px",
      fontWeight: "600",
      color: colors.textPrimary,
      marginBottom: "4px",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    cardDesignation: {
      fontSize: "14px",
      color: colors.textSecondary,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    cardBody: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    cardInfoRow: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "14px",
    },
    cardInfoLabel: {
      color: colors.textSecondary,
      fontWeight: "500",
      minWidth: "100px",
    },
    cardInfoValue: {
      color: colors.textPrimary,
      flex: 1,
    },
    cardActions: {
      display: "flex",
      gap: "8px",
      marginTop: "16px",
      paddingTop: "16px",
      borderTop: `1px solid ${colors.borderLight}`,
      flexWrap: "wrap",
    },
    cardActionButton: {
      flex: 1,
      padding: "10px 16px",
      borderRadius: "8px",
      border: "none",
      fontSize: "14px",
      fontWeight: "500",
      cursor: "pointer",
      transition: "all 0.2s",
      outline: "none",
    },
    cardEditButton: {
      backgroundColor: colors.primary,
      color: colors.white,
    },
    cardEditButtonHover: {
      backgroundColor: colors.primaryDark,
      transform: "translateY(-1px)",
      boxShadow: shadows.md,
    },
    cardDeleteButton: {
      backgroundColor: colors.white,
      color: colors.delete,
      border: `1px solid ${colors.delete}`,
    },
    cardDeleteButtonHover: {
      backgroundColor: colors.delete,
      color: colors.white,
      transform: "translateY(-1px)",
      boxShadow: shadows.md,
    },
    emptyState: {
      padding: "64px 24px",
      textAlign: "center",
      color: colors.textLight,
      fontSize: "16px",
      fontStyle: "italic",
    },
    uploadArea: {
      width: "100%",
      height: "200px",
      border: "2px dashed #d9d9d9",
      borderRadius: "8px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      backgroundColor: "#fafafa",
      transition: "all 0.3s",
    },
    imagePreview: {
      width: "100%",
      maxHeight: "200px",
      objectFit: "contain",
      borderRadius: "8px",
    },
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={styles.pageContainer}>
        <div style={styles.headerContainer}>
          <div style={styles.headerFlex}>
            <div>
              <h1 style={styles.headerTitle}>Instructor Management</h1>
              <p style={styles.headerSubtitle}>
                Manage your organization's instructors
              </p>
            </div>
            <div>
              <button
                onClick={handleAdd}
                style={styles.buttonPrimary}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primaryDark;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.primary;
                  e.currentTarget.style.transform = "none";
                }}
                disabled={loading}
              >
                Add New Instructor
              </button>
            </div>
          </div>
        </div>

        <div style={styles.mainContentContainer}>
          {loading && !instructors.length ? (
            <div style={styles.loadingContainer}>
              <div style={styles.spinner}></div>
            </div>
          ) : (
            <>
              {instructors.length === 0 && !loading ? (
                <div style={styles.emptyState}>
                  No instructors found.
                </div>
              ) : (
                <div style={styles.cardsGrid}>
                  {instructors.map((instructor) => {
                    const imgUrl = instructor.imageUrl || instructor.image || '';
                    const hasImage = imgUrl && imgUrl.trim() !== '' && !failedImageIds.has(instructor._id);
                    const firstLetter = instructor.name?.charAt(0)?.toUpperCase() || '?';
                    const cacheBust = instructor._imgVersion || (instructor.updatedAt ? new Date(instructor.updatedAt).getTime() : '');
                    const displayImgUrl = imgUrl
                      ? `${imgUrl}${imgUrl.includes('?') ? '&' : '?'}v=${cacheBust || Date.now()}`
                      : '';

                    return (
                      <div
                        key={instructor._id}
                        style={{
                          ...styles.card,
                          ...(hoveredCardId === instructor._id && styles.cardHover),
                        }}
                        onMouseEnter={() => setHoveredCardId(instructor._id)}
                        onMouseLeave={() => setHoveredCardId(null)}
                      >
                        <div style={styles.cardHeader}>
                          {hasImage ? (
                            <img
                              key={displayImgUrl}
                              src={displayImgUrl}
                              alt={instructor.name}
                              style={styles.cardProfilePic}
                              referrerPolicy="no-referrer"
                              onError={() => {
                                setFailedImageIds((prev) => new Set(prev).add(instructor._id));
                                if (!retriedImageIdsRef.current.has(instructor._id)) {
                                  retriedImageIdsRef.current.add(instructor._id);
                                  setTimeout(() => {
                                    setFailedImageIds((prev) => {
                                      const next = new Set(prev);
                                      next.delete(instructor._id);
                                      return next;
                                    });
                                  }, 2000);
                                }
                              }}
                            />
                          ) : (
                            <div style={styles.cardProfilePicPlaceholder}>
                              {firstLetter}
                            </div>
                          )}
                          <div style={styles.cardHeaderInfo}>
                            <div style={styles.cardName}>{instructor.name}</div>
                            <div style={styles.cardDesignation}>
                              {instructor.designation}
                            </div>
                          </div>
                        </div>
                        <div style={styles.cardBody}>
                          <div style={styles.cardInfoRow}>
                            <span style={styles.cardInfoLabel}>Tenure:</span>
                            <span style={styles.cardInfoValue}>
                              {instructor.tenure || '-'}
                            </span>
                          </div>
                          <div style={styles.cardInfoRow}>
                            <span style={styles.cardInfoLabel}>Remuneration:</span>
                            <span style={styles.cardInfoValue}>
                              {instructor.remuneration || '-'}
                            </span>
                          </div>
                          <div style={styles.cardInfoRow}>
                            <span style={styles.cardInfoLabel}>Qualification:</span>
                            <span style={styles.cardInfoValue}>
                              {instructor.qualification || '-'}
                            </span>
                          </div>
                          {instructor.order !== undefined && instructor.order !== null && (
                            <div style={styles.cardInfoRow}>
                              <span style={styles.cardInfoLabel}>Order:</span>
                              <span style={styles.cardInfoValue}>
                                {instructor.order}
                              </span>
                            </div>
                          )}
                        </div>
                        <div style={styles.cardActions}>
                          <button
                            onClick={() => handleEdit(instructor)}
                            style={{
                              ...styles.cardActionButton,
                              ...styles.cardEditButton,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                styles.cardEditButtonHover.backgroundColor;
                              e.currentTarget.style.transform =
                                styles.cardEditButtonHover.transform;
                              e.currentTarget.style.boxShadow =
                                styles.cardEditButtonHover.boxShadow;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                styles.cardEditButton.backgroundColor;
                              e.currentTarget.style.transform = "none";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleOpenImageModal(instructor)}
                            style={{
                              ...styles.cardActionButton,
                              backgroundColor: colors.white,
                              color: colors.primary,
                              border: `1px solid ${colors.primary}`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.primary;
                              e.currentTarget.style.color = colors.white;
                              e.currentTarget.style.transform = "translateY(-1px)";
                              e.currentTarget.style.boxShadow = shadows.md;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = colors.white;
                              e.currentTarget.style.color = colors.primary;
                              e.currentTarget.style.transform = "none";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                            disabled={loading}
                          >
                            Image
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this instructor?")) {
                                handleDelete(instructor._id);
                              }
                            }}
                            style={{
                              ...styles.cardActionButton,
                              ...styles.cardDeleteButton,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                styles.cardDeleteButtonHover.backgroundColor;
                              e.currentTarget.style.color =
                                styles.cardDeleteButtonHover.color;
                              e.currentTarget.style.transform =
                                styles.cardDeleteButtonHover.transform;
                              e.currentTarget.style.boxShadow =
                                styles.cardDeleteButtonHover.boxShadow;
                              e.currentTarget.style.borderColor =
                                styles.cardDeleteButtonHover.backgroundColor;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                styles.cardDeleteButton.backgroundColor;
                              e.currentTarget.style.color =
                                styles.cardDeleteButton.color;
                              e.currentTarget.style.transform = "none";
                              e.currentTarget.style.boxShadow = "none";
                              e.currentTarget.style.borderColor = colors.delete;
                            }}
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <Modal
        title={editingInstructor ? "Edit Instructor" : "Add Instructor"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: "Please enter name" }]}
              >
                <Input placeholder="Enter name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Designation"
                name="designation"
                rules={[{ required: true, message: "Please enter designation" }]}
              >
                <Input placeholder="Enter designation" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tenure"
                name="tenure"
                rules={[{ required: true, message: "Please enter tenure" }]}
              >
                <Input placeholder="e.g., 2023 to 2026" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Remuneration"
                name="remuneration"
                rules={[{ required: true, message: "Please enter remuneration" }]}
              >
                <Input placeholder="e.g., Honorary" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Qualification"
                name="qualification"
                rules={[{ required: true, message: "Please enter qualification" }]}
              >
                <Input placeholder="Enter qualification" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Order"
                name="order"
                tooltip="Display order (lower numbers appear first)"
              >
                <Input type="number" placeholder="Enter order number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Image"
            name="image"
          >
            <Upload
              beforeUpload={() => false}
              onChange={handleImageChange}
              showUploadList={false}
              accept="image/*"
            >
              <div style={styles.uploadArea}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" style={styles.imagePreview} />
                ) : (
                  <>
                    <UploadOutlined style={{ fontSize: "48px", color: "#8c8c8c" }} />
                    <Text style={{ marginTop: "8px", color: "#8c8c8c" }}>
                      Click to upload image
                    </Text>
                  </>
                )}
              </div>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: "24px" }}>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingInstructor ? "Update" : "Add"} Instructor
              </Button>
              <Button onClick={handleCancel}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Image Management Modal */}
      <Modal
        title={`Manage Image - ${selectedInstructorForImage?.name || ''}`}
        open={isImageModalVisible}
        onCancel={handleCloseImageModal}
        footer={null}
        width={600}
      >
        {selectedInstructorForImage && (
          <div>
            {/* Current Image Display */}
            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ marginBottom: "12px", color: colors.textPrimary }}>
                Current Image
              </h4>
              {selectedInstructorForImage.imageUrl || selectedInstructorForImage.image ? (
                <div style={{ textAlign: "center" }}>
                  <img
                    src={selectedInstructorForImage.imageUrl || selectedInstructorForImage.image}
                    alt={selectedInstructorForImage.name}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      borderRadius: "8px",
                      border: `1px solid ${colors.borderLight}`,
                      boxShadow: shadows.sm,
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    backgroundColor: colors.bgLighter,
                    borderRadius: "8px",
                    border: `1px dashed ${colors.borderDefault}`,
                    color: colors.textLight,
                  }}
                >
                  No image uploaded
                </div>
              )}
            </div>

            {/* Update Image Section */}
            <div style={{ marginBottom: "24px" }}>
              <h4 style={{ marginBottom: "12px", color: colors.textPrimary }}>
                Update Image
              </h4>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileSelect}
                disabled={imageLoading}
                style={{ marginBottom: "12px", width: "100%" }}
              />
              {imagePreviewForUpdate && imageFileForUpdate && (
                <div style={{ marginBottom: "12px" }}>
                  <h5 style={{ marginBottom: "8px", color: colors.textSecondary }}>
                    Preview:
                  </h5>
                  <img
                    src={imagePreviewForUpdate}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "200px",
                      borderRadius: "8px",
                      border: `1px solid ${colors.borderLight}`,
                      boxShadow: shadows.sm,
                    }}
                  />
                </div>
              )}
              <Button
                type="primary"
                onClick={handleUpdateImageOnly}
                disabled={!imageFileForUpdate || imageLoading}
                loading={imageLoading}
                style={{ width: "100%" }}
              >
                {imageLoading ? "Uploading..." : "Upload New Image"}
              </Button>
            </div>

            {/* Remove Image Section */}
            {(selectedInstructorForImage.imageUrl || selectedInstructorForImage.image) && (
              <div style={{ marginBottom: "24px", paddingTop: "24px", borderTop: `1px solid ${colors.borderLight}` }}>
                <h4 style={{ marginBottom: "12px", color: colors.textPrimary }}>
                  Remove Image
                </h4>
                <p style={{ color: colors.textSecondary, marginBottom: "12px" }}>
                  This will permanently delete the current image from the server.
                </p>
                <Button
                  danger
                  onClick={handleRemoveImage}
                  disabled={imageLoading}
                  loading={imageLoading}
                  style={{ width: "100%" }}
                >
                  {imageLoading ? "Removing..." : "Remove Image"}
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <Button onClick={handleCloseImageModal} disabled={imageLoading}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
      </div>
    </>
  );
};

export default InstructorManagement;
