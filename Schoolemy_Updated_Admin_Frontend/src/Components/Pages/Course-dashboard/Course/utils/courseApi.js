import axios from "../../../../../Utils/api";

export const fetchCourseData = async (coursename) => {
  try {
    const res = await axios.get(
      `/api/courses/courses/${encodeURIComponent(coursename)}`
    );
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch course");
  }
};

export const updateCourse = async (courseId, courseData, filesToUpload, filesToDelete) => {
  try {
    const formData = new FormData();

    // Add course data
    Object.keys(courseData).forEach((key) => {
      if (key !== "chapters" && key !== "whatYoullLearn") {
        if (typeof courseData[key] === "object" && courseData[key] !== null) {
          formData.append(key, JSON.stringify(courseData[key]));
        } else {
          formData.append(key, courseData[key]);
        }
      }
    });

    // Add arrays
    if (courseData.chapters) {
      formData.append("chapters", JSON.stringify(courseData.chapters));
    }
    if (courseData.whatYoullLearn) {
      formData.append("whatYoullLearn", JSON.stringify(courseData.whatYoullLearn));
    }

    // Add files
    Object.keys(filesToUpload).forEach((key) => {
      const files = filesToUpload[key];
      if (files && files.length > 0) {
        formData.append(key, files[0]);
      }
    });

    // Add files to delete
    if (filesToDelete.length > 0) {
      formData.append("filesToDelete", JSON.stringify(filesToDelete));
    }

    const res = await axios.put(
      `/api/courses/courses/${courseId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to update course");
  }
};

export const parseMediaFiles = (chapters) => {
  if (!chapters) return [];

  return chapters.map((chapter) => ({
    ...chapter,
    lessons: (chapter.lessons || []).map((lesson) => {
      const parsedLesson = { ...lesson };

      if (typeof parsedLesson.audioFile === "string" && parsedLesson.audioFile) {
        try {
          parsedLesson.audioFile = JSON.parse(parsedLesson.audioFile);
        } catch {
          // Keep as string if not valid JSON
        }
      }

      if (typeof parsedLesson.videoFile === "string" && parsedLesson.videoFile) {
        try {
          parsedLesson.videoFile = JSON.parse(parsedLesson.videoFile);
        } catch {
          // Keep as string if not valid JSON
        }
      }

      if (typeof parsedLesson.documentFile === "string" && parsedLesson.documentFile) {
        try {
          parsedLesson.documentFile = JSON.parse(parsedLesson.documentFile);
        } catch {
          // Keep as string if not valid JSON
        }
      }

      // API / Mongoose use lessonName; form UI uses lessonname — keep both in sync
      const title =
        parsedLesson.lessonname ?? parsedLesson.lessonName ?? "";
      parsedLesson.lessonname = title;
      parsedLesson.lessonName = parsedLesson.lessonName ?? title;

      return parsedLesson;
    }),
  }));
};
