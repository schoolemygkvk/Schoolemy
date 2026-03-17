import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../../Utils/api";
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
} from "@mui/material";
import {
  AddCircle,
  RemoveCircle,
  CloudUpload,
  ArrowBack,
  Info,
  Description,
  AttachMoney,
  CreditCard,
  MenuBook,
  CheckCircle,
  AudioFile,
  VideoFile,
  PictureAsPdf,
} from "@mui/icons-material";

const EditCourse = () => {
  const { coursename } = useParams();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    "Basic Information",
    "Description",
    "Course Content",
    "Review & Save",
  ];

  const [formData, setFormData] = useState({
    coursename: "",
    category: "",
    courseduration: "",
    level: "",
    language: "",
    certificates: "",
    description: "",
    price: {
      amount: 0,
      currency: "INR",
      discount: 0,
      finalPrice: 0,
      breakdown: {
        courseValue: 0,
        gst: { cgst: 0, sgst: 0, total: 0 },
        transactionFee: 0,
      },
    },
    contentduration: { hours: 0, minutes: 0 },
    whatYoullLearn: [],
    chapters: [],
    emi: {
      isAvailable: false,
      emiDurationMonths: "",
      monthlyAmount: "",
      totalAmount: "",
      notes: "",
    },
  });

  const [filesToUpload, setFilesToUpload] = useState({});
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [whatYoullLearnInput, setWhatYoullLearnInput] = useState("");

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

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  // Fetch course (Tutor endpoint) and normalize into the same state shape as Course-dashboard edit page
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `/courses-tutors/${encodeURIComponent(coursename)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const course = res.data;

        const parseMediaFiles = (chapters) => {
          if (!chapters) return [];
          return chapters.map((chapter) => ({
            ...chapter,
            lessons: (chapter.lessons || []).map((lesson) => {
              const parsedLesson = { ...lesson };

              // Parse audioFile/videoFile/pdfFile if stored as JSON string
              if (
                typeof parsedLesson.audioFile === "string" &&
                parsedLesson.audioFile
              ) {
                try {
                  parsedLesson.audioFile = JSON.parse(parsedLesson.audioFile);
                } catch {
                  parsedLesson.audioFile = [];
                }
              } else if (!Array.isArray(parsedLesson.audioFile)) {
                parsedLesson.audioFile = [];
              }

              if (
                typeof parsedLesson.videoFile === "string" &&
                parsedLesson.videoFile
              ) {
                try {
                  parsedLesson.videoFile = JSON.parse(parsedLesson.videoFile);
                } catch {
                  parsedLesson.videoFile = [];
                }
              } else if (!Array.isArray(parsedLesson.videoFile)) {
                parsedLesson.videoFile = [];
              }

              if (
                typeof parsedLesson.pdfFile === "string" &&
                parsedLesson.pdfFile
              ) {
                try {
                  parsedLesson.pdfFile = JSON.parse(parsedLesson.pdfFile);
                } catch {
                  parsedLesson.pdfFile = [];
                }
              } else if (!Array.isArray(parsedLesson.pdfFile)) {
                parsedLesson.pdfFile = [];
              }

              return parsedLesson;
            }),
          }));
        };

        // Price breakdown (same math as Course-dashboard edit page)
        const loadedAmount = course.price?.amount || 0;
        const loadedDiscount = course.price?.discount || 0;
        const loadedFinalPrice = loadedAmount * (1 - loadedDiscount / 100);
        const loadedCourseValue = loadedFinalPrice;  // Course Value = Final Price (after discount)
        const loadedCgst = loadedCourseValue * 0.09;
        const loadedSgst = loadedCourseValue * 0.09;
        const loadedGstTotal = loadedCgst + loadedSgst;
        const loadedSubtotal = loadedCourseValue + loadedCgst + loadedSgst;
        const loadedTransactionFee = loadedSubtotal * 0.02;  // 2% of (CV + GST)

        const calculatedBreakdown = {
          courseValue: parseFloat(loadedCourseValue.toFixed(2)),
          gst: {
            cgst: parseFloat(loadedCgst.toFixed(2)),
            sgst: parseFloat(loadedSgst.toFixed(2)),
            total: parseFloat(loadedGstTotal.toFixed(2)),
          },
          transactionFee: parseFloat(loadedTransactionFee.toFixed(2)),
        };

        setFormData({
          coursename: course.coursename,
          category: course.category,
          courseduration: course.courseduration,
          level: course.level,
          language: course.language,
          certificates: course.certificates,
          description: course.description,
          price: {
            amount: loadedAmount,
            discount: loadedDiscount,
            currency: course.price?.currency || "INR",
            finalPrice: parseFloat(loadedFinalPrice.toFixed(2)),
            breakdown: calculatedBreakdown,
          },
          contentduration: course.contentduration || { hours: 0, minutes: 0 },
          whatYoullLearn: course.whatYoullLearn || [],
          chapters: parseMediaFiles(course.chapters || []),
          emi: {
            isAvailable: course.emi?.isAvailable || false,
            emiDurationMonths: course.emi?.emiDurationMonths || "",
            monthlyAmount: course.emi?.monthlyAmount || "",
            totalAmount: course.emi?.totalAmount || "",
            notes: course.emi?.notes || "",
          },
        });
      } catch (err) {
        console.error("❌ Fetch course error:", err);
        showMessage("error", "Failed to load course data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [coursename]);

  const calculatePriceBreakdown = (amount, discount) => {
    const finalPrice = amount * (1 - discount / 100);
    const courseValue = finalPrice;  // Course Value = Final Price (after discount)
    const cgst = courseValue * 0.09;
    const sgst = courseValue * 0.09;
    const gstTotal = cgst + sgst;
    const subtotal = courseValue + cgst + sgst;  // Subtotal for transaction fee calculation
    const transactionFee = subtotal * 0.02;  // 2% of (CV + GST)

    return {
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      breakdown: {
        courseValue: parseFloat(courseValue.toFixed(2)),
        gst: {
          cgst: parseFloat(cgst.toFixed(2)),
          sgst: parseFloat(sgst.toFixed(2)),
          total: parseFloat(gstTotal.toFixed(2)),
        },
        transactionFee: parseFloat(transactionFee.toFixed(2)),
      },
    };
  };

  // Keep finalPrice + breakdown in sync without infinite loops
  useEffect(() => {
    const amount = parseFloat(formData.price.amount) || 0;
    const discount = parseFloat(formData.price.discount) || 0;
    if (amount === 0) return;

    const { finalPrice, breakdown } = calculatePriceBreakdown(amount, discount);
    setFormData((prev) => ({
      ...prev,
      price: {
        ...prev.price,
        finalPrice,
        breakdown,
      },
    }));
  }, [formData.price.amount, formData.price.discount]);

  const parseDurationToMonths = (duration) => {
    if (duration === "6 months") return 6;
    if (duration === "1 year") return 12;
    if (duration === "2 years") return 24;
    return 0;
  };

  // Auto-calculate EMI details safely
  useEffect(() => {
    if (!formData.emi.isAvailable) return;
    const months = parseDurationToMonths(formData.courseduration);
    const finalPrice = formData.price.finalPrice;
    const calculatedMonthly = months > 0 ? Math.round(finalPrice / months) : 0;

    if (
      formData.emi.emiDurationMonths !== months ||
      formData.emi.totalAmount !== finalPrice ||
      formData.emi.monthlyAmount !== calculatedMonthly
    ) {
      setFormData((prev) => ({
        ...prev,
        emi: {
          ...prev.emi,
          emiDurationMonths: months,
          totalAmount: finalPrice,
          monthlyAmount: calculatedMonthly,
        },
      }));
    }
  }, [
    formData.price.finalPrice,
    formData.courseduration,
    formData.emi.isAvailable,
    formData.emi.emiDurationMonths,
    formData.emi.totalAmount,
    formData.emi.monthlyAmount,
  ]);

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
      case 2:
        for (let chapter of formData.chapters) {
          if (!chapter.title?.trim()) {
            showMessage("error", "All chapters must have a title");
            return false;
          }
          for (let lesson of chapter.lessons || []) {
            if (!lesson.lessonname?.trim()) {
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

  const handleNext = () => {
    if (validateStep(activeStep)) setActiveStep((prev) => prev + 1);
  };
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;

    if (name.startsWith("contentduration.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        contentduration: {
          ...prev.contentduration,
          [key]: parseInt(value) || 0,
        },
      }));
      return;
    }

    if (name.startsWith("price.")) {
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
      return;
    }

    if (name.startsWith("emi.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        emi: {
          ...prev.emi,
          [key]: typeof checked !== "undefined" ? checked : value,
        },
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEmiChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      emi: {
        ...prev.emi,
        [name]: typeof checked !== "undefined" ? checked : value,
      },
    }));
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
    const newChapters = [...formData.chapters];
    newChapters[index][e.target.name] = e.target.value;
    setFormData((prev) => ({ ...prev, chapters: newChapters }));
  };

  const handleLessonChange = (chapterIndex, lessonIndex, e) => {
    const { name, value, files } = e.target;
    const newChapters = [...formData.chapters];
    const lesson = newChapters[chapterIndex].lessons[lessonIndex];

    if (files && files.length > 0) {
      const fieldName = `chapters[${chapterIndex}].lessons[${lessonIndex}].${name}File`;
      const newFiles = { ...filesToUpload };
      if (!newFiles[fieldName]) newFiles[fieldName] = [];
      newFiles[fieldName] = [...newFiles[fieldName], ...Array.from(files)];
      setFilesToUpload(newFiles);

      const totalFiles = Array.from(files).length;
      const totalSize = Array.from(files).reduce((sum, f) => sum + f.size, 0);
      const sizeMB = (totalSize / 1024 / 1024).toFixed(1);
      showMessage(
        "success",
        `${totalFiles} ${name} file(s) added (${sizeMB}MB)`,
      );
    } else {
      lesson[name] = value;
    }

    setFormData((prev) => ({ ...prev, chapters: newChapters }));
  };

  const addNewChapter = () => {
    setFormData((prev) => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        {
          title: "",
          lessons: [
            { lessonname: "", audioFile: [], videoFile: [], pdfFile: [] },
          ],
        },
      ],
    }));
  };

  const removeChapter = (chapterIdx) => {
    const chapter = formData.chapters[chapterIdx];
    const filesToRemove = [];
    chapter.lessons.forEach((lesson) => {
      filesToRemove.push(...(lesson.audioFile || []));
      filesToRemove.push(...(lesson.videoFile || []));
      filesToRemove.push(...(lesson.pdfFile || []));
    });
    setFilesToDelete((prev) => [...prev, ...filesToRemove]);
    setFormData((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((_, idx) => idx !== chapterIdx),
    }));
  };

  const addNewLesson = (chapterIdx) => {
    const updatedChapters = [...formData.chapters];
    updatedChapters[chapterIdx].lessons.push({
      lessonname: "",
      audioFile: [],
      videoFile: [],
      pdfFile: [],
    });
    setFormData((prev) => ({ ...prev, chapters: updatedChapters }));
  };

  const removeLesson = (chapterIdx, lessonIdx) => {
    const lesson = formData.chapters[chapterIdx].lessons[lessonIdx];
    const filesToRemove = [
      ...(lesson.audioFile || []),
      ...(lesson.videoFile || []),
      ...(lesson.pdfFile || []),
    ];
    setFilesToDelete((prev) => [...prev, ...filesToRemove]);

    const updatedChapters = [...formData.chapters];
    updatedChapters[chapterIdx].lessons = updatedChapters[
      chapterIdx
    ].lessons.filter((_, idx) => idx !== lessonIdx);
    setFormData((prev) => ({ ...prev, chapters: updatedChapters }));
  };

  const removeMediaFile = (chapterIdx, lessonIdx, fileType, fileIndex) => {
    const updatedChapters = [...formData.chapters];
    const fileToRemove =
      updatedChapters[chapterIdx].lessons[lessonIdx][fileType][fileIndex];
    setFilesToDelete((prev) => [...prev, fileToRemove]);

    updatedChapters[chapterIdx].lessons[lessonIdx][fileType] = updatedChapters[
      chapterIdx
    ].lessons[lessonIdx][fileType].filter((_, idx) => idx !== fileIndex);
    setFormData((prev) => ({ ...prev, chapters: updatedChapters }));
  };

  const removeUploadFile = (chapterIdx, lessonIdx, fileType, fileIndex) => {
    const fieldName = `chapters[${chapterIdx}].lessons[${lessonIdx}].${fileType}File`;
    setFilesToUpload((prev) => {
      const updated = { ...prev };
      if (updated[fieldName]) {
        updated[fieldName] = updated[fieldName].filter(
          (_, idx) => idx !== fileIndex,
        );
        if (updated[fieldName].length === 0) delete updated[fieldName];
      }
      return updated;
    });
  };

  // Tutor update: S3 presigned flow (bypasses API Gateway 10MB limit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    if (!validateStep(activeStep)) {
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const s3UploadedFiles = {};

      // Parse fieldName to get chapterIndex, lessonIndex, category
      const parseFieldName = (fn) => {
        const m = fn.match(
          /chapters\[(\d+)\]\.lessons\[(\d+)\]\.(audio|video|pdf)File/,
        );
        return m
          ? { chapterIndex: +m[1], lessonIndex: +m[2], category: m[3] }
          : null;
      };

      // Build file requests for presigned URLs
      const fileRequests = [];
      const fileListByIndex = [];
      for (const fieldName in filesToUpload) {
        if (!Array.isArray(filesToUpload[fieldName])) continue;
        const parsed = parseFieldName(fieldName);
        const cat =
          parsed?.category ||
          fieldName.split(".").pop()?.replace("File", "") ||
          "misc";
        filesToUpload[fieldName].forEach((file) => {
          fileRequests.push({
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            category: cat,
            chapterIndex: parsed?.chapterIndex ?? -1,
            lessonIndex: parsed?.lessonIndex ?? -1,
            customName: file.name,
          });
          fileListByIndex.push({ fieldName, file });
        });
      }

      // Upload files to S3 if any
      if (fileRequests.length > 0) {
        showMessage(
          "info",
          `Uploading ${fileRequests.length} file(s) to S3...`,
        );
        const urlResponse = await axios.post(
          "/api/courses/generate-upload-urls",
          {
            courseName: formData.coursename,
            bucketType: "tutor",
            files: fileRequests,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!urlResponse.data.success || !urlResponse.data.data) {
          throw new Error(
            urlResponse.data.error || "Failed to get upload URLs",
          );
        }

        const presignedUrls = urlResponse.data.data;
        for (let i = 0; i < presignedUrls.length; i++) {
          const urlData = presignedUrls[i];
          const { fieldName, file } = fileListByIndex[i];
          const body = await file.arrayBuffer();
          const putRes = await fetch(urlData.uploadUrl, {
            method: "PUT",
            body,
            headers: { "Content-Type": "application/octet-stream" },
          });
          if (!putRes.ok) throw new Error(`Failed to upload ${file.name}`);
          if (!s3UploadedFiles[fieldName]) s3UploadedFiles[fieldName] = [];
          s3UploadedFiles[fieldName].push({
            name: file.name,
            url: urlData.s3Url,
          });
        }
      }

      // Build chapters: exclude deleted files, add new S3 URLs
      const deleteUrls = new Set(
        (filesToDelete || []).filter((f) => f?.url).map((f) => f.url),
      );
      const updatedChapters = formData.chapters.map((chapter, chIdx) => ({
        title: chapter.title,
        lessons: (chapter.lessons || []).map((lesson, lIdx) => {
          const base = `chapters[${chIdx}].lessons[${lIdx}]`;
          let audioFiles = (lesson.audioFile || []).filter(
            (f) => !deleteUrls.has(f.url),
          );
          let videoFiles = (lesson.videoFile || []).filter(
            (f) => !deleteUrls.has(f.url),
          );
          let pdfFiles = (lesson.pdfFile || []).filter(
            (f) => !deleteUrls.has(f.url),
          );
          if (s3UploadedFiles[`${base}.audioFile`]) {
            audioFiles = [
              ...audioFiles,
              ...s3UploadedFiles[`${base}.audioFile`],
            ];
          }
          if (s3UploadedFiles[`${base}.videoFile`]) {
            videoFiles = [
              ...videoFiles,
              ...s3UploadedFiles[`${base}.videoFile`],
            ];
          }
          if (s3UploadedFiles[`${base}.pdfFile`]) {
            pdfFiles = [...pdfFiles, ...s3UploadedFiles[`${base}.pdfFile`]];
          }
          return {
            lessonname: lesson.lessonname,
            audioFile: audioFiles,
            videoFile: videoFiles,
            pdfFile: pdfFiles,
          };
        }),
      }));

      const updateData = {
        coursename: formData.coursename,
        category: formData.category,
        courseduration: formData.courseduration,
        level: formData.level,
        language: formData.language,
        certificates: formData.certificates,
        description: formData.description || "",
        whatYoullLearn: formData.whatYoullLearn || [],
        price: {
          amount: formData.price.amount ?? 0,
          discount: formData.price.discount ?? 0,
          currency: formData.price.currency || "INR",
        },
        contentduration: {
          hours: formData.contentduration.hours ?? 0,
          minutes: formData.contentduration.minutes ?? 0,
        },
        chapters: updatedChapters,
        filesToDelete: filesToDelete.filter((f) => f && f.url),
      };

      const response = await axios.put(
        `/course-tutors/update-with-s3-urls/${encodeURIComponent(coursename)}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 60000,
        },
      );

      if (response.data.success) {
        showMessage("success", "✅ Course updated successfully!");
        setTimeout(() => navigate(-1), 1200);
      } else {
        showMessage(
          "error",
          response.data.error || response.data.message || "Update failed",
        );
      }
    } catch (err) {
      console.error("❌ Update error:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Update failed";
      showMessage("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Styles copied to match Course-dashboard edit design
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
        "&:hover fieldset": { borderColor: "#818cf8" },
        "&.Mui-focused fieldset": { borderColor: "#a21caf" },
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
      "&:hover": { borderColor: "#a21caf", backgroundColor: "#ede9fe" },
    },
    chip: {
      borderRadius: "8px",
      backgroundColor: "#c7d2fe",
      color: "#312e81",
      fontWeight: 500,
      "& .MuiChip-deleteIcon": {
        color: "#818cf8",
        "&:hover": { color: "#a21caf" },
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
      "&:hover": { borderColor: "#6366f1", backgroundColor: "#ede9fe" },
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
              <Avatar sx={{ bgcolor: "#4f46e5", mr: 2 }}>
                <Info />
              </Avatar>
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
                  disabled
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
                    <MenuItem value="1 year">12 months</MenuItem>
                    <MenuItem value="2 years">24 months</MenuItem>
                  </Select>
                </FormControl>
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

              {/* Price Breakdown */}
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
                        💳 Final Price with GST & Fees
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

              {/* EMI Options */}
              <Grid item xs={12}>
                <Box sx={{ mt: 4, mb: 2 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ fontWeight: 600, color: "#3730a3" }}
                  >
                    EMI Options
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
            </Grid>

            <Box sx={styles.navigation}>
              <div />
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
              <Avatar sx={{ bgcolor: "#4f46e5", mr: 2 }}>
                <Description />
              </Avatar>
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
                InputProps={{ style: { overflow: "auto", resize: "vertical" } }}
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
                onKeyDown={(e) => {
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
                Next: Course Content
              </Button>
            </Box>
          </Paper>
        );

      case 2:
        return (
          <Paper sx={styles.section}>
            <Typography sx={styles.sectionTitle}>
              <Avatar sx={{ bgcolor: "#4f46e5", mr: 2 }}>
                <MenuBook />
              </Avatar>
              Course Content
            </Typography>

            {formData.chapters.map((chapter, cIndex) => (
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
                    disabled={formData.chapters.length <= 1}
                    sx={{
                      color:
                        formData.chapters.length > 1 ? "#ef4444" : "#cbd5e0",
                    }}
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

                {chapter.lessons?.map((lesson, lIndex) => (
                  <Card key={lIndex} sx={styles.lessonCard}>
                    <IconButton
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        color: "#ef4444",
                        backgroundColor: "#fef2f2",
                        "&:hover": { backgroundColor: "#fee2e2" },
                      }}
                      onClick={() => removeLesson(cIndex, lIndex)}
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

                            {/* Existing files */}
                            {lesson[`${type}File`] &&
                              lesson[`${type}File`].length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                  {lesson[`${type}File`].map((file, idx) => (
                                    <Chip
                                      key={idx}
                                      label={
                                        file.name ||
                                        file.filename ||
                                        `File ${idx + 1}`
                                      }
                                      onDelete={() =>
                                        removeMediaFile(
                                          cIndex,
                                          lIndex,
                                          `${type}File`,
                                          idx,
                                        )
                                      }
                                      sx={{
                                        m: 0.5,
                                        backgroundColor: "#e3f0ff",
                                        "& .MuiChip-deleteIcon": {
                                          color: "#ef4444",
                                        },
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}

                            {/* New files to upload */}
                            {filesToUpload[
                              `chapters[${cIndex}].lessons[${lIndex}].${type}File`
                            ] &&
                              filesToUpload[
                                `chapters[${cIndex}].lessons[${lIndex}].${type}File`
                              ].length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                  {filesToUpload[
                                    `chapters[${cIndex}].lessons[${lIndex}].${type}File`
                                  ].map((file, idx) => (
                                    <Chip
                                      key={idx}
                                      label={file.name}
                                      onDelete={() =>
                                        removeUploadFile(
                                          cIndex,
                                          lIndex,
                                          type,
                                          idx,
                                        )
                                      }
                                      sx={{
                                        m: 0.5,
                                        backgroundColor: "#c7f0d8",
                                        "& .MuiChip-deleteIcon": {
                                          color: "#ef4444",
                                        },
                                      }}
                                    />
                                  ))}
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
                  onClick={() => addNewLesson(cIndex)}
                  sx={styles.buttonSecondary}
                >
                  Add Lesson
                </Button>
              </Card>
            ))}

            <Button
              variant="contained"
              startIcon={<AddCircle />}
              onClick={addNewChapter}
              sx={{ ...styles.buttonPrimary, mt: 2 }}
            >
              Add Chapter
            </Button>

            <Box sx={styles.navigation}>
              <Button onClick={handleBack} sx={styles.buttonSecondary}>
                Back
              </Button>
              <Button onClick={handleNext} sx={styles.buttonPrimary}>
                Next: Review & Save
              </Button>
            </Box>
          </Paper>
        );

      case 3: {
        const totalLessons = formData.chapters.reduce(
          (acc, chapter) => acc + (chapter.lessons?.length || 0),
          0,
        );
        const contentDurationText = `${formData.contentduration.hours || 0}h ${formData.contentduration.minutes || 0}m`;

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
                4
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
                  Please review all information before updating the course
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3} sx={{ alignItems: "stretch" }}>
              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    p: 0,
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
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
                    </Grid>
                  </Box>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card
                  sx={{
                    p: 0,
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <Box
                    sx={{
                      background:
                        "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
                      p: 1.5,
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <MenuBook sx={{ fontSize: "1.25rem" }} />
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: "white", fontSize: "1rem" }}
                    >
                      Content Structure Summary
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, width: "100%" }}>
                    <Grid
                      container
                      spacing={2}
                      sx={{ width: "100%", margin: 0 }}
                    >
                      <Grid item xs={12} sm={4} sx={{ width: "100%" }}>
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
                            sx={{ fontWeight: 700, color: "#1e40af", mb: 0.5 }}
                          >
                            {formData.chapters.length}
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
                      <Grid item xs={12} sm={4} sx={{ width: "100%" }}>
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
                            sx={{ fontWeight: 700, color: "#166534", mb: 0.5 }}
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
                      <Grid item xs={12} sm={4} sx={{ width: "100%" }}>
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
                            sx={{ fontWeight: 700, color: "#92400e", mb: 0.5 }}
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
                                "& .MuiChip-icon": { color: "#d97706" },
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                )}

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

              <Grid item xs={12}>
                <Card
                  sx={{
                    p: 0,
                    mb: 2,
                    borderRadius: 3,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
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
                    {formData.chapters.map((chapter, cIndex) => (
                      <Card
                        key={cIndex}
                        sx={{
                          p: 2.5,
                          mb: 2.5,
                          backgroundColor: "#faf5ff",
                          border: "2px solid #e9d5ff",
                          borderRadius: 2,
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
                                wordBreak: "break-word",
                                whiteSpace: "pre-wrap",
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
                              {chapter.lessons?.length || 0} lesson
                              {(chapter.lessons?.length || 0) !== 1 ? "s" : ""}
                            </Typography>
                          </Box>
                        </Box>

                        {chapter.lessons?.map((lesson, lIndex) => (
                          <Box
                            key={lIndex}
                            sx={{
                              ml: 1,
                              mb: 2,
                              p: 2,
                              backgroundColor: "#fff",
                              borderRadius: 2,
                              border: "1px solid #f3e8ff",
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
                                  wordBreak: "break-word",
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {lesson.lessonname || "Untitled Lesson"}
                              </Typography>
                            </Box>

                            {["audio", "video", "pdf"].map((type) => {
                              const existingFiles =
                                lesson[`${type}File`] || lesson[type] || [];
                              const newFilesKey = `chapters[${cIndex}].lessons[${lIndex}].${type}File`;
                              const newFiles = filesToUpload[newFilesKey] || [];
                              const allFiles = [...existingFiles, ...newFiles];
                              if (allFiles.length === 0) return null;

                              const Icon =
                                type === "audio"
                                  ? AudioFile
                                  : type === "video"
                                    ? VideoFile
                                    : PictureAsPdf;
                              const color =
                                type === "audio"
                                  ? "#1e40af"
                                  : type === "video"
                                    ? "#9f1239"
                                    : "#92400e";

                              return (
                                <Box key={type} sx={{ mb: 1.5 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontWeight: 600,
                                      color,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                      mb: 0.75,
                                      fontSize: "0.75rem",
                                    }}
                                  >
                                    <Icon sx={{ fontSize: "0.875rem" }} />
                                    {type.charAt(0).toUpperCase() +
                                      type.slice(1)}{" "}
                                    Files ({allFiles.length})
                                  </Typography>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 0.5,
                                      ml: 2,
                                    }}
                                  >
                                    {allFiles.map((file, idx) => (
                                      <Chip
                                        key={idx}
                                        label={
                                          file?.name ||
                                          file?.filename ||
                                          `File ${idx + 1}`
                                        }
                                        size="small"
                                        sx={{
                                          fontSize: "0.7rem",
                                          height: "22px",
                                        }}
                                      />
                                    ))}
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        ))}
                      </Card>
                    ))}
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
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? "Updating Course..." : "Update Course"}
              </Button>
            </Box>
          </Paper>
        );
      }

      default:
        return <div>Unknown step</div>;
    }
  };

  if (isLoading && !formData.coursename) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading course data...</Typography>
      </Box>
    );
  }

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
      </Box>

      <Typography variant="h3" sx={styles.header}>
        Edit Course: {coursename}
      </Typography>

      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3 }}
          onClose={() => setMessage({ type: "", text: "" })}
        >
          {message.text}
        </Alert>
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

export default EditCourse;
