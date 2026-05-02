import { useState } from "react";

export const useCourseForm = (initialCourse) => {
  const [formData, setFormData] = useState({
    coursename: initialCourse?.coursename || "",
    category: initialCourse?.category || "",
    courseduration: initialCourse?.courseduration || "",
    level: initialCourse?.level || "",
    language: initialCourse?.language || "",
    certificates: initialCourse?.certificates || "",
    description: initialCourse?.description || "",
    thumbnail: null,
    previewVideo: null,
    price: initialCourse?.price || {
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
    contentduration: initialCourse?.contentduration || { hours: 0, minutes: 0 },
    whatYoullLearn: initialCourse?.whatYoullLearn || [],
    chapters: initialCourse?.chapters || [],
    emi: initialCourse?.emi || {
      isAvailable: false,
      emiDurationMonths: "",
      monthlyAmount: "",
      totalAmount: "",
      notes: "",
    },
  });

  const [filesToUpload, setFilesToUpload] = useState({});
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [whatYoullLearnInput, setWhatYoullLearnInput] = useState("");

  const handleChange = (e) => {
    const { name, value, files, checked } = e.target;

    if (files) {
      setFilesToUpload((prev) => ({
        ...prev,
        [name]: files,
      }));
    } else if (name.startsWith("price.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        price: { ...prev.price, [key]: value },
      }));
    } else if (name.startsWith("contentduration.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        contentduration: { ...prev.contentduration, [key]: value },
      }));
    } else if (name.startsWith("emi.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        emi: { ...prev.emi, [key]: checked !== undefined ? checked : value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
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
        whatYoullLearn: [...prev.whatYoullLearn, whatYoullLearnInput],
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
    newChapters[index].chaptername = e.target.value;
    setFormData((prev) => ({ ...prev, chapters: newChapters }));
  };

  const addNewChapter = () => {
    setFormData((prev) => ({
      ...prev,
      chapters: [
        ...prev.chapters,
        { chaptername: "", lessons: [] },
      ],
    }));
  };

  const removeChapter = (chapterIdx) => {
    const chapter = formData.chapters[chapterIdx];
    const newFilesToDelete = [
      ...filesToDelete,
      ...(chapter.lessons || []).flatMap((lesson) => [
        lesson.audioFile,
        lesson.documentFile,
        lesson.videoFile,
      ].filter(Boolean)),
    ];

    setFilesToDelete(newFilesToDelete);
    setFormData((prev) => ({
      ...prev,
      chapters: prev.chapters.filter((_, i) => i !== chapterIdx),
    }));
  };

  const addNewLesson = (chapterIdx) => {
    const updatedChapters = [...formData.chapters];
    updatedChapters[chapterIdx].lessons.push({
      lessonname: "",
      lessoninfo: "",
      audioFile: null,
      videoFile: null,
      documentFile: null,
    });
    setFormData((prev) => ({ ...prev, chapters: updatedChapters }));
  };

  const removeLesson = (chapterIdx, lessonIdx) => {
    const lesson = formData.chapters[chapterIdx].lessons[lessonIdx];
    const filesToRemove = [
      lesson.audioFile,
      lesson.documentFile,
      lesson.videoFile,
    ].filter(Boolean);

    setFilesToDelete((prev) => [...prev, ...filesToRemove]);

    const updatedChapters = [...formData.chapters];
    updatedChapters[chapterIdx].lessons = updatedChapters[chapterIdx].lessons.filter(
      (_, i) => i !== lessonIdx
    );
    setFormData((prev) => ({ ...prev, chapters: updatedChapters }));
  };

  return {
    formData,
    setFormData,
    filesToUpload,
    setFilesToUpload,
    filesToDelete,
    setFilesToDelete,
    whatYoullLearnInput,
    setWhatYoullLearnInput,
    handlers: {
      handleChange,
      handleEmiChange,
      handleWhatYoullLearn,
      removeWhatYoullLearn,
      handleChapterChange,
      addNewChapter,
      removeChapter,
      addNewLesson,
      removeLesson,
    },
  };
};
