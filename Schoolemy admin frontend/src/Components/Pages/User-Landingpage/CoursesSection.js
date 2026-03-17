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
import { HiArrowRight, HiChevronLeft, HiChevronRight } from "react-icons/hi";
import styled from "styled-components";

// --- STYLED COMPONENTS FOR PREVIEW ---
const PreviewSectionWrapper = styled.section`
  background-color: #f8fafc;
  padding: 3rem 0;
  overflow: hidden;
  width: 100%;
`;

const PreviewContainer = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 5%;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const PreviewSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const PreviewSectionTitle = styled.h2`
  font-size: 2.25rem;
  color: #1e293b;
  font-weight: 700;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const PreviewHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
    margin-top: 0.5rem;
  }
`;

const PreviewNavButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    gap: 0.5rem;
    position: absolute;
    top: 50%;
    left: 0;
    width: 100%;
    transform: translateY(-50%);
    justify-content: space-between;
    padding: 0 0.5rem;
    pointer-events: none;
  }
`;

const PreviewNavButton = styled.button`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  border: none;
  background-color: #ffffff;
  color: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #1e293b;
    color: #ffffff;
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
    pointer-events: auto;
    background-color: #ffffff;
    opacity: 0.9;
    
    &:active {
      transform: scale(0.95);
    }
  }
`;

const PreviewCarouselWrapper = styled.div`
  overflow: hidden;
  position: relative;
`;

const PreviewCarouselContainer = styled.div`
  display: flex;
  gap: 2rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 1rem;
  margin: 0 -1rem;
  -webkit-overflow-scrolling: touch;
  scroll-snap-type: x mandatory;
  
  &::-webkit-scrollbar { display: none; }
  -ms-overflow-style: none;
  scrollbar-width: none;

  @media (max-width: 768px) {
    gap: 1.5rem;
    padding: 1rem 0.5rem;
    margin: 0;
    scroll-padding: 0 1rem;
  }
`;

const PreviewCourseCard = styled.div`
  flex: 0 0 calc(33.333% - 22px);
  min-width: 320px;
  background-color: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 1024px) {
    flex-basis: calc(50% - 16px);
    min-width: 280px;
  }
  
  @media (max-width: 768px) {
    flex-basis: 90%;
    min-width: 280px;
    margin: 0 auto;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    
    &:hover {
      transform: translateY(-4px);
    }
  }
`;

const PreviewImageContainer = styled.div`
  height: 200px;
  position: relative;
  overflow: hidden;
  background-color: #e2e8f0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

  @media (max-width: 768px) {
    height: 200px;
  }
  
  ${PreviewCourseCard}:hover & img {
    transform: scale(1.05);
  }
`;

const PreviewCardContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const PreviewInfoBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }
`;

const PreviewCategoryPill = styled.span`
  background-color: #f1f5f9;
  color: #64748b;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const PreviewCourseTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 auto;
  padding-bottom: 1rem;
  line-height: 1.4;
  color: #1e293b;

  @media (max-width: 768px) {
    font-size: 1rem;
    padding-bottom: 0.75rem;
  }
`;

const PreviewStartLearningButton = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #1e293b;
  color: #ffffff;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.3s ease;
  margin-top: 1rem;
  cursor: pointer;

  &:hover {
    transform: scale(1.05);
    background-color: #0f172a;
  }

  @media (max-width: 768px) {
    padding: 0.5rem;
    font-size: 0.875rem;
    margin-top: 0.75rem;
  }
`;

const PreviewIndicatorDots = styled.div`
  display: none;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-bottom: 1rem;

  @media (max-width: 768px) {
    display: flex;
    position: relative;
    z-index: 2;
  }
`;

const PreviewDot = styled.button`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: none;
  background-color: ${({ active }) => active ? '#1e293b' : '#cbd5e1'};
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${({ active }) => active ? 1 : 0.5};
  transform: scale(${({ active }) => active ? 1.2 : 1});
