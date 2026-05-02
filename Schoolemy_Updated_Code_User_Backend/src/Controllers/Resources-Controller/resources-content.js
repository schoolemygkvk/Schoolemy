import  logger  from "../../Utils/logger.js";

import Course from "../../Models/Course-Model/Course-Model.js";
import PurchasedCourse from "../../Models/Purchased-Courses-Model/purchased-courses-model.js";
import path from "path";
import fs from "fs";
import {
  sanitizeLessonMediaUrls,
  validateLessonMediaUrl,
} from "../../Utils/lessonMediaUrl.js";

export const getResourcesByLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if user is enrolled in this course
    const enrolled = await PurchasedCourse.findOne({
      userId,
      courseId,
      paymentStatus: "completed",
    });

    if (!enrolled) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // Fetch course with the specific lesson
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Find the lesson in chapters
    let targetLesson = null;
    for (const chapter of course.chapters || []) {
      const lesson = chapter.lessons?.find((l) => l._id.toString() === lessonId);
      if (lesson) {
        targetLesson = lesson;
        break;
      }
    }

    if (!targetLesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    const safeLesson = sanitizeLessonMediaUrls(targetLesson);

    // Return resources (videos, audio, PDFs)
    res.json({
      success: true,
      lesson: {
        id: targetLesson._id,
        name: targetLesson.lessonname,
        resources: {
          videos: safeLesson.videoFile || [],
          audio: safeLesson.audioFile || [],
          pdfs: safeLesson.pdfFile || [],
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching resources:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch resources",
      error: error.message,
    });
  }
};


export const downloadResource = async (req, res) => {
  try {
    const { courseId, resourceId, fileType } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate file type
    if (!["pdf", "video", "audio"].includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type",
      });
    }

    // Check if user is enrolled in this course
    const enrolled = await PurchasedCourse.findOne({
      userId,
      courseId,
      paymentStatus: "completed",
    });

    if (!enrolled) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    // Fetch course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Find the resource in course structure
    let resourceUrl = null;
    for (const chapter of course.chapters || []) {
      for (const lesson of chapter.lessons || []) {
        const fileArray = (() => {
          switch (fileType) {
          case "pdf":
            return lesson.pdfFile;
          case "video":
            return lesson.videoFile;
          case "audio":
            return lesson.audioFile;
          default:
            return [];
          }
        })();

        const resource = fileArray?.find((f) => f._id?.toString() === resourceId);
        if (resource) {
          resourceUrl = resource.url;
          break;
        }
      }
    }

    if (!resourceUrl) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    const mediaKind =
      fileType === "pdf" ? "pdf" : fileType === "audio" ? "audio" : "video";
    const validated = validateLessonMediaUrl(resourceUrl, mediaKind);
    if (!validated.ok) {
      return res.status(400).json({
        success: false,
        message: "Invalid or disallowed resource URL",
      });
    }
    resourceUrl = validated.url;

    // If URL is external (S3, CloudStorage), redirect to it
    if (resourceUrl.startsWith("http://") || resourceUrl.startsWith("https://")) {
      return res.redirect(resourceUrl);
    }

    // If it's a local file path, serve it
    const filePath = path.join(process.cwd(), resourceUrl);

    // Security: Prevent path traversal attacks
    if (!filePath.startsWith(path.join(process.cwd()))) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "File not found on server",
      });
    }

    // Set appropriate headers based on file type
    const contentTypeMap = {
      pdf: "application/pdf",
      video: "video/mp4",
      audio: "audio/mpeg",
    };

    res.setHeader("Content-Type", contentTypeMap[fileType] || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${path.basename(filePath)}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("error", (error) => {
      logger.error("Error streaming file:", error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error downloading file",
        });
      }
    });
  } catch (error) {
    logger.error("Error downloading resource:", error);
    res.status(500).json({
      success: false,
      message: "Failed to download resource",
      error: error.message,
    });
  }
};


export const getCourseResources = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?._id || req.user?.id;

    // Fetch course (public data)
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check enrollment if user is logged in
    let isEnrolled = false;
    if (userId) {
      const enrolled = await PurchasedCourse.findOne({
        userId,
        courseId,
        paymentStatus: "completed",
      });
      isEnrolled = !!enrolled;
    }

    // Build resource structure
    const chapters = course.chapters?.map((chapter) => ({
      id: chapter._id,
      title: chapter.title,
      lessons: chapter.lessons?.map((lesson) => {
        const safe = sanitizeLessonMediaUrls(lesson);
        return {
          id: lesson._id,
          name: lesson.lessonname,
          // Only show resource metadata if enrolled
          hasVideos: isEnrolled && (safe.videoFile?.length > 0),
          hasAudio: isEnrolled && (safe.audioFile?.length > 0),
          hasPdf: isEnrolled && (safe.pdfFile?.length > 0),
          // For enrolled users, include actual resource data
          ...(isEnrolled && {
            videos: safe.videoFile || [],
            audio: safe.audioFile || [],
            pdfs: safe.pdfFile || [],
          }),
        };
      }),
    })) || [];

    res.json({
      success: true,
      course: {
        id: course._id,
        title: course.title || course.coursename,
        isEnrolled,
      },
      chapters,
    });
  } catch (error) {
    logger.error("Error fetching course resources:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch course resources",
      error: error.message,
    });
  }
};
