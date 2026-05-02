import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto"; // SECURITY FIX 3.20.1: For secure random file naming
import { fileURLToPath } from "url";
import asyncHandler from "../../Utils/asyncHandler.js";
import {
  createAnnouncement,
  getActiveAnnouncements,
  getAllAnnouncements,
  getLatestAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  toggleAnnouncementStatus,
} from "../../Controllers/Announcement-Controller/AnnouncementController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for announcement image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../../uploads/announcements");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // SECURITY FIX 3.20.1: Use cryptographically secure random bytes instead of Math.random()
    // Prevents predictable file names and potential directory traversal attacks
    const secureRandom = crypto.randomBytes(8).toString("hex");
    const uniqueSuffix = Date.now() + "-" + secureRandom;
    cb(null, "announcement-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter,
});

// Public routes — /latest must be registered before /:id or "latest" is cast as ObjectId
router.get("/active", asyncHandler(getActiveAnnouncements));
router.get("/latest", asyncHandler(getLatestAnnouncement));
router.get("/:id", asyncHandler(getAnnouncementById));

// Admin routes (add authentication middleware as needed)
// router.use(authMiddleware); // Uncomment and add your auth middleware

router.post("/", upload.single("image"), asyncHandler(createAnnouncement));
router.get("/", asyncHandler(getAllAnnouncements));
router.put("/:id", upload.single("image"), asyncHandler(updateAnnouncement));
router.delete("/:id", asyncHandler(deleteAnnouncement));
router.patch("/:id/toggle-status", asyncHandler(toggleAnnouncementStatus));

export default router;