`;

const CoursesSection = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [viewOpen, setViewOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [formData, setFormData] = useState({
    sectionTitle: "",
    courses: [
      {
        title: "",
        category: "",
        image: null,
        imagePreview: "",
      },
    ],
  });

  useEffect(() => {
    fetchData();
  }, []);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle scroll to update current index for indicator dots
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !viewOpen) return;

    const handleScroll = () => {
      if (isMobile && container.scrollWidth > 0) {
        const scrollPos = container.scrollLeft;
        const cardWidth = container.offsetWidth * 0.85;
        const newIndex = Math.round(scrollPos / (cardWidth + 16));
        setCurrentIndex(newIndex);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isMobile, viewOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/userdashboard/courses");
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setFormData({
          sectionTitle: data.sectionTitle || "",
          courses:
            data.courses && data.courses.length > 0
              ? data.courses.map((course) => ({
                  ...course,
                  image: null,
                  imagePreview: course.image || "",
                }))
              : [
                  {
                    title: "",
                    category: "",
                    image: null,
                    imagePreview: "",
                  },
                ],
        });
      }
    } catch (error) {
      console.error("Error fetching courses data:", error);
      setMessage({
        type: "error",
        text: "Failed to load courses section data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCourseChange = (index, field, value) => {
    const newCourses = [...formData.courses];
    newCourses[index][field] = value;
    setFormData((prev) => ({ ...prev, courses: newCourses }));
  };

  const handleCourseImageChange = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newCourses = [...formData.courses];
        newCourses[index].image = file;
        newCourses[index].imagePreview = reader.result;
        setFormData((prev) => ({ ...prev, courses: newCourses }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCourse = () => {
    setFormData((prev) => ({
      ...prev,
      courses: [
        ...prev.courses,
        {
          title: "",
          category: "",
          image: null,
          imagePreview: "",
        },
      ],
    }));
  };

  const handleRemoveCourse = (index) => {
    if (formData.courses.length > 1) {
      setFormData((prev) => ({
        ...prev,
        courses: prev.courses.filter((_, i) => i !== index),
      }));
    }
  };

  const handleViewOpen = () => {
    setViewOpen(true);
    setCurrentIndex(0);
  };

  const handleViewClose = () => {
    setViewOpen(false);
    setCurrentIndex(0);
  };

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.offsetWidth * (isMobile ? 0.85 : 0.9);
      container.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  const scrollToIndex = (index) => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = container.offsetWidth * 0.85;
      const scrollPosition = index * (cardWidth + 16);
      container.scrollTo({ left: scrollPosition, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const submitData = new FormData();
      submitData.append("sectionTitle", formData.sectionTitle);

      const coursesData = formData.courses.map((course, index) => {
        const courseData = {
          title: course.title,
          category: course.category,
        };

        if (course.image) {
          submitData.append(`course${index}Image`, course.image);
          courseData.image = `course${index}Image`;
        } else if (course.imagePreview) {
          courseData.image = course.imagePreview;
        }

        return courseData;
      });

      submitData.append("courses", JSON.stringify(coursesData));

      const response = await axios.put("/api/userdashboard/courses", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Courses section updated successfully!",
        });
        setTimeout(() => {
          fetchData();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving courses data:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save courses data. Please try again.",
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
              Courses Section Management
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Visibility />}
          onClick={handleViewOpen}
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
              Courses Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your courses section. You can add, edit, or remove courses as needed.
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {formData.courses ? formData.courses.length : 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.courses && formData.courses.length === 1 ? 'Course' : 'Courses'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <TextField
              fullWidth
              label="Section Title"
              value={formData.sectionTitle}
              onChange={(e) => handleChange("sectionTitle", e.target.value)}
              margin="normal"
              required
            />
          </CardContent>
        </Card>

        {formData.courses.map((course, index) => (
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
                <Typography variant="h6">Course {index + 1}</Typography>
                {formData.courses.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveCourse(index)}
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
                    label="Course Title"
                    value={course.title}
                    onChange={(e) =>
                      handleCourseChange(index, "title", e.target.value)
                    }
                    margin="normal"
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Category"
                    value={course.category}
                    onChange={(e) =>
                      handleCourseChange(index, "category", e.target.value)
                    }
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id={`course-image-${index}`}
                      type="file"
                      onChange={(e) => handleCourseImageChange(index, e)}
                    />
                    <label htmlFor={`course-image-${index}`}>
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUpload />}
                        sx={{ mr: 2 }}
                      >
                        Upload Course Image
                      </Button>
                    </label>
                    {course.imagePreview && (
                      <Box
                        component="img"
                        src={course.imagePreview}
                        alt={`Course ${index + 1}`}
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

        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddCourse}
            sx={{ mb: 2 }}
          >
            Add New Course
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
        onClose={handleViewClose}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="h6">Preview: Courses Section</Typography>
            {(() => {
              const validCourses = formData.courses
                ? formData.courses.filter(
                    (course) => course.title && course.title.trim() !== ""
                  )
                : [];
              return validCourses.length > 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({validCourses.length} {validCourses.length === 1 ? 'Course' : 'Courses'})
                </Typography>
              ) : null;
            })()}
          </Box>
          <IconButton onClick={handleViewClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, overflow: "auto" }}>
          <PreviewSectionWrapper>
            <PreviewContainer>
              <PreviewSectionHeader>
                <PreviewSectionTitle>
                  {formData.sectionTitle || "Popular Courses"}
                </PreviewSectionTitle>
                <PreviewHeaderActions>
                  <PreviewNavButtons>
                    <PreviewNavButton
                      onClick={() => handleScroll("left")}
                      aria-label="Previous courses"
                    >
                      <HiChevronLeft />
                    </PreviewNavButton>
                    <PreviewNavButton
                      onClick={() => handleScroll("right")}
                      aria-label="Next courses"
                    >
                      <HiChevronRight />
                    </PreviewNavButton>
                  </PreviewNavButtons>
                </PreviewHeaderActions>
              </PreviewSectionHeader>

              <PreviewCarouselWrapper>
                <PreviewCarouselContainer ref={scrollContainerRef}>
                  {formData.courses &&
                    formData.courses.length > 0 &&
                    formData.courses
                      .filter(
                        (course) =>
                          course.title && course.title.trim() !== ""
                      )
                      .map((course, index) => (
                        <PreviewCourseCard key={index}>
                          <PreviewImageContainer>
                            {course.imagePreview ? (
                              <img
                                src={course.imagePreview}
                                alt={course.title}
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: "100%",
                                  height: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#94a3b8",
                                  fontSize: "0.875rem",
                                }}
                              >
                                No Image
                              </Box>
                            )}
                          </PreviewImageContainer>
                          <PreviewCardContent>
                            <PreviewInfoBar>
                              {course.category && (
                                <PreviewCategoryPill>
                                  {course.category}
                                </PreviewCategoryPill>
                              )}
                            </PreviewInfoBar>
                            <PreviewCourseTitle>{course.title}</PreviewCourseTitle>
                            <PreviewStartLearningButton>
                              Start Learning <HiArrowRight />
                            </PreviewStartLearningButton>
                          </PreviewCardContent>
                        </PreviewCourseCard>
                      ))}
                  {(!formData.courses ||
                    formData.courses.length === 0 ||
                    formData.courses.every(
                      (course) => !course.title || course.title.trim() === ""
                    )) && (
                    <Box
                      sx={{
                        width: "100%",
                        textAlign: "center",
                        py: 4,
                        color: "#64748b",
                      }}
                    >
                      <Typography>No courses to display</Typography>
                    </Box>
                  )}
                </PreviewCarouselContainer>

                {/* Indicator dots for mobile */}
                {formData.courses &&
                  formData.courses.filter(
                    (course) => course.title && course.title.trim() !== ""
                  ).length > 0 && (
                    <PreviewIndicatorDots>
                      {formData.courses
                        .filter(
                          (course) => course.title && course.title.trim() !== ""
                        )
                        .map((_, index) => (
                          <PreviewDot
                            key={index}
                            active={index === currentIndex}
                            onClick={() => scrollToIndex(index)}
                            aria-label={`Go to course ${index + 1}`}
                          />
                        ))}
                    </PreviewIndicatorDots>
                  )}
              </PreviewCarouselWrapper>
            </PreviewContainer>
          </PreviewSectionWrapper>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CoursesSection;
