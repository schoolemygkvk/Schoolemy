import React from "react";
import {
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Avatar,
} from "@mui/material";

const BasicInfoStep = ({ formData, categories, onChange }) => {
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
    input: { mb: 2 },
  };

  return (
    <Paper sx={styles.section}>
      <Typography sx={styles.sectionTitle}>
        <Avatar sx={{ bgcolor: "#4f46e5", mr: 2 }}>1</Avatar>
        Basic Course Information
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Course Name *"
            name="coursename"
            value={formData.coursename}
            onChange={onChange}
            required
            disabled
            sx={styles.input}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={styles.input}>
            <InputLabel>Category *</InputLabel>
            <Select
              name="category"
              value={formData.category}
              onChange={onChange}
              label="Category *"
              required
            >
              <MenuItem value="">Select category</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth sx={styles.input}>
            <InputLabel>Course Duration *</InputLabel>
            <Select
              name="courseduration"
              value={formData.courseduration}
              onChange={onChange}
              label="Course Duration *"
              required
            >
              <MenuItem value="6 months">6 months</MenuItem>
              <MenuItem value="1 year">12 months</MenuItem>
              <MenuItem value="2 years">24 months</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth sx={styles.input}>
            <InputLabel>Language</InputLabel>
            <Select
              name="language"
              value={formData.language}
              onChange={onChange}
              label="Language"
            >
              <MenuItem value="English">English</MenuItem>
              <MenuItem value="Tamil">Tamil</MenuItem>
              <MenuItem value="Hindi">Hindi</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth sx={styles.input}>
            <InputLabel>Level</InputLabel>
            <Select
              name="level"
              value={formData.level}
              onChange={onChange}
              label="Level"
            >
              <MenuItem value="Beginner">Beginner</MenuItem>
              <MenuItem value="Intermediate">Intermediate</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Certificates"
            name="certificates"
            value={formData.certificates}
            onChange={onChange}
            multiline
            rows={2}
            sx={styles.input}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default BasicInfoStep;
