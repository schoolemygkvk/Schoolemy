import React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Grid,
  Avatar,
} from "@mui/material";

const CourseInstructor = ({
  formData,
  handleChange,
  styles,
  handleBack,
  handleNext,
}) => {
  return (
    <Paper sx={styles.section}>
      <Typography sx={styles.sectionTitle}>
        <Avatar sx={{ bgcolor: "#4f46e5", mr: 2 }}>3</Avatar>
        Instructor Information
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Instructor Name"
            name="instructor.name"
            value={formData.instructor.name}
            onChange={handleChange}
            sx={styles.input}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Instructor Role"
            name="instructor.role"
            value={formData.instructor.role}
            onChange={handleChange}
            sx={styles.input}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Social Media ID"
            name="instructor.socialmedia_id"
            value={formData.instructor.socialmedia_id}
            onChange={handleChange}
            sx={styles.input}
          />
        </Grid>
      </Grid>

      <Box sx={styles.navigation}>
        <Button onClick={handleBack} sx={styles.buttonSecondary}>
          Back
        </Button>
        <Button onClick={handleNext} sx={styles.buttonPrimary}>
          Next: Course Content
        </Button>
      </Box>
    </Paper>
  );
};

export default CourseInstructor;
