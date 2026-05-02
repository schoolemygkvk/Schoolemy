import { logger } from "../../Utils/logger.js";

import User from "../../Models/User-Model/User-Model.js";
import mongoose from "mongoose";
// SECURITY FIX 3.31.2: Input sanitization
import {
  sanitizeText,
  sanitizeEmail,
  sanitizePhone,
} from "../../Utils/sanitizationUtils.js";




async function verifyProfileOwnership(requestedUserId, authenticatedUserId, res) {
  // Validate IDs format
  if (!mongoose.Types.ObjectId.isValid(requestedUserId)) {
    res.status(400).json({
      success: false,
      message: "Invalid user ID format",
    });
    return false;
  }

  // CRITICAL: Verify ownership - authenticated user can only access their own profile
  if (requestedUserId !== authenticatedUserId) {
    // Log unauthorized access attempt
    logger.error(
      `SECURITY: Unauthorized profile access - User ${authenticatedUserId} tried to access profile of user ${requestedUserId}`,
    );

    // Return 403 Forbidden
    res.status(403).json({
      success: false,
      message: "You do not have permission to access this profile",
    });
    return false;
  }

  return true; // Ownership verified
}


export const getUserProfileSecure = async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.userId; // From auth middleware

    // SECURITY: Verify ownership
    const isOwner = await verifyProfileOwnership(userId, authenticatedUserId, res);
    if (!isOwner) {
      return; // verifyProfileOwnership already sent response
    }

    // Fetch user profile
    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile fetched successfully",
      data: user,
    });
  } catch (error) {
    logger.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    });
  }
};


export const updateUserProfileSecure = async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.userId; // From auth middleware

    // SECURITY: Verify ownership
    const isOwner = await verifyProfileOwnership(userId, authenticatedUserId, res);
    if (!isOwner) {
      return; // verifyProfileOwnership already sent response
    }

    let {
      username,
      email,
      mobile,
      fatherName,
      dateofBirth,
      gender,
      bloodGroup,
      address,
      Nationality,
      Occupation,
    } = req.body;

    // SECURITY FIX 3.31.2: Sanitize all text input
    username = sanitizeText(username);
    email = sanitizeEmail(email);
    mobile = sanitizePhone(mobile);
    fatherName = sanitizeText(fatherName);
    gender = sanitizeText(gender);
    bloodGroup = sanitizeText(bloodGroup);
    Nationality = sanitizeText(Nationality);
    Occupation = sanitizeText(Occupation);

    // Sanitize address fields if provided
    if (address && typeof address === "object") {
      address = {
        street: sanitizeText(address.street),
        city: sanitizeText(address.city),
        state: sanitizeText(address.state),
        country: sanitizeText(address.country),
        zipCode: sanitizeText(address.zipCode),
      };
    }

    // Validate dateofBirth format if provided
    let validatedDateofBirth = null;
    if (dateofBirth) {
      const date = new Date(dateofBirth);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date format for dateofBirth",
        });
      }
      if (date > new Date()) {
        return res.status(400).json({
          success: false,
          message: "Date of birth cannot be in the future",
        });
      }
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 150);
      if (date < minDate) {
        return res.status(400).json({
          success: false,
          message: "Date of birth is too far in the past",
        });
      }
      validatedDateofBirth = date;
    }

    // SECURITY: Check if new email already exists for another user
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

    // SECURITY: Check if new username already exists for another user
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

    // SECURITY: Check if new mobile already exists for another user
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
        message: "Address must be an object with properties",
      });
    }

    const updateData = {
      username,
      email,
      mobile: mobile ? convertMobileToNumber(mobile) : undefined,
      fatherName,
      dateofBirth: validatedDateofBirth,
      gender,
      bloodGroup,
      address,
      Nationality,
      Occupation,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating user profile:", error);

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

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Update failed due to server error",
      error: error.message,
    });
  }
};


export const deleteUserAccountSecure = async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.userId; // From auth middleware

    // SECURITY: Verify ownership
    const isOwner = await verifyProfileOwnership(userId, authenticatedUserId, res);
    if (!isOwner) {
      return; // verifyProfileOwnership already sent response
    }

    // Log account deletion
    logger.debug(`Account deletion: User ${userId} deleted their account at ${new Date().toISOString()}`);

    // Delete user account
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting user account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: error.message,
    });
  }
};


function convertMobileToNumber(mobile) {
  if (typeof mobile === "number") return mobile;
  if (typeof mobile === "string") {
    const cleaned = mobile.replace(/^\+|\s/g, "");
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}


export const updateProfilePictureSecure = async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.userId; // From auth middleware

    // SECURITY: Verify ownership
    const isOwner = await verifyProfileOwnership(userId, authenticatedUserId, res);
    if (!isOwner) {
      return; // verifyProfileOwnership already sent response
    }

    // Validate file presence
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Validate file buffer exists
    if (!req.file.buffer || !Buffer.isBuffer(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file data. Please try uploading again.",
      });
    }

    // Validate image file
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
      });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File size too large. Maximum 10MB allowed.",
      });
    }

    // SECURITY FIX 3.40.2: Store as MongoDB Binary (no 33% size bloat from Base64)
    // 5MB image = 5MB stored (NOT 6.7MB like Base64)
    logger.debug(`Storing profile picture as binary data: ${req.file.size} bytes`);

    // Get existing user to check if there's an old image
    const existingUser = await User.findById(userId).select(
      "profilePicture profileImageUrl",
    );

    // Update user profile picture - old image is automatically overwritten
    // Store as Buffer (binary) instead of Base64 string
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          profilePicture: {
            data: req.file.buffer, // Binary data (efficient storage)
            contentType: req.file.mimetype,
            uploadedAt: new Date(),
            filename: req.file.originalname,
            size: req.file.size,
          },
          // Clear cloud storage URL if it exists
          profileImageUrl: null,
        },
      },
      { new: true, runValidators: true },
    ).select("-password -profilePicture.data"); // Exclude binary data from response

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: {
        userId: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    logger.error("Error updating profile picture:", error);

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

    res.status(500).json({
      success: false,
      message: "Failed to update profile picture",
      error: error.message,
    });
  }
};

export default {
  getUserProfileSecure,
  updateUserProfileSecure,
  updateProfilePictureSecure,
  deleteUserAccountSecure,
  verifyProfileOwnership,
};
