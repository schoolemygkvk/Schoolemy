import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useCourseForm } from "./hooks/useCourseForm";
import { fetchCourseData, updateCourse, parseMediaFiles } from "./utils/courseApi";
import { updatePriceBreakdown, calculateEmiMonthly } from "./utils/priceCalculations";
import BasicInfoStep from "./steps/BasicInfoStep";
import DescriptionStep from "./steps/DescriptionStep";
import ContentStep from "./steps/ContentStep";
import ReviewStep from "./steps/ReviewStep";

const categories = [
  "Yoga", "Siddha Medicine", "Astrology", "Varma Therapy", "Ayurveda",
  "Pain Management", "Technology", "Business", "Personal Development",
  "Creative Arts", "Health & Wellness", "Academic", "Language Learning",
  "Career Development",
];

const EditCourse = () => {
  const { coursename } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploadProgress, setUploadProgress] = useState({
    show: false,
    file: "",
    percent: 0,
  });

  const steps = ["Basic Information", "Description", "Course Content", "Review & Save"];

  const form = useCourseForm({});

  useEffect(() => {
    loadCourseData();
  }, [coursename]);

  const loadCourseData = async () => {
    try {
      setCourseLoading(true);
      const courseData = await fetchCourseData(coursename);
      const parsedChapters = parseMediaFiles(courseData.chapters);

      form.setFormData({
        coursename: courseData.coursename,
        category: courseData.category,
        courseduration: courseData.courseduration,
        level: courseData.level,
        language: courseData.language,
        certificates: courseData.certificates,
        description: courseData.description,
        thumbnail: null,
        previewVideo: null,
        price: courseData.price,
        contentduration: courseData.contentduration,
        whatYoullLearn: courseData.whatYoullLearn || [],
        chapters: parsedChapters,
        emi: courseData.emi,
      });
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setCourseLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const validateStep = (step) => {
    const { formData } = form;

    if (step === 0) {
      if (!formData.coursename?.trim()) {
        showMessage("error", "Course name is required");
        return false;
      }
      if (!formData.category) {
        showMessage("error", "Category is required");
        return false;
      }
      if (!formData.courseduration) {
        showMessage("error", "Course duration is required");
        return false;
      }
    }

    if (step === 1) {
      if (!formData.description?.trim()) {
        showMessage("error", "Description is required");
        return false;
      }
    }

    if (step === 2) {
      if (!formData.chapters || formData.chapters.length === 0) {
        showMessage("error", "At least one chapter is required");
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!validateStep(activeStep)) {
        setIsLoading(false);
        return;
      }

      let courseData = { ...form.formData };
      courseData = updatePriceBreakdown(courseData);

      if (courseData.emi.isAvailable) {
        const emiData = calculateEmiMonthly(courseData);
        courseData.emi = { ...courseData.emi, ...emiData };
      }

      await updateCourse(coursename, courseData, form.filesToUpload, form.filesToDelete);
      showMessage("success", "Course updated successfully!");

      setTimeout(() => {
        navigate("/schoolemy/view-courses");
      }, 2000);
    } catch (error) {
      showMessage("error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    if (courseLoading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (activeStep) {
      case 0:
        return (
          <BasicInfoStep
            formData={form.formData}
            categories={categories}
            onChange={form.handlers.handleChange}
          />
        );
      case 1:
        return (
          <DescriptionStep
            formData={form.formData}
            whatYoullLearnInput={form.whatYoullLearnInput}
            onDescriptionChange={form.handlers.handleChange}
            onWhatYoullLearnChange={(value) => form.setWhatYoullLearnInput(value)}
            onAddWhatYoullLearn={form.handlers.handleWhatYoullLearn}
            onRemoveWhatYoullLearn={form.handlers.removeWhatYoullLearn}
          />
        );
      case 2:
        return (
          <ContentStep
            formData={form.formData}
            onChapterChange={form.handlers.handleChapterChange}
            onAddChapter={form.handlers.addNewChapter}
            onRemoveChapter={form.handlers.removeChapter}
            onAddLesson={form.handlers.addNewLesson}
            onRemoveLesson={form.handlers.removeLesson}
          />
        );
      case 3:
        return <ReviewStep formData={form.formData} categories={categories} />;
      default:
        return null;
    }
  };

  const styles = {
    container: { maxWidth: 1200, mx: "auto", p: 3 },
    header: { mb: 3, color: "#1f2937", fontWeight: "bold" },
    stepper: { mb: 4 },
    actions: {
      display: "flex",
      justifyContent: "space-between",
      mt: 4,
      gap: 2,
    },
    button: {
      px: 3,
      py: 1.2,
      borderRadius: "8px",
      fontSize: "1rem",
      fontWeight: "600",
      textTransform: "none",
    },
  };

  return (
    <Box sx={styles.container}>
      <Button
        onClick={() => navigate(-1)}
        startIcon={<ArrowBack />}
        sx={{ ...styles.button, mb: 2, color: "#6366f1" }}
      >
        Back
      </Button>

      <Typography variant="h4" sx={styles.header}>
        Edit Course: {coursename}
      </Typography>

      <Stepper activeStep={activeStep} sx={styles.stepper}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent()}

      <Box sx={styles.actions}>
        <Button
          variant="outlined"
          disabled={activeStep === 0 || isLoading}
          onClick={handleBack}
          sx={{ ...styles.button, color: "#6b7280" }}
        >
          Back
        </Button>

        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={isLoading}
            sx={{ ...styles.button, bgcolor: "#10b981" }}
          >
            {isLoading ? "Saving..." : "Save Course"}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            sx={{ ...styles.button, bgcolor: "#6366f1" }}
          >
            Next
          </Button>
        )}
      </Box>

      <Snackbar
        open={!!message.text}
        autoHideDuration={4000}
        onClose={() => setMessage({ type: "", text: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={message.type}
          onClose={() => setMessage({ type: "", text: "" })}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditCourse;
