import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  LinearProgress,
  Snackbar,
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
  VideoFile,
  AudioFile,
  PictureAsPdf,
} from "@mui/icons-material";

const normalizeMediaUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  const input = rawUrl.trim();
  if (!input) return "";
  if (input.startsWith("blob:") || input.startsWith("data:")) return input;
  try {
    return encodeURI(input);
  } catch {
    return input;
  }
};

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
    thumbnail: null,
    previewVideo: null,
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
  const [uploadProgress, setUploadProgress] = useState({
    show: false,
    file: "",
    percent: 0,
    overall: 0,
  });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [whatYoullLearnInput, setWhatYoullLearnInput] = useState("");

  // Available categories
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

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(
          `/api/courses/courses/${encodeURIComponent(coursename)}`,
        );
        const course = res.data;

        // Parse file arrays if they're strings
        const parseMediaFiles = (chapters) => {
          if (!chapters) return [];

          return chapters.map((chapter) => ({
            ...chapter,
            lessons: (chapter.lessons || []).map((lesson) => {
              const parsedLesson = { ...lesson };

              // Parse audioFile if it's a string
              if (
                typeof parsedLesson.audioFile === "string" &&
                parsedLesson.audioFile
              ) {
                try {
                  parsedLesson.audioFile = JSON.parse(parsedLesson.audioFile);
                  console.log(
                    `Parsed audioFile for "${lesson.lessonname ?? lesson.lessonName ?? ""}":`,
                    parsedLesson.audioFile,
                  );
                } catch (e) {
                  console.warn(
                    `Failed to parse audioFile for "${lesson.lessonname ?? lesson.lessonName ?? ""}":`,
                    e,
                  );
                  parsedLesson.audioFile = [];
                }
              } else if (!Array.isArray(parsedLesson.audioFile)) {
                parsedLesson.audioFile = [];
              }

              // Parse videoFile if it's a string
              if (
                typeof parsedLesson.videoFile === "string" &&
                parsedLesson.videoFile
              ) {
                try {
                  parsedLesson.videoFile = JSON.parse(parsedLesson.videoFile);
                  console.log(
                    `Parsed videoFile for "${lesson.lessonname ?? lesson.lessonName ?? ""}":`,
                    parsedLesson.videoFile,
                  );
                } catch (e) {
                  console.warn(
                    `Failed to parse videoFile for "${lesson.lessonname ?? lesson.lessonName ?? ""}":`,
                    e,
                  );
                  parsedLesson.videoFile = [];
                }
              } else if (!Array.isArray(parsedLesson.videoFile)) {
                parsedLesson.videoFile = [];
              }

              // Parse pdfFile if it's a string
              if (
                typeof parsedLesson.pdfFile === "string" &&
                parsedLesson.pdfFile
              ) {
                try {
                  parsedLesson.pdfFile = JSON.parse(parsedLesson.pdfFile);
                  console.log(
                    `Parsed pdfFile for "${lesson.lessonname ?? lesson.lessonName ?? ""}":`,
                    parsedLesson.pdfFile,
                  );
                } catch (e) {
                  console.warn(
                    `Failed to parse pdfFile for "${lesson.lessonname ?? lesson.lessonName ?? ""}":`,
                    e,
                  );
                  parsedLesson.pdfFile = [];
                }
              } else if (!Array.isArray(parsedLesson.pdfFile)) {
                parsedLesson.pdfFile = [];
              }

              // Mongoose schema uses lessonName; form fields use lessonname
              const title =
                parsedLesson.lessonname ?? parsedLesson.lessonName ?? "";
              parsedLesson.lessonname = title;
              parsedLesson.lessonName = parsedLesson.lessonName ?? title;

              return parsedLesson;
            }),
          }));
        };

        // Calculate price breakdown from loaded data
        const loadedAmount = course.price?.amount || 0;
        const loadedDiscount = course.price?.discount || 0;
        const loadedFinalPrice = loadedAmount * (1 - loadedDiscount / 100);
        // Course Value and Final Price are the SAME
        const loadedCourseValue = loadedFinalPrice;
        const loadedCgst = loadedCourseValue * 0.09;
        const loadedSgst = loadedCourseValue * 0.09;
        const loadedGstTotal = loadedCgst + loadedSgst;
        // Transaction Fee = 2% of (Course Value + CGST + SGST)
        const loadedSubtotalWithGst =
          loadedCourseValue + loadedCgst + loadedSgst;
        const loadedTransactionFee = loadedSubtotalWithGst * 0.02;

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
          thumbnail: course.thumbnail || null,
          previewVideo: course.previewVideo || null,
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

        console.log(
          "Course data loaded with calculated breakdown:",
          calculatedBreakdown,
        );
      } catch (err) {
        console.error("Fetch course error:", err);
        setMessage({ type: "error", text: "Failed to load course data" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [coursename]);

  // Helper function to calculate price breakdown
  const calculatePriceBreakdown = (amount, discount) => {
    const finalPrice = amount * (1 - discount / 100);
    // Course Value and Final Price are the SAME
    const courseValue = finalPrice;
    // Calculate GST based on the final price
    const cgst = courseValue * 0.09;
    const sgst = courseValue * 0.09;
    const gstTotal = cgst + sgst; // 18% of courseValue
    // Transaction Fee = 2% of (Course Value + CGST + SGST)
    const subtotalWithGst = courseValue + cgst + sgst;
    const transactionFee = subtotalWithGst * 0.02;

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

  // Calculate final price and breakdown whenever amount or discount changes
  useEffect(() => {
    const amount = parseFloat(formData.price.amount) || 0;
    const discount = parseFloat(formData.price.discount) || 0;

    // Skip if amount is 0 (initial state before data loads)
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
      const calculatedMonthly =
        months > 0 ? Math.round(finalPrice / months) : 0;

      // Only update if values have actually changed to prevent infinite loop
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
    }
  }, [
    formData.price.finalPrice,
    formData.courseduration,
    formData.emi.isAvailable,
    formData.emi.emiDurationMonths,
    formData.emi.totalAmount,
    formData.emi.monthlyAmount,
  ]);

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
      case 2:
        // Validate chapters and lessons
        for (let chapter of formData.chapters) {
          if (!chapter.title?.trim()) {
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

    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
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
    } else if (name.startsWith("emi.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        emi: {
          ...prev.emi,
          [key]: typeof checked !== "undefined" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
      // No file size limit - S3 direct upload handles unlimited file sizes
      // Handle file uploads
      const fieldName = `chapters[${chapterIndex}].lessons[${lessonIndex}].${name}File`;
      const newFiles = { ...filesToUpload };
      if (!newFiles[fieldName]) {
        newFiles[fieldName] = [];
      }
      newFiles[fieldName] = [...newFiles[fieldName], ...Array.from(files)];
      setFilesToUpload(newFiles);

      // Show success message with file info
      const totalFiles = Array.from(files).length;
      const totalSize = Array.from(files).reduce((sum, f) => sum + f.size, 0);
      const sizeMB = (totalSize / 1024 / 1024).toFixed(1);
      showMessage(
        "success",
        `${totalFiles} ${name} file(s) added (${sizeMB}MB) - will upload to S3`,
      );
    } else {
      lesson[name] = value;
      if (name === "lessonname") {
        lesson.lessonName = value;
      }
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
            {
              lessonname: "",
              audioFile: [],
              videoFile: [],
              pdfFile: [],
            },
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
        // Remove the field entirely if no files left
        if (updated[fieldName].length === 0) {
          delete updated[fieldName];
        }
      }
      return updated;
    });
  };

  // Sanitize payload to remove empty objects {} and undefined values
  const sanitizePayload = (obj) => {
    if (obj === null || obj === undefined) return null;
    if (typeof obj === "object") {
      if (Array.isArray(obj)) {
        // For arrays, if empty, return null; else sanitize each element
        const sanitized = obj
          .map(sanitizePayload)
          .filter((item) => item !== null);
        return sanitized.length > 0 ? sanitized : null;
      } else {
        // For objects, remove keys with {} or undefined values
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          const sanitizedValue = sanitizePayload(value);
          if (
            sanitizedValue !== null &&
            sanitizedValue !== undefined &&
            !(
              typeof sanitizedValue === "object" &&
              Object.keys(sanitizedValue).length === 0
            )
          ) {
            sanitized[key] = sanitizedValue;
          }
        }
        return Object.keys(sanitized).length > 0 ? sanitized : null;
      }
    }
    return obj;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    if (!validateStep(activeStep)) {
      setIsLoading(false);
      return;
    }

    try {
      // =====================================================
      // S3 DIRECT UPLOAD (Same workflow as Createcourses.js)
      // =====================================================
      console.log("Files to upload:", filesToUpload);

      let totalFiles = 0;
      let uploadedCount = 0;
      const s3UploadedFiles = {}; // Track S3 URLs by field name

      // Count total files - safely check for arrays
      for (const fieldName in filesToUpload) {
        if (Array.isArray(filesToUpload[fieldName])) {
          totalFiles += filesToUpload[fieldName].length;
        }
      }

      // Upload files to S3 if there are any
      if (totalFiles > 0) {
        try {
          showMessage("info", `Uploading ${totalFiles} files to S3...`);
          setUploadProgress({ show: true, file: "", percent: 0, overall: 0 });

          // Step 1: Get presigned URLs for all files
          const fileRequests = [];
          // Safely iterate only over array fields to build fileRequests
          for (const fieldName in filesToUpload) {
            if (Array.isArray(filesToUpload[fieldName])) {
              filesToUpload[fieldName].forEach((file) => {
                fileRequests.push({
                  fieldName,
                  fileName: file.name,
                  fileType: file.type,
                  category: fieldName.split(".").pop().replace("File", ""), // 'audio', 'video', 'pdf'
                });
              });
            }
          }

          // Use formData.coursename or fallback to URL parameter
          const finalCourseName = formData.coursename?.trim() || coursename?.trim();

          if (!finalCourseName) {
            throw new Error("Course name is required to upload files. Please reload the page.");
          }

          console.log("Requesting presigned URLs for files:", fileRequests);
          console.log("Using course name:", finalCourseName);

          const urlResponse = await axios.post(
            "/api/courses/generate-upload-urls",
            {
              courseName: finalCourseName,
              files: fileRequests,
            },
          );

          // Safely access presignedUrls with fallback and validation
          const presignedUrls = urlResponse.data?.data || [];
          if (!Array.isArray(presignedUrls)) {
            throw new Error(
              "Invalid API response: presigned URLs must be an array",
            );
          }
          console.log(`Received ${presignedUrls.length} presigned URLs`);

          // Step 2: Upload each file directly to S3
          for (const urlData of presignedUrls) {
            // Find the fieldName by matching the file name
            let fieldName = null;
            for (const fn in filesToUpload) {
              if (
                Array.isArray(filesToUpload[fn]) &&
                filesToUpload[fn].some(
                  (f) => f.name === urlData.originalFileName,
                )
              ) {
                fieldName = fn;
                break;
              }
            }
            if (!fieldName) {
              console.warn(
                `No fieldName found for file: ${urlData.originalFileName}`,
              );
              continue;
            }
            const fileList = filesToUpload[fieldName] || [];
            if (fileList.length === 0) {
              console.warn(`No files found for fieldName: ${fieldName}`);
              continue;
            }
            const file = fileList.find(
              (f) => f.name === urlData.originalFileName,
            );
            if (file) {
              uploadedCount++;
              const percent = Math.round((uploadedCount / totalFiles) * 100);
              setUploadProgress({
                show: true,
                file: file.name,
                percent,
                overall: percent,
              });

              console.log(
                `Uploading ${file.name} to S3 (${uploadedCount}/${totalFiles})...`,
              );

              const contentType =
                urlData.contentType || file.type || "application/octet-stream";
              const uploadResponse = await fetch(urlData.uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": contentType },
                body: file,
              });

              if (!uploadResponse.ok) {
                const detail = (await uploadResponse.text()).slice(0, 500);
                throw new Error(
                  `S3 upload failed for ${file.name} (HTTP ${uploadResponse.status}): ${detail || uploadResponse.statusText}`,
                );
              }

              // Store S3 URL for this field
              if (!s3UploadedFiles[fieldName]) {
                s3UploadedFiles[fieldName] = [];
              }
              s3UploadedFiles[fieldName].push({
                name: file.name,
                url: urlData.s3Url,
              });

              console.log(`Uploaded ${file.name} to S3`);
            }
          }

          showMessage(
            "success",
            `All ${totalFiles} files uploaded to S3 successfully!`,
          );
        } catch (s3Error) {
          console.error("S3 upload failed:", s3Error);
          setIsLoading(false);
          setUploadProgress({ show: false, file: "", percent: 0, overall: 0 });
          showMessage("error", `S3 upload failed: ${s3Error.message}`);
          return;
        }
      }

      setUploadProgress({ show: false, file: "", percent: 0, overall: 0 });

      // Build chapters with S3 URLs
      const updatedChapters = formData.chapters.map((chapter, chIdx) => {
        return {
          title: chapter.title,
          lessons: chapter.lessons.map((lesson, lIdx) => {
            const base = `chapters[${chIdx}].lessons[${lIdx}]`;

            // Start with existing files
            let audioFiles = [...(lesson.audioFile || [])];
            let videoFiles = [...(lesson.videoFile || [])];
            let pdfFiles = [...(lesson.pdfFile || [])];

            // Add newly uploaded S3 files
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
              lessonName: (lesson.lessonname && lesson.lessonname.trim()) || (lesson.lessonName && lesson.lessonName.trim()) || `Lesson ${lIdx + 1}`,
              audioFile: audioFiles,
              videoFile: videoFiles,
              pdfFile: pdfFiles,
            };
          }),
        };
      });

      // Prepare the update payload (JSON, not FormData)
      const updateData = {
        coursename: formData.coursename,
        category: formData.category,
        courseduration: formData.courseduration,
        level: formData.level,
        language: formData.language,
        certificates: formData.certificates,
        description: formData.description,
        thumbnail: formData.thumbnail,
        previewVideo: formData.previewVideo,
        whatYoullLearn: formData.whatYoullLearn,
        price: {
          amount: formData.price.amount,
          discount: formData.price.discount,
          currency: formData.price.currency,
        },
        contentduration: {
          hours: formData.contentduration.hours,
          minutes: formData.contentduration.minutes,
        },
        emi: {
          isAvailable: formData.emi.isAvailable,
          emiDurationMonths: formData.emi.isAvailable
            ? formData.emi.emiDurationMonths
            : null,
          totalAmount: formData.emi.isAvailable
            ? formData.emi.totalAmount
            : null,
          monthlyAmount: formData.emi.isAvailable
            ? formData.emi.monthlyAmount
            : null,
          notes: formData.emi.notes || "",
        },
        chapters: updatedChapters,
        filesToDelete: filesToDelete.filter(
          (f) => typeof f === "string" || (f && f.url),
        ),
      };

      // Sanitize the payload to remove empty objects {} and undefined values
      const sanitizedData = sanitizePayload(updateData);

      // Send update request (no files, just JSON data)
      const response = await axios.put(
        `/api/courses/course/update/${encodeURIComponent(coursename)}`,
        sanitizedData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 60000, // 1 minute should be enough for JSON
        },
      );

      if (response.data.success) {
        showMessage("success", "Course updated successfully!");
        setTimeout(() => navigate("/schoolemy/course-list"), 2000);
      } else {
        showMessage("error", response.data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update error:", err.message);
      setUploadProgress({ show: false, file: "", percent: 0, overall: 0 });

      // More detailed error messages
      let errorMessage = "Update failed";
      if (err.code === "ERR_NETWORK" || err.code === "ERR_CONNECTION_ABORTED") {
        errorMessage =
          "Network error or timeout. Check your internet connection.";
      } else if (err.response?.status === 413) {
        errorMessage = "Payload too large. Please contact support.";
      } else if (err.response) {
        errorMessage =
          err.response.data?.error ||
          err.response.data?.message ||
          `Update failed (${err.response.status})`;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Custom styles matching create page
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

              {/* Thumbnail & Preview Video Section */}
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
                      hidden
                      accept="image/*"
                      name="thumbnailFile"
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
                            ✅ Current Thumbnail
                          </Typography>
                          <img
                            src={formData.thumbnail}
                            alt="Thumbnail"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "150px",
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
                            Will be uploaded when you submit
                          </Typography>
                          <img
                            src={URL.createObjectURL(formData.thumbnail)}
                            alt="Thumbnail preview"
                            style={{
                              maxWidth: "100%",
                              maxHeight: "150px",
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
                      hidden
                      accept="video/*"
                      name="previewVideoFile"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleChange(e);
                        }
                      }}
                    />
                  </Button>
                  {formData.previewVideo && (
                    <Box sx={{ mt: 2, p: 2, backgroundColor: "#e0e7ff", borderRadius: 2, border: "1px solid #c7d2fe" }}>
                      {typeof formData.previewVideo === "string" ? (
                        <>
                          <Typography variant="caption" sx={{ color: "#4f46e5", fontWeight: 600 }}>
                            ✅ Current Preview
                          </Typography>
                          <video
                            src={normalizeMediaUrl(formData.previewVideo)}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "150px",
                              marginTop: "12px",
                              borderRadius: "8px",
                              display: "block",
                              backgroundColor: "#000",
                            }}
                            controls
                          />
                        </>
                      ) : (
                        <>
                          <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
                            🎬 Selected: {formData.previewVideo.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#9ca3af", display: "block", mt: 0.5 }}>
                            Will be uploaded when you submit
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* EMI Options Section */}
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
                Next: Course Content
              </Button>
            </Box>
          </Paper>
        );

      case 2:
        return (
          <Paper sx={styles.section}>
            <Typography sx={styles.sectionTitle}>
              <Avatar sx={{ bgcolor: "#4f46e5", mr: 2 }}>3</Avatar>
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
                      value={lesson.lessonname || lesson.lessonName || ""}
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
                            {/* Display existing files */}
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
                            {/* Display new files to upload */}
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

      case 3:
        const totalLessons = formData.chapters.reduce(
          (acc, chapter) => acc + (chapter.lessons?.length || 0),
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

              {/* Content Structure Summary */}
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
                    {/* Summary of all audio files */}
                    {(() => {
                      let totalAudioFiles = 0;
                      let totalVideoFiles = 0;
                      let totalPdfFiles = 0;

                      formData.chapters.forEach((chapter) => {
                        chapter.lessons?.forEach((lesson) => {
                          const audioFiles =
                            lesson.audioFile || lesson.audio || [];
                          const videoFiles =
                            lesson.videoFile || lesson.video || [];
                          const pdfFiles = lesson.pdfFile || lesson.pdf || [];
                          totalAudioFiles += audioFiles.length;
                          totalVideoFiles += videoFiles.length;
                          totalPdfFiles += pdfFiles.length;
                        });
                      });

                      // Also count new files to upload
                      Object.keys(filesToUpload).forEach((key) => {
                        if (key.includes(".audioFile"))
                          totalAudioFiles += filesToUpload[key].length;
                        if (key.includes(".videoFile"))
                          totalVideoFiles += filesToUpload[key].length;
                        if (key.includes(".pdfFile"))
                          totalPdfFiles += filesToUpload[key].length;
                      });

                      if (
                        totalAudioFiles === 0 &&
                        totalVideoFiles === 0 &&
                        totalPdfFiles === 0
                      )
                        return null;

                      return (
                        <Box
                          sx={{
                            mb: 3,
                            p: 2,
                            backgroundColor: "#f0f9ff",
                            borderRadius: 2,
                            border: "2px solid #bfdbfe",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              mb: 1.5,
                              color: "#1e40af",
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <MenuBook sx={{ fontSize: "1.1rem" }} />
                            Total Files Summary
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                              <Box
                                sx={{
                                  textAlign: "center",
                                  p: 1.5,
                                  backgroundColor: "#dbeafe",
                                  borderRadius: 1,
                                }}
                              >
                                <Typography
                                  variant="h4"
                                  sx={{
                                    fontWeight: 700,
                                    color: "#1e40af",
                                    mb: 0.5,
                                  }}
                                >
                                  {totalAudioFiles}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#1e40af",
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <AudioFile sx={{ fontSize: "0.875rem" }} />
                                  Audio Files
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Box
                                sx={{
                                  textAlign: "center",
                                  p: 1.5,
                                  backgroundColor: "#fce7f3",
                                  borderRadius: 1,
                                }}
                              >
                                <Typography
                                  variant="h4"
                                  sx={{
                                    fontWeight: 700,
                                    color: "#9f1239",
                                    mb: 0.5,
                                  }}
                                >
                                  {totalVideoFiles}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#9f1239",
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <VideoFile sx={{ fontSize: "0.875rem" }} />
                                  Video Files
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                              <Box
                                sx={{
                                  textAlign: "center",
                                  p: 1.5,
                                  backgroundColor: "#fef3c7",
                                  borderRadius: 1,
                                }}
                              >
                                <Typography
                                  variant="h4"
                                  sx={{
                                    fontWeight: 700,
                                    color: "#92400e",
                                    mb: 0.5,
                                  }}
                                >
                                  {totalPdfFiles}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "#92400e",
                                    fontWeight: 600,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 0.5,
                                  }}
                                >
                                  <PictureAsPdf sx={{ fontSize: "0.875rem" }} />
                                  PDF Files
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                      );
                    })()}

                    {formData.chapters.map((chapter, cIndex) => {
                      // Helper function to get file name from file object
                      const getFileName = (file) => {
                        if (!file) return "Unknown file";
                        if (typeof file === "string")
                          return decodeURIComponent(file);
                        // Check for File object (new uploads)
                        if (file instanceof File) return file.name;
                        // Check for various file object structures - prioritize name field
                        if (file.name) return file.name;
                        if (file.filename) return file.filename;
                        if (file.originalname) return file.originalname;
                        // Check for URL-based files (from backend)
                        if (file.url) {
                          const urlParts = file.url.split("/");
                          const encodedName =
                            urlParts[urlParts.length - 1] || file.url;
                          try {
                            // Decode URL-encoded Tamil/Unicode characters
                            return decodeURIComponent(encodedName);
                          } catch (e) {
                            console.warn(
                              "Failed to decode filename:",
                              encodedName,
                            );
                            return encodedName;
                          }
                        }
                        // Check for path-based files
                        if (file.path) {
                          const pathParts = file.path.split("/");
                          const encodedName =
                            pathParts[pathParts.length - 1] || file.path;
                          try {
                            return decodeURIComponent(encodedName);
                          } catch (e) {
                            return encodedName;
                          }
                        }
                        // Fallback
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
                                {(chapter.lessons?.length || 0) !== 1
                                  ? "s"
                                  : ""}
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
                                    wordBreak: "break-word",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {lesson.lessonname ||
                                    lesson.lessonName ||
                                    "Untitled Lesson"}
                                </Typography>
                              </Box>

                              {/* Display existing files */}
                              {["audio", "video", "pdf"].map((type) => {
                                // Check multiple possible file locations
                                const existingFiles =
                                  lesson[`${type}File`] || lesson[type] || [];
                                const newFilesKey = `chapters[${cIndex}].lessons[${lIndex}].${type}File`;
                                const newFiles =
                                  filesToUpload[newFilesKey] || [];

                                // Combine all files
                                const allFiles = [
                                  ...existingFiles,
                                  ...newFiles,
                                ];

                                if (allFiles.length === 0) return null;

                                return (
                                  <Box key={type} sx={{ mb: 1.5 }}>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: 600,
                                        color:
                                          type === "audio"
                                            ? "#1e40af"
                                            : type === "video"
                                              ? "#9f1239"
                                              : "#92400e",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 0.5,
                                        mb: 0.75,
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      {type === "audio" && (
                                        <AudioFile
                                          sx={{ fontSize: "0.875rem" }}
                                        />
                                      )}
                                      {type === "video" && (
                                        <VideoFile
                                          sx={{ fontSize: "0.875rem" }}
                                        />
                                      )}
                                      {type === "pdf" && (
                                        <PictureAsPdf
                                          sx={{ fontSize: "0.875rem" }}
                                        />
                                      )}
                                      {type.charAt(0).toUpperCase() +
                                        type.slice(1)}{" "}
                                      Files ({allFiles.length})
                                      {existingFiles.length > 0 &&
                                        newFiles.length > 0 && (
                                          <span
                                            style={{
                                              fontSize: "0.65rem",
                                              opacity: 0.7,
                                              marginLeft: "4px",
                                            }}
                                          >
                                            ({existingFiles.length} existing,{" "}
                                            {newFiles.length} new)
                                          </span>
                                        )}
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 0.5,
                                        ml: 2,
                                      }}
                                    >
                                      {/* Display existing files */}
                                      {existingFiles.map((file, fIndex) => (
                                        <Chip
                                          key={`existing-${fIndex}`}
                                          label={getFileName(file)}
                                          size="small"
                                          sx={{
                                            backgroundColor:
                                              type === "audio"
                                                ? "#dbeafe"
                                                : type === "video"
                                                  ? "#fce7f3"
                                                  : "#fef3c7",
                                            color:
                                              type === "audio"
                                                ? "#1e40af"
                                                : type === "video"
                                                  ? "#9f1239"
                                                  : "#92400e",
                                            fontSize: "0.7rem",
                                            maxWidth: "280px",
                                            height: "22px",
                                            border: "1px solid",
                                            borderColor:
                                              type === "audio"
                                                ? "#93c5fd"
                                                : type === "video"
                                                  ? "#f9a8d4"
                                                  : "#fde68a",
                                            "& .MuiChip-label": {
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              padding: "0 8px",
                                            },
                                          }}
                                        />
                                      ))}
                                      {/* Display new files to upload */}
                                      {newFiles.map((file, fIndex) => (
                                        <Chip
                                          key={`new-${fIndex}`}
                                          label={file.name || getFileName(file)}
                                          size="small"
                                          sx={{
                                            backgroundColor:
                                              type === "audio"
                                                ? "#dbeafe"
                                                : type === "video"
                                                  ? "#fce7f3"
                                                  : "#fef3c7",
                                            color:
                                              type === "audio"
                                                ? "#1e40af"
                                                : type === "video"
                                                  ? "#9f1239"
                                                  : "#92400e",
                                            fontSize: "0.7rem",
                                            maxWidth: "280px",
                                            height: "22px",
                                            border: "2px solid",
                                            borderColor:
                                              type === "audio"
                                                ? "#3b82f6"
                                                : type === "video"
                                                  ? "#ec4899"
                                                  : "#f59e0b",
                                            fontWeight: 600,
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
                                );
                              })}

                              {/* Show message if no files */}
                              {(!lesson.audioFile ||
                                lesson.audioFile.length === 0) &&
                                (!lesson.audio || lesson.audio.length === 0) &&
                                (!lesson.videoFile ||
                                  lesson.videoFile.length === 0) &&
                                (!lesson.video || lesson.video.length === 0) &&
                                (!lesson.pdfFile ||
                                  lesson.pdfFile.length === 0) &&
                                (!lesson.pdf || lesson.pdf.length === 0) &&
                                (!filesToUpload[
                                  `chapters[${cIndex}].lessons[${lIndex}].audioFile`
                                ] ||
                                  filesToUpload[
                                    `chapters[${cIndex}].lessons[${lIndex}].audioFile`
                                  ].length === 0) &&
                                (!filesToUpload[
                                  `chapters[${cIndex}].lessons[${lIndex}].videoFile`
                                ] ||
                                  filesToUpload[
                                    `chapters[${cIndex}].lessons[${lIndex}].videoFile`
                                  ].length === 0) &&
                                (!filesToUpload[
                                  `chapters[${cIndex}].lessons[${lIndex}].pdfFile`
                                ] ||
                                  filesToUpload[
                                    `chapters[${cIndex}].lessons[${lIndex}].pdfFile`
                                  ].length === 0) && (
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
                    {formData.chapters.length === 0 && (
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

            {/* Upload Progress Indicator */}
            {uploadProgress.show && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  backgroundColor: "#f0f9ff",
                  borderRadius: 2,
                  border: "1px solid #bae6fd",
                }}
              >
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ color: "#0369a1", fontWeight: 600 }}
                >
                  Uploading Files to S3...
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, color: "#64748b" }}>
                  Current: {uploadProgress.file}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress.overall}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#e0f2fe",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: "#0ea5e9",
                        },
                      }}
                    />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ minWidth: 50, color: "#0369a1", fontWeight: 600 }}
                  >
                    {uploadProgress.overall}%
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={styles.navigation}>
              <Button onClick={handleBack} sx={styles.buttonSecondary}>
                Back
              </Button>
              <Button
                type="submit"
                sx={styles.buttonPrimary}
                disabled={isLoading || uploadProgress.show}
                startIcon={
                  isLoading || uploadProgress.show ? (
                    <CircularProgress size={20} />
                  ) : null
                }
                onClick={handleSubmit}
              >
                {uploadProgress.show
                  ? "Uploading Files..."
                  : isLoading
                    ? "Updating Course..."
                    : "Update Course"}
              </Button>
            </Box>
          </Paper>
        );

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

export default EditCourse;
