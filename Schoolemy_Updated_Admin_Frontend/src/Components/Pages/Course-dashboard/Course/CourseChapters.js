import React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Card,
  Grid,
  IconButton,
  Chip,
  Avatar,
} from "@mui/material";
import { AddCircle, RemoveCircle, CloudUpload } from "@mui/icons-material";

const CourseChapters = ({
  chapters,
  handleChapterChange,
  handleLessonChange,
  handleRemoveLessonFile,
  addChapter,
  addLesson,
  removeChapter,
  removeLesson,
  styles,
  handleBack,
  handleNext,
}) => {
  return (
    <Paper sx={styles.section}>
      <Typography sx={styles.sectionTitle}>
        <Avatar sx={{ bgcolor: "#4f46e5", mr: 2 }}>4</Avatar>
        Course Content
      </Typography>

      {chapters.map((chapter, cIndex) => (
        <Card key={cIndex} sx={styles.chapterCard}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Chapter {cIndex + 1}
            </Typography>
            <IconButton
              onClick={() => removeChapter(cIndex)}
              disabled={chapters.length <= 1}
              sx={{ color: chapters.length > 1 ? "#ef4444" : "#cbd5e0" }}
            >
              <RemoveCircle />
            </IconButton>
          </Box>

          <TextField
            fullWidth
            label="Chapter Title *"
            name="title"
            value={chapter.title}
            onChange={(e) => handleChapterChange(cIndex, e)}
            sx={{ ...styles.input, mb: 3 }}
            required
          />

          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
            Lessons
          </Typography>

          {chapter.lessons.map((lesson, lIndex) => (
            <Card key={lIndex} sx={styles.lessonCard}>
              <IconButton
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  color:
                    chapter.lessons.length > 1 ? "#ef4444" : "#cbd5e0",
                }}
                onClick={() => removeLesson(cIndex, lIndex)}
                disabled={chapter.lessons.length <= 1}
              >
                <RemoveCircle />
              </IconButton>

              <TextField
                label="Lesson Name *"
                name="lessonName"
                value={lesson.lessonName}
                onChange={(e) => handleLessonChange(cIndex, lIndex, e)}
                sx={{ ...styles.input, mb: 2, width: "60%" }}
                required
              />

              <Grid container spacing={2}>
                {[
                  { key: "audioFile", label: "AUDIO", accept: "audio/*" },
                  { key: "videoFile", label: "VIDEO", accept: "video/*" },
                  { key: "pdfFile", label: "PDF", accept: "application/pdf" }
                ].map(({ key, label, accept }) => (
                  <Grid item xs={12} md={4} key={key}>
                    <Box sx={styles.fileUpload}>
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1,
                          textTransform: "uppercase",
                          fontWeight: 500,
                        }}
                      >
                        {label} Files
                      </Typography>
                      <input
                        type="file"
                        name={key}
                        multiple
                        onChange={(e) =>
                          handleLessonChange(cIndex, lIndex, e)
                        }
                        accept={accept}
                        style={{ display: "none" }}
                        id={`${key}-${cIndex}-${lIndex}`}
                      />
                      <label htmlFor={`${key}-${cIndex}-${lIndex}`}>
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUpload />}
                        >
                          Upload
                        </Button>
                      </label>
                      {lesson[key] && lesson[key].length > 0 && (
                        <Box
                          sx={{
                            mt: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 1,
                            }}
                          >
                            {lesson[key].map((file, fIndex) => {
                              let fileLabel = "";
                              if (typeof file === "string")
                                fileLabel = file;
                              else if (
                                file &&
                                (file.name || file.filename)
                              )
                                fileLabel = file.name || file.filename;
                              else if (file && file.originalname)
                                fileLabel = file.originalname;
                              else fileLabel = String(file);

                              return (
                                <Chip
                                  key={fIndex}
                                  label={fileLabel}
                                  onDelete={() =>
                                    handleRemoveLessonFile(
                                      cIndex,
                                      lIndex,
                                      key,
                                      fIndex,
                                    )
                                  }
                                  sx={styles.chip}
                                />
                              );
                            })}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{ color: "success.main" }}
                          >
                            {lesson[key].length} file(s) selected
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>
          ))}

          <Button
            variant="outlined"
            startIcon={<AddCircle />}
            onClick={() => addLesson(cIndex)}
            sx={styles.buttonSecondary}
          >
            Add Lesson
          </Button>
        </Card>
      ))}

      <Button
        variant="contained"
        startIcon={<AddCircle />}
        onClick={addChapter}
        sx={{ ...styles.buttonPrimary, mt: 2 }}
      >
        Add Chapter
      </Button>

      <Box sx={styles.navigation}>
        <Button onClick={handleBack} sx={styles.buttonSecondary}>
          Back
        </Button>
        <Button onClick={handleNext} sx={styles.buttonPrimary}>
          Next: Review
        </Button>
      </Box>
    </Paper>
  );
};

export default CourseChapters;
