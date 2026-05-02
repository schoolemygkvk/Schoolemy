import  logger  from "../../Utils/logger.js";
import mongoose from "mongoose";

import User from "../../Models/User-Model/User-Model.js";
import Course from "../../Models/Course-Model/Course-Model.js";
import TutorCourse from "../../Models/Tutor-Course/Tutor-course-model.js";
import sharp from "sharp";
import {
  uploadProfileImageToCloud,
  deleteProfileImageFromCloud,
  generatePresignedUploadUrl,
} from "../../Utils/CloudStorageService.js";

// Helper function to convert mobile string to number (removes + prefix if present)
const convertMobileToNumber = (mobile) => {
  if (typeof mobile === "number") return mobile;
  if (typeof mobile === "string") {
    // Remove + prefix and any spaces, then convert to number
    const cleaned = mobile.replace(/^\+|\s/g, "");
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
  }
  return null;
};

// SECURITY FIX 3.40.2: Helper to convert binary to Base64 for frontend display
// Only used when fetching image to send to frontend
const convertBinaryToBase64 = (buffer, mimetype) => {
  if (!buffer) return null;
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

const validateImageFile = (file) => {
  const allowedTypes = [
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
  const maxSize = 10 * 1024 * 1024; // 10MB (reduced for better performance)

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, GIF, WebP, and HEIC (iPhone) are allowed.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "File size too large. Maximum 10MB allowed.",
    };
  }

  return { valid: true };
};


function serializeProfilePictureForClient(pp) {
  if (pp == null || typeof pp !== "object" || Array.isArray(pp)) return pp;
  const out = { ...pp };
  if (out.data != null && typeof out.data !== "string") {
    if (Buffer.isBuffer(out.data)) {
      out.data = out.data.toString("utf8");
    } else if (out.data._bsontype === "Binary") {
      out.data = out.data.toString("utf8");
    } else if (typeof out.data.toString === "function") {
      try {
        out.data = out.data.toString("utf8");
      } catch {
        /* leave as-is */
      }
    }
  }
  return out;
}

const PLACEHOLDER_PROFILE_HOST = "cdn.schoolemy.com";

// Get User Profile
export const getUserProfile = async (req, res) => {
  try {
    // Always include profileImageUrl (S3 URL) in the response
    const user = await User.findById(req.userId)
      .select("-password")
      .select("+profileImageUrl")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    // Ensure profileImageUrl is included in response (even if null)
    if (!user.profileImageUrl) {
      // For migration: if no S3 URL but old binary exists, fetch and convert to Base64
      const rawDoc = await User.collection.findOne(
        { _id: user._id },
        { projection: { profilePicture: 1 } },
      );

      if (rawDoc?.profilePicture?.data) {
        // QUICK FIX 5: Instead of bloating response with Base64, use placeholder
        // Users should upload new profile pic to S3 via updateUserProfile
        user.profileImageUrl = `https://${PLACEHOLDER_PROFILE_HOST}/default-avatar.png`;
      }
    }

    res.status(200).json(user);
  } catch (error) {
    logger.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// SECURITY FIX 3.40.2: Get profile picture as image file (for direct img src)
// Returns image as binary with correct Content-Type header
export const getProfilePictureImage = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.collection.findOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { projection: { profilePicture: 1 } },
    );

    if (!user || !user.profilePicture || !user.profilePicture.data) {
      return res.status(404).json({
        success: false,
        message: "Profile picture not found",
      });
    }

    const { data, contentType } = user.profilePicture;

    // Set response headers for image
    res.setHeader("Content-Type", contentType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    res.setHeader("Content-Length", data.length);

    // Send binary image data
    if (Buffer.isBuffer(data)) {
      res.send(data);
    } else if (typeof data === "string" && data.startsWith("data:")) {
      // Fallback for Base64 string format
      const base64Data = data.split(",")[1];
      res.send(Buffer.from(base64Data, "base64"));
    } else {
      res.status(500).json({
        success: false,
        message: "Invalid image data format",
      });
    }
  } catch (error) {
    logger.error("Error fetching profile picture:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile picture",
      error: error.message,
    });
  }
};

