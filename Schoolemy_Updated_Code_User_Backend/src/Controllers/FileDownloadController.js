import { logger } from "../Utils/logger.js";

import mongoose from "mongoose";
import Course from "../Models/Course-Model/Course-Model.js";
import Payment from "../Models/Payment-Model/Payment-Model.js";
import StaffDetails from "../Models/Resources-Model/staff-details-model.js";



// Allowed file types for downloads
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg"];
const ALLOWED_PDF_TYPES = ["application/pdf"];
const MAX_AUDIO_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_PDF_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_STAFF_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB


function normalizeUserId(req) {
  const raw = req.userId;
  if (!raw || !mongoose.Types.ObjectId.isValid(raw)) return null;
  return new mongoose.Types.ObjectId(raw);
}


async function verifyEnrollment(userId, courseId) {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return false;
  }
  const cid = new mongoose.Types.ObjectId(courseId);
  const payment = await Payment.findOne({
    userId,
    courseId: cid,
    paymentStatus: "completed",
  });
  return !!payment;
}


function validateFileUrl(url) {
  if (!url || typeof url !== "string") {
    return { valid: false, error: "Invalid file URL" };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    return { valid: false, error: "Malformed URL" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, error: "Invalid file URL scheme" };
  }

  const pathAndQuery = `${parsed.pathname}${parsed.search || ""}`;
  if (pathAndQuery.includes("..") || parsed.pathname.includes("//")) {
    return { valid: false, error: "Invalid file path" };
  }

  return { valid: true, url: parsed.href };
}


function validateContentType(contentType, fileExtension) {
  const ext = fileExtension.toLowerCase();

  if (ext === "mp3" || ext === "audio") {
    return ALLOWED_AUDIO_TYPES.includes(contentType);
  }

  if (ext === "pdf") {
    return ALLOWED_PDF_TYPES.includes(contentType);
  }

  if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
    return contentType.startsWith("image/");
  }

  return false;
}


