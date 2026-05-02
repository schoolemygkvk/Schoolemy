import express from "express";
import asyncHandler from "../Utils/asyncHandler.js";
import {
  downloadAudioFile,
  downloadPdfFile,
  downloadStaffImage,
} from "../Controllers/FileDownloadController.js";
import { verifyToken } from "../Middleware/authMiddleware.js";

const router = express.Router();



// Audio file download (requires enrollment in course)
router.get(
  "/download/:courseId/:fileId/audio",
  verifyToken,
  asyncHandler(downloadAudioFile),
);

// PDF file download (requires enrollment in course)
router.get(
  "/download/:courseId/:pdfId/pdf",
  verifyToken,
  asyncHandler(downloadPdfFile),
);

// Staff profile image download (requires authentication)
router.get(
  "/download/staff-image/:staffId",
  verifyToken,
  asyncHandler(downloadStaffImage),
);

export default router;
