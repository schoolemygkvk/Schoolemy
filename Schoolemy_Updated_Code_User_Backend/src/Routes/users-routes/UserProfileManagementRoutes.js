import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import multer from "multer";
import { verifyToken } from "../../Middleware/authMiddleware.js";
import {
  getUserProfileSecure,
  updateUserProfileSecure,
  updateProfilePictureSecure,
  deleteUserAccountSecure,
} from "../../Controllers/user-Controller/UserProfileManagementController.js";

const router = express.Router();

// SECURITY FIX 2.16.1: Enforce consistent file size limit
// Prevents DoS attacks via large file uploads consuming server memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for profile pictures
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
        ),
        false,
      );
    }
  },
});



// Get user profile (ownership verified)
router.get("/:userId", verifyToken, asyncHandler(getUserProfileSecure));

// Update user profile (ownership verified)
router.put("/:userId", verifyToken, asyncHandler(updateUserProfileSecure));

// SECURITY FIX 3.40.1: Update profile picture with Base64 storage (ownership verified)
// Automatically removes old image and stores new one in database
router.put(
  "/:userId/picture",
  verifyToken,
  upload.single("profilePicture"),
  asyncHandler(updateProfilePictureSecure),
);

// Delete user account (ownership verified)
router.delete("/:userId", verifyToken, asyncHandler(deleteUserAccountSecure));

export default router;
