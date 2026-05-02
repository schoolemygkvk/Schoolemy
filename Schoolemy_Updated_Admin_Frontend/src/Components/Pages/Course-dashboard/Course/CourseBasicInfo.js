import React from "react";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Paper,
  Grid,
  FormControlLabel,
  Checkbox,
  Avatar,
  Divider,
  Button,
} from "@mui/material";

const CourseBasicInfo = ({
  formData,
  handleChange,
  handleEmiChange,
  categories,
  levels,
  languages,
  certificateOptions,
  styles,
  handleBack,
  handleNext,
}) => {
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
            onChange={handleChange}
            required
            sx={styles.input}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FormControl fullWidth sx={styles.input}>
            <InputLabel id="category-label" shrink>
              Category *
            </InputLabel>
            <Select
              labelId="category-label"
              id="category-select"
              name="category"
              value={formData.category}
              onChange={handleChange}
              label="Category *"
              required
              displayEmpty
              renderValue={(selected) =>
                selected ? (
                  selected
                ) : (
                  <span style={{ color: "#6b7280" }}>Select category</span>
                )
              }
              sx={{
                minHeight: "56px",
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  whiteSpace: "normal",
                  lineHeight: "1.2",
                  paddingTop: "8px",
                  paddingBottom: "8px",
                },
              }}
            >
              <MenuItem value="">
                <em style={{ color: "#6b7280" }}>Select category</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth sx={styles.input}>
            <InputLabel>Course Duration *</InputLabel>
            <Select
              name="courseDuration"
              value={formData.courseDuration}
              onChange={handleChange}
              label="Course Duration *"
              required
              sx={{
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 1,
                  paddingTop: "8px",
                  paddingBottom: "8px",
                },
              }}
            >
              <MenuItem value="6 months" sx={{ py: 1, px: 2 }}>
                6 months
              </MenuItem>
              <MenuItem value="1 year" sx={{ py: 1, px: 2 }}>
                12 months
              </MenuItem>
              <MenuItem value="2 years" sx={{ py: 1, px: 2 }}>
                24 months
              </MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth sx={styles.input}>
            <InputLabel>Level *</InputLabel>
            <Select
              name="level"
              value={formData.level}
              onChange={handleChange}
              label="Level *"
              required
              sx={{
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 1,
                  paddingTop: "8px",
                  paddingBottom: "8px",
                },
              }}
            >
              {levels && levels.map((level) => (
                <MenuItem key={level.value} value={level.value}>
                  {level.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth sx={styles.input}>
            <InputLabel>Language *</InputLabel>
            <Select
              name="language"
              value={formData.language}
              onChange={handleChange}
              label="Language *"
              required
              sx={{
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 1,
                  paddingTop: "8px",
                  paddingBottom: "8px",
                },
              }}
            >
              {languages && languages.map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  {lang.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth sx={styles.input}>
            <InputLabel>Certificate *</InputLabel>
            <Select
              name="certificates"
              value={formData.certificates}
              onChange={handleChange}
              label="Certificate *"
              required
              sx={{
                "& .MuiSelect-select": {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 1,
                  paddingTop: "8px",
                  paddingBottom: "8px",
                },
              }}
            >
              {certificateOptions && certificateOptions.map((cert) => (
                <MenuItem key={cert.value} value={cert.value}>
                  {cert.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControlLabel
            control={
              <Checkbox
                name="useAutoCourseMotherId"
                checked={formData.useAutoCourseMotherId}
                onChange={handleChange}
                sx={{
                  color: "#4f46e5",
                  "&.Mui-checked": { color: "#4f46e5" },
                }}
              />
            }
            label="Auto-generate CourseMotherId"
          />
          {!formData.useAutoCourseMotherId && (
            <TextField
              fullWidth
              label="Course Mother ID *"
              name="CourseMotherId"
              value={formData.CourseMotherId}
              onChange={handleChange}
              required
              disabled={formData.useAutoCourseMotherId}
              sx={styles.input}
              helperText="Leave auto-generate checked for automatic ID generation"
            />
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Price Amount (INR) *"
            name="price.amount"
            type="number"
            value={formData.price.amount}
            onChange={handleChange}
            required
            sx={styles.input}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            label="Discount (%)"
            name="price.discount"
            type="number"
            value={formData.price.discount}
            onChange={handleChange}
            sx={styles.input}
            InputProps={{ inputProps: { min: 0, max: 100 } }}
            helperText="Discount between 0-100%"
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={styles.priceDisplay}>
            <Typography variant="body2" color="text.secondary">
              Final Price
            </Typography>
            <Typography variant="h6" color="#4f46e5" fontWeight="600">
              {formData.price.currency}{" "}
              {formData.price.finalPrice.toFixed(2)}
            </Typography>
          </Box>
        </Grid>

        {/* Price Breakdown Section */}
        <Grid item xs={12}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: "#f8f9fa",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{ fontWeight: 600, color: "#3730a3", mb: 2 }}
            >
              Price Breakdown (All-Inclusive)
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Course Value
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    ₹
                    {formData.price.breakdown?.courseValue?.toFixed(2) ||
                      "0.00"}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    CGST (9%)
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    ₹
                    {formData.price.breakdown?.gst?.cgst?.toFixed(2) ||
                      "0.00"}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    SGST (9%)
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    ₹
                    {formData.price.breakdown?.gst?.sgst?.toFixed(2) ||
                      "0.00"}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Transaction Fee (2%)
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    ₹
                    {formData.price.breakdown?.transactionFee?.toFixed(2) ||
                      "0.00"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ my: 1.5 }} />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Total GST (18%)
              </Typography>
              <Typography
                variant="body1"
                fontWeight="600"
                color="#4f46e5"
              >
                ₹
                {formData.price.breakdown?.gst?.total?.toFixed(2) ||
                  "0.00"}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Thumbnail & Preview Video Upload Section */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontWeight: 600, color: "#3730a3", mt: 3, mb: 2 }}
          >
            Media Files
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Course Thumbnail
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{
                py: 2,
                border: "2px dashed #4f46e5",
                color: "#4f46e5",
                "&:hover": {
                  backgroundColor: "#f3f4f6",
                  borderColor: "#4f46e5",
                },
              }}
            >
              Upload Thumbnail
              <input
                type="file"
                name="thumbnailFile"
                hidden
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleChange(e);
                  }
                }}
              />
            </Button>
            {formData.thumbnail && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: "#e0e7ff", borderRadius: 2, border: "1px solid #c7d2fe" }}>
                {typeof formData.thumbnail === "string" ? (
                  <>
                    <Typography variant="caption" sx={{ color: "#4f46e5", fontWeight: 600 }}>
                      ✅ Uploaded to S3
                    </Typography>
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        marginTop: "12px",
                        borderRadius: "8px",
                        display: "block",
                      }}
                    />
                  </>
                ) : (
                  <>
                    <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
                      📄 Selected: {formData.thumbnail.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#9ca3af", display: "block", mt: 0.5 }}>
                      Will be uploaded to S3 when you submit the form
                    </Typography>
                    <img
                      src={URL.createObjectURL(formData.thumbnail)}
                      alt="Thumbnail preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        marginTop: "12px",
                        borderRadius: "8px",
                        border: "2px solid #a5b4fc",
                        display: "block",
                      }}
                    />
                  </>
                )}
              </Box>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
              Preview Video
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{
                py: 2,
                border: "2px dashed #4f46e5",
                color: "#4f46e5",
                "&:hover": {
                  backgroundColor: "#f3f4f6",
                  borderColor: "#4f46e5",
                },
              }}
            >
              Upload Preview Video
              <input
                type="file"
                name="previewvideoFile"
                hidden
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleChange(e);
                  }
                }}
              />
            </Button>
            {formData.previewvideo && (
              <Box sx={{ mt: 2, p: 2, backgroundColor: "#e0e7ff", borderRadius: 2, border: "1px solid #c7d2fe" }}>
                {typeof formData.previewvideo === "string" ? (
                  <Typography variant="caption" sx={{ color: "#4f46e5", fontWeight: 600 }}>
                    ✅ Uploaded to S3
                  </Typography>
                ) : (
                  <>
                    <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
                      🎬 Selected: {formData.previewvideo.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#9ca3af", display: "block", mt: 0.5 }}>
                      Will be uploaded to S3 when you submit the form
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* EMI Options Section */}
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ fontWeight: 600, color: "#3730a3" }}
        >
          EMI Options{" "}
          <span style={{ color: "#eb3815ff" }}>(required)</span>
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  name="isAvailable"
                  checked={formData.emi.isAvailable}
                  onChange={handleEmiChange}
                  sx={{
                    color: "#4f46e5",
                    "&.Mui-checked": { color: "#4f46e5" },
                  }}
                />
              }
              label="Enable EMI for this course"
            />
          </Grid>
          {formData.emi.isAvailable && (
            <>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="EMI Duration (Months) *"
                  name="emiDurationMonths"
                  type="number"
                  value={formData.emi.emiDurationMonths}
                  onChange={handleEmiChange}
                  required
                  sx={styles.input}
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Total Amount (INR) *"
                  name="totalAmount"
                  type="number"
                  value={formData.emi.totalAmount}
                  onChange={handleEmiChange}
                  required
                  sx={styles.input}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Monthly Amount (INR) *"
                  name="monthlyAmount"
                  type="number"
                  value={formData.emi.monthlyAmount}
                  onChange={handleEmiChange}
                  required
                  sx={styles.input}
                  InputProps={{ inputProps: { min: 0 } }}
                  helperText="Auto-calculated from total amount and duration"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.emi.notes}
                  onChange={handleEmiChange}
                  multiline
                  rows={2}
                  sx={styles.input}
                />
              </Grid>
            </>
          )}
        </Grid>
      </Box>

      <Box sx={styles.navigation}>
        <div></div>
        <Button onClick={handleNext} sx={styles.buttonPrimary}>
          Next: Description
        </Button>
      </Box>
    </Paper>
  );
};

export default CourseBasicInfo;
