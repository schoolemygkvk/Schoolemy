import React from "react";
import {
  Paper,
  TextField,
  Typography,
  Avatar,
  Button,
  Box,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
} from "@mui/material";
import {
  AddCircle,
  RemoveCircle,
  ExpandMore,
  Delete,
  Add,
} from "@mui/icons-material";

const ContentStep = ({
  formData,
  onChapterChange,
  onAddChapter,
  onRemoveChapter,
  onAddLesson,
  onRemoveLesson,
}) => {
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
    chapterCard: {
      mb: 2,
      bgcolor: "white",
      border: "1px solid #e5e7eb",
    },
    input: { mb: 1 },
  };

  return (
    <Paper sx={styles.section}>
      <Typography sx={styles.sectionTitle}>
        <Avatar sx={{ bgcolor: "#ec4899", mr: 2 }}>3</Avatar>
        Course Content
      </Typography>

      <Box sx={{ mb: 3 }}>
        {formData.chapters?.map((chapter, chapterIndex) => (
          <Accordion key={chapterIndex} sx={styles.chapterCard}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Typography>
                  Chapter {chapterIndex + 1}: {chapter.chaptername || "Unnamed"}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveChapter(chapterIndex);
                  }}
                  color="error"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <TextField
                  fullWidth
                  label="Chapter Name"
                  value={chapter.chaptername}
                  onChange={(e) => onChapterChange(chapterIndex, e)}
                  sx={styles.input}
                />

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Lessons ({chapter.lessons?.length || 0})
                </Typography>

                {chapter.lessons?.map((lesson, lessonIndex) => (
                  <Card key={lessonIndex} sx={{ mb: 2, bgcolor: "#f3f4f6" }}>
                    <CardContent>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2">
                          Lesson {lessonIndex + 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => onRemoveLesson(chapterIndex, lessonIndex)}
                          color="error"
                        >
                          <RemoveCircle fontSize="small" />
                        </IconButton>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        label="Lesson Name"
                        value={lesson.lessonname || lesson.lessonName || ""}
                        placeholder="Enter lesson name"
                        sx={styles.input}
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Lesson Info"
                        value={lesson.lessoninfo || ""}
                        placeholder="Enter lesson description"
                        multiline
                        rows={2}
                        sx={styles.input}
                      />
                    </CardContent>
                  </Card>
                ))}

                <Button
                  startIcon={<Add />}
                  onClick={() => onAddLesson(chapterIndex)}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1 }}
                >
                  Add Lesson
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Button
        startIcon={<AddCircle />}
        onClick={onAddChapter}
        variant="contained"
        fullWidth
        sx={{ bgcolor: "#6366f1", mb: 2 }}
      >
        Add Chapter
      </Button>
    </Paper>
  );
};

export default ContentStep;
