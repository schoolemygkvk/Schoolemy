import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios, { API_URL } from "../../../Utils/api";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  IconButton,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  ArrowBack,
  Save,
  Add,
  Delete,
  CloudUpload,
  Image as ImageIcon,
  Visibility,
  Close,
  ChevronLeft,
  ChevronRight,
} from "@mui/icons-material";
import styled, { css } from "styled-components";

// --- STYLED COMPONENTS FOR PREVIEW ---
const PreviewBannerWrapper = styled.section`
  width: 100%;
  height: 70vh;
  min-height: 500px;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
`;

const PreviewHeader = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 5;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  padding: 12px 20px;
  border-radius: 8px;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PreviewSliderContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  transition: transform 0.7s ease-in-out;
  transform: ${({ currentSlide }) => `translateX(-${currentSlide * 100}%)`};
`;

const PreviewSlide = styled.div`
  flex: 0 0 100%;
  height: 100%;
  position: relative;
`;

const PreviewSlideBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url(${({ bgImage }) => bgImage || 'none'});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #1a1a1a;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.25);
  }
`;

const PreviewCustomLayoutContainer = styled.div`
  position: absolute;
  z-index: 2;
  top: 50%;
  transform: translateY(-50%);
  max-width: 45%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  left: 8%;

  ${({ hAlign }) =>
    hAlign === 'right' &&
    css`
      left: auto;
      right: 8%;
    `}
`;

const PreviewEyebrow = styled.p`
  background-color: #f59e0b;
  color: #fff;
  padding: 6px 14px;
  border-radius: 8px;
  font-weight: 600;
  display: inline-block;
  margin-bottom: 16px;
  font-size: 14px;
`;

const PreviewTitle = styled.h1`
  font-size: 2.5rem;
  font-weight: 600;
  color: #fff;
  line-height: 1.4;
  margin: 0;
  margin-bottom: 24px;
  text-shadow: 1px 1px 4px rgba(0,0,0,0.5);
`;

const PreviewButtonWrapper = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-start;
`;

const PreviewPrimaryButton = styled.a`
  padding: 12px 24px;
  background-color: #f59e0b;
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  white-space: nowrap;

  &:hover {
    background-color: #d97706;
    transform: translateY(-2px);
  }
`;

const PreviewSecondaryButton = styled.button`
  padding: 12px 24px;
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(5px);
  color: #ffffff;
  text-decoration: none;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  transition: all 0.3s ease;
  white-space: nowrap;
  cursor: pointer;
  font-family: inherit;

  &:hover {
    background-color: rgba(255, 255, 255, 0.25);
    border-color: #ffffff;
    transform: translateY(-2px);
  }
`;

const PreviewDotsContainer = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  z-index: 3;
`;

const PreviewDot = styled.button`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background-color: ${({ isActive }) => (isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.5)')};
  transition: background-color 0.3s ease;
  box-shadow: 0 0 5px rgba(0,0,0,0.3);
`;

const PreviewNavButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 4;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.7);
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(5px);
  color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  &:hover {
    background-color: rgba(0, 0, 0, 0.6);
    border-color: #ffffff;
    transform: translateY(-50%) scale(1.1);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    transform: translateY(-50%);
  }

  ${({ position }) =>
    position === 'left'
      ? css`
          left: 20px;
        `
      : css`
          right: 20px;
        `}
