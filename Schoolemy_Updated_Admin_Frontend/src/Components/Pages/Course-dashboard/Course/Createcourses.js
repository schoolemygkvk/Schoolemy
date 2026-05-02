import React, { useState, useEffect } from "react";
import axios from "../../../../Utils/api";
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import { ArrowBack, CheckCircle } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { hasToken } from "../../../../Hooks/useToken";

// Import sub-components
import CourseBasicInfo from "./CourseBasicInfo";
import CourseDescription from "./CourseDescription";
import CourseInstructor from "./CourseInstructor";
import CourseChapters from "./CourseChapters";
import CourseReview from "./CourseReview";

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
  const FORM_CACHE_KEY = "courseDashboardFormData";
  const CHAPTERS_CACHE_KEY = "courseDashboardChapters";

  // Initial states
  const initialFormData = {
    CourseMotherId: "",
    useAutoCourseMotherId: true,
    coursename: "",
    category: "",
    courseDuration: "6 months",
    contentDuration: { hours: 0, minutes: 0 },
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
    previewvideo: null,
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
          lessonName: "",
          audioFile: [],
          videoFile: [],
          pdfFile: [],
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
        parsed.thumbnail = null;
        parsed.previewvideo = null;

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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStarted, setUploadStarted] = useState(false);
  const [uploadHadFiles, setUploadHadFiles] = useState(false);

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

  const levels = [
    { value: "beginner", label: "Beginner" },
    { value: "medium", label: "Intermediate" },
    { value: "hard", label: "Advanced" },
  ];

  const languages = [
    { value: "english", label: "English" },
    { value: "tamil", label: "Tamil" },
  ];

  const certificateOptions = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  // Cache formData and chapters on change
  useEffect(() => {
    const cacheForm = { ...formData, thumbnail: null, previewvideo: null };
    localStorage.setItem(FORM_CACHE_KEY, JSON.stringify(cacheForm));
  }, [formData]);

  useEffect(() => {
    localStorage.setItem(CHAPTERS_CACHE_KEY, JSON.stringify(chapters));
  }, [chapters]);

  // Calculate final price and breakdown whenever amount or discount changes
  useEffect(() => {
    const amount = parseFloat(formData.price.amount) || 0;
    const discount = parseFloat(formData.price.discount) || 0;

    const finalPrice = amount * (1 - discount / 100);
    const courseValue = finalPrice;
    const cgst = courseValue * 0.09;
    const sgst = courseValue * 0.09;
    const gstTotal = cgst + sgst;
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

  // Parse course duration to months
  const parseDurationToMonths = (duration) => {
    if (duration === "6 months") return 6;
    if (duration === "1 year") return 12;
    if (duration === "2 years") return 24;
    return 0;
  };

  // Auto-calculate EMI details based on final price and course duration
  useEffect(() => {
    if (formData.emi.isAvailable) {
      const months = parseDurationToMonths(formData.courseDuration);
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
    formData.courseDuration,
    formData.emi.isAvailable,
  ]);

  // Handler functions
  const handleNext = () => {
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
        for (let chapter of chapters) {
          if (!chapter.title.trim()) {
            showMessage("error", "All chapters must have a title");
            return false;
          }
          for (let lesson of chapter.lessons) {
            const lessonTitle = (
              lesson.lessonName ||
              lesson.lessonname ||
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
    } else if (name === "thumbnailFile" && files) {
      setFormData((prev) => ({ ...prev, thumbnail: files[0] }));
    } else if (name === "previewvideoFile" && files) {
      setFormData((prev) => ({ ...prev, previewvideo: files[0] }));
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
    } else if (name.startsWith("contentDuration.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        contentDuration: {
          ...prev.contentDuration,
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
            lessonName: "",
            audioFile: [],
            videoFile: [],
            pdfFile: [],
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
      lessonName: "",
      audioFile: [],
      videoFile: [],
      pdfFile: [],
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

    if (!hasToken()) {
      showMessage("error", "Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    setUploadStarted(true);
    setUploadProgress(0);

    try {

      // Collect all files that need to be uploaded
      const filesToUpload = [];

      // Thumbnail
      if (formData.thumbnail instanceof File) {
        console.log("📸 Thumbnail file found:", formData.thumbnail.name);
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
      if (formData.previewvideo instanceof File) {
        console.log("🎥 Preview video file found:", formData.previewvideo.name);
        filesToUpload.push({
          file: formData.previewvideo,
          fileName: formData.previewvideo.name,
          fileType: formData.previewvideo.type,
          fileSize: formData.previewvideo.size,
          category: "preview",
          customName: formData.previewvideo.name,
        });
      }

      // Chapter lesson files
      chapters.forEach((chapter, cIndex) => {
        if (chapter.title && chapter.title.trim()) {
          chapter.lessons.forEach((lesson, lIndex) => {
            if (lesson.lessonName && lesson.lessonName.trim()) {
              const fileTypeMap = {
                audioFile: "audio",
                videoFile: "video",
                pdfFile: "pdf"
              };
              Object.entries(fileTypeMap).forEach(([fieldName, s3Category]) => {
                const files = lesson[fieldName];
                if (files && Array.isArray(files)) {
                  files.forEach((file) => {
                    if (file instanceof File) {
                      filesToUpload.push({
                        file,
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                        category: s3Category,
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

      setUploadHadFiles(filesToUpload.length > 0);

      let uploadedFilesMap = {};

      // Only request presigned URLs if there are files to upload
      if (filesToUpload.length > 0) {
        // Get presigned URLs from backend
        const urlResponse = await axios.post(
          "/api/courses/generate-upload-urls",
          {
            courseName: formData.coursename,
            files: filesToUpload.map(({ file, ...rest }) => rest),
            bucketType: "admin",
          },
        );

        if (!urlResponse.data?.success || !urlResponse.data?.data?.length) {
          throw new Error(
            urlResponse.data?.error || "Failed to get upload URLs",
          );
        }

        const presignedUrls = urlResponse.data.data;

        // Upload files sequentially so progress updates reliably (matches tutor CourseUpload)
        for (let i = 0; i < presignedUrls.length; i++) {
          const urlData = presignedUrls[i];
          const fileInfo = filesToUpload[i];
          const contentType =
            urlData.contentType ||
            fileInfo.fileType ||
            "application/octet-stream";

          const response = await fetch(urlData.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": contentType },
            body: fileInfo.file,
          });

          if (!response.ok) {
            console.error(`S3 upload response:`, {
              status: response.status,
              statusText: response.statusText,
              uploadUrl: urlData.uploadUrl,
              fileType: fileInfo.fileType,
            });
            throw new Error(
              `S3 upload failed: ${response.status} ${response.statusText}`,
            );
          }

          const key = `${urlData.category}_${urlData.chapterIndex}_${urlData.lessonIndex}`;
          if (!uploadedFilesMap[key]) {
            uploadedFilesMap[key] = [];
          }
          uploadedFilesMap[key].push({
            name: fileInfo.fileName,
            url: urlData.s3Url,
          });

          if (urlData.category === "thumbnail") {
            uploadedFilesMap.thumbnail = urlData.s3Url;
          }
          if (urlData.category === "preview") {
            uploadedFilesMap.previewvideo = urlData.s3Url;
          }

          setUploadProgress(
            Math.round(((i + 1) / presignedUrls.length) * 90),
          );
        }
      } else {
        setUploadProgress(85);
      }

      // Prepare course data with S3 URLs (admin catalog — not tutor-submitted courses)
      setUploadProgress(92);

      // Ensure previewvideo is a string, not an array
      let previewvideoUrl = uploadedFilesMap.previewvideo || "";
      if (Array.isArray(previewvideoUrl)) {
        previewvideoUrl = previewvideoUrl.length > 0 ? previewvideoUrl[0].url || previewvideoUrl[0] : "";
      }

      const monthsFromDuration = parseDurationToMonths(formData.courseDuration);
      const finalPrice = formData.price.finalPrice ?? 0;
      const emiPayload = formData.emi.isAvailable
        ? {
            isAvailable: true,
            emiDurationMonths:
              Number(formData.emi.emiDurationMonths) || monthsFromDuration,
            monthlyAmount:
              Number(formData.emi.monthlyAmount) ||
              (monthsFromDuration > 0
                ? Math.round(finalPrice / monthsFromDuration)
                : 0),
            totalAmount: Number(formData.emi.totalAmount) || finalPrice,
            notes: formData.emi.notes || "",
          }
        : {
            isAvailable: false,
            emiDurationMonths: null,
            monthlyAmount: null,
            totalAmount: null,
            notes: "",
          };

      const courseData = {
        coursename: formData.coursename,
        category: formData.category,
        courseduration: formData.courseDuration,
        CourseMotherId: formData.CourseMotherId,
        useAutoCourseMotherId: formData.useAutoCourseMotherId,
        thumbnail: uploadedFilesMap.thumbnail || "",
        previewVideo: previewvideoUrl,
        contentduration: formData.contentDuration,
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
        emi: emiPayload,
        chapters: chapters
          .filter((ch) => ch.title && ch.title.trim())
          .map((chapter, cIndex) => {
            const validLessons = chapter.lessons
              .filter((lesson) => lesson.lessonName && lesson.lessonName.trim())
              .map((lesson, lIndex) => {
                const audioKey = `audio_${cIndex}_${lIndex}`;
                const videoKey = `video_${cIndex}_${lIndex}`;
                const pdfKey = `pdf_${cIndex}_${lIndex}`;

                return {
                  lessonName: (lesson.lessonName && lesson.lessonName.trim()) || `Lesson ${lIndex + 1}`,
                  audioFile: uploadedFilesMap[audioKey] || [],
                  videoFile: uploadedFilesMap[videoKey] || [],
                  pdfFile: uploadedFilesMap[pdfKey] || [],
                };
              });
            return {
              title: chapter.title,
              lessons: validLessons,
            };
          })
          .filter((ch) => ch.lessons && ch.lessons.length > 0),
      };

      // Create course with S3 URLs (matches POST /api/courses/create-with-s3-urls in coursecontroller)
      await axios.post("/api/courses/create-with-s3-urls", courseData);

      setUploadProgress(100);
      showMessage("success", "Course created successfully!");
      // Clear cache after successful save
      localStorage.removeItem(FORM_CACHE_KEY);
      localStorage.removeItem(CHAPTERS_CACHE_KEY);
      resetForm();
      setTimeout(() => {
        setUploadStarted(false);
        setUploadProgress(0);
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (err) {
      console.error("Error creating course:", err.message);
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
    localStorage.removeItem(FORM_CACHE_KEY);
    localStorage.removeItem(CHAPTERS_CACHE_KEY);
  };

  const handleClear = () => {
    localStorage.removeItem(FORM_CACHE_KEY);
    localStorage.removeItem(CHAPTERS_CACHE_KEY);
    setFormData(initialFormData);
    setChapters(initialChapters);
    setWhatYoullLearnInput("");
    setActiveStep(0);
    setMessage({ type: "success", text: "Form and cache cleared." });
    setTimeout(() => setMessage({ type: "", text: "" }), 1000);
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

  // Render step content
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <CourseBasicInfo
            formData={formData}
            handleChange={handleChange}
            handleEmiChange={handleEmiChange}
            categories={categories}
            levels={levels}
            languages={languages}
            certificateOptions={certificateOptions}
            styles={styles}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        );
      case 1:
        return (
          <CourseDescription
            formData={formData}
            whatYoullLearnInput={whatYoullLearnInput}
            setWhatYoullLearnInput={setWhatYoullLearnInput}
            handleChange={handleChange}
            handleWhatYoullLearn={handleWhatYoullLearn}
            removeWhatYoullLearn={removeWhatYoullLearn}
            styles={styles}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        );
      case 2:
        return (
          <CourseInstructor
            formData={formData}
            handleChange={handleChange}
            styles={styles}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        );
      case 3:
        return (
          <CourseChapters
            chapters={chapters}
            handleChapterChange={handleChapterChange}
            handleLessonChange={handleLessonChange}
            handleRemoveLessonFile={handleRemoveLessonFile}
            addChapter={addChapter}
            addLesson={addLesson}
            removeChapter={removeChapter}
            removeLesson={removeLesson}
            styles={styles}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        );
      case 4:
        return (
          <CourseReview
            formData={formData}
            chapters={chapters}
            styles={styles}
            loading={loading || uploadStarted}
            handleBack={handleBack}
            handleSubmit={handleSubmit}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        ...styles.container,
        paddingBottom: uploadStarted ? "200px" : styles.container.padding,
      }}
    >
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

      {/* Upload progress — fixed bar (same pattern as tutor CourseUpload.js) */}
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
                  {uploadProgress >= 92 && uploadProgress < 100
                    ? "Saving course metadata..."
                    : uploadHadFiles && uploadProgress < 92
                      ? "Uploading course files to S3..."
                      : uploadProgress < 100
                        ? "Saving course metadata..."
                        : "Done"}
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
                Course created successfully
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

      <Snackbar
        open={!!message.text && !uploadStarted && message.type !== "success"}
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
