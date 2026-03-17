import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";
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
  Rating,
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
  ArrowForward,
} from "@mui/icons-material";

// Helper function to normalize avatar URL (handles base64 strings)
const normalizeAvatarUrl = (avatar) => {
  if (!avatar) return "";
  
  // If it's already a data URL (starts with data:image), return as is
  if (avatar.startsWith("data:image")) {
    return avatar;
  }
  
  // If it's a base64 string without data URL prefix, add the prefix
  // Check if it looks like base64 (contains only base64 characters)
  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (base64Regex.test(avatar) && avatar.length > 100) {
    // Try to detect image type from common patterns
    let mimeType = "image/jpeg"; // default
    
    // JPEG starts with /9j/4AAQ or similar
    if (avatar.startsWith("/9j/") || avatar.startsWith("iVBORw0KGgo")) {
      mimeType = avatar.startsWith("/9j/") ? "image/jpeg" : "image/png";
    } else if (avatar.startsWith("iVBORw0KGgo") || avatar.startsWith("R0lGOD")) {
      mimeType = avatar.startsWith("iVBORw0KGgo") ? "image/png" : "image/gif";
    } else if (avatar.startsWith("UklGR")) {
      mimeType = "image/webp";
    }
    
    return `data:${mimeType};base64,${avatar}`;
  }
  
  // If it's a regular URL (http/https), return as is
  if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
    return avatar;
  }
  
  // If it's a relative path, return as is
  if (avatar.startsWith("/")) {
    return avatar;
  }
  
  // For any other case, return as is (might be a filename or other format)
  return avatar;
};

const FeedbackSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [viewOpen, setViewOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [formData, setFormData] = useState({
    badgeText: "",
    title: "",
    subtitle: "",
    stats: [
      {
        value: "",
        label: "",
      },
    ],
    testimonials: [
      {
        text: "",
        rating: 5,
        name: "",
        role: "",
        avatar: null,
        avatarPreview: "",
      },
    ],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/userdashboard/feedback");
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setFormData({
          badgeText: data.badgeText || "",
          title: data.title || "",
          subtitle: data.subtitle || "",
          stats:
            data.stats && data.stats.length > 0
              ? data.stats
              : [
                  {
                    value: "",
                    label: "",
                  },
                ],
          testimonials:
            data.testimonials && data.testimonials.length > 0
              ? data.testimonials.map((testimonial) => ({
                  ...testimonial,
                  avatar: null,
                  avatarPreview: normalizeAvatarUrl(testimonial.avatar || ""),
                }))
              : [
                  {
                    text: "",
                    rating: 5,
                    name: "",
                    role: "",
                    avatar: null,
                    avatarPreview: "",
                  },
                ],
        });
      }
    } catch (error) {
      console.error("Error fetching feedback data:", error);
      setMessage({
        type: "error",
        text: "Failed to load feedback section data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (index, field, value) => {
    const newStats = [...formData.stats];
    newStats[index][field] = value;
    setFormData((prev) => ({ ...prev, stats: newStats }));
  };

  const handleTestimonialChange = (index, field, value) => {
    const newTestimonials = [...formData.testimonials];
    newTestimonials[index][field] = value;
    setFormData((prev) => ({ ...prev, testimonials: newTestimonials }));
  };

  const handleTestimonialImageChange = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newTestimonials = [...formData.testimonials];
        newTestimonials[index].avatar = file;
        newTestimonials[index].avatarPreview = reader.result;
        setFormData((prev) => ({ ...prev, testimonials: newTestimonials }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStat = () => {
    setFormData((prev) => ({
      ...prev,
      stats: [
        ...prev.stats,
        {
          value: "",
          label: "",
        },
      ],
    }));
  };

  const handleRemoveStat = (index) => {
    if (formData.stats.length > 1) {
      setFormData((prev) => ({
        ...prev,
        stats: prev.stats.filter((_, i) => i !== index),
      }));
    }
  };

  const handleAddTestimonial = () => {
    setFormData((prev) => ({
      ...prev,
      testimonials: [
        ...prev.testimonials,
        {
          text: "",
          rating: 5,
          name: "",
          role: "",
          avatar: null,
          avatarPreview: "",
        },
      ],
    }));
  };

  const handleRemoveTestimonial = (index) => {
    if (formData.testimonials.length > 1) {
      setFormData((prev) => ({
        ...prev,
        testimonials: prev.testimonials.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const submitData = new FormData();
      submitData.append("badgeText", formData.badgeText);
      submitData.append("title", formData.title);
      submitData.append("subtitle", formData.subtitle);
      submitData.append("stats", JSON.stringify(formData.stats));

      const testimonialsData = formData.testimonials.map((testimonial, index) => {
        const testimonialData = {
          text: testimonial.text,
          rating: testimonial.rating,
          name: testimonial.name,
          role: testimonial.role,
        };

        if (testimonial.avatar) {
          submitData.append(`testimonial${index}Avatar`, testimonial.avatar);
          testimonialData.avatar = `testimonial${index}Avatar`;
        } else if (testimonial.avatarPreview) {
          testimonialData.avatar = testimonial.avatarPreview;
        }

        return testimonialData;
      });

      submitData.append("testimonials", JSON.stringify(testimonialsData));

      const response = await axios.put("/api/userdashboard/feedback", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Feedback section updated successfully!",
        });
        setTimeout(() => {
          fetchData();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving feedback data:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save feedback data. Please try again.",
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
      <Box
        sx={{
          mb: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/schoolemy/user-landing-page")}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Feedback Section Management
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
          backgroundColor: (theme) =>
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.05)"
              : "rgba(0, 0, 0, 0.02)",
          borderLeft: "4px solid",
          borderColor: "primary.main",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Feedback Section Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your feedback section content including stats and student
              testimonials.
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {formData.testimonials?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.testimonials?.length === 1
                ? "Testimonial"
                : "Testimonials"}
            </Typography>
            {formData.stats && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {formData.stats.length}{" "}
                {formData.stats.length === 1 ? "Stat" : "Stats"}
              </Typography>
            )}
          </Box>
        </Box>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Badge Text"
                  value={formData.badgeText}
                  onChange={(e) => handleChange("badgeText", e.target.value)}
                  margin="normal"
                  multiline
                  rows={1}
                  maxRows={2}
                  sx={{
                    "& .MuiInputBase-input": {
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  margin="normal"
                  multiline
                  rows={2}
                  maxRows={4}
                  required
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
                  rows={3}
                  maxRows={6}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>Stats</Typography>

                {formData.stats.map((stat, index) => (
                  <Box
                    key={index}
                    sx={{ mb: 2, display: "flex", gap: 2, alignItems: "center" }}
                  >
                    <TextField
                      fullWidth
                      label={`Stat ${index + 1} Value`}
                      value={stat.value}
                      onChange={(e) =>
                        handleStatChange(index, "value", e.target.value)
                      }
                      margin="normal"
                    />
                    <TextField
                      fullWidth
                      label={`Stat ${index + 1} Label`}
                      value={stat.label}
                      onChange={(e) =>
                        handleStatChange(index, "label", e.target.value)
                      }
                      margin="normal"
                    />
                    {formData.stats.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveStat(index)}
                        sx={{ mt: 1 }}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                ))}
                <Box sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={handleAddStat}
                  >
                    Add Stat
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Testimonials</Typography>

            <Divider sx={{ mb: 3 }} />

            {formData.testimonials.map((testimonial, index) => (
              <Card key={index} sx={{ mb: 3 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Testimonial {index + 1}</Typography>
                    {formData.testimonials.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveTestimonial(index)}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Testimonial Text"
                        value={testimonial.text}
                        onChange={(e) =>
                          handleTestimonialChange(
                            index,
                            "text",
                            e.target.value
                          )
                        }
                        margin="normal"
                        multiline
                        rows={5}
                        maxRows={10}
                        required
                        sx={{
                          "& .MuiInputBase-input": {
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Box sx={{ mt: 2 }}>
                        <Typography component="legend">Rating</Typography>
                        <Rating
                          name={`rating-${index}`}
                          value={testimonial.rating}
                          onChange={(event, newValue) => {
                            handleTestimonialChange(index, "rating", newValue);
                          }}
                          max={5}
                        />
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Name"
                        value={testimonial.name}
                        onChange={(e) =>
                          handleTestimonialChange(index, "name", e.target.value)
                        }
                        margin="normal"
                        multiline
                        rows={1}
                        maxRows={2}
                        required
                        sx={{
                          "& .MuiInputBase-input": {
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Role"
                        value={testimonial.role}
                        onChange={(e) =>
                          handleTestimonialChange(index, "role", e.target.value)
                        }
                        margin="normal"
                        multiline
                        rows={1}
                        maxRows={2}
                        sx={{
                          "& .MuiInputBase-input": {
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          },
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box sx={{ mt: 2 }}>
                        <input
                          accept="image/*"
                          style={{ display: "none" }}
                          id={`testimonial-avatar-${index}`}
                          type="file"
                          onChange={(e) =>
                            handleTestimonialImageChange(index, e)
                          }
                        />
                        <label htmlFor={`testimonial-avatar-${index}`}>
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUpload />}
                            sx={{ mr: 2 }}
                          >
                            Upload Avatar
                          </Button>
                        </label>
                        {testimonial.avatarPreview && (
                          <Box
                            component="img"
                            src={normalizeAvatarUrl(testimonial.avatarPreview)}
                            alt={`Testimonial ${index + 1}`}
                            sx={{
                              mt: 2,
                              maxWidth: "100px",
                              maxHeight: "100px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}

            <Box
              sx={{
                mt: 2,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={handleAddTestimonial}
              >
                Add Testimonial
              </Button>
            </Box>
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
          <Typography variant="h6">Feedback Section Preview</Typography>
          <IconButton onClick={() => setViewOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <PreviewFeedbackSection formData={formData} activeIndex={activeIndex} setActiveIndex={setActiveIndex} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Preview Component
const PreviewFeedbackSection = ({ formData, activeIndex, setActiveIndex }) => {
  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = 400 + 24; // card width + gap
      const scrollAmount = cardWidth;
      const currentScroll = container.scrollLeft;
      const newScroll = direction === "left" 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      container.scrollTo({
        left: newScroll,
        behavior: "smooth",
      });

      // Update active index
      const newIndex = Math.round(newScroll / cardWidth);
      setActiveIndex(Math.max(0, Math.min(newIndex, formData.testimonials.length - 1)));
    }
  };

  const scrollToIndex = (index) => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = 400 + 24;
      container.scrollTo({
        left: cardWidth * index,
        behavior: "smooth",
      });
      setActiveIndex(index);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Box
          key={i}
          component="span"
          sx={{
            color: "#fbbf24",
            fontSize: "18px",
            filter: "drop-shadow(0 1px 2px rgba(251, 191, 36, 0.3))",
          }}
        >
          ★
        </Box>
      );
    }
    if (hasHalfStar) {
      stars.push(
        <Box
          key="half"
          component="span"
          sx={{
            color: "#fbbf24",
            fontSize: "18px",
            filter: "drop-shadow(0 1px 2px rgba(251, 191, 36, 0.3))",
          }}
        >
          ★
        </Box>
      );
    }
    return stars;
  };

  const validTestimonials = formData.testimonials.filter(
    (t) => t.text && t.name
  );

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        padding: { xs: "48px 16px", md: "96px 24px" },
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        sx={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: { xs: "0 8px", md: "0 24px" },
        }}
      >
        {/* Section Header */}
        <Box
          sx={{
            textAlign: "center",
            maxWidth: "800px",
            margin: "0 auto 40px",
          }}
        >
          {formData.badgeText && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 20px",
                background: "linear-gradient(135deg, rgba(0, 0, 0, 0.08), rgba(30, 30, 30, 0.1))",
                border: "1px solid rgba(0, 0, 0, 0.2)",
                borderRadius: "50px",
                marginBottom: "16px",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "#000000",
                letterSpacing: "0.5px",
              }}
            >
              ★ {formData.badgeText}
            </Box>
          )}

          {formData.title && (
            <Typography
              variant="h2"
              sx={{
                fontFamily: "inherit",
                fontSize: { xs: "1.75rem", md: "3rem" },
                color: "#000000",
                fontWeight: 800,
                margin: "0 0 16px 0",
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #000000 0%, #000000 70%, #000000 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {formData.title}
            </Typography>
          )}

          {formData.subtitle && (
            <Typography
              sx={{
                fontSize: { xs: "0.95rem", md: "1.125rem" },
                color: "#666666",
                lineHeight: 1.7,
                maxWidth: "600px",
                margin: "0 auto",
                fontWeight: 400,
              }}
            >
              {formData.subtitle}
            </Typography>
          )}

          {/* Stats Bar */}
          {formData.stats && formData.stats.length > 0 && formData.stats.some(s => s.value && s.label) && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "32px",
                marginTop: "32px",
                flexWrap: "wrap",
              }}
            >
              {formData.stats
                .filter((stat) => stat.value && stat.label)
                .map((stat, index) => (
                  <Box key={index} sx={{ textAlign: "center" }}>
                    <Typography
                      sx={{
                        fontSize: { xs: "1.5rem", md: "2.25rem" },
                        fontWeight: 800,
                        color: "#000000",
                        margin: "0 0 4px 0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.875rem",
                        color: "#666666",
                        margin: 0,
                        fontWeight: 500,
                      }}
                    >
                      {stat.label}
                    </Typography>
                  </Box>
                ))}
            </Box>
          )}
        </Box>

        {/* Carousel */}
        {validTestimonials.length > 0 && (
          <>
            <Box
              sx={{
                position: "relative",
                overflow: "visible",
                padding: "16px 0",
              }}
            >
              <Box
                ref={scrollContainerRef}
                sx={{
                  display: "flex",
                  gap: "24px",
                  padding: "24px 8px",
                  margin: "0 -8px",
                  overflowX: "auto",
                  scrollBehavior: "smooth",
                  scrollSnapType: "x mandatory",
                  "&::-webkit-scrollbar": {
                    height: "8px",
                  },
                  "&::-webkit-scrollbar-track": {
                    background: "rgba(0, 0, 0, 0.05)",
                    borderRadius: "10px",
                    margin: "0 20px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    background: "linear-gradient(90deg, #000000, #2c2c2c)",
                    borderRadius: "10px",
                    "&:hover": {
                      background: "linear-gradient(90deg, #000000, #1a1a1a)",
                    },
                  },
                }}
              >
                {validTestimonials.map((testimonial, index) => (
                  <Card
                    key={index}
                    sx={{
                      flex: "0 0 90%",
                      maxWidth: "400px",
                      background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
                      borderRadius: "24px",
                      padding: { xs: "32px", md: "40px" },
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      scrollSnapAlign: "center",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: "2px solid transparent",
                      boxShadow: "0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                      overflow: "hidden",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "4px",
                        background: "linear-gradient(90deg, #000000, #2c2c2c, #4a4a4a)",
                        borderRadius: "24px 24px 0 0",
                      },
                      "&:hover": {
                        transform: "translateY(-8px) scale(1.02)",
                        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08)",
                        borderColor: "rgba(0, 0, 0, 0.2)",
                      },
                      "@media (min-width: 600px)": {
                        flex: "0 0 85%",
                      },
                      "@media (min-width: 960px)": {
                        flex: "0 0 400px",
                      },
                    }}
                  >
                    {/* Quote Icon */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: "24px",
                        right: "24px",
                        width: "50px",
                        height: "50px",
                        background: "linear-gradient(135deg, rgba(0, 0, 0, 0.08), rgba(30, 30, 30, 0.12))",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#000000",
                        fontSize: "20px",
                        zIndex: 1,
                      }}
                    >
                      "
                    </Box>

                    {/* Rating Badge */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 12px",
                        background: "linear-gradient(135deg, #fef3c7, #fde68a)",
                        borderRadius: "20px",
                        marginBottom: "20px",
                        width: "fit-content",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: "4px" }}>
                        {renderStars(testimonial.rating || 5)}
                      </Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "#92400e",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {testimonial.rating || 5}
                      </Typography>
                    </Box>

                    {/* Testimonial Text */}
                    <Typography
                      sx={{
                        color: "#666666",
                        lineHeight: 1.8,
                        flexGrow: 1,
                        marginBottom: "24px",
                        fontSize: { xs: "0.95rem", md: "1.05rem" },
                        position: "relative",
                        zIndex: 1,
                        fontWeight: 400,
                      }}
                    >
                      "{testimonial.text}"
                    </Typography>

                    {/* Author Info */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        position: "relative",
                        zIndex: 1,
                        paddingTop: "16px",
                        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: "56px", md: "64px" },
                          height: { xs: "56px", md: "64px" },
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #000000, #2c2c2c)",
                          padding: "3px",
                          position: "relative",
                          flexShrink: 0,
                          "&::after": {
                            content: '"✓"',
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: "20px",
                            height: "20px",
                            background: "linear-gradient(135deg, #10b981, #059669)",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: "bold",
                            color: "white",
                            border: "2px solid #ffffff",
                          },
                        }}
                      >
                        {testimonial.avatarPreview ? (
                          <Box
                            component="img"
                            src={normalizeAvatarUrl(testimonial.avatarPreview)}
                            alt={testimonial.name}
                            sx={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "3px solid #ffffff",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                              // Show fallback with initial
                              const parent = e.target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div style="width: 100%; height: 100%; border-radius: 50%; background: linear-gradient(135deg, #000000, #2c2c2c); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px; border: 3px solid #ffffff;">${testimonial.name ? testimonial.name.charAt(0).toUpperCase() : "?"}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #000000, #2c2c2c)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: "bold",
                              fontSize: "24px",
                              border: "3px solid #ffffff",
                            }}
                          >
                            {testimonial.name.charAt(0).toUpperCase()}
                          </Box>
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          sx={{
                            display: "block",
                            color: "#000000",
                            fontWeight: 700,
                            fontSize: { xs: "1.05rem", md: "1.1rem" },
                            marginBottom: "4px",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {testimonial.name}
                        </Typography>
                        {testimonial.role && (
                          <Typography
                            sx={{
                              display: "block",
                              color: "#999999",
                              fontSize: { xs: "0.875rem", md: "0.9rem" },
                              fontWeight: 500,
                            }}
                          >
                            {testimonial.role}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            </Box>

            {/* Navigation */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "16px",
                marginTop: "40px",
                "@media (min-width: 960px)": {
                  justifyContent: "flex-end",
                  marginTop: "48px",
                },
              }}
            >
              <IconButton
                onClick={() => handleScroll("left")}
                disabled={activeIndex === 0}
                sx={{
                  width: { xs: "52px", md: "56px" },
                  height: { xs: "52px", md: "56px" },
                  borderRadius: "50%",
                  border: "2px solid transparent",
                  background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #000000, #2c2c2c) border-box",
                  color: "#000000",
                  fontSize: { xs: "1.25rem", md: "1.4rem" },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.05)",
                  "&:hover:not(:disabled)": {
                    background: "linear-gradient(135deg, #000000, #2c2c2c)",
                    color: "white",
                    transform: "scale(1.05)",
                    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.1)",
                  },
                  "&:disabled": {
                    opacity: 0.4,
                    cursor: "not-allowed",
                  },
                }}
              >
                <ArrowBack />
              </IconButton>

              {/* Progress Dots */}
              <Box sx={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {validTestimonials.slice(0, 6).map((_, index) => (
                  <Box
                    key={index}
                    onClick={() => scrollToIndex(index)}
                    sx={{
                      width: activeIndex === index ? "24px" : "8px",
                      height: "8px",
                      borderRadius: "4px",
                      background: activeIndex === index
                        ? "linear-gradient(90deg, #000000, #2c2c2c)"
                        : "rgba(0, 0, 0, 0.15)",
                      transition: "all 0.3s ease",
                      cursor: "pointer",
                      "&:hover": {
                        background: activeIndex === index
                          ? "linear-gradient(90deg, #000000, #2c2c2c)"
                          : "rgba(0, 0, 0, 0.3)",
                      },
                    }}
                  />
                ))}
              </Box>

              <IconButton
                onClick={() => handleScroll("right")}
                disabled={activeIndex >= validTestimonials.length - 1}
                sx={{
                  width: { xs: "52px", md: "56px" },
                  height: { xs: "52px", md: "56px" },
                  borderRadius: "50%",
                  border: "2px solid transparent",
                  background: "linear-gradient(white, white) padding-box, linear-gradient(135deg, #000000, #2c2c2c) border-box",
                  color: "#000000",
                  fontSize: { xs: "1.25rem", md: "1.4rem" },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.05)",
                  "&:hover:not(:disabled)": {
                    background: "linear-gradient(135deg, #000000, #2c2c2c)",
                    color: "white",
                    transform: "scale(1.05)",
                    boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25), 0 4px 8px rgba(0, 0, 0, 0.1)",
                  },
                  "&:disabled": {
                    opacity: 0.4,
                    cursor: "not-allowed",
                  },
                }}
              >
                <ArrowForward />
              </IconButton>
            </Box>
          </>
        )}

        {validTestimonials.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#999999",
            }}
          >
            <Typography variant="body1">
              No testimonials available. Please add testimonials to see the preview.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FeedbackSection;
