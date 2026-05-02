import React, { useState, useEffect } from "react";
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
import { FiCheckCircle } from "react-icons/fi";

// --- STYLED COMPONENTS FOR PREVIEW ---
const PreviewSectionWrapper = styled.section`
  background-color: #ffffff;
  padding: 40px 4%;
  overflow: hidden;
  
  @media (max-width: 960px) {
    padding: 30px 3%;
  }
`;

const PreviewContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  align-items: center;
  gap: 32px;
  
  @media (min-width: 960px) {
    gap: 48px;
  }

  @media (min-width: 1280px) {
    grid-template-columns: 45% 55%;
    gap: 64px;
  }
`;

const PreviewImageColumn = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
  
  @media (min-width: 1280px) {
    min-height: 450px;
    margin: 0;
  }
`;

const PreviewImageWrapper = styled.div`
  position: relative;
  max-width: 450px;
  width: 100%;
  transition: transform 0.3s ease-in-out;

  &:hover {
    transform: translateY(-10px);
  }

  @media (max-width: 960px) {
    max-width: 350px;
  }
`;

const PreviewBackgroundBlob = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 24px;
  background: linear-gradient(135deg, #E0FF9A, #FFF078);
  z-index: 1;
  top: -20px;
  left: -20px;
  transform: rotate(-15deg);
`;

const PreviewStyledImage = styled.img`
  width: 100%;
  height: auto;
  display: block;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 2;
`;

const PreviewTextColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const PreviewSectionTitle = styled.h2`
  font-size: 2rem;
  color: #1a1a1a;
  font-weight: 700;
  margin: 0 0 32px 0;
  line-height: 1.3;

  @media (min-width: 960px) {
    font-size: 2.5rem;
  }

  @media (max-width: 600px) {
    font-size: 1.5rem;
    margin: 0 0 24px 0;
  }
`;

const PreviewFeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  width: 100%;

  @media (min-width: 600px) {
    gap: 24px;
  }

  @media (min-width: 960px) and (max-width: 1280px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const PreviewFeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  font-size: 1rem;
  color: #666666;
  transition: transform 0.2s ease-in-out;
  padding: 8px;
  border-radius: 8px;
  word-wrap: break-word;
  word-break: break-word;
  overflow-wrap: break-word;

  &:hover {
    transform: translateX(8px);
    background-color: rgba(224, 255, 154, 0.1);
  }

  svg {
    color: #4CAF50;
    font-size: 1.5rem;
    flex-shrink: 0;
    margin-top: 2px;
    transition: transform 0.2s ease;
  }

  span {
    flex: 1;
    line-height: 1.6;
    white-space: normal;
    overflow: visible;
    text-overflow: clip;
  }

  &:hover svg {
    transform: scale(1.2);
  }

  @media (max-width: 600px) {
    font-size: 0.875rem;
    gap: 12px;
    
    svg {
      font-size: 1.25rem;
    }
  }
`;

const WhyChooseUsSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    title: "",
    image: null,
    imagePreview: "",
    features: [""],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/userdashboard/why-choose-us");
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setFormData({
          title: data.title || "",
          image: null,
          imagePreview: data.image || "",
          features: data.features && data.features.length > 0 
            ? data.features 
            : [""],
        });
      }
    } catch (error) {
      console.error("Error fetching why choose us data:", error);
      setMessage({
        type: "error",
        text: "Failed to load section data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData((prev) => ({ ...prev, features: newFeatures }));
  };

  const handleAddFeature = () => {
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  const handleRemoveFeature = (index) => {
    if (formData.features.length > 1) {
      setFormData((prev) => ({
        ...prev,
        features: prev.features.filter((_, i) => i !== index),
      }));
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          image: file,
          imagePreview: reader.result,
        }));
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
      submitData.append("features", JSON.stringify(formData.features.filter(f => f.trim() !== "")));
      
      if (formData.image instanceof File) {
        submitData.append("image", formData.image);
      }

      const response = await axios.put("/api/userdashboard/why-choose-us", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Why Choose Us section updated successfully!",
        });
        setTimeout(() => {
          fetchData();
        }, 1000);
      }
    } catch (error) {
      console.error("Error saving data:", error);
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to save data. Please try again.",
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
            Why Choose Us Section Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Visibility />}
          onClick={() => setOpenPreview(true)}
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
              Why Choose Us Section Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your "Why Choose Us" section content. Add features and customize the section title and image.
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {formData.features.filter(f => f.trim() !== "").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.features.filter(f => f.trim() !== "").length === 1 ? 'Feature' : 'Features'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3, width: "100%" }}>
          <CardContent sx={{ width: "100%" }}>
            <Grid container spacing={3} sx={{ width: "100%" }}>
              <Grid item xs={12} sx={{ width: "100%" }}>
                <TextField
                  fullWidth
                  label="Section Title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <input
                    accept="image/*"
                    style={{ display: "none" }}
                    id="why-choose-us-image"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <label htmlFor="why-choose-us-image">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUpload />}
                      sx={{ mr: 2 }}
                    >
                      Upload Image
                    </Button>
                  </label>
                  {formData.imagePreview && (
                    <Box
                      component="img"
                      src={formData.imagePreview}
                      alt="Why choose us"
                      sx={{
                        mt: 2,
                        maxWidth: "100%",
                        maxHeight: "400px",
                        borderRadius: 1,
                      }}
                    />
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} sx={{ width: "100%" }}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>Features</Typography>

                {formData.features.map((feature, index) => (
                  <Box key={index} sx={{ mb: 2, display: "flex", gap: 1, alignItems: "flex-start", width: "100%" }}>
                    <TextField
                      fullWidth
                      label={`Feature ${index + 1}`}
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      margin="normal"
                      multiline
                      minRows={2}
                      maxRows={6}
                      sx={{
                        flex: 1,
                        width: "100%",
                        "& .MuiInputBase-root": {
                          minHeight: "auto",
                          width: "100%",
                        },
                        "& .MuiInputBase-input": {
                          width: "100%",
                        },
                        "& .MuiOutlinedInput-root": {
                          width: "100%",
                        },
                      }}
                    />
                    {formData.features.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveFeature(index)}
                        sx={{ mt: 1, flexShrink: 0 }}
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
                    onClick={handleAddFeature}
                  >
                    Add Feature
                  </Button>
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
        open={openPreview}
        onClose={() => setOpenPreview(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: "90vh",
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Preview: Why Choose Us Section</Typography>
          <IconButton onClick={() => setOpenPreview(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <PreviewSectionWrapper>
            <PreviewContainer>
              <PreviewImageColumn>
                {formData.imagePreview && (
                  <PreviewImageWrapper>
                    <PreviewBackgroundBlob />
                    <PreviewStyledImage
                      src={formData.imagePreview}
                      alt="Why choose us"
                    />
                  </PreviewImageWrapper>
                )}
                {!formData.imagePreview && (
                  <Box
                    sx={{
                      width: "100%",
                      maxWidth: "450px",
                      height: "300px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f5f5f5",
                      borderRadius: 2,
                      border: "2px dashed #ccc",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No image uploaded
                    </Typography>
                  </Box>
                )}
              </PreviewImageColumn>

              <PreviewTextColumn>
                <PreviewSectionTitle>
                  {formData.title || "Why Choose Us Section Title"}
                </PreviewSectionTitle>
                <PreviewFeaturesList>
                  {formData.features
                    .filter((feature) => feature.trim() !== "")
                    .map((feature, index) => (
                      <PreviewFeatureItem key={index}>
                        <FiCheckCircle />
                        <span>{feature}</span>
                      </PreviewFeatureItem>
                    ))}
                  {formData.features.filter((f) => f.trim() !== "").length === 0 && (
                    <PreviewFeatureItem>
                      <Typography variant="body2" color="text.secondary">
                        No features added yet
                      </Typography>
                    </PreviewFeatureItem>
                  )}
                </PreviewFeaturesList>
              </PreviewTextColumn>
            </PreviewContainer>
          </PreviewSectionWrapper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WhyChooseUsSection;
