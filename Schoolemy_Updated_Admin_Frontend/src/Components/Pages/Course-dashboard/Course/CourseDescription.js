import React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Chip,
  Avatar,
} from "@mui/material";

const CourseDescription = ({
  formData,
  whatYoullLearnInput,
  setWhatYoullLearnInput,
  handleChange,
  handleWhatYoullLearn,
  removeWhatYoullLearn,
  styles,
  handleBack,
  handleNext,
}) => {
  return (
    <Paper sx={styles.section}>
      <Typography sx={styles.sectionTitle}>
        <Avatar sx={{ bgcolor: "#4f46e5", mr: 2 }}>2</Avatar>
        Course Description
      </Typography>
      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          label="Course Description *"
          name="description"
          value={formData.description}
          onChange={handleChange}
          multiline
          minRows={4}
          maxRows={20}
          sx={styles.input}
          required
          InputProps={{
            style: { overflow: "auto", resize: "vertical" },
          }}
        />
      </Box>
      <Typography
        sx={{
          ...styles.sectionTitle,
          mb: 2,
          mt: 2,
          fontSize: "1.2rem",
          borderBottom: "none",
          display: "block",
          color: "#1e3a8a",
        }}
      >
        What You'll Learn
      </Typography>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 2,
          alignItems: "center",
          maxWidth: 600,
        }}
      >
        <TextField
          fullWidth
          value={whatYoullLearnInput}
          onChange={(e) => setWhatYoullLearnInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleWhatYoullLearn();
            }
          }}
          placeholder="Add learning point"
          sx={styles.input}
        />
        <Button
          variant="contained"
          onClick={handleWhatYoullLearn}
          disabled={!whatYoullLearnInput.trim()}
          sx={styles.buttonPrimary}
        >
          Add
        </Button>
      </Box>
      <Box
        sx={{
          minHeight: 52,
          p: 2,
          borderRadius: 2,
          backgroundColor: "#e3f0ff",
          maxWidth: 600,
        }}
      >
        {formData.whatYoullLearn.length > 0 ? (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {formData.whatYoullLearn.map((item, index) => (
              <Chip
                key={index}
                label={item}
                onDelete={() => removeWhatYoullLearn(index)}
                sx={styles.chip}
              />
            ))}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{ color: "#94a3b8", alignSelf: "center", ml: 1 }}
          >
            No learning points added yet
          </Typography>
        )}
      </Box>
      <Box sx={styles.navigation}>
        <Button onClick={handleBack} sx={styles.buttonSecondary}>
          Back
        </Button>
        <Button onClick={handleNext} sx={styles.buttonPrimary}>
          Next: Instructor
        </Button>
      </Box>
    </Paper>
  );
};

export default CourseDescription;
