import React from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Card,
  Grid,
  Avatar,
  CircularProgress,
} from "@mui/material";
import {
  Info,
  Person,
  Description,
  MenuBook,
  Image as ImageIcon,
} from "@mui/icons-material";

const CourseReview = ({
  formData,
  chapters,
  styles,
  loading,
  handleBack,
  handleSubmit,
}) => {
  const totalLessons = chapters.reduce(
    (acc, chapter) => acc + chapter.lessons.length,
    0,
  );
  const contentDurationText = `${formData.contentDuration.hours || 0}h ${formData.contentDuration.minutes || 0}m`;

  return (
    <Paper
      sx={{
        ...styles.section,
        background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 3,
          pb: 2,
          borderBottom: "3px solid #6366f1",
        }}
      >
        <Avatar
          sx={{
            bgcolor: "#6366f1",
            width: 56,
            height: 56,
            fontSize: "1.5rem",
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(99, 102, 241, 0.3)",
          }}
        >
          5
        </Avatar>
        <Box>
          <Typography
            sx={{
              ...styles.sectionTitle,
              fontSize: "2rem",
              mb: 0.5,
              borderBottom: "none",
              paddingBottom: 0,
            }}
          >
            Review Course Details
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Please review all information before creating the course
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
        {/* Basic Information Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 0,
              mb: 2,
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 30px rgba(99, 102, 241, 0.15)",
              },
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                p: 1.5,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Info sx={{ fontSize: "1.25rem" }} />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "white",
                  fontSize: "1rem",
                }}
              >
                Basic Information
              </Typography>
            </Box>
            <Box sx={{ p: 2, width: "100%" }}>
              <ReviewItem label="Course Name" value={formData.coursename} />
              <ReviewItem label="Category" value={formData.category} />
              <ReviewItem label="Course Mother ID" value={
                !formData.useAutoCourseMotherId && formData.CourseMotherId
                  ? formData.CourseMotherId
                  : formData.useAutoCourseMotherId
                    ? "Auto-generated"
                    : null
              } />
              <ReviewItem label="Duration" value={formData.courseDuration} />
              <ReviewItem label="Content Duration" value={contentDurationText} />
              <ReviewItem label="Level" value={formData.level} />
              <ReviewItem label="Language" value={formData.language} />
              <ReviewItem label="Certificates" value={formData.certificates} />
              <Box
                sx={{
                  mt: 1,
                  p: 1.5,
                  backgroundColor: "#eff6ff",
                  borderRadius: 2,
                  border: "1px solid #bfdbfe",
                  width: "100%",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: "#1e40af",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    fontSize: "0.75rem",
                  }}
                >
                  <ImageIcon sx={{ fontSize: "0.875rem" }} />
                  Media Files
                </Typography>
                <Grid container spacing={1.5} sx={{ width: "100%", margin: 0 }}>
                  <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#6b7280",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        letterSpacing: "0.5px",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Thumbnail
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#111827",
                        fontWeight: 500,
                        fontSize: "0.8rem",
                        wordBreak: "break-word",
                        width: "100%",
                      }}
                    >
                      {formData.thumbnail ? (
                        formData.thumbnail.name
                      ) : (
                        <span
                          style={{
                            color: "#9ca3af",
                            fontStyle: "italic",
                          }}
                        >
                          Not uploaded
                        </span>
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#6b7280",
                        fontWeight: 500,
                        textTransform: "uppercase",
                        fontSize: "0.65rem",
                        letterSpacing: "0.5px",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      Preview Video
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#111827",
                        fontWeight: 500,
                        fontSize: "0.8rem",
                        wordBreak: "break-word",
                        width: "100%",
                      }}
                    >
                      {formData.previewVideo ? (
                        formData.previewVideo.name
                      ) : (
                        <span
                          style={{
                            color: "#9ca3af",
                            fontStyle: "italic",
                          }}
                        >
                          Not uploaded
                        </span>
                      )}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Instructor Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 0,
              mb: 2,
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 30px rgba(99, 102, 241, 0.15)",
              },
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
                p: 1.5,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Person sx={{ fontSize: "1.25rem" }} />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "white",
                  fontSize: "1rem",
                }}
              >
                Instructor
              </Typography>
            </Box>
            <Box sx={{ p: 2, width: "100%" }}>
              <ReviewItem label="Name" value={formData.instructor.name} />
              <ReviewItem label="Role" value={formData.instructor.role} />
              <ReviewItem label="Social Media" value={formData.instructor.socialmedia_id} />
            </Box>
          </Card>
        </Grid>

        {/* Description Card */}
        <Grid item xs={12}>
          <Card
            sx={{
              p: 0,
              mb: 2,
              width: "100%",
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 30px rgba(99, 102, 241, 0.15)",
              },
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                p: 2,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Description sx={{ fontSize: "1.5rem" }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                Description
              </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Typography
                sx={{
                  whiteSpace: "pre-wrap",
                  color: formData.description ? "#111827" : "#9ca3af",
                  lineHeight: 1.8,
                  fontSize: "1rem",
                  fontStyle: formData.description ? "normal" : "italic",
                }}
              >
                {formData.description || "No description provided"}
              </Typography>
            </Box>
          </Card>
        </Grid>

        {/* What You'll Learn Card */}
        {formData.whatYoullLearn && formData.whatYoullLearn.length > 0 && (
          <Grid item xs={12}>
            <Card
              sx={{
                p: 0,
                mb: 2,
                borderRadius: 3,
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 30px rgba(99, 102, 241, 0.15)",
                },
              }}
            >
              <Box
                sx={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  p: 2,
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                  What You'll Learn
                </Typography>
              </Box>
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {formData.whatYoullLearn.map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "inline-block",
                        backgroundColor: "#fef3c7",
                        color: "#92400e",
                        padding: "0.5rem 1rem",
                        borderRadius: "20px",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                      }}
                    >
                      {item}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Card>
          </Grid>
        )}

        {/* Content Summary Card */}
        <Grid item xs={12}>
          <Card
            sx={{
              p: 0,
              mb: 2,
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
              overflow: "hidden",
              border: "1px solid #e5e7eb",
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 8px 30px rgba(99, 102, 241, 0.15)",
              },
            }}
          >
            <Box
              sx={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                p: 2,
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <MenuBook sx={{ fontSize: "1.5rem" }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: "white" }}>
                Course Content Summary
              </Typography>
            </Box>
            <Box sx={{ p: 2.5 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Chapters
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 600, color: "#3b82f6" }}
                    >
                      {chapters.length}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Lessons
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 600, color: "#3b82f6" }}
                    >
                      {totalLessons}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Price
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{ fontWeight: 600, color: "#3b82f6" }}
                    >
                      {formData.price.currency}{" "}
                      {formData.price.finalPrice.toFixed(2)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Box sx={styles.navigation}>
        <Button onClick={handleBack} sx={styles.buttonSecondary}>
          Back
        </Button>
        <Button
          onClick={handleSubmit}
          sx={styles.buttonPrimary}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Creating Course..." : "Create Course"}
        </Button>
      </Box>
    </Paper>
  );
};

// Helper component for review items
const ReviewItem = ({ label, value }) => (
  <Box sx={{ mb: 1.5, width: "100%" }}>
    <Typography
      variant="caption"
      sx={{
        color: "#6b7280",
        fontWeight: 500,
        textTransform: "uppercase",
        fontSize: "0.65rem",
        letterSpacing: "0.5px",
        display: "block",
        mb: 0.5,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        color: "#111827",
        fontWeight: 500,
        wordBreak: "break-word",
        width: "100%",
      }}
    >
      {value || (
        <span
          style={{
            color: "#9ca3af",
            fontStyle: "italic",
          }}
        >
          Not provided
        </span>
      )}
    </Typography>
  </Box>
);

export default CourseReview;
