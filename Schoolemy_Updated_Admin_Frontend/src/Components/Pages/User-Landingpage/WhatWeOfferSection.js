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
  Visibility,
  Close,
} from "@mui/icons-material";
import styled from "styled-components";
import * as FaIcons from "react-icons/fa";
import { Link } from "react-router-dom";

// Styled Components for Preview
const PreviewSectionWrapper = styled.section`
  background-color: ${({ theme }) => theme?.colors?.background?.primary || "#ffffff"};
  padding: ${({ theme }) => theme?.spacing?.sectionPadding || "4rem"} 5%;
`;

const PreviewContainer = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: ${({ theme }) => theme?.spacing?.[8] || "2rem"};
  padding: ${({ theme }) => theme?.spacing?.[4] || "1rem"};

  @media (min-width: 768px) {
    padding: ${({ theme }) => theme?.spacing?.[6] || "1.5rem"};
    gap: ${({ theme }) => theme?.spacing?.[10] || "2.5rem"};
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme?.spacing?.[12] || "3rem"};
  }
`;

const PreviewTextColumn = styled.div`
  @media (min-width: 1024px) {
    position: sticky;
    top: 120px;
    height: fit-content;
    align-self: flex-start;
    max-height: calc(100vh - 140px);
    overflow-y: auto;
  }
`;

const PreviewSectionTitle = styled.h2`
  font-family: ${({ theme }) => theme?.typography?.fonts?.accent || "inherit"};
  font-size: ${({ theme }) => theme?.typography?.size?.["5xl"] || "2.5rem"};
  font-weight: ${({ theme }) => theme?.typography?.weight?.bold || "700"};
  color: ${({ theme }) => theme?.colors?.text?.primary || "#1F2937"};
  margin: 0 0 ${({ theme }) => theme?.spacing?.[6] || "1.5rem"} 0;
`;

const PreviewSectionDescription = styled.p`
  font-size: ${({ theme }) => theme?.typography?.size?.lg || "1.125rem"};
  color: ${({ theme }) => theme?.colors?.text?.secondary || "#6B7280"};
  line-height: ${({ theme }) => theme?.typography?.lineHeight?.relaxed || "1.75"};
  margin-bottom: ${({ theme }) => theme?.spacing?.[8] || "2rem"};
`;

const PreviewStyledButton = styled(Link)`
  display: inline-block;
  padding: ${({ theme }) => theme?.spacing?.[4] || "0.5rem"} ${({ theme }) => theme?.spacing?.[8] || "1rem"};
  background-color: ${({ theme }) => theme?.colors?.accent?.[400] || "#6366f1"};
  color: ${({ theme }) => theme?.colors?.text?.primary || "#ffffff"};
  border-radius: ${({ theme }) => theme?.borderRadius?.full || "9999px"};
  text-decoration: none;
  font-weight: ${({ theme }) => theme?.typography?.weight?.bold || "700"};
  transition: all 0.3s ease;

  &:hover {
    background-color: ${({ theme }) => theme?.colors?.accent?.[500] || "#4f46e5"};
    transform: scale(1.05);
  }
`;

const PreviewScrollingColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme?.spacing?.[6] || "1.5rem"};
`;

const PreviewOfferingCard = styled.div`
  background-color: ${({ theme }) => theme?.colors?.neutral?.[800] || "#1F2937"};
  padding: ${({ theme }) => theme?.spacing?.[6] || "1.5rem"};
  border-radius: ${({ theme }) => theme?.borderRadius?.["2xl"] || "1rem"};
  border: 1px solid ${({ theme }) => theme?.colors?.neutral?.[700] || "#374151"};
  transition: all 0.3s ease-in-out;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      45deg,
      ${({ theme }) => theme?.colors?.accent?.[400] || "#6366f1"}22,
      ${({ theme }) => theme?.colors?.neutral?.[800] || "#1F2937"}
    );
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    border-color: ${({ theme }) => theme?.colors?.accent?.[400] || "#6366f1"};

    &::before {
      opacity: 1;
    }
  }

  @media (min-width: 768px) {
    padding: ${({ theme }) => theme?.spacing?.[8] || "2rem"};
  }
`;

const PreviewCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme?.spacing?.[5] || "1.25rem"};
`;

const PreviewIconCircle = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme?.colors?.neutral?.[500] || "#6B7280"};
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;
  color: ${({ theme }) => theme?.colors?.text?.inverse || "#ffffff"};
  flex-shrink: 0;
`;

const PreviewOfferingTitle = styled.h3`
  font-size: ${({ theme }) => theme?.typography?.size?.["2xl"] || "1.5rem"};
  font-weight: ${({ theme }) => theme?.typography?.weight?.semibold || "600"};
  color: ${({ theme }) => theme?.colors?.text?.inverse || "#ffffff"};
  margin: 0;
`;

// Helper function to get icon component dynamically
const getIconComponent = (iconName) => {
  if (!iconName) return null;
  const IconComponent = FaIcons[iconName];
  return IconComponent ? <IconComponent /> : null;
};

const WhatWeOfferSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    buttonText: "",
    buttonLink: "",
    offerings: [
      {
        title: "",
        icon: "",
        link: "",
      },
    ],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/userdashboard/what-we-offer");
      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setFormData({
          title: data.title || "",
          description: data.description || "",
          buttonText: data.buttonText || "",
          buttonLink: data.buttonLink || "",
          offerings:
            data.offerings && data.offerings.length > 0
              ? data.offerings
              : [
                  {
                    title: "",
                    icon: "",
                    link: "",
                  },
                ],
        });
      }
    } catch (error) {
      console.error("Error fetching what we offer data:", error);
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

  const handleOfferingChange = (index, field, value) => {
    const newOfferings = [...formData.offerings];
    newOfferings[index][field] = value;
    setFormData((prev) => ({ ...prev, offerings: newOfferings }));
  };

  const handleAddOffering = () => {
    setFormData((prev) => ({
      ...prev,
      offerings: [
        ...prev.offerings,
        {
          title: "",
          icon: "",
          link: "",
        },
      ],
    }));
  };

  const handleRemoveOffering = (index) => {
    if (formData.offerings.length > 1) {
      setFormData((prev) => ({
        ...prev,
        offerings: prev.offerings.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.put("/api/userdashboard/what-we-offer", {
        title: formData.title,
        description: formData.description,
        buttonText: formData.buttonText,
        buttonLink: formData.buttonLink,
        offerings: formData.offerings.filter((o) => o.title.trim() !== ""),
      });

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "What We Offer section updated successfully!",
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
            What We Offer Section Management
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
              What We Offer Section Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your "What We Offer" section including title, description, button, and offerings with icons and links.
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="h4" color="primary.main" fontWeight="bold">
              {formData.offerings.filter((o) => o.title && o.title.trim() !== "").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.offerings.filter((o) => o.title && o.title.trim() !== "").length === 1 ? "Offering" : "Offerings"}
            </Typography>
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
                  label="Section Title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  margin="normal"
                  required
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
                  rows={4}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Button Text"
                  value={formData.buttonText}
                  onChange={(e) => handleChange("buttonText", e.target.value)}
                  margin="normal"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Button Link"
                  value={formData.buttonLink}
                  onChange={(e) => handleChange("buttonLink", e.target.value)}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Offerings</Typography>

            <Divider sx={{ mb: 3 }} />

            {formData.offerings.map((offering, index) => (
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
                    <Typography variant="subtitle1">
                      Offering {index + 1}
                    </Typography>
                    {formData.offerings.length > 1 && (
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveOffering(index)}
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Title"
                        value={offering.title}
                        onChange={(e) =>
                          handleOfferingChange(index, "title", e.target.value)
                        }
                        margin="normal"
                        required
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Icon (e.g., FaSpa)"
                        value={offering.icon}
                        onChange={(e) =>
                          handleOfferingChange(index, "icon", e.target.value)
                        }
                        margin="normal"
                      />
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label="Link"
                        value={offering.link}
                        onChange={(e) =>
                          handleOfferingChange(index, "link", e.target.value)
                        }
                        margin="normal"
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
                onClick={handleAddOffering}
              >
                Add Offering
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
            m: 2,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Preview: What We Offer Section</Typography>
          <IconButton onClick={() => setViewOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <PreviewSectionWrapper>
            <PreviewContainer>
              <PreviewTextColumn>
                <PreviewSectionTitle>
                  {formData.title || "What We Offer"}
                </PreviewSectionTitle>
                <PreviewSectionDescription>
                  {formData.description || "We bring together highly skilled teachers and practitioners who are masters in their fields. Our expertise is rooted in traditional sciences."}
                </PreviewSectionDescription>
                {formData.buttonText && formData.buttonLink && (
                  <PreviewStyledButton to={formData.buttonLink}>
                    {formData.buttonText}
                  </PreviewStyledButton>
                )}
              </PreviewTextColumn>

              <PreviewScrollingColumn>
                {formData.offerings
                  .filter((o) => o.title && o.title.trim() !== "")
                  .map((item, index) => (
                    <Link
                      to={item.link || "#"}
                      key={index}
                      style={{ textDecoration: "none" }}
                      onClick={(e) => {
                        if (!item.link || item.link === "#") {
                          e.preventDefault();
                        }
                      }}
                    >
                      <PreviewOfferingCard>
                        <PreviewCardHeader>
                          <PreviewIconCircle>
                            {getIconComponent(item.icon)}
                          </PreviewIconCircle>
                          <PreviewOfferingTitle>{item.title}</PreviewOfferingTitle>
                        </PreviewCardHeader>
                      </PreviewOfferingCard>
                    </Link>
                  ))}
                {formData.offerings.filter((o) => o.title && o.title.trim() !== "").length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                    No offerings to display. Please add at least one offering with a title.
                  </Typography>
                )}
              </PreviewScrollingColumn>
            </PreviewContainer>
          </PreviewSectionWrapper>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default WhatWeOfferSection;