export const downloadAudioFile = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const { courseId, fileId } = req.params;

    // SECURITY FIX 3.45.1: Verify authentication
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // SECURITY FIX 3.45.1: Verify course ID is valid
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // SECURITY FIX 3.45.1: Verify user is enrolled in course
    const isEnrolled = await verifyEnrollment(
      userId,
      new mongoose.Types.ObjectId(courseId),
    );
    if (!isEnrolled) {
      logger.warn("[Security] Unauthorized audio download attempt", {
        userId: userId.toString(),
        courseId,
        fileId,
        ip: req.ip,
      });
      return res.status(403).json({
        success: false,
        message: "You do not have access to this course",
      });
    }

    // SECURITY FIX 3.45.1: Verify course exists
    const course = await Course.findById(courseId).select(
      "chapters title",
    );
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // SECURITY FIX 3.45.1: Find audio file in course and validate it exists
    let audioFileUrl = null;
    let fileName = null;
    let foundInCourse = false;

    for (const chapter of course.chapters || []) {
      for (const lesson of chapter.lessons || []) {
        if (lesson.audioFile && Array.isArray(lesson.audioFile)) {
          const audioFile = lesson.audioFile.find(
            (af) => af._id?.toString() === fileId,
          );
          if (audioFile) {
            audioFileUrl = audioFile.url;
            fileName = audioFile.name || "audio.mp3";
            foundInCourse = true;
            break;
          }
        }
      }
      if (foundInCourse) break;
    }

    if (!foundInCourse || !audioFileUrl) {
      logger.warn("[Security] Audio file not found in course", {
        userId: userId.toString(),
        courseId,
        fileId,
      });
      return res.status(404).json({
        success: false,
        message: "Audio file not found",
      });
    }

    // SECURITY FIX 3.45.1: Validate file URL
    const urlValidation = validateFileUrl(audioFileUrl);
    if (!urlValidation.valid) {
      logger.error("[Security] Invalid file URL", {
        courseId,
        fileId,
        error: urlValidation.error,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid file URL",
      });
    }

    // SECURITY FIX 3.45.1: Fetch file from storage and validate
    try {
      const fileResponse = await fetch(audioFileUrl);

      if (!fileResponse.ok) {
        logger.error("[Security] Failed to fetch audio file", {
          status: fileResponse.status,
          courseId,
          fileId,
        });
        return res.status(fileResponse.status).json({
          success: false,
          message: "Failed to retrieve file",
        });
      }

      // SECURITY FIX 3.45.1: Validate content type
      const contentType = fileResponse.headers.get("content-type");
      const fileExtension = fileName.split(".").pop() || "mp3";

      if (!validateContentType(contentType || "audio/mpeg", fileExtension)) {
        logger.warn("[Security] Invalid audio content type", {
          contentType,
          fileName,
          courseId,
          fileId,
        });
        return res.status(400).json({
          success: false,
          message: "Invalid file type",
        });
      }

      // SECURITY FIX 3.45.1: Validate file size
      const contentLength = parseInt(
        fileResponse.headers.get("content-length"),
        10,
      );
      if (contentLength && contentLength > MAX_AUDIO_SIZE) {
        logger.warn("[Security] Audio file exceeds size limit", {
          size: contentLength,
          maxSize: MAX_AUDIO_SIZE,
          courseId,
          fileId,
        });
        return res.status(413).json({
          success: false,
          message: "File is too large",
        });
      }

      // SECURITY FIX 3.45.1: Log successful download
      logger.debug("[Download] Audio file download", {
        userId: userId.toString(),
        courseId,
        fileName,
        size: contentLength,
      });

      // Set response headers for download
      res.setHeader("Content-Type", contentType || "audio/mpeg");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(fileName)}"`,
      );
      res.setHeader("Content-Length", contentLength || 0);
      res.setHeader("Cache-Control", "no-cache");

      // Stream file to client
      const buffer = await fileResponse.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (fetchError) {
      logger.error("[Download Error] Failed to stream audio file", {
        error: fetchError.message,
        courseId,
        fileId,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to download file",
      });
    }
  } catch (error) {
    logger.error("[downloadAudioFile Error]", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const downloadPdfFile = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const { courseId, pdfId } = req.params;

    // SECURITY FIX 3.45.1: Verify authentication
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // SECURITY FIX 3.45.1: Verify course ID is valid
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    // SECURITY FIX 3.45.1: Verify user is enrolled in course
    const isEnrolled = await verifyEnrollment(
      userId,
      new mongoose.Types.ObjectId(courseId),
    );
    if (!isEnrolled) {
      logger.warn("[Security] Unauthorized PDF download attempt", {
        userId: userId.toString(),
        courseId,
        pdfId,
        ip: req.ip,
      });
      return res.status(403).json({
        success: false,
        message: "You do not have access to this course",
      });
    }

    // SECURITY FIX 3.45.1: Verify course exists
    const course = await Course.findById(courseId).select(
      "chapters title",
    );
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // SECURITY FIX 3.45.1: Find PDF in course and validate it exists
    // PDFs live on lesson.pdfFile (same pattern as audio on lesson.audioFile).
    let pdfUrl = null;
    let fileName = null;
    let foundInCourse = false;

    for (const chapter of course.chapters || []) {
      for (const lesson of chapter.lessons || []) {
        if (lesson.pdfFile && Array.isArray(lesson.pdfFile)) {
          const pdf = lesson.pdfFile.find((p) => p._id?.toString() === pdfId);
          if (pdf) {
            pdfUrl = pdf.url;
            fileName = pdf.name || pdf.title || "document.pdf";
            foundInCourse = true;
            break;
          }
        }
      }
      if (foundInCourse) break;
    }

    // Legacy: some courses stored PDFs on chapter.pdfs
    if (!foundInCourse) {
      for (const chapter of course.chapters || []) {
        if (chapter.pdfs && Array.isArray(chapter.pdfs)) {
          const pdf = chapter.pdfs.find((p) => p._id?.toString() === pdfId);
          if (pdf) {
            pdfUrl = pdf.url;
            fileName = pdf.name || pdf.title || "document.pdf";
            foundInCourse = true;
            break;
          }
        }
      }
    }

    if (!foundInCourse || !pdfUrl) {
      logger.warn("[Security] PDF file not found in course", {
        userId: userId.toString(),
        courseId,
        pdfId,
      });
      return res.status(404).json({
        success: false,
        message: "PDF file not found",
      });
    }

    // SECURITY FIX 3.45.1: Validate file URL
    const urlValidation = validateFileUrl(pdfUrl);
    if (!urlValidation.valid) {
      logger.error("[Security] Invalid PDF URL", {
        courseId,
        pdfId,
        error: urlValidation.error,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid file URL",
      });
    }

    // SECURITY FIX 3.45.1: Fetch file from storage and validate
    try {
      const fileResponse = await fetch(pdfUrl);

      if (!fileResponse.ok) {
        logger.error("[Security] Failed to fetch PDF file", {
          status: fileResponse.status,
          courseId,
          pdfId,
        });
        return res.status(fileResponse.status).json({
          success: false,
          message: "Failed to retrieve file",
        });
      }

      // SECURITY FIX 3.45.1: Validate content type
      const contentType = fileResponse.headers.get("content-type");
      if (contentType && !ALLOWED_PDF_TYPES.includes(contentType)) {
        logger.warn("[Security] Invalid PDF content type", {
          contentType,
          fileName,
          courseId,
          pdfId,
        });
        return res.status(400).json({
          success: false,
          message: "Invalid file type",
        });
      }

      // SECURITY FIX 3.45.1: Validate file size
      const contentLength = parseInt(
        fileResponse.headers.get("content-length"),
        10,
      );
      if (contentLength && contentLength > MAX_PDF_SIZE) {
        logger.warn("[Security] PDF file exceeds size limit", {
          size: contentLength,
          maxSize: MAX_PDF_SIZE,
          courseId,
          pdfId,
        });
        return res.status(413).json({
          success: false,
          message: "File is too large",
        });
      }

      // SECURITY FIX 3.45.1: Log successful download
      logger.debug("[Download] PDF file download", {
        userId: userId.toString(),
        courseId,
        fileName,
        size: contentLength,
      });

      // Set response headers for download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(fileName)}"`,
      );
      res.setHeader("Content-Length", contentLength || 0);
      res.setHeader("Cache-Control", "no-cache");

      // Stream file to client
      const buffer = await fileResponse.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (fetchError) {
      logger.error("[Download Error] Failed to stream PDF file", {
        error: fetchError.message,
        courseId,
        pdfId,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to download file",
      });
    }
  } catch (error) {
    logger.error("[downloadPdfFile Error]", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const downloadStaffImage = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const { staffId } = req.params;

    // SECURITY FIX 3.45.1: Verify authentication
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // SECURITY FIX 3.45.1: Verify staff ID is valid
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid staff ID",
      });
    }

    // SECURITY FIX 3.45.1: Verify staff member exists
    const staff = await StaffDetails.findById(staffId).select(
      "name profilePicture",
    );
    if (!staff || !staff.profilePicture) {
      return res.status(404).json({
        success: false,
        message: "Staff image not found",
      });
    }

    const imageUrl = staff.profilePicture.url;

    // SECURITY FIX 3.45.1: Validate file URL
    const urlValidation = validateFileUrl(imageUrl);
    if (!urlValidation.valid) {
      logger.error("[Security] Invalid staff image URL", {
        staffId,
        error: urlValidation.error,
      });
      return res.status(400).json({
        success: false,
        message: "Invalid file URL",
      });
    }

    // SECURITY FIX 3.45.1: Fetch image and validate
    try {
      const fileResponse = await fetch(imageUrl);

      if (!fileResponse.ok) {
        return res.status(fileResponse.status).json({
          success: false,
          message: "Failed to retrieve image",
        });
      }

      // SECURITY FIX 3.45.1: Validate content type (must be image)
      const contentType = fileResponse.headers.get("content-type");
      if (!contentType || !contentType.startsWith("image/")) {
        logger.warn("[Security] Invalid staff image content type", {
          contentType,
          staffId,
        });
        return res.status(400).json({
          success: false,
          message: "Invalid file type",
        });
      }

      // SECURITY FIX 3.45.1: Validate file size
      const contentLength = parseInt(
        fileResponse.headers.get("content-length"),
        10,
      );
      if (contentLength && contentLength > MAX_STAFF_IMAGE_SIZE) {
        logger.warn("[Security] Staff image exceeds size limit", {
          size: contentLength,
          maxSize: MAX_STAFF_IMAGE_SIZE,
          staffId,
        });
        return res.status(413).json({
          success: false,
          message: "File is too large",
        });
      }

      // Set response headers
      res.setHeader("Content-Type", contentType);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(staff.name + ".jpg")}"`,
      );
      res.setHeader("Content-Length", contentLength || 0);

      // Stream file to client
      const buffer = await fileResponse.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (fetchError) {
      logger.error("[Download Error] Failed to stream staff image", {
        error: fetchError.message,
        staffId,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to download image",
      });
    }
  } catch (error) {
    logger.error("[downloadStaffImage Error]", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
