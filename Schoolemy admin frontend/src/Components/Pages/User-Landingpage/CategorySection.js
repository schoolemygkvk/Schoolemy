import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";
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
  DialogTitle,
  DialogContent,
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
import { HiChevronLeft, HiChevronRight } from "react-icons/hi";

// --- STYLED COMPONENTS FOR PREVIEW ---
const CategoryImage = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  background-image: url(${({ image }) => image || 'none'});
  background-size: cover;
  background-position: center;
  opacity: ${({ image }) => image ? 1 : 0.3};
  transition: all 0.5s ease;
  filter: brightness(1.1) contrast(1.05);

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.1) 0%,
      rgba(0, 0, 0, 0.3) 100%
    );
    border-radius: 50%;
    transition: all 0.5s ease;
    mix-blend-mode: soft-light;
  }
`;

const PreviewContainer = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  padding: 24px;
`;

const SectionHeadline = styled.h2`
  text-align: center;
  font-size: 2rem;
  color: #1a1a1a;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 32px;
  
  @media (min-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 48px;
  }
`;

const CarouselWrapper = styled.div`
  overflow: hidden;
  position: relative;
`;

const CarouselContainer = styled.div`
  display: flex;
  gap: 16px;
  padding: 8px;
  padding-bottom: 16px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  margin: 0 -8px;
  
  &::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  @media (min-width: 480px) {
    gap: 24px;
    padding: 12px;
  }
  
  @media (min-width: 768px) {
    gap: 32px;
    padding: 16px;
    margin: 0;
  }

  @media (min-width: 1024px) {
    gap: 48px;
    padding: 24px;
  }
`;

const CategoryCard = styled.div`
  flex: 0 0 140px;
  width: 140px;
  height: 140px;
  padding: 12px;
  border-radius: 50%;
  background-color: ${({ bgColor }) => bgColor || '#6366f1'};
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
  scroll-snap-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1), 0 2px 10px rgba(255, 255, 255, 0.1);
  padding-bottom: 20px;
  margin: 8px;
  backdrop-filter: blur(5px);
  text-decoration: none;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(255, 255, 255, 0.2), 0 8px 25px rgba(0, 0, 0, 0.15);

    ${CategoryImage} {
      filter: brightness(1.2) contrast(1.1);
      &:before {
        background: linear-gradient(
          180deg,
          rgba(0, 0, 0, 0) 0%,
          rgba(0, 0, 0, 0.2) 100%
        );
        opacity: 0.8;
      }
    }
  }
  
  @media (min-width: 480px) {
    flex: 0 0 160px;
    width: 160px;
    height: 160px;
    padding-bottom: 24px;
  }
  
  @media (min-width: 768px) {
    flex: 0 0 200px;
    width: 200px;
    height: 200px;
    padding: 16px;
    padding-bottom: 32px;
  }

  @media (min-width: 1024px) {
    flex: 0 0 220px;
    width: 220px;
    height: 220px;
    padding: 24px;
    padding-bottom: 40px;
  }
`;

const CategoryTitle = styled.h3`
  font-size: 0.75rem;
  color: white;
  font-weight: 300;
  position: relative;
  z-index: 2;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  letter-spacing: 0.5px;
  width: 100%;
  text-align: center;
  padding: 0 8px;
  
  @media (min-width: 480px) {
    font-size: 0.875rem;
    letter-spacing: 0.8px;
  }
  
  @media (min-width: 768px) {
    font-size: 1rem;
    letter-spacing: 1px;
    padding: 0 12px;
  }

  @media (min-width: 1024px) {
    font-size: 1.125rem;
    letter-spacing: 1.2px;
    padding: 0 16px;
  }
`;

const NavButtons = styled.div`
  display: flex;
  gap: 16px;
  justify-content: flex-start;
  margin-top: 24px;
  
  @media (max-width: 767px) {
    justify-content: center;
  }
`;

const NavButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  background-color: transparent;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #1a1a1a;
    color: white;
    border-color: #1a1a1a;
  }
  
  @media (min-width: 768px) {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
`;

const CategorySection = () => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [showNavButtons, setShowNavButtons] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    sectionTitle: "",
    categories: [
      {
        title: "",
        image: null,
        imagePreview: "",
        bgColor: "#6366f1",
      },
    ],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/userdashboard/categories");
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setFormData({
          sectionTitle: data.sectionTitle || "",
          categories:
            data.categories && data.categories.length > 0
              ? data.categories.map((cat) => ({
                  ...cat,
                  image: null,
                  imagePreview: cat.image || "",
                  bgColor: cat.bgColor || "#6366f1",
                }))
              : [
                  {
                    title: "",
                    image: null,
                    imagePreview: "",
                    bgColor: "#6366f1",
                  },
                ],
        });
      }
    } catch (error) {
      console.error("Error fetching categories data:", error);
      setMessage({
        type: "error",
        text: "Failed to load categories section data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (index, field, value) => {
    const newCategories = [...formData.categories];
    newCategories[index][field] = value;
    setFormData((prev) => ({ ...prev, categories: newCategories }));
  };

  const handleCategoryImageChange = (index, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newCategories = [...formData.categories];
        newCategories[index].image = file;
        newCategories[index].imagePreview = reader.result;
        setFormData((prev) => ({ ...prev, categories: newCategories }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = () => {
    setFormData((prev) => ({
      ...prev,
      categories: [
        ...prev.categories,
        {
          title: "",
          image: null,
          imagePreview: "",
          bgColor: "#6366f1",
        },
      ],
    }));
  };

  const handleRemoveCategory = (index) => {
    if (formData.categories.length > 1) {
      setFormData((prev) => ({
        ...prev,
        categories: prev.categories.filter((_, i) => i !== index),
      }));
    }
  };

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = window.innerWidth < 768 
        ? container.offsetWidth * 0.85 
        : 280;
      const gap = window.innerWidth < 768 ? 16 : 24;
      const scrollAmount = cardWidth + gap;
      
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Check if we need to show navigation buttons (if content overflows)
  useEffect(() => {
    if (viewDialogOpen) {
      const checkScroll = () => {
        if (scrollContainerRef.current) {
          const { scrollWidth, clientWidth } = scrollContainerRef.current;
          setShowNavButtons(scrollWidth > clientWidth);
        }
      };

      // Delay to ensure DOM is ready
      setTimeout(checkScroll, 100);
      window.addEventListener('resize', checkScroll);
      
      return () => {
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [viewDialogOpen, formData.categories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const submitData = new FormData();
      submitData.append("sectionTitle", formData.sectionTitle);

      const categoriesData = formData.categories.map((category, index) => {
        const categoryData = {
          title: category.title,
          bgColor: category.bgColor,
        };

        if (category.image) {
          submitData.append(`category${index}Image`, category.image);
          categoryData.image = `category${index}Image`;
        } else if (category.imagePreview) {
          categoryData.image = category.imagePreview;
        }

        return categoryData;
      });

      submitData.append("categories", JSON.stringify(categoriesData));

      const response = await axios.put("/api/userdashboard/categories", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Category section updated successfully!",
        });
        setTimeout(() => {
          fetchData();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving categories data:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save categories data. Please try again.",
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
              Category Section Management
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Visibility />}
          onClick={() => setViewDialogOpen(true)}
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
              Category Section Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your category section including section title and category cards with images and colors.
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {formData.categories.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.categories.length === 1 ? "Category" : "Categories"}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Section Configuration
            </Typography>
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

        {formData.categories.map((category, index) => (
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
                <Typography variant="h6">Category {index + 1}</Typography>
                {formData.categories.length > 1 && (
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveCategory(index)}
                  >
                    <Delete />
                  </IconButton>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                Category Details
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Category Title"
                    value={category.title}
                    onChange={(e) =>
                      handleCategoryChange(index, "title", e.target.value)
                    }
                    margin="normal"
                    required
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
                      <TextField
                        fullWidth
                        label="Background Color (Hex)"
                        value={category.bgColor}
                        onChange={(e) =>
                          handleCategoryChange(index, "bgColor", e.target.value)
                        }
                        margin="normal"
                        placeholder="#6366f1"
                      />
                      <Box
                        component="input"
                        type="color"
                        value={category.bgColor || "#6366f1"}
                        onChange={(e) =>
                          handleCategoryChange(index, "bgColor", e.target.value)
                        }
                        sx={{
                          width: 60,
                          height: 60,
                          border: "2px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          cursor: "pointer",
                          padding: 0,
                          mt: 1,
                          flexShrink: 0,
                          "&::-webkit-color-swatch-wrapper": {
                            padding: 0,
                          },
                          "&::-webkit-color-swatch": {
                            border: "none",
                            borderRadius: "4px",
                          },
                        }}
                        title="Pick a color"
                      />
                    </Box>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 1,
                        backgroundColor: category.bgColor || "#6366f1",
                        border: "2px solid",
                        borderColor: "divider",
                        boxShadow: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        minHeight: 50,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: "white",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          fontWeight: 500,
                        }}
                      >
                        Color Preview
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "white",
                          textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                          fontFamily: "monospace",
                          backgroundColor: "rgba(0,0,0,0.2)",
                          px: 1,
                          py: 0.5,
                          borderRadius: 0.5,
                        }}
                      >
                        {category.bgColor || "#6366f1"}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ mt: 2 }}>
                    <input
                      accept="image/*"
                      style={{ display: "none" }}
                      id={`category-image-${index}`}
                      type="file"
                      onChange={(e) => handleCategoryImageChange(index, e)}
                    />
                    <label htmlFor={`category-image-${index}`}>
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUpload />}
                        sx={{ mr: 2 }}
                      >
                        Upload Category Image
                      </Button>
                    </label>
                    {category.imagePreview && (
                      <Box
                        component="img"
                        src={category.imagePreview}
                        alt={`Category ${index + 1}`}
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

        <Box sx={{ mt: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={handleAddCategory}
          >
            Add New Category
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
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6">Category Section Preview</Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: "primary.main", 
                fontWeight: 600,
                backgroundColor: (theme) => theme.palette.mode === 'dark' 
                  ? 'rgba(99, 102, 241, 0.2)' 
                  : 'rgba(99, 102, 241, 0.1)',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
              }}
            >
              {formData.categories.length} {formData.categories.length === 1 ? "Category" : "Categories"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {showNavButtons && formData.categories.length > 0 && (
              <>
                <IconButton
                  onClick={() => handleScroll('left')}
                  aria-label="Scroll Left"
                  sx={{
                    width: 40,
                    height: 40,
                    border: "1px solid",
                    borderColor: "divider",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <HiChevronLeft />
                </IconButton>
                <IconButton
                  onClick={() => handleScroll('right')}
                  aria-label="Scroll Right"
                  sx={{
                    width: 40,
                    height: 40,
                    border: "1px solid",
                    borderColor: "divider",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <HiChevronRight />
                </IconButton>
              </>
            )}
            <IconButton onClick={() => setViewDialogOpen(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <PreviewContainer>
            <SectionHeadline>
              {formData.sectionTitle || "Explore course categories"}
            </SectionHeadline>

            <CarouselWrapper>
              <CarouselContainer ref={scrollContainerRef}>
                {formData.categories.map((category, index) => (
                  <CategoryCard 
                    key={index} 
                    bgColor={category.bgColor || "#6366f1"}
                  >
                    <CategoryImage image={category.imagePreview} />
                    <CategoryTitle>{category.title || `Category ${index + 1}`}</CategoryTitle>
                  </CategoryCard>
                ))}
              </CarouselContainer>
            </CarouselWrapper>
          </PreviewContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CategorySection;
