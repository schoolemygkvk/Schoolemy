import React from "react";
import {
  Paper,
  Typography,
  Avatar,
  Grid,
  Card,
  CardContent,
  Chip,
  Box,
  Divider,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";

const ReviewStep = ({ formData, categories }) => {
  const styles = {
    section: {
      p: 3,
      mb: 3,
      borderRadius: "12px",
      border: "1px solid #e5e7eb",
      bgcolor: "#f9fafb",
    },
    sectionTitle: {
      display: "flex",
      alignItems: "center",
      mb: 3,
      fontSize: "1.25rem",
      fontWeight: "600",
      color: "#1f2937",
    },
    card: {
      mb: 2,
      bgcolor: "white",
      border: "1px solid #e5e7eb",
    },
    label: {
      fontWeight: "600",
      color: "#6b7280",
      fontSize: "0.875rem",
    },
    value: {
      color: "#1f2937",
      fontSize: "1rem",
      mt: 0.5,
    },
  };

  return (
    <Paper sx={styles.section}>
      <Typography sx={styles.sectionTitle}>
        <Avatar sx={{ bgcolor: "#10b981", mr: 2 }}>4</Avatar>
        Review & Save
      </Typography>

      <Grid container spacing={2}>
        {/* Basic Info */}
        <Grid item xs={12}>
          <Card sx={styles.card}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📋 Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography sx={styles.label}>Course Name</Typography>
                  <Typography sx={styles.value}>{formData.coursename}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={styles.label}>Category</Typography>
                  <Typography sx={styles.value}>{formData.category}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography sx={styles.label}>Duration</Typography>
                  <Typography sx={styles.value}>{formData.courseduration}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography sx={styles.label}>Language</Typography>
                  <Typography sx={styles.value}>{formData.language || "Not set"}</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography sx={styles.label}>Level</Typography>
                  <Typography sx={styles.value}>{formData.level || "Not set"}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <Card sx={styles.card}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📝 Description
              </Typography>
              <Typography sx={{ color: "#4b5563", lineHeight: 1.6 }}>
                {formData.description}
              </Typography>
              {formData.whatYoullLearn && formData.whatYoullLearn.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    What You'll Learn:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {formData.whatYoullLearn.map((item, idx) => (
                      <Chip
                        key={idx}
                        label={item}
                        size="small"
                        sx={{ bgcolor: "#dbeafe", color: "#0369a1" }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Content */}
        <Grid item xs={12}>
          <Card sx={styles.card}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                📚 Course Content
              </Typography>
              <Box>
                {formData.chapters?.map((chapter, idx) => (
                  <Box key={idx} sx={{ mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CheckCircle sx={{ color: "#10b981", fontSize: "1.25rem" }} />
                      <Typography sx={{ fontWeight: "600" }}>
                        Chapter {idx + 1}: {chapter.chaptername}
                      </Typography>
                    </Box>
                    <Typography sx={{ ml: 4, color: "#6b7280", fontSize: "0.875rem" }}>
                      {chapter.lessons?.length || 0} lesson(s)
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary */}
        <Grid item xs={12}>
          <Card sx={styles.card}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                ✅ Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography sx={styles.label}>Total Chapters</Typography>
                  <Typography sx={styles.value}>
                    {formData.chapters?.length || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography sx={styles.label}>Total Lessons</Typography>
                  <Typography sx={styles.value}>
                    {formData.chapters?.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0) || 0}
                  </Typography>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, p: 2, bgcolor: "#fef2f2", borderRadius: "8px", borderLeft: "4px solid #ef4444" }}>
                <Typography sx={{ color: "#991b1b", fontSize: "0.875rem" }}>
                  ⚠️ Review all information carefully before saving. Changes will be applied immediately.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ReviewStep;
