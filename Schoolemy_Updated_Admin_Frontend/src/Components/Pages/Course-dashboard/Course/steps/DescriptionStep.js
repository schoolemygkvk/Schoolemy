import React from "react";
import {
  Paper,
  TextField,
  Typography,
  Avatar,
  Grid,
  Button,
  Chip,
  Box,
} from "@mui/material";
import { AddCircle, RemoveCircle } from "@mui/icons-material";

const DescriptionStep = ({
  formData,
  whatYoullLearnInput,
  onDescriptionChange,
  onWhatYoullLearnChange,
  onAddWhatYoullLearn,
  onRemoveWhatYoullLearn,
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
    input: { mb: 2 },
    learnBox: { mt: 2, p: 2, bgcolor: "white", borderRadius: "8px" },
  };

  return (
    <Paper sx={styles.section}>
      <Typography sx={styles.sectionTitle}>
        <Avatar sx={{ bgcolor: "#8b5cf6", mr: 2 }}>2</Avatar>
        Course Description
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Course Description *"
            name="description"
            value={formData.description}
            onChange={onDescriptionChange}
            multiline
            rows={6}
            required
            sx={styles.input}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            What You'll Learn
          </Typography>
          <Box sx={styles.learnBox}>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Add a learning point"
                value={whatYoullLearnInput}
                onChange={(e) => onWhatYoullLearnChange(e.target.value)}
              />
              <Button
                startIcon={<AddCircle />}
                onClick={onAddWhatYoullLearn}
                variant="contained"
                size="small"
                sx={{ bgcolor: "#6366f1" }}
              >
                Add
              </Button>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {formData.whatYoullLearn?.map((item, index) => (
                <Chip
                  key={index}
                  label={item}
                  onDelete={() => onRemoveWhatYoullLearn(index)}
                  deleteIcon={<RemoveCircle />}
                  sx={{ bgcolor: "#e0e7ff", color: "#4f46e5" }}
                />
              ))}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DescriptionStep;
