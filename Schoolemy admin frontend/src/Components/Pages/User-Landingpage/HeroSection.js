import React, { useState, useEffect } from "react";
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
  CloudUpload,
  Visibility,
  Close,
} from "@mui/icons-material";
import styled from "styled-components";
import * as FaIcons from "react-icons/fa";
import { HiArrowRight } from "react-icons/hi";

// Styled Components for Preview
const PreviewHeroContainer = styled.section`
  max-width: 1300px;
  margin: 0 auto;
  padding: 2.5rem 1rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: center;
  
  @media (min-width: 768px) {
    padding: 4rem 1.5rem;
    gap: 2.5rem;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    padding: 6rem 2rem;
    gap: 3rem;
  }
`;

const PreviewHeroTextContent = styled.div`
  text-align: center;
  order: 2;
  
  @media (min-width: 1024px) {
    text-align: left;
    order: 1;
  }
`;

const PreviewEyebrow = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 1rem;
  background-color: #F3E8FF;
  border-radius: 9999px;
  font-weight: 500;
  font-size: 0.75rem;
  margin-bottom: 1rem;
  color: #6B7280;

  @media (min-width: 768px) {
    font-size: 0.875rem;
    padding: 0.5rem 1.25rem;
    margin-bottom: 1.5rem;
  }

  svg {
    font-size: 0.6rem;
    
    @media (min-width: 768px) {
      font-size: 0.75rem;
    }
    
    color: #8B5CF6;
  }
`;

const PreviewHeadline = styled.h1`
  color: #1F2937;
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 1rem;
  
  @media (min-width: 768px) {
    font-size: 2rem;
    margin-bottom: 1.25rem;
  }
  
  @media (min-width: 1024px) {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
  }
`;

const PreviewDescription = styled.p`
  font-size: 0.875rem;
  color: #6B7280;
  line-height: 1.625;
  max-width: 550px;
  margin: 0 auto 1.5rem auto;
  
  @media (min-width: 768px) {
    font-size: 1rem;
    margin: 0 auto 1.75rem auto;
  }
  
  @media (min-width: 1024px) {
    margin: 0 0 2rem 0;
  }
`;

const PreviewButtonWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  justify-content: center;
  
  @media (min-width: 640px) {
    flex-direction: row;
  }
  
  @media (min-width: 1024px) {
    justify-content: flex-start;
  }
`;

const PreviewPrimaryButton = styled.a`
  padding: 0.75rem 1.5rem;
  background-color: #111827;
  color: #FFFFFF;
  border-radius: 0.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  font-size: 0.875rem;
  text-align: center;
  display: inline-block;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  @media (min-width: 768px) {
    padding: 0.875rem 1.75rem;
  }
`;

const PreviewSecondaryButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: transparent;
  color: #1F2937;
  font-weight: 600;
  transition: all 0.3s ease;
  text-decoration: none;
  font-size: 0.875rem;

  @media (min-width: 768px) {
    padding: 0.875rem 1.75rem;
    gap: 0.75rem;
    justify-content: flex-start;
  }

  svg {
    transition: all 0.3s ease;
  }

  &:hover {
    color: #6366F1;
    svg {
      transform: translateX(4px);
    }
  }
`;

const PreviewHeroImageContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  order: 1;
  margin-bottom: 1rem;
  
  @media (min-width: 1024px) {
    order: 2;
    margin-bottom: 0;
  }
`;

const PreviewMainImage = styled.img`
  width: 100%;
  max-width: 280px;
  height: auto;
  border-radius: 0.5rem;
  object-fit: cover;
  z-index: 5;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  @media (min-width: 640px) {
    max-width: 350px;
    border-radius: 0.75rem;
  }
  
  @media (min-width: 768px) {
    max-width: 400px;
  }
  
  @media (min-width: 1024px) {
    max-width: 450px;
  }
`;