`;

const TopBannerSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [viewOpen, setViewOpen] = useState(false);
  const [previewSlides, setPreviewSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [slides, setSlides] = useState([
    {
      eyebrow: "",
      title: "",
      description: "",
      bgImage: null,
      bgImagePreview: "",
    },
  ]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/userdashboard/top-banner");
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        if (data.slides && data.slides.length > 0) {
          setSlides(
            data.slides.map((slide) => ({
              ...slide,
              bgImage: null,
              bgImagePreview: slide.bgImage || "",
            }))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching banner data:", error);
      setMessage({
        type: "error",
        text: "Failed to load banner data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSlideChange = (index, field, value) => {
    const newSlides = [...slides];
    newSlides[index][field] = value;
    setSlides(newSlides);
  };

  const handleImageChange = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSlides = [...slides];
        newSlides[index].bgImage = file;
        newSlides[index].bgImagePreview = reader.result;
        setSlides(newSlides);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSlide = () => {
    setSlides([
      ...slides,
      {
        eyebrow: "",
        title: "",
        description: "",
        bgImage: null,
        bgImagePreview: "",
      },
    ]);
  };

  const handleRemoveSlide = (index) => {
    if (slides.length > 1) {
      setSlides(slides.filter((_, i) => i !== index));
    }
  };

  const handleViewClick = async () => {
    setViewOpen(true);
    setPreviewLoading(true);
    setCurrentSlide(0);
    
    try {
      const response = await axios.get("/api/userdashboard/top-banner");
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        if (data.slides && data.slides.length > 0) {
          setPreviewSlides(
            data.slides.map((slide) => ({
              eyebrow: slide.eyebrow || "",
              title: slide.title || "",
              description: slide.description || "",
              bgImage: slide.bgImage || "",
            }))
          );
        } else {
          setPreviewSlides([]);
        }
      } else {
        setPreviewSlides([]);
      }
    } catch (error) {
      console.error("Error fetching preview data:", error);
      setPreviewSlides([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCloseView = () => {
    setViewOpen(false);
    setCurrentSlide(0);
  };

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  const handlePreviousSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? previewSlides.length - 1 : prev - 1
    );
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) =>
      prev === previewSlides.length - 1 ? 0 : prev + 1
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      const slidesData = slides.map((slide, index) => {
        const slideData = {
          eyebrow: slide.eyebrow,
          title: slide.title,
          description: slide.description,
        };

        if (slide.bgImage) {
          formData.append(`slide${index}Image`, slide.bgImage);
          slideData.bgImage = `slide${index}Image`;
        } else if (slide.bgImagePreview) {
          slideData.bgImage = slide.bgImagePreview;
        }

        return slideData;
      });

      formData.append("slides", JSON.stringify(slidesData));

      const response = await axios.put("/api/userdashboard/top-banner", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Top banner section updated successfully!",
        });
        setTimeout(() => {
          fetchData();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving banner data:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save banner data. Please try again.",
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
          <Box>
            <Typography variant="h4" component="h1">
              Top Banner Section Management
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Visibility />}
          onClick={handleViewClick}
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
              Banner Slides Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your banner slides. You can add, edit, or remove slides as needed.
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {slides.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {slides.length === 1 ? 'Slide' : 'Slides'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <form onSubmit={handleSubmit}>
        {slides.map((slide, index) => (
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
                <Typography variant="h6">Slide {index + 1}</Typography>
                {slides.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveSlide(index)}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Eyebrow Text"
                    value={slide.eyebrow}
                    onChange={(e) =>
                      handleSlideChange(index, "eyebrow", e.target.value)
                    }
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={slide.title}
                    onChange={(e) =>
                      handleSlideChange(index, "title", e.target.value)
                    }
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={slide.description}
                    onChange={(e) =>
                      handleSlideChange(index, "description", e.target.value)
                    }
                    margin="normal"
                    multiline
                    rows={3}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id={`banner-image-${index}`}
                      type="file"
                      onChange={(e) => handleImageChange(index, e)}
                    />
                    <label htmlFor={`banner-image-${index}`}>
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUpload />}
                        sx={{ mr: 2 }}
                      >
                        Upload Background Image
                      </Button>
                    </label>
                    {slide.bgImagePreview && (
                      <Box
                        component="img"
                        src={slide.bgImagePreview}
                        alt={`Slide ${index + 1}`}
                        sx={{
                          mt: 2,
                          maxWidth: "100%",
                          maxHeight: "200px",
                          borderRadius: 1,
                        }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        ))}

        <Box sx={{ mt: 3, mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddSlide}
          >
            Add New Slide
          </Button>
        </Box>

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
        onClose={handleCloseView}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            height: "auto",
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6">Banner Preview</Typography>
            {previewSlides.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({currentSlide + 1} / {previewSlides.length})
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleCloseView} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, position: "relative" }}>
          {previewLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="500px"
            >
              <CircularProgress />
            </Box>
          ) : previewSlides.length === 0 ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              minHeight="500px"
            >
              <Typography variant="body1" color="text.secondary">
                No banner slides available to preview.
              </Typography>
            </Box>
          ) : (
            <PreviewBannerWrapper>
              <PreviewHeader>
                <span>Slide {currentSlide + 1} of {previewSlides.length}</span>
              </PreviewHeader>
              <PreviewSliderContainer currentSlide={currentSlide}>
                {previewSlides.map((slide, index) => (
                  <PreviewSlide key={index}>
                    <PreviewSlideBackground
                      bgImage={
                        slide.bgImage
                          ? slide.bgImage.startsWith("http") || slide.bgImage.startsWith("data:")
                            ? slide.bgImage
                            : slide.bgImage.startsWith("/")
                            ? `${API_URL}${slide.bgImage}`
                            : `${API_URL}/${slide.bgImage}`
                          : ""
                      }
                    />
                    <PreviewCustomLayoutContainer>
                      {slide.eyebrow && <PreviewEyebrow>{slide.eyebrow}</PreviewEyebrow>}
                      {slide.title && <PreviewTitle>"{slide.title}"</PreviewTitle>}
                    </PreviewCustomLayoutContainer>
                  </PreviewSlide>
                ))}
              </PreviewSliderContainer>

              {previewSlides.length > 1 && (
                <>
                  <PreviewNavButton
                    position="left"
                    onClick={handlePreviousSlide}
                    aria-label="Previous slide"
                  >
                    <ChevronLeft />
                  </PreviewNavButton>
                  <PreviewNavButton
                    position="right"
                    onClick={handleNextSlide}
                    aria-label="Next slide"
                  >
                    <ChevronRight />
                  </PreviewNavButton>
                  <PreviewDotsContainer>
                    {previewSlides.map((_, index) => (
                      <PreviewDot
                        key={index}
                        isActive={index === currentSlide}
                        onClick={() => goToSlide(index)}
                      />
                    ))}
                  </PreviewDotsContainer>
                </>
              )}
            </PreviewBannerWrapper>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default TopBannerSection;
