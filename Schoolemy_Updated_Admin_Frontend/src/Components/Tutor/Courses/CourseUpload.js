import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "../../../Utils/api";
import { secureStorage } from "../../../Utils/security";
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
  Avatar,
  Alert,
  Chip,
  CircularProgress,
  Divider,
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
  MenuBook,
  CheckCircle,
  Image as ImageIcon,
  VideoFile,
  AudioFile,
  PictureAsPdf,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const CreateCourses = () => {
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
  const FORM_CACHE_KEY = "courseUploadFormData";
  const CHAPTERS_CACHE_KEY = "courseUploadChapters";

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
  const [blobUrls, setBlobUrls] = useState({}); // Map of blob URLs for media files

  // Generate and manage blob URLs for audio, video, and PDF files
  useEffect(() => {
    const newBlobUrls = {};
    const urlsToRevoke = [];

    // Collect all existing URLs to revoke
    Object.values(blobUrls).forEach((chapterUrls) => {
      if (typeof chapterUrls === 'object') {
        Object.values(chapterUrls).forEach((lessonUrls) => {
          if (typeof lessonUrls === 'object') {
            Object.values(lessonUrls).forEach((typeUrls) => {
              if (Array.isArray(typeUrls)) {
                typeUrls.forEach((url) => urlsToRevoke.push(url));
              }
            });
          }
        });
      }
    });

    // Generate new blob URLs for all files
    chapters.forEach((chapter, cIndex) => {
      newBlobUrls[cIndex] = {};
      chapter.lessons.forEach((lesson, lIndex) => {
        const createUrlsForFiles = (files) => {
          if (!Array.isArray(files)) return [];
          return files
            .filter(f => f instanceof File || f instanceof Blob)
            .map((f) => {
              const url = URL.createObjectURL(f);
              urlsToRevoke.push(url);
              return url;
            });
        };
        newBlobUrls[cIndex][lIndex] = {
          audio: createUrlsForFiles(lesson.audio),
          video: createUrlsForFiles(lesson.video),
          pdf: createUrlsForFiles(lesson.pdf),
        };
      });
    });

    setBlobUrls(newBlobUrls);

    // Cleanup: revoke old URLs
    return () => {
      urlsToRevoke.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [chapters]);

  // Calculate final price using useMemo to avoid infinite loops
  const calculatedFinalPrice = useMemo(() => {
    const amount = parseFloat(formData.price.amount) || 0;
    const discount = parseFloat(formData.price.discount) || 0;
    return parseFloat((amount * (1 - discount / 100)).toFixed(2));
  }, [formData.price.amount, formData.price.discount]);

  // Update formData with finalPrice and breakdown
  const prevFinalPriceRef = useRef(null);
  useEffect(() => {
    // Only update if the calculated price actually changed
    if (
      prevFinalPriceRef.current === null ||
      prevFinalPriceRef.current !== calculatedFinalPrice
    ) {
      prevFinalPriceRef.current = calculatedFinalPrice;

      // Calculate breakdown
      const courseValue = calculatedFinalPrice;
      const cgst = courseValue * 0.09;
      const sgst = courseValue * 0.09;
      const gstTotal = cgst + sgst;
      // Transaction Fee = 2% of (Course Value + CGST + SGST)
      const subtotalWithGst = courseValue + cgst + sgst;
      const transactionFee = subtotalWithGst * 0.02;

      setFormData((prev) => {
        // Only update if the value actually changed
        if (prev.price.finalPrice === calculatedFinalPrice) {
          return prev;
        }
        return {
          ...prev,
          price: {
            ...prev.price,
            finalPrice: calculatedFinalPrice,
            breakdown: {
              courseValue: parseFloat(courseValue.toFixed(2)),
              gst: {
                cgst: parseFloat(cgst.toFixed(2)),
                sgst: parseFloat(sgst.toFixed(2)),
                total: parseFloat(gstTotal.toFixed(2)),
              },
              transactionFee: parseFloat(transactionFee.toFixed(2)),
            },
          },
        };
      });
    }
  }, [calculatedFinalPrice]);

  // Cache formData and chapters on change
  // Use a ref to track the previous cached value to prevent unnecessary updates
  const prevFormDataRef = useRef(null);

  useEffect(() => {
    // Create a serializable version without File objects
    const cacheForm = { ...formData, thumbnail: null, previewVideo: null };
    const cacheString = JSON.stringify(cacheForm);

    // Only cache if the data actually changed
    if (prevFormDataRef.current !== cacheString) {
      prevFormDataRef.current = cacheString;
      localStorage.setItem(FORM_CACHE_KEY, cacheString);
    }
  }, [formData]);

  useEffect(() => {
    localStorage.setItem(CHAPTERS_CACHE_KEY, JSON.stringify(chapters));
  }, [chapters]);

  // Clear cache and reset form handler
  const handleClear = () => {
    localStorage.removeItem(FORM_CACHE_KEY);
    localStorage.removeItem(CHAPTERS_CACHE_KEY);
    setFormData(initialFormData);
    setChapters(initialChapters);
    setWhatYoullLearnInput("");
    setActiveStep(0);
    // show brief confirmation then auto-clear
    setMessage({ type: "success", text: "Form and cache cleared." });
    setTimeout(() => setMessage({ type: "", text: "" }), 1000);
  };
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStarted, setUploadStarted] = useState(false);
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
            const lessonTitle = (
              lesson.lessonname ||
              lesson.lessonName ||
              ""
            ).trim();
            if (!lessonTitle) {
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
      const fileArray = Array.from(files);
      lesson[name] = fileArray;
      // store the original file names so we can send them to the server
      // use a property like audioname/videoname/pdfname
      const nameKey = `${name}name`;
      lesson[nameKey] = fileArray.map((f) => f.name).join(",");
    } else {
      lesson[name] = value;
    }

    setChapters(newChapters);
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

  // Remove a specific uploaded file from a lesson (audio/video/pdf)
  const removeUploadedFile = (
    chapterIndex,
    lessonIndex,
    fileType,
    fileIndex,
  ) => {
    const newChapters = [...chapters];
    const lesson = newChapters[chapterIndex].lessons[lessonIndex];
    if (!lesson || !lesson[fileType]) return;
    // remove file object
    lesson[fileType] = lesson[fileType].filter((_, i) => i !== fileIndex);
    // update filename list if present
    const nameKey = `${fileType}name`;
    if (lesson[nameKey]) {
      const names = lesson[nameKey]
        .split(",")
        .filter((_, i) => i !== fileIndex);
      lesson[nameKey] = names.join(",");
    }
    setChapters(newChapters);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadStarted(true);
    setUploadProgress(0);
    setMessage({ type: "", text: "" });

    if (!validateStep(activeStep)) {
      setLoading(false);
      setUploadStarted(false);
      return;
    }

    try {
      const tutorObjectId = secureStorage.getItem("_id");
      if (!tutorObjectId) {
        throw new Error("No user session found. Please log in again.");
      }

      // Step 1: Collect all files to upload
      const filesToUpload = [];

      if (formData.thumbnail && formData.thumbnail instanceof File) {
        filesToUpload.push({
          file: formData.thumbnail,
          fileName: formData.thumbnail.name,
          fileType: formData.thumbnail.type,
          fileSize: formData.thumbnail.size,
          category: "thumbnail",
          chapterIndex: -1,
          lessonIndex: -1,
          customName: formData.thumbnail.name,
        });
      }

      if (formData.previewVideo && formData.previewVideo instanceof File) {
        filesToUpload.push({
          file: formData.previewVideo,
          fileName: formData.previewVideo.name,
          fileType: formData.previewVideo.type,
          fileSize: formData.previewVideo.size,
          category: "preview",
          chapterIndex: -1,
          lessonIndex: -1,
          customName: formData.previewVideo.name,
        });
      }

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

      let uploadedFilesMap = {};

      // Step 2: Upload files to S3 via presigned URLs (bypasses API Gateway 10MB limit)
      if (filesToUpload.length > 0) {
        showMessage(
          "info",
          `Preparing to upload ${filesToUpload.length} file(s)...`,
        );

        const urlResponse = await axios.post(
          "/api/courses/generate-upload-urls",
          {
            courseName: formData.coursename,
            bucketType: "tutor",
            files: filesToUpload.map(({ file, ...rest }) => rest),
          },
        );

        if (!urlResponse.data.success || !urlResponse.data.data) {
          throw new Error(
            urlResponse.data.error || "Failed to get upload URLs",
          );
        }

        const presignedUrls = urlResponse.data.data;
        showMessage("info", "Uploading files to S3...");

        for (let i = 0; i < presignedUrls.length; i++) {
          const urlData = presignedUrls[i];
          const fileInfo = filesToUpload[i];
          // Must match ContentType used when signing (API returns the exact value)
          const contentType =
            urlData.contentType ||
            fileInfo.fileType ||
            "application/octet-stream";

          const putResponse = await fetch(urlData.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: fileInfo.file,
          });

          if (!putResponse.ok) {
            const detail = (await putResponse.text()).slice(0, 500);
            throw new Error(
              `Failed to upload ${fileInfo.fileName} (HTTP ${putResponse.status}): ${detail || putResponse.statusText}`,
            );
          }

          // Update progress bar
          const progressPercent = Math.round(
            ((i + 1) / presignedUrls.length) * 100,
          );
          setUploadProgress(progressPercent);

          const key = `${urlData.category}_${urlData.chapterIndex}_${urlData.lessonIndex}`;
          if (!uploadedFilesMap[key]) uploadedFilesMap[key] = [];
          uploadedFilesMap[key].push({
            name: fileInfo.fileName,
            url: urlData.s3Url,
          });

          if (urlData.category === "thumbnail") {
            uploadedFilesMap.thumbnail = urlData.s3Url;
          }
          if (urlData.category === "preview") {
            uploadedFilesMap.previewVideo = urlData.s3Url;
          }
        }
      }

      // Step 3: Build chapters with S3 URLs
      const chaptersWithUrls = chapters
        .filter((ch) => ch.title && ch.title.trim())
        .map((chapter, cIndex) => ({
          title: chapter.title,
          lessons: chapter.lessons
            .filter((l) => l.lessonname && l.lessonname.trim())
            .map((lesson, lIndex) => {
              const audioKey = `audio_${cIndex}_${lIndex}`;
              const videoKey = `video_${cIndex}_${lIndex}`;
              const pdfKey = `pdf_${cIndex}_${lIndex}`;
              return {
                lessonName: (lesson.lessonname && lesson.lessonname.trim()) || `Lesson ${lIndex + 1}`,
                audioFile: uploadedFilesMap[audioKey] || [],
                videoFile: uploadedFilesMap[videoKey] || [],
                pdfFile: uploadedFilesMap[pdfKey] || [],
              };
            }),
        }));

      // Step 4: Create course with S3 URLs (lightweight JSON - no 413)
      // Ensure previewvideo is a string, not an array
      let previewvideoUrl = uploadedFilesMap.previewVideo || "";
      if (Array.isArray(previewvideoUrl)) {
        previewvideoUrl = previewvideoUrl.length > 0 ? previewvideoUrl[0].url || previewvideoUrl[0] : "";
      }

      const courseData = {
        tutorObjectId,
        coursename: formData.coursename,
        category: formData.category,
        courseDuration: formData.courseduration,
        CourseMotherId: formData.CourseMotherId,
        useAutoCourseMotherId: formData.useAutoCourseMotherId,
        thumbnail: uploadedFilesMap.thumbnail || formData.thumbnail || "",
        previewvideo: previewvideoUrl,
        contentDuration: formData.contentduration,
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
        chapters: chaptersWithUrls,
      };

      const response = await axios.post(
        "/createcourses-tutors-with-s3-urls",
        courseData,
      );

      const courseStatus = response.data?.data?.status || "pending_review";
      const statusMessage =
        courseStatus === "pending_review"
          ? "✓ Course created successfully! Your course is now pending admin review and will be visible to students once approved."
          : "✓ Course created successfully!";

      setUploadProgress(100);
      showMessage("success", statusMessage);
      localStorage.removeItem(FORM_CACHE_KEY);
      localStorage.removeItem(CHAPTERS_CACHE_KEY);
      resetForm();
      setTimeout(() => {
        setUploadStarted(false);
        setUploadProgress(0);
        navigate("/schoolemy/tutor-course-list");
      }, 3000);
    } catch (err) {
      console.error("Error creating course:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to create course";
      showMessage("error", errorMessage);
      setUploadStarted(false);
      setUploadProgress(0);
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
      paddingBottom: uploadStarted ? "200px" : "2rem",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
      minHeight: "100vh",
      transition: "padding-bottom 0.3s ease",
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
                  >
                    <MenuItem value="6 months">6 months</MenuItem>
                    <MenuItem value="1 year">1 year</MenuItem>
                    <MenuItem value="2 years">2 years</MenuItem>
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
                  InputProps={{ inputProps: { min: 0 } }}
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
                          Subtotal
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight="600"
                          color="#4f46e5"
                        >
                          ₹
                          {(
                            (parseFloat(
                              formData.price.breakdown?.courseValue,
                            ) || 0) +
                            (parseFloat(formData.price.breakdown?.gst?.cgst) ||
                              0) +
                            (parseFloat(formData.price.breakdown?.gst?.sgst) ||
                              0)
                          ).toFixed(2)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 1.5 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Transaction Fee (2%)
                        </Typography>
                        <Typography
                          variant="body1"
                          fontWeight="600"
                          color="#ef4444"
                        >
                          ₹
                          {formData.price.breakdown?.transactionFee?.toFixed(
                            2,
                          ) || "0.00"}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
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
                    </Grid>
                  </Grid>
                  <Divider sx={{ my: 1.5 }} />
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#ede9fe",
                      borderRadius: 1,
                      border: "2px solid #4f46e5",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        variant="body1"
                        fontWeight="700"
                        color="#3730a3"
                      >
                        Final Price with GST & Fees
                      </Typography>
                      <Typography variant="h5" fontWeight="700" color="#4f46e5">
                        ₹
                        {(
                          (parseFloat(formData.price.breakdown?.courseValue) ||
                            0) +
                          (parseFloat(formData.price.breakdown?.gst?.cgst) ||
                            0) +
                          (parseFloat(formData.price.breakdown?.gst?.sgst) ||
                            0) +
                          (parseFloat(
                            formData.price.breakdown?.transactionFee,
                          ) || 0)
                        ).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
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
                      fullWidth
                      label="Lesson Name *"
                      name="lessonname"
                      value={lesson.lessonname}
                      onChange={(e) => handleLessonChange(cIndex, lIndex, e)}
                      sx={{ ...styles.input, mb: 2 }}
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
                            {/* Show uploaded filenames if available, otherwise show file count */}
                            {lesson[`${type}name`] ? (
                              <Box
                                sx={{
                                  mt: 1,
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 1,
                                  alignItems: "center",
                                }}
                              >
                                {lesson[`${type}name`]
                                  .split(",")
                                  .map((fname, i) => (
                                    <Chip
                                      key={i}
                                      label={fname}
                                      size="small"
                                      onDelete={() =>
                                        removeUploadedFile(
                                          cIndex,
                                          lIndex,
                                          type,
                                          i,
                                        )
                                      }
                                      sx={{ backgroundColor: "#e6f4ea" }}
                                    />
                                  ))}
                              </Box>
                            ) : lesson[type] && lesson[type].length > 0 ? (
                              <Box sx={{ mt: 1 }}>
                                <Typography
                                  variant="caption"
                                  display="block"
                                  sx={{ color: "success.main" }}
                                >
                                  {lesson[type].length} file(s) selected
                                </Typography>
                                {/* show basic players/previews for audio/video and links for pdf */}
                                {type === "audio" &&
                                  lesson.audio &&
                                  lesson.audio.length > 0 && (
                                    <Box sx={{ mt: 1 }}>
                                      {lesson.audio.map((f, idx) => (
                                        <audio
                                          key={idx}
                                          controls
                                          src={blobUrls[cIndex]?.[lIndex]?.audio?.[idx]}
                                          style={{
                                            display: "block",
                                            marginTop: 8,
                                            width: "100%",
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  )}
                                {type === "video" &&
                                  lesson.video &&
                                  lesson.video.length > 0 && (
                                    <Box sx={{ mt: 1 }}>
                                      {lesson.video.map((f, idx) => (
                                        <video
                                          key={idx}
                                          controls
                                          src={blobUrls[cIndex]?.[lIndex]?.video?.[idx]}
                                          style={{
                                            display: "block",
                                            marginTop: 8,
                                            maxWidth: "100%",
                                          }}
                                        />
                                      ))}
                                    </Box>
                                  )}
                                {type === "pdf" &&
                                  lesson.pdf &&
                                  lesson.pdf.length > 0 && (
                                    <Box
                                      sx={{
                                        mt: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 1,
                                      }}
                                    >
                                      {lesson.pdf.map((f, idx) => (
                                        <a
                                          key={idx}
                                          href={blobUrls[cIndex]?.[lIndex]?.pdf?.[idx]}
                                          target="_blank"
                                          rel="noreferrer"
                                        >
                                          {f.name}
                                        </a>
                                      ))}
                                    </Box>
                                  )}
                              </Box>
                            ) : null}
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

        // Helper function to get file name from file object
        const getFileName = (file) => {
          if (typeof file === "string") return file;
          if (file && (file.name || file.filename))
            return file.name || file.filename;
          if (file && file.originalname) return file.originalname;
          return String(file);
        };

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
                      {formData.CourseMotherId &&
                        !formData.useAutoCourseMotherId && (
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
                                {formData.useAutoCourseMotherId
                                  ? "Auto-generated"
                                  : formData.CourseMotherId || (
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
                        )}
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
                    {chapters.map((chapter, cIndex) => (
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
                                boxShadow: "0 2px 8px rgba(168, 85, 247, 0.1)",
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
                            {((lesson.audio && lesson.audio.length > 0) ||
                              lesson.audioname) && (
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
                                  Audio Files (
                                  {lesson.audio
                                    ? lesson.audio.length
                                    : lesson.audioname
                                      ? lesson.audioname.split(",").length
                                      : 0}
                                  )
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.5,
                                    ml: 2,
                                  }}
                                >
                                  {lesson.audioname
                                    ? // Use audioname if available (comma-separated string)
                                      lesson.audioname
                                        .split(",")
                                        .map((fileName, fIndex) => (
                                          <Chip
                                            key={fIndex}
                                            label={fileName.trim()}
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
                                        ))
                                    : // Fallback to file objects
                                      lesson.audio &&
                                      lesson.audio.map((file, fIndex) => (
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
                            {((lesson.video && lesson.video.length > 0) ||
                              lesson.videoname) && (
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
                                  Video Files (
                                  {lesson.video
                                    ? lesson.video.length
                                    : lesson.videoname
                                      ? lesson.videoname.split(",").length
                                      : 0}
                                  )
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.5,
                                    ml: 2,
                                  }}
                                >
                                  {lesson.videoname
                                    ? // Use videoname if available (comma-separated string)
                                      lesson.videoname
                                        .split(",")
                                        .map((fileName, fIndex) => (
                                          <Chip
                                            key={fIndex}
                                            label={fileName.trim()}
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
                                        ))
                                    : // Fallback to file objects
                                      lesson.video &&
                                      lesson.video.map((file, fIndex) => (
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
                            {((lesson.pdf && lesson.pdf.length > 0) ||
                              lesson.pdfname) && (
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
                                  <PictureAsPdf sx={{ fontSize: "0.875rem" }} />
                                  PDF Files (
                                  {lesson.pdf
                                    ? lesson.pdf.length
                                    : lesson.pdfname
                                      ? lesson.pdfname.split(",").length
                                      : 0}
                                  )
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 0.5,
                                    ml: 2,
                                  }}
                                >
                                  {lesson.pdfname
                                    ? // Use pdfname if available (comma-separated string)
                                      lesson.pdfname
                                        .split(",")
                                        .map((fileName, fIndex) => (
                                          <Chip
                                            key={fIndex}
                                            label={fileName.trim()}
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
                                        ))
                                    : // Fallback to file objects
                                      lesson.pdf &&
                                      lesson.pdf.map((file, fIndex) => (
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
                              !lesson.audioname &&
                              (!lesson.video || lesson.video.length === 0) &&
                              !lesson.videoname &&
                              (!lesson.pdf || lesson.pdf.length === 0) &&
                              !lesson.pdfname && (
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
                    ))}
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

      {message.text && !uploadStarted && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: "", text: "" })}
        >
          {message.text}
        </Alert>
      )}

      {/* Upload Progress Bar - Fixed at Bottom */}
      {uploadStarted && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "24px",
            backgroundColor: "#f8fafc",
            borderTop: "2px solid #e0e7ff",
            boxShadow: "0 -4px 12px rgba(99, 102, 241, 0.1)",
            zIndex: 999,
            animation: "slideUp 0.3s ease-in-out",
            "@keyframes slideUp": {
              from: { transform: "translateY(100%)" },
              to: { transform: "translateY(0)" },
            },
          }}
        >
          <Box sx={{ maxWidth: "800px", margin: "0 auto" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={uploadProgress}
                  size={32}
                  sx={{ color: uploadProgress === 100 ? "#10b981" : "#6366f1" }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: "#6366f1" }}
                >
                  Uploading Course Files...
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 700, color: "#6366f1", fontSize: "16px" }}
              >
                {uploadProgress}%
              </Typography>
            </Box>
            <Box
              sx={{
                width: "100%",
                height: "6px",
                borderRadius: "3px",
                backgroundColor: "#e0e7ff",
                overflow: "hidden",
                boxShadow: "0 2px 4px rgba(99, 102, 241, 0.1)",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${uploadProgress}%`,
                  backgroundColor:
                    uploadProgress === 100 ? "#10b981" : "#6366f1",
                  transition: "all 0.3s ease",
                  borderRadius: "3px",
                }}
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* Bottom Success Notification */}
      {message.type === "success" && uploadProgress === 100 && (
        <Box
          sx={{
            position: "fixed",
            bottom: uploadStarted ? "140px" : "0",
            left: 0,
            right: 0,
            padding: "24px",
            backgroundColor: "#ecfdf5",
            borderTop: "4px solid #10b981",
            boxShadow: "0 -4px 12px rgba(16, 185, 129, 0.15)",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "slideUp 0.3s ease-in-out",
            "@keyframes slideUp": {
              from: { transform: "translateY(100%)" },
              to: { transform: "translateY(0)" },
            },
            transition: "all 0.3s ease",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <CheckCircle sx={{ color: "#10b981", fontSize: "32px" }} />
            <Box>
              <Typography
                sx={{ fontWeight: 700, color: "#059669", fontSize: "16px" }}
              >
                ✓ Course Upload Successful!
              </Typography>
              <Typography sx={{ color: "#047857", fontSize: "14px", mt: 0.5 }}>
                {message.text}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      <Stepper activeStep={activeStep} sx={styles.stepper}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}
    </Box>
  );
};

export default CreateCourses;