const PreviewBackgroundShape = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  max-width: 280px;
  background-color: #FCE7F3;
  border-radius: 0.5rem;
  transform: rotate(5deg);
  z-index: 1;
  
  @media (min-width: 640px) {
    max-width: 350px;
    border-radius: 0.75rem;
  }
  
  @media (min-width: 768px) {
    max-width: 400px;
  }
  
  @media (min-width: 1024px) {
    max-width: 450px;
  }
`;

const PreviewFloatingCard = styled.div`
  position: absolute;
  backdrop-filter: blur(10px);
  border: 1px solid #E5E7EB;
  border-radius: 0.375rem;
  padding: 0.5rem;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 10;
  
  @media (min-width: 768px) {
    padding: 0.75rem;
    gap: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  
  @media (min-width: 1024px) {
    padding: 1rem;
  }
`;

const PreviewCardTop = styled(PreviewFloatingCard)`
  top: -0.5rem;
  left: -0.5rem;
  background: rgba(255, 255, 255, 0.7);

  @media (min-width: 768px) {
    top: 1rem;
    left: -1rem;
  }
  
  @media (min-width: 1024px) {
    top: 2rem;
    left: -2rem;
  }
`;

const PreviewCardBottom = styled(PreviewFloatingCard)`
  bottom: -0.5rem;
  right: -0.5rem;
  background: #FFEDF0;

  @media (min-width: 768px) {
    bottom: 1rem;
    right: -1rem;
  }
  
  @media (min-width: 1024px) {
    bottom: 2rem;
    right: -2rem;
  }
`;

const PreviewIconWrapper = styled.div`
  background-color: #E0E7FF;
  color: #4F46E5;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  
  @media (min-width: 768px) {
    width: 35px;
    height: 35px;
  }
  
  @media (min-width: 1024px) {
    width: 40px;
    height: 40px;
  }
`;

const PreviewCardText = styled.div`
  p {
    margin: 0;
    font-size: 0.625rem;
    color: #6B7280;
    font-weight: 500;
    
    @media (min-width: 768px) {
      font-size: 0.75rem;
    }
  }
  
  strong {
    font-size: 0.75rem;
    color: #1F2937;
    font-weight: 600;
    display: block;
    
    @media (min-width: 768px) {
      font-size: 0.875rem;
    }
  }
`;

// Helper function to get icon component dynamically
const getIconComponent = (iconName) => {
  if (!iconName) return null;
  const IconComponent = FaIcons[iconName];
  return IconComponent || null;
};

const HeroSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    eyebrow: "",
    headline: "",
    description: "",
    primaryButtonText: "",
    primaryButtonLink: "",
    secondaryButtonText: "",
    secondaryButtonLink: "",
    mainImage: null,
    mainImagePreview: "",
    cardTop: {
      icon: "",
      value: "",
      label: "",
    },
    cardBottom: {
      image: null,
      imagePreview: "",
      title: "",
      label: "",
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/userdashboard/hero");
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setFormData({
          eyebrow: data.eyebrow || "",
          headline: data.headline || "",
          description: data.description || "",
          primaryButtonText: data.primaryButtonText || "",
          primaryButtonLink: data.primaryButtonLink || "",
          secondaryButtonText: data.secondaryButtonText || "",
          secondaryButtonLink: data.secondaryButtonLink || "",
          mainImage: null,
          mainImagePreview: data.mainImage || "",
          cardTop: data.cardTop || {
            icon: "",
            value: "",
            label: "",
          },
          cardBottom: data.cardBottom
            ? {
                ...data.cardBottom,
                image: null,
                imagePreview: data.cardBottom.image || "",
              }
            : {
                image: null,
                imagePreview: "",
                title: "",
                label: "",
              },
        });
      }
    } catch (error) {
      console.error("Error fetching hero data:", error);
      setMessage({
        type: "error",
        text: "Failed to load hero section data. Please try again.",
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

  const handleImageChange = (field, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field.includes(".")) {
          // Handle nested fields like "cardBottom.image"
          const [parent, child] = field.split(".");
          setFormData((prev) => ({
            ...prev,
            [parent]: {
              ...prev[parent],
              [child]: file,
              [`${child}Preview`]: reader.result,
            },
          }));
        } else {
          // Handle top-level fields like "mainImage"
          setFormData((prev) => ({
            ...prev,
            [field]: file,
            [`${field}Preview`]: reader.result,
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
      
      submitData.append("eyebrow", formData.eyebrow);
      submitData.append("headline", formData.headline);
      submitData.append("description", formData.description);
      submitData.append("primaryButtonText", formData.primaryButtonText);
      submitData.append("primaryButtonLink", formData.primaryButtonLink);
      submitData.append("secondaryButtonText", formData.secondaryButtonText);
      submitData.append("secondaryButtonLink", formData.secondaryButtonLink);
      
      if (formData.mainImage) {
        submitData.append("mainImage", formData.mainImage);
      } else if (formData.mainImagePreview) {
        submitData.append("mainImage", formData.mainImagePreview);
      }

      submitData.append("cardTop", JSON.stringify(formData.cardTop));

      if (formData.cardBottom.image) {
        submitData.append("cardBottomImage", formData.cardBottom.image);
      } else if (formData.cardBottom.imagePreview) {
        submitData.append("cardBottomImage", formData.cardBottom.imagePreview);
      }
      submitData.append("cardBottom", JSON.stringify({
        title: formData.cardBottom.title,
        label: formData.cardBottom.label,
      }));

      const response = await axios.put("/api/userdashboard/hero", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Hero section updated successfully!",
        });
        setTimeout(() => {
          fetchData();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving hero data:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save hero section data. Please try again.",
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
              Hero Section Management
            </Typography>
          </Box>
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
              Hero Section Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your hero section content including headline, description, buttons, and cards.
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {formData.headline ? "✓" : "—"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.headline ? "Configured" : "Not Set"}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Main Content
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Eyebrow Text"
                  value={formData.eyebrow}
                  onChange={(e) => handleChange("eyebrow", e.target.value)}
                  margin="normal"
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
                  label="Headline"
                  value={formData.headline}
                  onChange={(e) => handleChange("headline", e.target.value)}
                  margin="normal"
                  required
                  multiline
                  minRows={3}
                  maxRows={10}
                  InputProps={{
                    style: { overflow: "auto", resize: "vertical" },
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  margin="normal"
                  multiline
                  minRows={6}
                  maxRows={20}
                  InputProps={{
                    style: { overflow: "auto", resize: "vertical" },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Primary Button Text"
                  value={formData.primaryButtonText}
                  onChange={(e) =>
                    handleChange("primaryButtonText", e.target.value)
                  }
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Primary Button Link"
                  value={formData.primaryButtonLink}
                  onChange={(e) =>
                    handleChange("primaryButtonLink", e.target.value)
                  }
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Secondary Button Text"
                  value={formData.secondaryButtonText}
                  onChange={(e) =>
                    handleChange("secondaryButtonText", e.target.value)
                  }
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Secondary Button Link"
                  value={formData.secondaryButtonLink}
                  onChange={(e) =>
                    handleChange("secondaryButtonLink", e.target.value)
                  }
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="hero-main-image"
                    type="file"
                    onChange={(e) => handleImageChange("mainImage", e)}
                  />
                  <label htmlFor="hero-main-image">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{ mr: 2 }}
                    >
                      Upload Main Image
                    </Button>
                  </label>
                  {formData.mainImagePreview && (
                    <Box
                      component="img"
                      src={formData.mainImagePreview}
                      alt="Hero main"
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
              Top Card
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Icon (e.g., FaSpa)"
                  value={formData.cardTop.icon}
                  onChange={(e) =>
                    handleNestedChange("cardTop", "icon", e.target.value)
                  }
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Value"
                  value={formData.cardTop.value}
                  onChange={(e) =>
                    handleNestedChange("cardTop", "value", e.target.value)
                  }
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Label"
                  value={formData.cardTop.label}
                  onChange={(e) =>
                    handleNestedChange("cardTop", "label", e.target.value)
                  }
                  margin="normal"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Bottom Card
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Title"
                  value={formData.cardBottom.title}
                  onChange={(e) =>
                    handleNestedChange("cardBottom", "title", e.target.value)
                  }
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Label"
                  value={formData.cardBottom.label}
                  onChange={(e) =>
                    handleNestedChange("cardBottom", "label", e.target.value)
                  }
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="hero-card-bottom-image"
                    type="file"
                    onChange={(e) => handleImageChange("cardBottom.image", e)}
                  />
                  <label htmlFor="hero-card-bottom-image">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{ mr: 2 }}
                    >
                      Upload Card Image
                    </Button>
                  </label>
                  {formData.cardBottom.imagePreview && (
                    <Box
                      component="img"
                      src={formData.cardBottom.imagePreview}
                      alt="Card bottom"
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
          <Typography variant="h6">Hero Section Preview</Typography>
          <IconButton onClick={() => setViewOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <PreviewHeroContainer>
            <PreviewHeroTextContent>
              {formData.eyebrow && (
                <PreviewEyebrow>
                  {getIconComponent(formData.cardTop.icon) && 
                    React.createElement(getIconComponent(formData.cardTop.icon))
                  }
                  {formData.eyebrow}
                </PreviewEyebrow>
              )}
              
              {formData.headline && (
                <PreviewHeadline>
                  {formData.headline}
                </PreviewHeadline>
              )}
              
              {formData.description && (
                <PreviewDescription>
                  {formData.description}
                </PreviewDescription>
              )}

              {(formData.primaryButtonText || formData.secondaryButtonText) && (
                <PreviewButtonWrapper>
                  {formData.primaryButtonText && (
                    <PreviewPrimaryButton 
                      href={formData.primaryButtonLink || "#"}
                      onClick={(e) => {
                        if (!formData.primaryButtonLink) e.preventDefault();
                      }}
                    >
                      {formData.primaryButtonText}
                    </PreviewPrimaryButton>
                  )}
                  {formData.secondaryButtonText && (
                    <PreviewSecondaryButton 
                      href={formData.secondaryButtonLink || "#"}
                      onClick={(e) => {
                        if (!formData.secondaryButtonLink) e.preventDefault();
                      }}
                    >
                      {formData.secondaryButtonText} <HiArrowRight />
                    </PreviewSecondaryButton>
                  )}
                </PreviewButtonWrapper>
              )}
            </PreviewHeroTextContent>

            {(formData.mainImagePreview || formData.cardTop.value || formData.cardBottom.title) && (
              <PreviewHeroImageContainer>
                <PreviewBackgroundShape />
                {formData.mainImagePreview && (
                  <PreviewMainImage 
                    src={formData.mainImagePreview} 
                    alt="Hero main" 
                  />
                )}
                
                {formData.cardTop.value && (
                  <PreviewCardTop>
                    {formData.cardTop.icon && getIconComponent(formData.cardTop.icon) && (
                      <PreviewIconWrapper>
                        {React.createElement(getIconComponent(formData.cardTop.icon))}
                      </PreviewIconWrapper>
                    )}
                    <PreviewCardText>
                      <strong>{formData.cardTop.value}</strong>
                      {formData.cardTop.label && <p>{formData.cardTop.label}</p>}
                    </PreviewCardText>
                  </PreviewCardTop>
                )}

                {formData.cardBottom.title && (
                  <PreviewCardBottom>
                    {formData.cardBottom.imagePreview && (
                      <img 
                        src={formData.cardBottom.imagePreview} 
                        alt={formData.cardBottom.title} 
                        style={{ width: '30px', height: '30px', borderRadius: '50%' }}
                      />
                    )}
                    <PreviewCardText>
                      <strong>{formData.cardBottom.title}</strong>
                      {formData.cardBottom.label && <p>{formData.cardBottom.label}</p>}
                    </PreviewCardText>
                  </PreviewCardBottom>
                )}
              </PreviewHeroImageContainer>
            )}
          </PreviewHeroContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default HeroSection;
