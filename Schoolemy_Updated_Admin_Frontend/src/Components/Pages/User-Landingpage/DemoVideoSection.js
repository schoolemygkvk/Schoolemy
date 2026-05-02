import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios, { API_URL } from "../../../Utils/api";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  IconButton,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  Paper,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  Add,
  Delete,
  CloudUpload,
  Visibility,
  Close,
} from "@mui/icons-material";
import styled from "styled-components";
import * as FaIcons from "react-icons/fa";

// Styled Components for Preview
const PreviewContainer = styled.section`
  max-width: 1300px;
  margin: 0 auto;
  padding: 2.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  
  @media (min-width: 768px) {
    padding: 4rem 1.5rem;
  }
  
  @media (min-width: 1024px) {
    padding: 6rem 2rem;
  }
`;

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const PreviewTitle = styled.h1`
  color: #1F2937;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  margin: 0;
  margin-bottom: 0.5rem;
  
  @media (min-width: 768px) {
    font-size: 2rem;
    margin-bottom: 0.75rem;
  }
  
  @media (min-width: 1024px) {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
`;

const PreviewSubtitle = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
  line-height: 1.625;
  margin: 0;
  
  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

const PreviewVideoContainer = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  background-color: #000;
  
  @media (min-width: 768px) {
    border-radius: 0.75rem;
  }
  
  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }
`;

const PreviewThumbnail = styled.img`
  width: 100%;
  max-width: 100%;
  height: auto;
  max-height: 500px;
  border-radius: 0.5rem;
  object-fit: contain;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  background-color: #f9fafb;
  display: block;
  
  @media (min-width: 768px) {
    border-radius: 0.75rem;
    max-height: 600px;
  }
`;

const PreviewStatsTitle = styled.h2`
  color: #1F2937;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.25;
  margin: 0;
  margin-bottom: 1rem;
  
  @media (min-width: 768px) {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  @media (min-width: 1024px) {
    font-size: 1.75rem;
  }
`;

const PreviewButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  background-color: #111827;
  color: #FFFFFF;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    background-color: #1F2937;
  }
  
  @media (min-width: 768px) {
    padding: 0.875rem 1.75rem;
  }
`;

const PreviewMetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 1.5rem;
  
  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const PreviewMetricCard = styled.div`
  background-color: #ffffff;
  border: 1px solid #E5E7EB;
  border-radius: 0.5rem;
  padding: 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
`;

const PreviewMetricIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: center;
  align-items: center;
  
  svg {
    color: #4F46E5;
  }
`;

const PreviewMetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 0.5rem;
  
  @media (min-width: 768px) {
    font-size: 1.75rem;
  }
`;

const PreviewMetricLabel = styled.div`
  font-size: 0.875rem;
  color: #6B7280;
  font-weight: 500;
`;

const PreviewReviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  background-color: #F9FAFB;
  border-radius: 0.5rem;
  padding: 1.5rem;
  
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: flex-start;
    padding: 2rem;
  }
`;

const PreviewReviewImage = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  margin: 0 auto;
  
  @media (min-width: 768px) {
    margin: 0;
  }
`;

const PreviewReviewText = styled.p`
  font-size: 0.875rem;
  color: #1F2937;
  line-height: 1.625;
  margin: 0;
  font-style: italic;
  flex: 1;
  
  @media (min-width: 768px) {
    font-size: 1rem;
  }
`;

// Helper function to get icon component dynamically
const getIconComponent = (iconName) => {
  if (!iconName) return null;
  const IconComponent = FaIcons[iconName];
  return IconComponent || null;
};

// Helper function to get thumbnail URL
const getThumbnailUrl = (thumbnail) => {
  if (!thumbnail) return "";
  // If it's already a full URL or data URL, return as is
  if (thumbnail.startsWith("http") || thumbnail.startsWith("data:")) {
    return thumbnail;
  }
  // If it's a relative path starting with /, construct full URL with API base
  if (thumbnail.startsWith("/")) {
    if (thumbnail.includes('/uploads/') || thumbnail.includes('/images/')) {
      return `${API_URL}${thumbnail}`;
    }
    return `${window.location.origin}${thumbnail}`;
  }
  // If it doesn't start with /, it might be a relative path from API
  return `${API_URL}/${thumbnail}`;
};

