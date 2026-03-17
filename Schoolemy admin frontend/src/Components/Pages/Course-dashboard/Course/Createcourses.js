import React, { useState, useEffect } from "react";
import axios from "../../../../Utils/api";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  Paper,
  Grid,
  IconButton,
  FormControlLabel,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Card,
  Divider,
  Avatar,
  Alert,
  Chip,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import {
  AddCircle,
  RemoveCircle,
  CloudUpload,
  VideoLibrary,
  Image,
  ArrowBack,
  Info,
  Person,
  Description,
  AttachMoney,
  CreditCard,
  MenuBook,
  CheckCircle,
  Image as ImageIcon,
  VideoFile,
  AudioFile,
  PictureAsPdf,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const CreateCourses = () => {
  // Clear cache and reset form handler
  const handleClear = () => {
    localStorage.removeItem(FORM_CACHE_KEY);
    localStorage.removeItem(CHAPTERS_CACHE_KEY);
    setFormData(initialFormData);
    setChapters(initialChapters);
    setWhatYoullLearnInput("");
    setActiveStep(0);
    // Show success message briefly then auto-clear
    setMessage({ type: "success", text: "Form and cache cleared." });
    setTimeout(() => setMessage({ type: "", text: "" }), 1000);
  };
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    "Basic Information",
    "Description",
    "Instructor",
    "Content",
    "Review",
  ];

  // Cache keys
  const FORM_CACHE_KEY = "courseDashboardFormData";
  const CHAPTERS_CACHE_KEY = "courseDashboardChapters";

  // Initial states
  const initialFormData = {
    CourseMotherId: "",
    useAutoCourseMotherId: true,
    coursename: "",
    category: "",
    courseduration: "6 months",
    contentduration: { hours: 0, minutes: 0 },
    price: {
      amount: 0,
      currency: "INR",
      discount: 0,
      finalPrice: 0,
      breakdown: {
        courseValue: 0,
        gst: {
          cgst: 0,
          sgst: 0,
          total: 0,
        },
        transactionFee: 0,
      },
    },
    level: "beginner",
    language: "english",
    certificates: "yes",
    description: "",
    whatYoullLearn: [],
    thumbnail: null,
    previewVideo: null,
    instructor: {
      name: "",
      role: "",
      socialmedia_id: "",
    },
    emi: {
      isAvailable: false,
      emiDurationMonths: "",
      monthlyAmount: "",
      totalAmount: "",
      notes: "",
    },
  };
  const initialChapters = [
    {
      title: "",
      lessons: [
        {
          lessonname: "",
          audio: [],
          video: [],
          pdf: [],
        },
      ],
    },
  ];

  // Load cache on mount
  const [formData, setFormData] = useState(() => {
    const cached = localStorage.getItem(FORM_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // File objects can't be cached, so ignore thumbnail/previewVideo
        parsed.thumbnail = null;
        parsed.previewVideo = null;

        // Ensure breakdown exists
        if (!parsed.price.breakdown) {
          parsed.price.breakdown = {
            courseValue: 0,
            gst: {
              cgst: 0,
              sgst: 0,
              total: 0,
            },
            transactionFee: 0,
          };
        }
        return parsed;
      } catch {
        return initialFormData;
      }
    }
    return initialFormData;
  });

  const [chapters, setChapters] = useState(() => {
    const cached = localStorage.getItem(CHAPTERS_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        return initialChapters;
      }
    }
    return initialChapters;
  });

  const [whatYoullLearnInput, setWhatYoullLearnInput] = useState("");

  // Cache formData and chapters on change
  useEffect(() => {
    // Don't cache File objects
    const cacheForm = { ...formData, thumbnail: null, previewVideo: null };
    localStorage.setItem(FORM_CACHE_KEY, JSON.stringify(cacheForm));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem(CHAPTERS_CACHE_KEY, JSON.stringify(chapters));
  }, [chapters]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Available categories from your backend model
  const categories = [
    "Yoga",
    "Siddha Medicine",
    "Astrology",
    "Varma Therapy",
    "Ayurveda",
    "Pain Management",
    "Technology",
    "Business",
    "Personal Development",
    "Creative Arts",
    "Health & Wellness",
    "Academic",
    "Language Learning",
    "Career Development",
  ];

  // Calculate final price and breakdown whenever amount or discount changes
  useEffect(() => {
    const amount = parseFloat(formData.price.amount) || 0;
    const discount = parseFloat(formData.price.discount) || 0;

    // 1) Final price after discount (before GST & transaction fee)
    const finalPrice = amount * (1 - discount / 100);

    // 2) GST + transaction fee on the discounted price
    const courseValue = finalPrice; // e.g. 12000 @ 10% → 10800
    const cgst = courseValue * 0.09; // 9% CGST
    const sgst = courseValue * 0.09; // 9% SGST
    const gstTotal = cgst + sgst; // 18% total GST
    // Transaction Fee = 2% of (Course Value + CGST + SGST)
    const subtotalWithGst = courseValue + cgst + sgst;
    const transactionFee = subtotalWithGst * 0.02;

    const totalWithCharges = courseValue + gstTotal + transactionFee;

    setFormData((prev) => ({
      ...prev,
      price: {
        ...prev.price,
        finalPrice: parseFloat(finalPrice.toFixed(2)),
        breakdown: {
          courseValue: parseFloat(courseValue.toFixed(2)),
          gst: {
            cgst: parseFloat(cgst.toFixed(2)),
            sgst: parseFloat(sgst.toFixed(2)),
            total: parseFloat(gstTotal.toFixed(2)),
          },
          transactionFee: parseFloat(transactionFee.toFixed(2)),
          totalWithCharges: parseFloat(totalWithCharges.toFixed(2)),
        },
      },
    }));
  }, [formData.price.amount, formData.price.discount]);

  // Function to parse course duration to months
  const parseDurationToMonths = (duration) => {
    if (duration === "6 months") return 6;
    if (duration === "1 year") return 12;
    if (duration === "2 years") return 24;
    return 0;
  };

  // Auto-calculate EMI details based on final price and course duration
  useEffect(() => {
    if (formData.emi.isAvailable) {
      const months = parseDurationToMonths(formData.courseduration);
      const finalPrice = formData.price.finalPrice;

      setFormData((prev) => ({
        ...prev,
        emi: {
          ...prev.emi,
          emiDurationMonths: months,
          totalAmount: finalPrice,
          monthlyAmount: months > 0 ? Math.round(finalPrice / months) : 0,
        },
      }));
    }
  }, [
    formData.price.finalPrice,
    formData.courseduration,
    formData.emi.isAvailable,
  ]);

  const handleNext = () => {
    // Validate current step before proceeding
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        if (!formData.coursename || !formData.category) {
          showMessage("error", "Course name and category are required");
          return false;
        }
        return true;
      case 1:
        if (!formData.description) {
          showMessage("error", "Course description is required");
          return false;
        }
        return true;
      case 3:
        // Validate chapters and lessons
        for (let chapter of chapters) {
          if (!chapter.title.trim()) {
            showMessage("error", "All chapters must have a title");
            return false;
          }
          for (let lesson of chapter.lessons) {
            if (!lesson.lessonname.trim()) {
              showMessage("error", "All lessons must have a name");
              return false;
            }
          }
        }
        return true;
      default:
        return true;
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleChange = (e) => {
    const { name, value, files, checked } = e.target;

    if (name === "useAutoCourseMotherId") {
      setFormData((prev) => ({
        ...prev,
        useAutoCourseMotherId: checked,
        CourseMotherId: checked ? "" : prev.CourseMotherId,
      }));
    } else if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else if (name.startsWith("instructor.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        instructor: {
          ...prev.instructor,
          [key]: value,
        },
      }));
    } else if (name.startsWith("contentduration.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        contentduration: {
          ...prev.contentduration,
          [key]: parseInt(value) || 0,
        },
      }));
    } else if (name.startsWith("price.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        price: {
          ...prev.price,
          [key]:
            key === "amount" || key === "discount"
              ? parseFloat(value) || 0
              : value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleWhatYoullLearn = () => {
    if (whatYoullLearnInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        whatYoullLearn: [...prev.whatYoullLearn, whatYoullLearnInput.trim()],
      }));
      setWhatYoullLearnInput("");
    }
  };

  const removeWhatYoullLearn = (index) => {
    setFormData((prev) => ({
      ...prev,
      whatYoullLearn: prev.whatYoullLearn.filter((_, i) => i !== index),
    }));
  };

  const handleEmiChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      emi: {
        ...prev.emi,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const handleChapterChange = (index, e) => {
    const newChapters = [...chapters];
    newChapters[index][e.target.name] = e.target.value;
    setChapters(newChapters);
  };

  const handleLessonChange = (chapterIndex, lessonIndex, e) => {
    const { name, value, files } = e.target;
    const newChapters = [...chapters];
    const lesson = newChapters[chapterIndex].lessons[lessonIndex];

    if (files && files.length > 0) {
      // Append new files to existing files instead of replacing
      const existingFiles = Array.isArray(lesson[name]) ? lesson[name] : [];
      lesson[name] = [...existingFiles, ...Array.from(files)];
    } else {
      lesson[name] = value;
    }

    setChapters(newChapters);
  };

  const handleRemoveLessonFile = (
    chapterIndex,
    lessonIndex,
    fileType,
    fileIndex,
  ) => {
    const newChapters = [...chapters];
    const lesson = newChapters[chapterIndex].lessons[lessonIndex];
    const files = Array.isArray(lesson[fileType]) ? [...lesson[fileType]] : [];
    if (files.length > fileIndex) {
      files.splice(fileIndex, 1);
      lesson[fileType] = files;
      setChapters(newChapters);
    }
  };

  const addChapter = () => {
    setChapters([
      ...chapters,
      {
        title: "",
        lessons: [
          {
            lessonname: "",
            audio: [],
            video: [],
            pdf: [],
          },
        ],
      },
    ]);
  };

  const removeChapter = (index) => {
    if (chapters.length > 1) {
      setChapters(chapters.filter((_, i) => i !== index));
    }
  };

  const addLesson = (chapterIndex) => {
    const newChapters = [...chapters];
    newChapters[chapterIndex].lessons.push({
      lessonname: "",
      audio: [],
      video: [],
      pdf: [],
    });
    setChapters(newChapters);
  };

  const removeLesson = (chapterIndex, lessonIndex) => {
    const newChapters = [...chapters];
    if (newChapters[chapterIndex].lessons.length > 1) {
      newChapters[chapterIndex].lessons = newChapters[
        chapterIndex
      ].lessons.filter((_, i) => i !== lessonIndex);
      setChapters(newChapters);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!validateStep(activeStep)) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");

    try {
      console.log("🚀 Starting S3 direct upload workflow...");

      // Step 1: Collect all files that need to be uploaded
      const filesToUpload = [];

      // Thumbnail
      if (formData.thumbnail instanceof File) {
        filesToUpload.push({
          file: formData.thumbnail,
          fileName: formData.thumbnail.name,
          fileType: formData.thumbnail.type,
          fileSize: formData.thumbnail.size,
          category: "thumbnail",
          customName: formData.thumbnail.name,
        });
      }

      // Preview video
      if (formData.previewVideo instanceof File) {
        filesToUpload.push({
          file: formData.previewVideo,
          fileName: formData.previewVideo.name,
          fileType: formData.previewVideo.type,
          fileSize: formData.previewVideo.size,
          category: "preview",
          customName: formData.previewVideo.name,
        });
      }

      // Chapter lesson files
      chapters.forEach((chapter, cIndex) => {
        if (chapter.title && chapter.title.trim()) {
          chapter.lessons.forEach((lesson, lIndex) => {
            if (lesson.lessonname && lesson.lessonname.trim()) {
              ["audio", "video", "pdf"].forEach((fileType) => {
                const files = lesson[fileType];
                if (files && Array.isArray(files)) {
                  files.forEach((file) => {
                    if (file instanceof File) {
                      filesToUpload.push({
                        file,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                        category: fileType,
                        chapterIndex: cIndex,
                        lessonIndex: lIndex,
                        customName: file.name,
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });

      console.log(`📦 Total files to upload: ${filesToUpload.length}`);

      let uploadedFilesMap = {};

      // Step 2: Only request presigned URLs if there are files to upload
      if (filesToUpload.length > 0) {
        showMessage(
          "info",
          `Preparing to upload ${filesToUpload.length} file(s)...`,
        );

        // Get presigned URLs from backend
        const urlResponse = await axios.post(
          "/api/courses/generate-upload-urls",
          {
            courseName: formData.coursename,
            files: filesToUpload.map(({ file, ...rest }) => rest), // Don't send file objects
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        console.log(
          `✅ Received ${urlResponse.data.data.length} presigned URLs`,
        );

        // Step 3: Upload files directly to S3
        const uploadPromises = urlResponse.data.data.map(
          async (urlData, index) => {
            const fileInfo = filesToUpload[index];
            console.log(`⬆️ Uploading ${fileInfo.fileName} to S3...`);

            try {
              const body = await fileInfo.file.arrayBuffer();
              const response = await fetch(urlData.uploadUrl, {
                method: "PUT",
                body,
                headers: { "Content-Type": "application/octet-stream" },
              });

              if (!response.ok) {
                throw new Error(
                  `S3 upload failed: ${response.status} ${response.statusText}`,
                );
              }

              console.log(`✅ Successfully uploaded: ${fileInfo.fileName}`);

              // Map the uploaded file to its S3 URL
              const key = `${urlData.category}_${urlData.chapterIndex}_${urlData.lessonIndex}`;
              if (!uploadedFilesMap[key]) {
                uploadedFilesMap[key] = [];
              }
              uploadedFilesMap[key].push({
                name: fileInfo.fileName,
                url: urlData.s3Url,
              });

              // Handle thumbnail and preview separately
              if (urlData.category === "thumbnail") {
                uploadedFilesMap.thumbnail = urlData.s3Url;
              }
              if (urlData.category === "preview") {
                if (!uploadedFilesMap.previewVideo) {
                  uploadedFilesMap.previewVideo = [];
                }
                uploadedFilesMap.previewVideo.push({
                  name: fileInfo.fileName,
                  url: urlData.s3Url,
                });
              }

              return { success: true, url: urlData.s3Url };
            } catch (uploadErr) {
              console.error(
                `❌ Failed to upload ${fileInfo.fileName}:`,
                uploadErr,
              );
              throw new Error(`Failed to upload ${fileInfo.fileName}`);
            }
          },
        );

        showMessage("info", "Uploading files to S3...");
        await Promise.all(uploadPromises);
        console.log("✅ All files uploaded to S3 successfully");
      }

      // Step 4: Prepare course data with S3 URLs
      showMessage("info", "Saving course metadata...");

      const courseData = {
        coursename: formData.coursename,
        category: formData.category,
        courseduration: formData.courseduration,
        CourseMotherId: formData.CourseMotherId,
        useAutoCourseMotherId: formData.useAutoCourseMotherId,
        thumbnail: uploadedFilesMap.thumbnail || formData.thumbnail || "",
        previewVideo: uploadedFilesMap.previewVideo || [],
        contentduration: formData.contentduration,
        price: {
          amount: formData.price.amount,
          currency: formData.price.currency,
          discount: formData.price.discount,
        },
        level: formData.level,
        language: formData.language,
        certificates: formData.certificates,
        description: formData.description,
        whatYoullLearn: formData.whatYoullLearn,
        instructor: formData.instructor,
        emi: formData.emi,
        chapters: chapters
          .filter((ch) => ch.title && ch.title.trim())
          .map((chapter, cIndex) => ({
            title: chapter.title,
            lessons: chapter.lessons
              .filter((lesson) => lesson.lessonname && lesson.lessonname.trim())
              .map((lesson, lIndex) => {
                const audioKey = `audio_${cIndex}_${lIndex}`;
                const videoKey = `video_${cIndex}_${lIndex}`;
                const pdfKey = `pdf_${cIndex}_${lIndex}`;

                return {
                  lessonname: lesson.lessonname,
                  audioFile: uploadedFilesMap[audioKey] || [],
                  videoFile: uploadedFilesMap[videoKey] || [],
                  pdfFile: uploadedFilesMap[pdfKey] || [],
                };
              }),
          })),
      };

      console.log("📤 Sending course data to backend...");

      // Step 5: Create course with S3 URLs (lightweight API call)
      const response = await axios.post(
        "/api/courses/create-with-s3-urls",
        courseData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("✅ Course creation response:", response.data);

      showMessage("success", "Course created successfully!");
      // Clear cache after successful save
      localStorage.removeItem(FORM_CACHE_KEY);
      localStorage.removeItem(CHAPTERS_CACHE_KEY);
      resetForm();
    } catch (err) {
      console.error("❌ Error creating course:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to create course";
      showMessage("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setChapters(initialChapters);
    setWhatYoullLearnInput("");
    setActiveStep(0);
    // Also clear cache
    localStorage.removeItem(FORM_CACHE_KEY);
    localStorage.removeItem(CHAPTERS_CACHE_KEY);
  };

  // Custom styles
  const styles = {
    container: {
      padding: "2rem",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
      minHeight: "100vh",
    },
    header: {
      textAlign: "center",
      marginBottom: "2.5rem",
      color: "#312e81",
      fontWeight: 700,
      fontSize: "2.5rem",
      background: "linear-gradient(90deg, #6366f1, #a21caf 80%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    stepper: {
      marginBottom: "3rem",
      padding: "1.5rem",
      borderRadius: "12px",
      backgroundColor: "rgba(236, 233, 254, 0.9)",
      boxShadow: "0 4px 20px rgba(99, 102, 241, 0.08)",
    },
    section: {
      padding: "2.5rem",
      marginBottom: "2.5rem",
      borderRadius: "16px",
      backgroundColor: "#f3f4f6",
      boxShadow: "0 10px 30px rgba(99, 102, 241, 0.07)",
      border: "1px solid #c7d2fe",
    },
    sectionTitle: {
      marginBottom: "2rem",
      fontWeight: 600,
      color: "#3730a3",
      fontSize: "1.5rem",
      display: "flex",
      alignItems: "center",
      paddingBottom: "0.75rem",
      borderBottom: "2px solid #a5b4fc",
    },
    input: {
      borderRadius: "10px",
      "& .MuiOutlinedInput-root": {
        borderRadius: "10px",
        backgroundColor: "#f8fafc",
        "&:hover fieldset": {
          borderColor: "#818cf8",
        },
        "&.Mui-focused fieldset": {
          borderColor: "#a21caf",
        },
      },
    },
    fileUpload: {
      border: "2px dashed #a5b4fc",
      borderRadius: "12px",
      padding: "1.5rem",
      textAlign: "center",
      transition: "all 0.3s ease",
      backgroundColor: "#f8fafc",
      cursor: "pointer",
      "&:hover": {
        borderColor: "#a21caf",
        backgroundColor: "#ede9fe",
      },
    },
    chip: {
      borderRadius: "8px",
      backgroundColor: "#c7d2fe",
      color: "#312e81",
      fontWeight: 500,
      "& .MuiChip-deleteIcon": {
        color: "#818cf8",
        "&:hover": {
          color: "#a21caf",
        },
      },
    },
    chapterCard: {
      padding: "1.5rem",
      marginBottom: "1.5rem",
      borderRadius: "12px",
      backgroundColor: "#f8fafc",
      border: "1px solid #a5b4fc",
    },
    lessonCard: {
      padding: "1.5rem",
      marginBottom: "1rem",
      borderRadius: "10px",
      backgroundColor: "#fff",
      border: "1px solid #c7d2fe",
      position: "relative",
    },
    buttonPrimary: {
      borderRadius: "10px",
      padding: "0.75rem 2rem",
      fontWeight: 600,
      textTransform: "none",
      fontSize: "1rem",
      background: "linear-gradient(90deg, #6366f1, #a21caf 80%)",
      color: "#fff",
      boxShadow: "0 4px 6px rgba(99, 102, 241, 0.15)",
      "&:hover": {
        background: "linear-gradient(90deg, #a21caf, #6366f1 80%)",
        boxShadow: "0 6px 8px rgba(99, 102, 241, 0.22)",
        transform: "translateY(-2px)",
      },
      "&:disabled": {
        background: "#cbd5e0",
        transform: "none",
        boxShadow: "none",
      },
    },
    buttonSecondary: {
      borderRadius: "10px",
      padding: "0.75rem 2rem",
      fontWeight: 600,
      textTransform: "none",
      fontSize: "1rem",
      color: "#a21caf",
      borderColor: "#a5b4fc",
      backgroundColor: "#f3e8ff",
      "&:hover": {
        borderColor: "#6366f1",
        backgroundColor: "#ede9fe",
      },
    },
    priceDisplay: {
      padding: "1rem",
      borderRadius: "10px",
      backgroundColor: "#f0f9ff",
      border: "1px solid #a5b4fc",
      textAlign: "center",
      marginTop: "1rem",
    },
    navigation: {
      display: "flex",
      justifyContent: "space-between",
      marginTop: "2.5rem",
    },
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
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
                        <span style={{ color: "#6b7280" }}>
                          Select category
                        </span>
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
                    name="courseduration"
                    value={formData.courseduration}
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

              <Grid item xs={12} md={8}>
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
                  //InputProps={{ inputProps: { min: 0 } }}
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
                    💰 Price Breakdown (All-Inclusive)
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
                          {formData.price.breakdown?.transactionFee?.toFixed(
                            2,
                          ) || "0.00"}
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

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={styles.input}>
                  <InputLabel>Level *</InputLabel>
                  <Select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    label="Level *"
                    required
                  >
                    <MenuItem value="beginner">Beginner</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
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
                  >
                    <MenuItem value="english">English</MenuItem>
                    <MenuItem value="tamil">Tamil</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={styles.input}>
                  <InputLabel>Certificates *</InputLabel>
                  <Select
                    name="certificates"
                    value={formData.certificates}
                    onChange={handleChange}
                    label="Certificates *"
                    required
                  >
                    <MenuItem value="yes">Yes</MenuItem>
                    <MenuItem value="no">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontWeight: 500 }}
                  >
                    Content Duration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Hours"
                        name="contentduration.hours"
                        type="number"
                        value={formData.contentduration.hours}
                        onChange={handleChange}
                        sx={styles.input}
                        InputProps={{ inputProps: { min: 0 } }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Minutes"
                        name="contentduration.minutes"
                        type="number"
                        value={formData.contentduration.minutes}
                        onChange={handleChange}
                        sx={styles.input}
                        InputProps={{ inputProps: { min: 0, max: 59 } }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography
                    variant="subtitle1"
                    gutterBottom
                    sx={{ fontWeight: 500 }}
                  >
                    Media Files
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={styles.fileUpload}>
                        <Image color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Thumbnail
                        </Typography>
                        <input
                          type="file"
                          name="thumbnail"
                          onChange={handleChange}
                          accept="image/*"
                          style={{ display: "none" }}
                          id="thumbnail-upload"
                        />
                        <label htmlFor="thumbnail-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUpload />}
                          >
                            Upload
                          </Button>
                        </label>
                        {formData.thumbnail && (
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{ mt: 1, color: "success.main" }}
                          >
                            Selected: {formData.thumbnail.name}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Box sx={styles.fileUpload}>
                        <VideoLibrary
                          color="primary"
                          sx={{ fontSize: 40, mb: 1 }}
                        />
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          Preview Video
                        </Typography>
                        <input
                          type="file"
                          name="previewVideo"
                          onChange={handleChange}
                          accept="video/*"
                          style={{ display: "none" }}
                          id="video-upload"
                        />
                        <label htmlFor="video-upload">
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUpload />}
                          >
                            Upload
                          </Button>
                        </label>
                        {formData.previewVideo && (
                          <Typography
                            variant="caption"
                            display="block"
                            sx={{ mt: 1, color: "success.main" }}
                          >
                            Selected: {formData.previewVideo.name}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>

            <Box sx={styles.navigation}>
              <div></div>
              <Button onClick={handleNext} sx={styles.buttonPrimary}>
                Next: Description
              </Button>
            </Box>
          </Paper>
        );

      case 1:
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

      case 2:
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

      case 3:
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
                      name="lessonname"
                      value={lesson.lessonname}
                      onChange={(e) => handleLessonChange(cIndex, lIndex, e)}
                      sx={{ ...styles.input, mb: 2, width: "60%" }}
                      required
                    />

                    <Grid container spacing={2}>
                      {["audio", "video", "pdf"].map((type) => (
                        <Grid item xs={12} md={4} key={type}>
                          <Box sx={styles.fileUpload}>
                            <Typography
                              variant="body2"
                              sx={{
                                mb: 1,
                                textTransform: "uppercase",
                                fontWeight: 500,
                              }}
                            >
                              {type} Files
                            </Typography>
                            <input
                              type="file"
                              name={type}
                              multiple
                              onChange={(e) =>
                                handleLessonChange(cIndex, lIndex, e)
                              }
                              accept={
                                type === "pdf" ? "application/pdf" : `${type}/*`
                              }
                              style={{ display: "none" }}
                              id={`${type}-${cIndex}-${lIndex}`}
                            />
                            <label htmlFor={`${type}-${cIndex}-${lIndex}`}>
                              <Button
                                variant="outlined"
                                component="span"
                                startIcon={<CloudUpload />}
                              >
                                Upload
                              </Button>
                            </label>
                            {lesson[type] && lesson[type].length > 0 && (
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
                                  {lesson[type].map((file, fIndex) => {
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
                                            type,
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
                                  {lesson[type].length} file(s) selected
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

      case 4:
        const totalLessons = chapters.reduce(
          (acc, chapter) => acc + chapter.lessons.length,
          0,
        );
        const contentDurationText = `${formData.contentduration.hours || 0}h ${formData.contentduration.minutes || 0}m`;

        // Helper function to render info row
        const InfoRow = ({ label, value, icon: Icon }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.5,
              py: 1.5,
              borderBottom: "1px solid #e5e7eb",
              "&:last-child": { borderBottom: "none" },
            }}
          >
            {Icon && (
              <Icon
                sx={{
                  color: "#6366f1",
                  fontSize: "1.2rem",
                  mt: 0.25,
                  flexShrink: 0,
                }}
              />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="caption"
                sx={{
                  color: "#6b7280",
                  fontWeight: 500,
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: "0.5px",
                  display: "block",
                  mb: 0.5,
                }}
              >
                {label}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#111827",
                  fontWeight: 500,
                  wordBreak: "break-word",
                }}
              >
                {value || (
                  <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
                    Not provided
                  </span>
                )}
              </Typography>
            </Box>
          </Box>
        );

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
              {/* Basic Information */}
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
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
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
                      sx={{ fontWeight: 600, color: "white", fontSize: "1rem" }}
                    >
                      Basic Information
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, width: "100%" }}>
                    <Grid
                      container
                      spacing={2}
                      sx={{ width: "100%", margin: 0 }}
                    >
                      <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
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
                            Course Name
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
                            {formData.coursename || (
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
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
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
                            Category
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#111827",
                              fontWeight: 500,
                              width: "100%",
                            }}
                          >
                            {formData.category || (
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
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
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
                            Course Mother ID
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#111827",
                              fontWeight: 500,
                              width: "100%",
                            }}
                          >
                            {!formData.useAutoCourseMotherId &&
                            formData.CourseMotherId ? (
                              formData.CourseMotherId
                            ) : formData.useAutoCourseMotherId ? (
                              "Auto-generated"
                            ) : (
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
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
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
                            Duration
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#111827",
                              fontWeight: 500,
                              width: "100%",
                            }}
                          >
                            {formData.courseduration || (
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
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
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
                            Content Duration
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#111827",
                              fontWeight: 500,
                              width: "100%",
                            }}
                          >
                            {contentDurationText}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
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
                            Level
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#111827",
                              fontWeight: 500,
                              width: "100%",
                            }}
                          >
                            {formData.level || (
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
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
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
                            Language
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#111827",
                              fontWeight: 500,
                              width: "100%",
                            }}
                          >
                            {formData.language || (
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
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
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
                            Certificates
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#111827",
                              fontWeight: 500,
                              width: "100%",
                            }}
                          >
                            {formData.certificates || (
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
                      </Grid>
                      <Grid item xs={12} sx={{ width: "100%" }}>
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
                          <Grid
                            container
                            spacing={1.5}
                            sx={{ width: "100%", margin: 0 }}
                          >
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
                      </Grid>
                    </Grid>
                  </Box>
                </Card>
              </Grid>

              {/* Instructor Information */}
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
                      background:
                        "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
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
                      sx={{ fontWeight: 600, color: "white", fontSize: "1rem" }}
                    >
                      Instructor
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, width: "100%" }}>
                    <Grid
                      container
                      spacing={2}
                      sx={{ width: "100%", margin: 0 }}
                    >
                      <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
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
                            Name
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
                            {formData.instructor.name || (
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
                      </Grid>
                      <Grid item xs={12} sm={6} sx={{ width: "100%" }}>
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
                            Role
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
                            {formData.instructor.role || (
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
                      </Grid>
                      <Grid item xs={12} sx={{ width: "100%" }}>
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
                            Social Media
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
                            {formData.instructor.socialmedia_id || (
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
                      </Grid>
                    </Grid>
                  </Box>
                </Card>
              </Grid>

              {/* Description */}
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
                      background:
                        "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      p: 2,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <Description sx={{ fontSize: "1.5rem" }} />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "white" }}
                    >
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

              {/* What You'll Learn */}
              {formData.whatYoullLearn &&
                formData.whatYoullLearn.length > 0 && (
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
                          background:
                            "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                          p: 2,
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <CheckCircle sx={{ fontSize: "1.5rem" }} />
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: "white" }}
                        >
                          What You'll Learn ({formData.whatYoullLearn.length}{" "}
                          points)
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2.5 }}>
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}
                        >
                          {formData.whatYoullLearn.map((item, index) => (
                            <Chip
                              key={index}
                              label={item}
                              icon={
                                <CheckCircle
                                  sx={{ fontSize: "1rem !important" }}
                                />
                              }
                              sx={{
                                backgroundColor: "#fef3c7",
                                color: "#92400e",
                                fontWeight: 500,
                                fontSize: "0.875rem",
                                padding: "8px 12px",
                                height: "auto",
                                borderRadius: 2,
                                border: "1px solid #fde68a",
                                "& .MuiChip-icon": {
                                  color: "#d97706",
                                },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                )}

              {/* Price Information */}
              <Grid item xs={12} md={6} sx={{ display: "flex" }}>
                <Card
                  sx={{
                    p: 0,
                    mb: 2,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
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
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                      p: 2,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <AttachMoney sx={{ fontSize: "1.5rem" }} />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "white" }}
                    >
                      Pricing Information
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2.5,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <InfoRow
                      label="Base Amount"
                      value={`${formData.price.currency} ${formData.price.amount.toFixed(2)}`}
                      icon={AttachMoney}
                    />
                    {formData.price.discount > 0 && (
                      <InfoRow
                        label="Discount"
                        value={`${formData.price.discount}%`}
                      />
                    )}
                    <Box
                      sx={{
                        mt: 2,
                        p: 2.5,
                        background:
                          "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                        borderRadius: 2,
                        border: "2px solid #10b981",
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#065f46",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          fontSize: "0.75rem",
                          letterSpacing: "1px",
                          display: "block",
                          mb: 1,
                        }}
                      >
                        Final Price
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          color: "#065f46",
                          fontWeight: 700,
                          fontSize: "2rem",
                        }}
                      >
                        {formData.price.currency}{" "}
                        {formData.price.finalPrice.toFixed(2)}
                      </Typography>
                    </Box>
                    {formData.price.breakdown && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          backgroundColor: "#f9fafb",
                          borderRadius: 2,
                          border: "1px solid #e5e7eb",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 600,
                            mb: 1.5,
                            color: "#374151",
                            fontSize: "0.875rem",
                          }}
                        >
                          Price Breakdown
                        </Typography>
                        <Grid container spacing={1.5}>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b7280", display: "block" }}
                            >
                              Course Value
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "#111827" }}
                            >
                              ₹
                              {formData.price.breakdown.courseValue?.toFixed(
                                2,
                              ) || "0.00"}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b7280", display: "block" }}
                            >
                              CGST (9%)
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "#111827" }}
                            >
                              ₹
                              {formData.price.breakdown.gst?.cgst?.toFixed(2) ||
                                "0.00"}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b7280", display: "block" }}
                            >
                              SGST (9%)
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "#111827" }}
                            >
                              ₹
                              {formData.price.breakdown.gst?.sgst?.toFixed(2) ||
                                "0.00"}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography
                              variant="caption"
                              sx={{ color: "#6b7280", display: "block" }}
                            >
                              Transaction Fee (2%)
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "#111827" }}
                            >
                              ₹
                              {formData.price.breakdown.transactionFee?.toFixed(
                                2,
                              ) || "0.00"}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "#374151" }}
                              >
                                Total GST (18%)
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: 700, color: "#6366f1" }}
                              >
                                ₹
                                {formData.price.breakdown.gst?.total?.toFixed(
                                  2,
                                ) || "0.00"}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    )}
                  </Box>
                </Card>
              </Grid>

              {/* EMI Information */}
              <Grid item xs={12} md={6} sx={{ display: "flex" }}>
                <Card
                  sx={{
                    p: 0,
                    mb: 2,
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
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
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
                      p: 2,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <CreditCard sx={{ fontSize: "1.5rem" }} />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "white" }}
                    >
                      EMI Options
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      p: 2.5,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <InfoRow
                      label="EMI Available"
                      value={formData.emi.isAvailable ? "Yes" : "No"}
                      icon={CreditCard}
                    />
                    {formData.emi.isAvailable && (
                      <>
                        <InfoRow
                          label="EMI Duration"
                          value={`${formData.emi.emiDurationMonths || 0} months`}
                        />
                        <InfoRow
                          label="Total Amount"
                          value={`${formData.price.currency} ${formData.emi.totalAmount || formData.price.finalPrice.toFixed(2)}`}
                        />
                        <InfoRow
                          label="Monthly Amount"
                          value={`${formData.price.currency} ${formData.emi.monthlyAmount || "0.00"}`}
                        />
                        {formData.emi.notes && (
                          <Box
                            sx={{
                              mt: 2,
                              p: 2,
                              backgroundColor: "#fef3c7",
                              borderRadius: 2,
                              border: "1px solid #fde68a",
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: "#92400e",
                                fontWeight: 600,
                                textTransform: "uppercase",
                                fontSize: "0.7rem",
                                letterSpacing: "0.5px",
                                display: "block",
                                mb: 1,
                              }}
                            >
                              Notes
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ color: "#78350f" }}
                            >
                              {formData.emi.notes}
                            </Typography>
                          </Box>
                        )}
                      </>
                    )}
                  </Box>
                </Card>
              </Grid>

              {/* Content Structure Summary */}
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
                      background:
                        "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                      p: 2,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <MenuBook sx={{ fontSize: "1.5rem" }} />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "white" }}
                    >
                      Content Structure Summary
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            textAlign: "center",
                            p: 2,
                            backgroundColor: "#eff6ff",
                            borderRadius: 2,
                            border: "2px solid #93c5fd",
                          }}
                        >
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 700,
                              color: "#1e40af",
                              mb: 0.5,
                            }}
                          >
                            {chapters.length}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#1e40af",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              fontSize: "0.75rem",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Total Chapters
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            textAlign: "center",
                            p: 2,
                            backgroundColor: "#f0fdf4",
                            borderRadius: 2,
                            border: "2px solid #86efac",
                          }}
                        >
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 700,
                              color: "#166534",
                              mb: 0.5,
                            }}
                          >
                            {totalLessons}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#166534",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              fontSize: "0.75rem",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Total Lessons
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box
                          sx={{
                            textAlign: "center",
                            p: 2,
                            backgroundColor: "#fef3c7",
                            borderRadius: 2,
                            border: "2px solid #fde68a",
                          }}
                        >
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 700,
                              color: "#92400e",
                              mb: 0.5,
                            }}
                          >
                            {formData.whatYoullLearn?.length || 0}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: "#92400e",
                              fontWeight: 600,
                              textTransform: "uppercase",
                              fontSize: "0.75rem",
                              letterSpacing: "0.5px",
                            }}
                          >
                            Learning Points
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Card>
              </Grid>

              {/* Detailed Chapter and Lesson Breakdown */}
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
                      background:
                        "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",
                      p: 2,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                    }}
                  >
                    <MenuBook sx={{ fontSize: "1.5rem" }} />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "white" }}
                    >
                      Detailed Content Structure
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2.5 }}>
                    {chapters.map((chapter, cIndex) => {
                      // Helper function to get file name from file object
                      const getFileName = (file) => {
                        if (typeof file === "string") return file;
                        if (file && (file.name || file.filename))
                          return file.name || file.filename;
                        if (file && file.originalname) return file.originalname;
                        return String(file);
                      };

                      return (
                        <Card
                          key={cIndex}
                          sx={{
                            p: 2.5,
                            mb: 2.5,
                            backgroundColor: "#faf5ff",
                            border: "2px solid #e9d5ff",
                            borderRadius: 2,
                            transition: "all 0.2s",
                            "&:hover": {
                              borderColor: "#c084fc",
                              boxShadow: "0 4px 12px rgba(168, 85, 247, 0.15)",
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              mb: 2,
                              pb: 1.5,
                              borderBottom: "2px solid #e9d5ff",
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: "#a855f7",
                                width: 40,
                                height: 40,
                                fontSize: "1rem",
                                fontWeight: 700,
                              }}
                            >
                              {cIndex + 1}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 700,
                                  color: "#6b21a8",
                                  fontSize: "1.1rem",
                                }}
                              >
                                {chapter.title || "Untitled Chapter"}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "#9333ea",
                                  fontWeight: 500,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  mt: 0.5,
                                }}
                              >
                                <MenuBook sx={{ fontSize: "0.875rem" }} />
                                {chapter.lessons.length} lesson
                                {chapter.lessons.length !== 1 ? "s" : ""}
                              </Typography>
                            </Box>
                          </Box>

                          {chapter.lessons.map((lesson, lIndex) => (
                            <Box
                              key={lIndex}
                              sx={{
                                ml: 1,
                                mb: 2,
                                p: 2,
                                backgroundColor: "#fff",
                                borderRadius: 2,
                                border: "1px solid #f3e8ff",
                                transition: "all 0.2s",
                                "&:hover": {
                                  borderColor: "#d8b4fe",
                                  boxShadow:
                                    "0 2px 8px rgba(168, 85, 247, 0.1)",
                                },
                                "&:last-child": { mb: 0 },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  mb: 1.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: "50%",
                                    backgroundColor: "#f3e8ff",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#9333ea",
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {lIndex + 1}
                                </Box>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 600,
                                    color: "#581c87",
                                    fontSize: "0.95rem",
                                  }}
                                >
                                  {lesson.lessonname || "Untitled Lesson"}
                                </Typography>
                              </Box>

                              {/* Audio Files */}
                              {lesson.audio && lesson.audio.length > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 600,
                                      color: "#1e40af",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      mb: 0.75,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    <AudioFile sx={{ fontSize: "0.875rem" }} />
                                    Audio Files ({lesson.audio.length})
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 0.5,
                                      ml: 2,
                                    }}
                                  >
                                    {lesson.audio.map((file, fIndex) => (
                                      <Chip
                                        key={fIndex}
                                        label={getFileName(file)}
                                        size="small"
                                        sx={{
                                          backgroundColor: "#dbeafe",
                                          color: "#1e40af",
                                          fontSize: "0.7rem",
                                          maxWidth: "280px",
                                          height: "22px",
                                          "& .MuiChip-label": {
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            padding: "0 8px",
                                          },
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}

                              {/* Video Files */}
                              {lesson.video && lesson.video.length > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 600,
                                      color: "#9f1239",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      mb: 0.75,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    <VideoFile sx={{ fontSize: "0.875rem" }} />
                                    Video Files ({lesson.video.length})
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 0.5,
                                      ml: 2,
                                    }}
                                  >
                                    {lesson.video.map((file, fIndex) => (
                                      <Chip
                                        key={fIndex}
                                        label={getFileName(file)}
                                        size="small"
                                        sx={{
                                          backgroundColor: "#fce7f3",
                                          color: "#9f1239",
                                          fontSize: "0.7rem",
                                          maxWidth: "280px",
                                          height: "22px",
                                          "& .MuiChip-label": {
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            padding: "0 8px",
                                          },
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}

                              {/* PDF Files */}
                              {lesson.pdf && lesson.pdf.length > 0 && (
                                <Box sx={{ mb: 1.5 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 600,
                                      color: "#92400e",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      mb: 0.75,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    <PictureAsPdf
                                      sx={{ fontSize: "0.875rem" }}
                                    />
                                    PDF Files ({lesson.pdf.length})
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 0.5,
                                      ml: 2,
                                    }}
                                  >
                                    {lesson.pdf.map((file, fIndex) => (
                                      <Chip
                                        key={fIndex}
                                        label={getFileName(file)}
                                        size="small"
                                        sx={{
                                          backgroundColor: "#fef3c7",
                                          color: "#92400e",
                                          fontSize: "0.7rem",
                                          maxWidth: "280px",
                                          height: "22px",
                                          "& .MuiChip-label": {
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            padding: "0 8px",
                                          },
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              )}

                              {/* Show message if no files uploaded */}
                              {(!lesson.audio || lesson.audio.length === 0) &&
                                (!lesson.video || lesson.video.length === 0) &&
                                (!lesson.pdf || lesson.pdf.length === 0) && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "#9ca3af",
                                      fontStyle: "italic",
                                      display: "block",
                                      mt: 1,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    No files uploaded for this lesson
                                  </Typography>
                                )}
                            </Box>
                          ))}
                        </Card>
                      );
                    })}
                    {chapters.length === 0 && (
                      <Box
                        sx={{
                          textAlign: "center",
                          py: 4,
                          color: "#9ca3af",
                        }}
                      >
                        <MenuBook
                          sx={{ fontSize: "3rem", mb: 1, opacity: 0.5 }}
                        />
                        <Typography
                          variant="body1"
                          sx={{ fontStyle: "italic" }}
                        >
                          No chapters added yet
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Card>
              </Grid>
            </Grid>

            <Box sx={styles.navigation}>
              <Button onClick={handleBack} sx={styles.buttonSecondary}>
                Back
              </Button>
              <Button
                type="submit"
                sx={styles.buttonPrimary}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? "Creating Course..." : "Create Course"}
              </Button>
            </Box>
          </Paper>
        );

      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={styles.container}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 3,
          width: "100%",
        }}
      >
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBack />}
          sx={{
            color: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.08)",
            "&:hover": {
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              transform: "translateX(-4px)",
            },
            transition: "all 0.3s ease",
            borderRadius: "12px",
            padding: "8px 16px",
            fontWeight: 600,
            textTransform: "none",
          }}
        >
          Back
        </Button>
        <Button
          onClick={handleClear}
          color="error"
          variant="outlined"
          aria-label="clear-course-form"
          data-testid="clear-course-form"
          sx={{
            borderRadius: "12px",
            padding: "8px 16px",
            fontWeight: 600,
            textTransform: "none",
            backgroundColor: "transparent",
            borderColor: "#ef4444",
            color: "#ef4444",
            "&:hover": {
              backgroundColor: "#ffe4e6",
              borderColor: "#dc2626",
            },
          }}
        >
          Clear Cache
        </Button>
      </Box>

      <Typography variant="h3" sx={styles.header}>
        Create New Course
      </Typography>

      <Stepper activeStep={activeStep} sx={styles.stepper}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Snackbar
        open={!!message.text}
        autoHideDuration={4000}
        onClose={() => setMessage({ type: "", text: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={message.type}
          onClose={() => setMessage({ type: "", text: "" })}
          sx={{ width: "100%" }}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateCourses;