// Get user's enrolled courses with populated course data
export const getUserEnrolledCourses = async (req, res) => {
  try {
    // First, check if user has created tutor courses
    const tutorCourses = await TutorCourse.find({
      tutor: req.userId,
      status: "approved",
    }).select("coursename category price thumbnail");

    if (tutorCourses.length > 0) {
      // User is a tutor, return their created courses
      const mappedTutorCourses = tutorCourses.map((course) => ({
        _id: course._id,
        coursename: course.coursename,
        category: course.category,
        price: course.price,
        emi: { isAvailable: false }, // Tutors' courses don't have EMI for themselves
        thumbnail: course.thumbnail,
        accessStatus: "full", // Tutors have full access to their own courses
        emiPlan: null,
      }));

      res.status(200).json({
        success: true,
        data: mappedTutorCourses,
      });
    } else {
      // User is a student, return enrolled courses
      const user = await User.findById(req.userId)
        .populate("enrolledCourses.emiPlan")
        .select("enrolledCourses");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Transform enrolled courses to include course data
      const enrolledCoursesPromises = user.enrolledCourses.map(
        async (enrollment) => {
          let courseData;
          if (enrollment.courseType === "TutorCourse") {
            courseData = await TutorCourse.findById(enrollment.course).select(
              "coursename category price thumbnail",
            );
            if (courseData) {
              courseData.emi = { isAvailable: false };
            }
          } else {
            courseData = await Course.findById(enrollment.course).select(
              "coursename category price emi thumbnail",
            );
          }

          if (courseData) {
            return {
              _id: enrollment.course,
              coursename: courseData.coursename,
              category: courseData.category,
              price: courseData.price,
              emi: courseData.emi,
              thumbnail: courseData.thumbnail,
              accessStatus: enrollment.accessStatus,
              emiPlan: enrollment.emiPlan,
            };
          }
          return null;
        },
      );

      const enrolledCourses = (
        await Promise.all(enrolledCoursesPromises)
      ).filter(Boolean);

      res.status(200).json({
        success: true,
        data: enrolledCourses,
      });
    }
  } catch (error) {
    logger.error("Error fetching user enrolled courses:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Update User Profile Details (except profile picture)
export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    // Debug logging
    logger.debug(" Profile update request:", {
      userId,
      body: req.body,
      headers: {
        contentType: req.headers["content-type"],
        authorization: req.headers.authorization ? "Bearer [REDACTED]" : "none",
      },
    });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    const {
      username, // Changed from firstName, lastName
      email,
      mobile, // Changed from mobileNumber
      fatherName, // Changed from fatherOrHusbandName
      dateofBirth, // Changed from dateOfBirth
      gender,
      bloodGroup,
      address,
      Nationality, // Added
      Occupation, // Added
    } = req.body;

    // Validate dateofBirth format if provided
    let validatedDateofBirth = null;
    if (dateofBirth) {
      const date = new Date(dateofBirth);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid date format for dateofBirth. Please use a valid date (YYYY-MM-DD or ISO format).",
        });
      }
      // Check if date is not in the future
      if (date > new Date()) {
        return res.status(400).json({
          success: false,
          message: "Date of birth cannot be in the future.",
        });
      }
      // Check if date is reasonable (not more than 150 years ago)
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 150);
      if (date < minDate) {
        return res.status(400).json({
          success: false,
          message: "Date of birth is too far in the past.",
        });
      }
      validatedDateofBirth = date;
    }

    // Optional: Check if the new email already exists for another user (only if email is being updated)
    if (email) {
      const existingUserWithEmail = await User.findOne({
        email: email,
        _id: { $ne: userId }, // Exclude current user
      });
      if (existingUserWithEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use by another account",
        });
      }
    }

    // Optional: Check if the new username already exists for another user (only if username is being updated)
    if (username) {
      const existingUserWithUsername = await User.findOne({
        username: username,
        _id: { $ne: userId }, // Exclude current user
      });
      if (existingUserWithUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already in use by another account",
        });
      }
    }

    // Optional: Check if the new mobile already exists for another user (only if mobile is being updated)
    if (mobile) {
      const mobileNumber = convertMobileToNumber(mobile);
      if (!mobileNumber) {
        return res.status(400).json({
          success: false,
          message: "Invalid mobile number format",
        });
      }
      const existingUserWithMobile = await User.findOne({
        mobile: mobileNumber,
        _id: { $ne: userId }, // Exclude current user
      });
      if (existingUserWithMobile) {
        return res.status(400).json({
          success: false,
          message: "Mobile number already in use by another account",
        });
      }
    }

    // Validate address structure if provided
    if (address && typeof address !== "object") {
      return res.status(400).json({
        success: false,
        message:
          "Address must be an object with properties: street, city, state, country, zipCode",
      });
    }

    // Validate address properties if address object is provided
    if (address) {
      const allowedAddressKeys = [
        "street",
        "city",
        "state",
        "country",
        "zipCode",
      ];
      const providedKeys = Object.keys(address);
      const invalidKeys = providedKeys.filter(
        (key) => !allowedAddressKeys.includes(key),
      );

      if (invalidKeys.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid address properties: ${invalidKeys.join(", ")}. Allowed properties: ${allowedAddressKeys.join(", ")}`,
        });
      }
    }

    // Convert mobile to number if provided
    const mobileNumber = mobile ? convertMobileToNumber(mobile) : undefined;
    if (mobile && !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number format",
      });
    }

    const updateData = {
      username,
      email,
      mobile: mobileNumber,
      fatherName,
      dateofBirth: validatedDateofBirth, // Use validated date
      gender,
      bloodGroup,
      address, // Address object { street, city, state, country, zipCode }
      Nationality,
      Occupation,
    };

    // Remove undefined fields so they don't overwrite existing data with nulls if not provided
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );
    if (updateData.address && Object.keys(updateData.address).length === 0) {
      delete updateData.address; // Don't send empty address object unless intended
    } else if (updateData.address) {
      Object.keys(updateData.address).forEach(
        (key) =>
          updateData.address[key] === undefined &&
          delete updateData.address[key],
      );
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId, // Find user by ID
      { $set: updateData }, // Update specified fields
      { new: true, runValidators: true }, // Enable validators for proper schema validation
    ).select("-password +profileImageUrl"); // Include S3 URL so frontend gets it

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating profile:", error);
    logger.error("Error details:", JSON.stringify(error, null, 2));

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Update failed due to server error",
      error: error.message,
    });
  }
};

// Update Profile Picture - Upload to AWS S3 (Replaces MongoDB Binary Storage)
export const updateProfilePicture = async (req, res) => {
  try {
    logger.debug("Uploading profile picture to S3 for userId:", req.userId);

    // Validate authentication
    if (!req.userId) {
      logger.debug("User ID not provided");
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    // PRESIGNED URL FLOW: If fileUrl is provided, skip file upload and store directly
    if (req.body.fileUrl) {
      logger.debug("Using presigned URL flow - storing S3 URL directly");
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Delete old image from S3 (non-blocking)
      if (user.profileImageUrl) {
        deleteProfileImageFromCloud(user.profileImageUrl).catch((err) =>
          logger.warn("Failed to delete old image:", err.message),
        );
      }

      // Update user with new S3 URL
      user.profileImageUrl = req.body.fileUrl;
      user.profilePicture = undefined;
      await user.save();

      logger.info("Profile picture updated (presigned URL):", req.userId);
      return res.status(200).json({
        success: true,
        message: "Profile picture updated successfully",
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          profileImageUrl: user.profileImageUrl,
        },
      });
    }

    // ORIGINAL FLOW: File upload via multipart
    // Validate file presence
    if (!req.file) {
      logger.debug("No file uploaded");
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Validate file buffer exists
    if (!req.file.buffer || !Buffer.isBuffer(req.file.buffer)) {
      logger.debug("Invalid file buffer");
      return res.status(400).json({
        success: false,
        message: "Invalid file data. Please try uploading again.",
      });
    }

    // Validate uploaded file
    const validation = validateImageFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Detect HEIC/HEIF by magic bytes (more reliable than mimetype)
    // HEIC/HEIF files start with: 00 00 00 [size] 66 74 79 70 (ftyp signature)
    const detectHeicByMagicBytes = (buffer) => {
      if (buffer.length < 12) return false;
      // Check for 'ftyp' at offset 4
      const ftypSignature = buffer.slice(4, 8).toString("ascii");
      if (ftypSignature === "ftyp") {
        // Check for HEIC/HEIF brand
        const brandSignature = buffer.slice(8, 12).toString("ascii");
        return ["heic", "heix", "hevc", "hevx"].includes(brandSignature.toLowerCase());
      }
      return false;
    };

    const HEIC_MIMETYPES = ["image/heic", "image/heif", "image/x-heic", "image/x-heif"];
    const isHeicByMimetype = HEIC_MIMETYPES.includes(req.file.mimetype?.toLowerCase());
    const isHeicByMagic = detectHeicByMagicBytes(req.file.buffer);
    const isHeic = isHeicByMimetype || isHeicByMagic;

    logger.debug("Image format detected - mimetype:", req.file.mimetype, "| HEIC detected:", isHeic);
    // Note: Sharp validation removed — multer fileFilter + validateImageFile() already validate file type
    // Sharp is unreliable on Lambda, so we skip metadata validation and let CloudStorageService handle errors

    // Step 1: Get existing user to retrieve old S3 image URL for deletion
    const existingUser = await User.findById(req.userId).select(
      "+profileImageUrl",
    );

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found, cannot update profile picture",
      });
    }

    const oldImageUrl = existingUser.profileImageUrl;
    logger.debug("Old S3 image URL:", oldImageUrl || "none");

    // Step 2: Upload image to AWS S3
    logger.debug("Uploading image to AWS S3...");
    const uploadResult = await uploadProfileImageToCloud(
      req.file.buffer,
      req.userId,
      req.file.originalname,
      isHeic,
    );

    if (!uploadResult.success) {
      logger.error("S3 upload failed:", uploadResult.error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload profile picture to cloud storage",
        error: uploadResult.error,
      });
    }

    const newImageUrl = uploadResult.imageUrl;
    logger.debug("Successfully uploaded to S3:", newImageUrl);

    // Step 3: Delete old S3 image (non-blocking - don't fail on cleanup error)
    if (oldImageUrl) {
      deleteProfileImageFromCloud(oldImageUrl)
        .then((result) => {
          if (result.success) {
            logger.debug("Successfully deleted old S3 image");
          } else {
            logger.warn("Failed to delete old S3 image (non-critical):", result.error);
          }
        })
        .catch((err) => {
          logger.warn("Error deleting old S3 image (non-critical):", err.message);
        });
    }

    // Step 4: Update user document with new S3 URL, clear legacy binary data
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          profileImageUrl: newImageUrl, // Store S3 URL
        },
        $unset: {
          profilePicture: "", // Clear legacy binary data
        },
      },
      { new: true, runValidators: true },
    )
      .select("-password")
      .select("+profileImageUrl");

    if (!updatedUser) {
      logger.warn("User not found after S3 upload (should not happen)");
      return res.status(404).json({
        success: false,
        message: "User not found, cannot update profile picture",
      });
    }

    logger.info("Profile picture updated via S3 for user:", updatedUser._id);
    logger.debug("S3 image size:", uploadResult.size, "KB");

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user: {
        _id: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username,
        profileImageUrl: updatedUser.profileImageUrl,
      },
    });
  } catch (error) {
    logger.error("Error updating profile picture:", error);
    logger.error("Error details:", JSON.stringify(error, null, 2));

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.keys(error.errors).map((key) => ({
        field: key,
        message: error.errors[key].message,
      }));
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to upload photo",
      error: error.message,
    });
  }
};

export const generateProfileUploadUrl = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - user ID not found",
      });
    }

    const { fileName, fileType } = req.body;
    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "fileName and fileType are required",
      });
    }

    const presignedData = await generatePresignedUploadUrl(
      req.userId,
      fileName,
      fileType,
    );

    res.status(200).json({
      success: true,
      data: presignedData,
    });
  } catch (error) {
    logger.error("Generate upload URL error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate upload URL",
      error: error.message,
    });
  }
};