// Helper function to convert YouTube URL to embed format
const getYouTubeEmbedUrl = (url) => {
  if (!url) return "";
  
  // Clean the URL - remove any whitespace
  url = url.trim();
  
  // If it's already an embed URL, return as is (but clean up any extra params)
  if (url.includes("youtube.com/embed/")) {
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch && embedMatch[1]) {
      return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }
    return url;
  }
  
  // Extract video ID from various YouTube URL formats
  let videoId = "";
  
  // Short YouTube URL: https://youtu.be/VIDEO_ID or https://youtu.be/VIDEO_ID?si=...
  // This handles: https://youtu.be/_8kV4FHSDnA?si=FEP5_1J62T8S3MxZ
  if (url.includes("youtu.be/")) {
    const match = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      videoId = match[1];
    }
  }
  // Standard YouTube URL: https://www.youtube.com/watch?v=VIDEO_ID
  else if (url.includes("youtube.com/watch")) {
    const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      videoId = match[1];
    }
  }
  // YouTube mobile URL: https://m.youtube.com/watch?v=VIDEO_ID
  else if (url.includes("m.youtube.com/watch")) {
    const match = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
      videoId = match[1];
    }
  }
  // If it's already just a video ID (11 characters)
  else if (url.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url)) {
    videoId = url;
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  // If we can't parse it, return the original URL (might already be embed format)
  console.warn("Could not parse YouTube URL:", url);
  return url;
};

const DemoVideoSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    videoUrl: "",
    videoThumbnail: null,
    videoThumbnailPreview: "",
    statsTitle: "",
    buttonText: "",
    buttonLink: "",
    metrics: [
      {
        value: "",
        label: "",
        icon: "",
      },
    ],
    review: {
      text: "",
      image: null,
      imagePreview: "",
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/userdashboard/demo-video");
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setFormData({
          title: data.title || "",
          subtitle: data.subtitle || "",
          videoUrl: data.videoUrl || "",
          videoThumbnail: null,
          videoThumbnailPreview: data.videoThumbnail || "",
          statsTitle: data.statsTitle || "",
          buttonText: data.buttonText || "",
          buttonLink: data.buttonLink || "",
          metrics:
            data.metrics && data.metrics.length > 0
              ? data.metrics
              : [
                  {
                    value: "",
                    label: "",
                    icon: "",
                  },
                ],
          review: data.review
            ? {
                ...data.review,
                image: null,
                imagePreview: data.review.image || "",
              }
            : {
                text: "",
                image: null,
                imagePreview: "",
              },
        });
      }
    } catch (error) {
      console.error("Error fetching demo video data:", error);
      setMessage({
        type: "error",
        text: "Failed to load demo video section data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const handleMetricChange = (index, field, value) => {
    const newMetrics = [...formData.metrics];
    newMetrics[index][field] = value;
    setFormData((prev) => ({ ...prev, metrics: newMetrics }));
  };

  const handleAddMetric = () => {
    setFormData((prev) => ({
      ...prev,
      metrics: [
        ...prev.metrics,
        {
          value: "",
          label: "",
          icon: "",
        },
      ],
    }));
  };

  const handleRemoveMetric = (index) => {
    if (formData.metrics.length > 1) {
      setFormData((prev) => ({
        ...prev,
        metrics: prev.metrics.filter((_, i) => i !== index),
      }));
    }
  };

  const handleImageChange = (field, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === "videoThumbnail") {
          setFormData((prev) => ({
            ...prev,
            videoThumbnail: file,
            videoThumbnailPreview: reader.result,
          }));
        } else if (field === "reviewImage") {
          setFormData((prev) => ({
            ...prev,
            review: {
              ...prev.review,
              image: file,
              imagePreview: reader.result,
            },
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("subtitle", formData.subtitle);
      submitData.append("videoUrl", formData.videoUrl);
      submitData.append("statsTitle", formData.statsTitle);
      submitData.append("buttonText", formData.buttonText);
      submitData.append("buttonLink", formData.buttonLink);
      submitData.append("metrics", JSON.stringify(formData.metrics));

      if (formData.videoThumbnail instanceof File) {
        submitData.append("videoThumbnail", formData.videoThumbnail);
      }

      if (formData.review.image instanceof File) {
        submitData.append("reviewImage", formData.review.image);
      }
      submitData.append("review", JSON.stringify({
        text: formData.review.text,
      }));

      const response = await axios.put("/api/userdashboard/demo-video", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Demo video section updated successfully!",
        });
        setTimeout(() => {
          fetchData();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving demo video data:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save demo video data. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/schoolemy/user-landing-page")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Demo Video Section Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Visibility />}
          onClick={() => setViewOpen(true)}
          sx={{ ml: "auto" }}
        >
          View
        </Button>
      </Box>

      {message.text && (
        <Alert
          severity={message.type}
          onClose={() => setMessage({ type: "", text: "" })}
          sx={{ mb: 3 }}
        >
          {message.text}
        </Alert>
      )}

      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          borderLeft: '4px solid',
          borderColor: 'primary.main',
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Demo Video Section Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your demo video section including video information, stats, metrics, and review content.
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {formData.metrics.filter((m) => m.value || m.label).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.metrics.filter((m) => m.value || m.label).length === 1 ? "Metric" : "Metrics"}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Video Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  margin="normal"
                  required
                  multiline
                  minRows={2}
                  maxRows={6}
                  InputProps={{
                    style: { overflow: "auto", resize: "vertical" },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subtitle"
                  value={formData.subtitle}
                  onChange={(e) => handleChange("subtitle", e.target.value)}
                  margin="normal"
                  multiline
                  minRows={3}
                  maxRows={8}
                  InputProps={{
                    style: { overflow: "auto", resize: "vertical" },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Video URL (YouTube embed URL)"
                  value={formData.videoUrl}
                  onChange={(e) => handleChange("videoUrl", e.target.value)}
                  margin="normal"
                  placeholder="https://www.youtube.com/embed/..."
                  multiline
                  minRows={2}
                  maxRows={4}
                  InputProps={{
                    style: { overflow: "auto", resize: "vertical" },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="video-thumbnail"
                    type="file"
                    onChange={(e) => handleImageChange("videoThumbnail", e)}
                  />
                  <label htmlFor="video-thumbnail">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{ mr: 2 }}
                    >
                      Upload Video Thumbnail
                    </Button>
                  </label>
                  {formData.videoThumbnailPreview && (
                    <Box
                      component="img"
                      src={formData.videoThumbnailPreview}
                      alt="Video thumbnail"
                      sx={{
                        mt: 2,
                        maxWidth: "100%",
                        maxHeight: "300px",
                        borderRadius: 1,
                      }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Stats Section
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Stats Title"
                  value={formData.statsTitle}
                  onChange={(e) => handleChange("statsTitle", e.target.value)}
                  margin="normal"
                  multiline
                  minRows={2}
                  maxRows={6}
                  InputProps={{
                    style: { overflow: "auto", resize: "vertical" },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Button Text"
                  value={formData.buttonText}
                  onChange={(e) => handleChange("buttonText", e.target.value)}
                  margin="normal"
                  multiline
                  minRows={2}
                  maxRows={4}
                  InputProps={{
                    style: { overflow: "auto", resize: "vertical" },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Button Link"
                  value={formData.buttonLink}
                  onChange={(e) => handleChange("buttonLink", e.target.value)}
                  margin="normal"
                  multiline
                  minRows={2}
                  maxRows={4}
                  InputProps={{
                    style: { overflow: "auto", resize: "vertical" },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" sx={{ mb: 2 }}>Metrics</Typography>

                {formData.metrics.map((metric, index) => (
                  <Card key={index} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography variant="subtitle2">
                          Metric {index + 1}
                        </Typography>
                        {formData.metrics.length > 1 && (
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveMetric(index)}
                          >
                            <Delete />
                          </IconButton>
                        )}
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Value"
                            value={metric.value}
                            onChange={(e) =>
                              handleMetricChange(index, "value", e.target.value)
                            }
                            margin="normal"
                            multiline
                            minRows={2}
                            maxRows={4}
                            InputProps={{
                              style: { overflow: "auto", resize: "vertical" },
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Label"
                            value={metric.label}
                            onChange={(e) =>
                              handleMetricChange(index, "label", e.target.value)
                            }
                            margin="normal"
                            multiline
                            minRows={2}
                            maxRows={4}
                            InputProps={{
                              style: { overflow: "auto", resize: "vertical" },
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Icon (e.g., FaStar)"
                            value={metric.icon}
                            onChange={(e) =>
                              handleMetricChange(index, "icon", e.target.value)
                            }
                            margin="normal"
                            multiline
                            minRows={2}
                            maxRows={4}
                            InputProps={{
                              style: { overflow: "auto", resize: "vertical" },
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={handleAddMetric}
                  >
                    Add Metric
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Review Section
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Review Text"
                  value={formData.review.text}
                  onChange={(e) =>
                    handleNestedChange("review", "text", e.target.value)
                  }
                  margin="normal"
                  multiline
                  minRows={4}
                  maxRows={10}
                  InputProps={{
                    style: { overflow: "auto", resize: "vertical" },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="review-image"
                    type="file"
                    onChange={(e) => handleImageChange("reviewImage", e)}
                  />
                  <label htmlFor="review-image">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{ mr: 2 }}
                    >
                      Upload Review Image
                    </Button>
                  </label>
                  {formData.review.imagePreview && (
                    <Box
                      component="img"
                      src={formData.review.imagePreview}
                      alt="Review"
                      sx={{
                        mt: 2,
                        maxWidth: "100px",
                        maxHeight: "100px",
                        borderRadius: "50%",
                      }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/schoolemy/user-landing-page")}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <Save />}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Box>
      </form>

      {/* Preview Dialog */}
      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            overflow: "auto",
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Demo Video Section Preview</Typography>
          <IconButton onClick={() => setViewOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <PreviewContainer>
            {/* Video Information Section */}
            {(formData.title || formData.subtitle || formData.videoUrl || formData.videoThumbnailPreview) && (
              <PreviewSection>
                {formData.title && (
                  <PreviewTitle>{formData.title}</PreviewTitle>
                )}
                {formData.subtitle && (
                  <PreviewSubtitle>{formData.subtitle}</PreviewSubtitle>
                )}
                {formData.videoThumbnailPreview && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                      Video Thumbnail
                    </Typography>
                    <PreviewThumbnail
                      src={getThumbnailUrl(formData.videoThumbnailPreview)}
                      alt="Video thumbnail"
                      onError={(e) => {
                        console.error("Error loading thumbnail:", formData.videoThumbnailPreview);
                        // Try to show a placeholder or hide the image
                        e.target.style.display = "none";
                      }}
                      onLoad={() => {
                        console.log("Thumbnail loaded successfully");
                      }}
                    />
                  </Box>
                )}
                {formData.videoUrl && (
                  <Box sx={{ mb: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      href={formData.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        mt: 1,
                        px: 3,
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: 600,
                      }}
                    >
                      View Video
                    </Button>
                  </Box>
                )}
              </PreviewSection>
            )}

            {/* Stats Section */}
            {(formData.statsTitle || formData.buttonText || formData.buttonLink || (formData.metrics && formData.metrics.length > 0 && formData.metrics.some(m => m.value || m.label))) && (
              <PreviewSection>
                {formData.statsTitle && (
                  <PreviewStatsTitle>{formData.statsTitle}</PreviewStatsTitle>
                )}
                {formData.metrics && formData.metrics.length > 0 && formData.metrics.some(m => m.value || m.label) && (
                  <PreviewMetricsGrid>
                    {formData.metrics.map((metric, index) => {
                      if (!metric.value && !metric.label) return null;
                      const IconComponent = getIconComponent(metric.icon);
                      return (
                        <PreviewMetricCard key={index}>
                          {IconComponent && (
                            <PreviewMetricIcon>
                              {React.createElement(IconComponent)}
                            </PreviewMetricIcon>
                          )}
                          {metric.value && (
                            <PreviewMetricValue>{metric.value}</PreviewMetricValue>
                          )}
                          {metric.label && (
                            <PreviewMetricLabel>{metric.label}</PreviewMetricLabel>
                          )}
                        </PreviewMetricCard>
                      );
                    })}
                  </PreviewMetricsGrid>
                )}
                {formData.buttonText && (
                  <PreviewButton
                    href={formData.buttonLink || "#"}
                    onClick={(e) => {
                      if (!formData.buttonLink) e.preventDefault();
                    }}
                  >
                    {formData.buttonText}
                  </PreviewButton>
                )}
              </PreviewSection>
            )}

            {/* Review Section */}
            {(formData.review?.text || formData.review?.imagePreview) && (
              <PreviewSection>
                <PreviewReviewContainer>
                  {formData.review?.imagePreview && (
                    <PreviewReviewImage
                      src={formData.review.imagePreview}
                      alt="Review"
                    />
                  )}
                  {formData.review?.text && (
                    <PreviewReviewText>
                      "{formData.review.text}"
                    </PreviewReviewText>
                  )}
                </PreviewReviewContainer>
              </PreviewSection>
            )}

            {/* Empty State */}
            {!formData.title && !formData.subtitle && !formData.videoUrl && !formData.statsTitle && !formData.review?.text && (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="h6" color="text.secondary">
                  No data available to preview
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Please fill in the form fields to see a preview
                </Typography>
              </Box>
            )}
          </PreviewContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DemoVideoSection;
