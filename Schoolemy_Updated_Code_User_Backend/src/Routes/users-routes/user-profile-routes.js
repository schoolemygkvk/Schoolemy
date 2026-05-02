import express from "express";
import asyncHandler from "../../Utils/asyncHandler.js";
import multer from "multer";
import {
  getUserProfile,
  updateUserProfile,
  updateProfilePicture,
  getProfilePictureImage,
  getUserEnrolledCourses,
  generateProfileUploadUrl,
} from "../../Controllers/user-Controller/user-profile-controller.js";

const router = express.Router();



// Updated multer configuration to use memory storage for S3 upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit (aligned with controller validation)
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/heif",
      "image/heic",
      "image/x-heic",
      "image/x-heif",
    ];

    // Check both MIME type and file extension for broader compatibility
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".heif", ".heic"];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf("."));

    const mimeTypeValid = allowedMimeTypes.includes(file.mimetype);
    const extensionValid = allowedExtensions.includes(fileExtension);

    if (mimeTypeValid || extensionValid) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG, GIF, WebP, and HEIC (iPhone) are allowed.",
        ),
        false,
      );
    }
  },
});

router.get("/profiles", asyncHandler(getUserProfile)); // Get user profile (excludes base64 by default, use ?includeImage=true to include)
router.get("/user/courses", asyncHandler(getUserEnrolledCourses)); // Get user's enrolled courses

// SECURITY FIX 3.40.2: Get profile picture as image file (for direct img src)
// Usage: <img src="/api/v1/user-profile/picture/:userId" />
router.get("/picture/:userId", asyncHandler(getProfilePictureImage));

router.put("/putprofile", asyncHandler(updateUserProfile));
router.post("/upload-url", asyncHandler(generateProfileUploadUrl));
router.put("/profile-picture", upload.single("profilePicture"), asyncHandler(updateProfilePicture));

export default router;