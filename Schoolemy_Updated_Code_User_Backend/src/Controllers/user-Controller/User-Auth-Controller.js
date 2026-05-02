import { logger } from "../../Utils/logger.js";

import { sendOtpEmail } from "../../Notification/EmailTransport.js";
import User from "../../Models/User-Model/User-Model.js";
import RefreshToken from "../../Models/RefreshToken-Model/RefreshToken-Model.js";
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_COOKIE_MAX_MS,
  expiryStringToMs,
} from "../../Utils/tokenExpiry.js";
import { generateOtp } from "../../Utils/OTPGenerate.js";
import {
  isValidEmail,
  isValidPassword,
} from "../../Utils/validate.js";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { uploadProfileImageToCloud } from "../../Utils/CloudStorageService.js";
// SECURITY FIX 3.31.2: Input sanitization functions
import {
  sanitizeEmail,
  sanitizePhone,
  sanitizeText,
  sanitizeFilePath,
} from "../../Utils/sanitizationUtils.js";
// SECURITY CHECKLIST: Account lockout tracking
import {
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
} from "../../Middleware/accountLockoutMiddleware.js";
import { getJwtSecret } from "../../Utils/jwtSecret.js";


const generateAccessToken = (userId, role) => {
  return jwt.sign(
    {
      id: String(userId),
      role: role || "user",
    },
    getJwtSecret(),
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    },
  );
};


const generateRefreshTokenString = () => {
  return crypto.randomBytes(32).toString("hex");
};


const hashRefreshToken = async (token) => {
  return await bcrypt.hash(token, 10);
};

// Add Base64 utility function
const convertToBase64 = (buffer, mimetype) => {
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

// Add file validation function
const validateImageFile = (file) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
    };
  }

  if (file.size > maxSize) {
    return { valid: false, error: "File size too large. Maximum 5MB allowed." };
  }

  return { valid: true };
};

export const register = async (req, res) => {
  try {
    // SECURITY FIX 3.31.2: Sanitize user input
    let { email } = req.body;
    if (email) email = sanitizeEmail(email);

    // Input validation
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }

    const query = { email };

    // Isolate DB lookup errors
    let existingUser;
    try {
      existingUser = await User.findOne(query);
    } catch (dbError) {
      logger.error("Database error during user lookup:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database error. Please try again later.",
      });
    }

    // FIX 2.1.2: Check for both completed (verified) users AND pending users
    // This prevents race conditions where two concurrent signups could both succeed
    if (existingUser) {
      if (existingUser.registerOtpVerified) {
        // User already completed registration
        return res.status(409).json({
          success: false,
          message: "User with this email already exists. Please login.",
        });
      } else if (existingUser.registerOtp) {
        // User is in the middle of OTP verification
        return res.status(409).json({
          success: false,
          code: "REGISTER_OTP_PENDING",
          message: "An OTP has already been sent. Please verify it first or wait before trying again.",
        });
      }
      // If OTP expired, allow re-registration by overwriting the pending user record
      // This will happen when we save the new OTP below
    }

    // Generate OTP
    const { otp } = generateOtp();

    // OTP send: map failures to HTTP errors
    let result;
    try {
      result = await sendOtpEmail(email, otp);
    } catch (otpError) {
      logger.error("OTP send error:", otpError);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again later.",
      });
    }

    if (!result || !result.success) {
      return res.status(400).json({
        success: false,
        message: `Failed to send OTP. ${result?.message || "Service temporarily unavailable"}`,
      });
    }

    // CRITICAL FIX: Create a pending user record with OTP details
    // This allows verifyOtp() to find the user later
    const otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // OTP valid for 2 minutes

    // SECURITY FIX 2.12.1: Hash OTP before storing in database
    // Prevents account takeover if database is compromised
    const hashedOtp = await bcrypt.hash(otp, 10);

    const newUser = new User({
      email,
      registerOtp: hashedOtp, // Store HASHED OTP (was plain text, now encrypted)
      registerOtpExpiresAt: otpExpiresAt,
      registerOtpVerified: false,
    });

    // Persist pending user; handle duplicate key and validation errors
    try {
      await newUser.save();
    } catch (saveError) {
      logger.error("User creation error:", saveError);

      // Handle specific MongoDB errors
      if (saveError.code === 11000) {
        // Duplicate key error
        const field = Object.keys(saveError.keyPattern)[0];
        return res.status(409).json({
          success: false,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already registered.`,
        });
      }

      if (saveError.name === "ValidationError") {
        // Validation error
        const errors = Object.values(saveError.errors).map(e => e.message);
        return res.status(400).json({
          success: false,
          message: "Validation failed: " + errors.join(", "),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to create account. Please try again.",
      });
    }

    // SECURITY FIX: Do NOT return OTP in response. OTP must only be sent via email (out-of-band channels)
    // Returning OTP in HTTP response allows MITM attacks, browser devtools inspection, and proxy interception
    return res.status(200).json({
      success: true,
      message: `OTP sent to ${email}. Please check your email.`,
    });
  } catch (error) {
    // Outer catch for unexpected errors
    logger.error("Unexpected error in register:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  }
};

export const completeRegistration = async (req, res) => {
  try {
    // 1. Extract ALL data from the request
    let {
      email: bodyEmail,
      mobile,
      password,
      username,
      fatherName,
      dateofBirth,
      gender,
      bloodGroup,
      Nationality,
      Occupation,
      street,
      city,
      state,
      country,
      zipCode,
    } = req.body;

    // SECURITY FIX 3.31.2: Sanitize all text input
    username = sanitizeText(username);
    fatherName = sanitizeText(fatherName);
    Nationality = sanitizeText(Nationality);
    Occupation = sanitizeText(Occupation);
    street = sanitizeText(street);
    city = sanitizeText(city);
    state = sanitizeText(state);
    country = sanitizeText(country);
    zipCode = sanitizeText(zipCode);

    const email =
      bodyEmail && String(bodyEmail).trim()
        ? sanitizeEmail(String(bodyEmail).trim().toLowerCase())
        : "";

    // 2. Basic Validation for essential fields
    if (!password || !username || !req.file) {
      return res.status(400).json({
        success: false,
        message: "Password, username, and profile picture are required.",
      });
    }
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8+ characters with a mix of uppercase, lowercase, number & special character.",
      });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }

    // 3. Validate uploaded file
    if (req.file) {
      const validation = validateImageFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }
    }

    const query = { email };
    const existingUser = await User.findOne(query);

    // Upload profile picture to AWS S3 (NEW: not binary storage)
    let profileImageUrl = null;
    if (req.file) {
      try {
        // Generate a temporary user ID for S3 path (use email hash for new users)
        const tempUserId = existingUser ? existingUser._id : crypto.createHash("md5").digest("hex");

        const uploadResult = await uploadProfileImageToCloud(
          req.file.buffer,
          tempUserId,
          req.file.originalname,
        );

        if (!uploadResult.success) {
          logger.error("S3 upload failed during registration:", uploadResult.error);
          return res.status(400).json({
            success: false,
            message: "Failed to upload profile picture. " + uploadResult.error,
          });
        }

        profileImageUrl = uploadResult.imageUrl;
        logger.debug("Profile picture uploaded to S3:", profileImageUrl);
      } catch (error) {
        logger.error("Profile picture S3 upload error:", error);
        return res.status(400).json({
          success: false,
          message: "Failed to process profile picture.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      // CRITICAL FIX 3: Check registration completion instead of just OTP verification
      if (!existingUser.registerOtpVerified) {
        return res.status(400).json({
          success: false,
          message: "Please verify your OTP before completing registration.",
        });
      }

      // CRITICAL FIX 3: Prevent re-completion of registration
      if (existingUser.registrationCompleted) {
        return res.status(409).json({
          success: false,
          message: "Registration already completed. Please login.",
        });
      }

      // CRITICAL FIX 3: On update, prevent changing username if already set
      if (existingUser.username && existingUser.username !== username) {
        return res.status(409).json({
          success: false,
          message: "Username cannot be changed after initial registration.",
        });
      }

      // Check if new username is unique (only if being set for first time)
      if (!existingUser.username && username) {
        const otherUser = await User.findOne({
          username,
          _id: { $ne: existingUser._id },
        });
        if (otherUser) {
          return res.status(409).json({
            success: false,
            message: "Username already in use by another account.",
          });
        }
      }

      // Update user with new information
      existingUser.password = hashedPassword;
      existingUser.username = username;
      existingUser.fatherName = fatherName;
      existingUser.dateofBirth = dateofBirth ? new Date(dateofBirth) : null;
      existingUser.gender = gender;
      existingUser.bloodGroup = bloodGroup;
      existingUser.Nationality = Nationality;
      existingUser.Occupation = Occupation;
      existingUser.address = { street, city, state, country, zipCode };
      if (profileImageUrl) {
        existingUser.profileImageUrl = profileImageUrl; // Store S3 URL
        existingUser.profilePicture = undefined; // Clear legacy binary field
      }
      existingUser.registrationCompleted = true;
      existingUser.registrationCompletedAt = new Date();
      existingUser.registrationStage = "profile-completed";

      await existingUser.save();

      const accessToken = generateAccessToken(existingUser._id, existingUser.role);
      const refreshTokenString = generateRefreshTokenString();
      const refreshTokenHash = await hashRefreshToken(refreshTokenString);
      const refreshTokenRecord = new RefreshToken({
        user: existingUser._id,
        token: refreshTokenHash,
        expiresAt: new Date(Date.now() + expiryStringToMs(process.env.REFRESH_TOKEN_EXPIRY || "30d")),
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.get("User-Agent"),
        isRevoked: false,
      });
      await refreshTokenRecord.save();
      existingUser.currentRefreshTokenId = refreshTokenRecord._id;
      existingUser.status = "active";
      existingUser.lastActivity = new Date();
      await existingUser.save();

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: ACCESS_TOKEN_COOKIE_MAX_MS,
        path: "/",
      });
      res.cookie("refreshToken", refreshTokenString, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: expiryStringToMs(process.env.REFRESH_TOKEN_EXPIRY || "30d"),
        path: "/",
      });

      return res.status(200).json({
        success: true,
        message: "Registration complete! Welcome.",
        accessToken,
        user: {
          id: existingUser._id,
          email: existingUser.email,
          username: existingUser.username,
          role: existingUser.role,
          profileImageUrl: existingUser.profileImageUrl,
        },
      });
    }

    // CRITICAL FIX 4: Better handling for new user creation with race condition prevention
    if (username) {
      const taken = await User.findOne({ username });
      if (taken) {
        return res.status(409).json({
          success: false,
          message: "Username already in use by another account.",
        });
      }
    }

    const newUserPayload = {
      ...query,
      password: hashedPassword,
      username,
      fatherName,
      dateofBirth: dateofBirth ? new Date(dateofBirth) : null,
      gender,
      bloodGroup,
      Nationality,
      Occupation,
      address: { street, city, state, country, zipCode },
      profileImageUrl: profileImageUrl, // Store S3 URL instead of binary
      registerOtpVerified: true,
      registrationCompleted: true,
      registrationCompletedAt: new Date(),
      registrationStage: "profile-completed",
    };

    const newUser = new User(newUserPayload);
    await newUser.save();

    const accessToken = generateAccessToken(newUser._id, newUser.role);
    const refreshTokenString = generateRefreshTokenString();
    const refreshTokenHash = await hashRefreshToken(refreshTokenString);
    const refreshTokenRecord = new RefreshToken({
      user: newUser._id,
      token: refreshTokenHash,
      expiresAt: new Date(Date.now() + expiryStringToMs(process.env.REFRESH_TOKEN_EXPIRY || "30d")),
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get("User-Agent"),
      isRevoked: false,
    });
    await refreshTokenRecord.save();
    newUser.currentRefreshTokenId = refreshTokenRecord._id;
    newUser.status = "active";
    newUser.lastActivity = new Date();
    await newUser.save();

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: ACCESS_TOKEN_COOKIE_MAX_MS,
      path: "/",
    });
    res.cookie("refreshToken", refreshTokenString, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: expiryStringToMs(process.env.REFRESH_TOKEN_EXPIRY || "30d"),
      path: "/",
    });

    return res.status(201).json({
      success: true,
      message: "Registration complete! Welcome.",
      accessToken,
      user: {
        id: newUser._id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        profileImageUrl: newUser.profileImageUrl,
      },
    });
  } catch (error) {
    logger.error("CompleteRegistration error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error during registration.",
    });
  }
};

export const resendOtp = async (req, res) => {
  try {
    // RESEND OTP FIX: Complete rewrite for proper flow handling
    let { email } = req.body;

    // Sanitize input
    if (email) email = sanitizeEmail(email);

    // Validate email format
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }

    const query = { email };

    // FIX: Add database error handling
    let existingUser;
    try {
      existingUser = await User.findOne(query);
    } catch (dbError) {
      logger.error("Database error during user lookup:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database error. Please try again later.",
      });
    }

    // FIX: User doesn't exist
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please sign up first.",
      });
    }

    // FIX: Check if registration is already completed
    if (existingUser.registrationCompleted) {
      return res.status(409).json({
        success: false,
        message: "Registration already completed. Please login.",
      });
    }

    // FIX: Check if OTP already verified but password not set
    if (existingUser.registerOtpVerified && !existingUser.password) {
      return res.status(400).json({
        success: false,
        message: "OTP already verified. Please proceed to set your password.",
      });
    }

    // FIX: Check if account is already fully registered
    if (existingUser.registerOtpVerified && existingUser.password) {
      return res.status(409).json({
        success: false,
        message: "This account is already registered. Please login.",
      });
    }

    // Generate new OTP
    const { otp } = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // FIX: Send OTP with proper error handling
    let result;
    try {
      result = await sendOtpEmail(email, otp);
    } catch (otpError) {
      logger.error("OTP send error in resendOtp:", otpError);
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again later.",
      });
    }

    if (!result || !result.success) {
      logger.warn(`Failed to send OTP to ${email}:`, result?.message);
      return res.status(400).json({
        success: false,
        message: `Failed to send OTP. ${result?.message || "Service temporarily unavailable"}`,
      });
    }

    // SECURITY FIX 2.12.1: Hash OTP before storing in database
    // Prevents account takeover if database is compromised
    const hashedOtp = await bcrypt.hash(otp, 10);

    // FIX: Update OTP in database with error handling
    try {
      existingUser.registerOtp = hashedOtp;
      existingUser.registerOtpExpiresAt = otpExpiresAt;
      // Do NOT reset registerOtpVerified - keep its current state
      await existingUser.save();
    } catch (saveError) {
      logger.error("Failed to save OTP to database:", saveError);
      return res.status(500).json({
        success: false,
        message: "Failed to process resend. Please try again.",
      });
    }

    // FIX: Success response with clear instructions
    return res.status(200).json({
      success: true,
      message: `New OTP sent to ${email}. OTP is valid for 2 minutes.`,
      destination: email,
    });
  } catch (error) {
    logger.error("Unexpected error in resendOtp:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    let { email, otp } = req.body;

    // Sanitize input
    if (email) email = sanitizeEmail(email);

    // FIX: Validate OTP is provided
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: "OTP is required.",
      });
    }

    // FIX: Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp.toString())) {
      return res.status(400).json({
        success: false,
        message: "OTP must be 6 digits.",
      });
    }

    // Validate email format
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }

    const query = { email };

    // FIX: Add database error handling
    let user;
    try {
      user = await User.findOne(query);
    } catch (dbError) {
      logger.error("Database error during OTP verification:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database error. Please try again later.",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please sign up first.",
      });
    }

    // FIX: Check if OTP exists
    if (!user.registerOtp) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new OTP.",
      });
    }

    // FIX: Check OTP expiry FIRST (before validation) to give accurate error message
    const otpExpired = user.registerOtpExpiresAt && new Date() > new Date(user.registerOtpExpiresAt);
    if (otpExpired) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // SECURITY FIX 2.12.1: Use bcrypt.compare() for OTP verification
    // Compares plain text OTP with stored hash (prevents timing attacks)
    let otpValid = false;
    try {
      otpValid = await bcrypt.compare(otp.toString(), user.registerOtp);
    } catch (bcryptError) {
      logger.error("Bcrypt comparison error:", bcryptError);
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    if (!otpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check and try again.",
      });
    }

    // FIX: Clear OTP and mark as verified with error handling
    let updatedUser;
    try {
      updatedUser = await User.findOneAndUpdate(
        query,
        {
          registerOtpVerified: true,
          registerOtp: undefined,
          registerOtpExpiresAt: undefined,
          registrationStage: "otp-verified",
        },
        { new: true },
      );
    } catch (updateError) {
      logger.error("Failed to update user after OTP verification:", updateError);
      return res.status(500).json({
        success: false,
        message: "Failed to verify OTP. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully! Please proceed to set your password.",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    logger.error("Unexpected error in verifyOtp:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again later.",
      code: "INTERNAL_ERROR",
    });
  }
};

export const createPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8+ characters with a mix of uppercase, lowercase, number & special character.",
      });
    }

    const query = { email };
    const user = await User.findOne(query).lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.registerOtpVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Please verify OTP first" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { password: hashedPassword },
      { new: true },
    );

    return res
      .status(200)
      .json({ success: true, message: "Password created successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const registerForm = async (req, res) => {
  try {
    const {
      email,
      username,
      fatherName,
      dateofBirth,
      gender,
      address,
      bloodGroup,
      Nationality,
      Occupation,
    } = req.body;

    const requiredFields = {
      email,
      username,
      fatherName,
      dateofBirth,
      gender,
      address,
      bloodGroup,
      Nationality,
      Occupation,
    };

    const missingFields = Object.entries(requiredFields)
      .filter(
        ([key, value]) => value === undefined || value === null || value === "",
      )
      .map(([key]) => key);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Validate uploaded file if present
    if (req.file) {
      const validation = validateImageFile(req.file);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.error,
        });
      }
    }

    // Find user
    const query = { email };
    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please complete registration first.",
      });
    }

    // Check registration completion
    if (!user.registerOtpVerified || !user.password) {
      return res.status(400).json({
        success: false,
        message: "Please complete the registration process first",
      });
    }

    // Ensure email and username are unique if they are being updated
    if (email && email !== user.email) {
      const existingUserWithEmail = await User.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (existingUserWithEmail) {
        return res.status(400).json({
          success: false,
          message: "Email already in use by another account",
        });
      }
    }

    if (username && username !== user.username) {
      const existingUserWithUsername = await User.findOne({
        username,
        _id: { $ne: user._id },
      });
      if (existingUserWithUsername) {
        return res.status(400).json({
          success: false,
          message: "Username already in use by another account",
        });
      }
    }

    // Validate date format if provided
    if (req.body.dateofBirth) {
      const dob = new Date(req.body.dateofBirth);
      if (isNaN(dob.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid date of birth format",
        });
      }
      req.body.dateofBirth = dob;
    }

    // Prepare update data
    const updateData = {
      username,

      fatherName: req.body.fatherName || null,
      dateofBirth: req.body.dateofBirth || null,
      gender: req.body.gender || null,
      address: {
        street: req.body.address?.street || null,
        city: req.body.address?.city || null,
        state: req.body.address?.state || null,
        country: req.body.address?.country || null,
        zipCode: req.body.address?.zipCode || null,
      },
      bloodGroup: req.body.bloodGroup || null,
      Nationality: req.body.Nationality || null,
      Occupation: req.body.Occupation || null,
    };

    // Handle file upload if present - Upload to AWS S3 (not binary storage)
    if (req.file) {
      try {
        const uploadResult = await uploadProfileImageToCloud(
          req.file.buffer,
          user._id,
          req.file.originalname,
        );

        if (!uploadResult.success) {
          logger.error("S3 upload failed during registerForm:", uploadResult.error);
          return res.status(400).json({
            success: false,
            message: "Failed to upload profile picture. " + uploadResult.error,
          });
        }

        updateData.profileImageUrl = uploadResult.imageUrl; // Store S3 URL
        // Clear legacy binary field
        updateData.$unset = { profilePicture: "" };

      } catch (error) {
        logger.error("Profile picture S3 upload error:", error);
        return res.status(400).json({
          success: false,
          message: "Failed to process profile picture.",
        });
      }
    }

    // Update user
    const updateQuery = { $set: updateData };
    if (updateData.$unset) {
      updateQuery.$unset = updateData.$unset;
      delete updateData.$unset;
    }

    const updatedUser = await User.findOneAndUpdate(query, updateQuery, {
      new: true,
      runValidators: true,
    }).select("-password -registerOtp -forgotPasswordOtp").select("+profileImageUrl").lean();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        ...updatedUser,
        profileImageUrl: updatedUser?.profileImageUrl || null, // Ensure it's included
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required." });
  }

  if (!isValidEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid email format." });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Password is required",
    });
  }

  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be 8+ characters with a mix of uppercase, lowercase, number & special character.",
    });
  }

  try {
    const query = { email };
    const user = await User.findOne(query).select('+password');

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!user.registerOtpVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify OTP before logging in",
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "Password not set. Please reset your password.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      // SECURITY CHECKLIST: Record failed login attempt
      await recordFailedLoginAttempt(email);
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password. Please try again",
      });
    }

    // SECURITY CHECKLIST: Reset failed attempts on successful login
    await resetFailedLoginAttempts(email);

    // SECURITY FIX 3.32.4: Generate access + refresh tokens (not old JWT)
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshTokenString = generateRefreshTokenString();
    const refreshTokenHash = await hashRefreshToken(refreshTokenString);

    // SECURITY FIX 3.32.5: Store refresh token in database
    // This allows token revocation, rotation, and security tracking
    const refreshTokenRecord = new RefreshToken({
      user: user._id,
      token: refreshTokenHash,
      expiresAt: new Date(Date.now() + expiryStringToMs(process.env.REFRESH_TOKEN_EXPIRY || "30d")),
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get("User-Agent"),
      isRevoked: false,
    });

    await refreshTokenRecord.save();

    // Update user's current refresh token pointer
    user.currentRefreshTokenId = refreshTokenRecord._id;

    // Update user status and login history
    user.status = "active";
    user.lastActivity = new Date();
    const loginEntry = {
      loginTime: new Date(),
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get("User-Agent"),
    };
    user.loginHistory.push(loginEntry);
    // Keep only the latest 7 login attempts
    if (user.loginHistory.length > 7) {
      user.loginHistory = user.loginHistory.slice(-7);
    }
    await user.save();

    // SECURITY FIX 3.32.6: Set tokens in HTTP-only cookies
    // Access token cookie maxAge matches JWT expiresIn (ACCESS_TOKEN_EXPIRY)
    res.cookie("accessToken", accessToken, {
      httpOnly: true, // JavaScript cannot access (XSS protection)
      secure: true, // Required for SameSite=None to work across origins
      sameSite: "none", // Allow cross-origin cookie sending; CSRF protected by X-CSRF-Token header
      maxAge: ACCESS_TOKEN_COOKIE_MAX_MS,
      path: "/", // Available to entire application
    });

    // Refresh token cookie: 30 days
    res.cookie("refreshToken", refreshTokenString, {
      httpOnly: true,
      secure: true, // Required for SameSite=None
      sameSite: "none", // Allow cross-origin cookie sending; CSRF protected by X-CSRF-Token header
      maxAge: expiryStringToMs(process.env.REFRESH_TOKEN_EXPIRY || "30d"),
      path: "/",
    });

    // SECURITY FIX 3.32.7: Return tokens in HTTP-only cookies (primary method)
    // Also return token in response body as fallback for localStorage/Authorization header
    // This ensures compatibility with both cookie-based and header-based auth
    return res.status(200).json({
      success: true,
      message: "Login successful! Welcome back.",
      accessToken: accessToken, // Fallback: store in localStorage if cookies fail
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
      // Cookies: accessToken and refreshToken are in HTTP-only cookies (primary)
      // Header fallback: accessToken in response body for localStorage
    });
  } catch (error) {
    logger.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//forgot password api
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }

    const query = { email };
    const user = await User.findOne(query);

    // SECURITY FIX 3.21.1: Prevent account enumeration attacks
    // Return same message for both "user exists" and "user not found" cases
    // This prevents attackers from discovering which email addresses have accounts
    // If user exists, send OTP and return generic message
    // If user doesn't exist, skip OTP sending but still return generic message
    let otpSent = false;

    if (user) {
      try {
        // Generate OTP
        const { otp, otpExpiresAt } = generateOtp();

        // SECURITY FIX 3.23.1: Send OTP BEFORE saving to database
        // Prevents storing OTP if email/SMS service fails
        // This prevents race condition where OTP is in database but never sent to user
        let sendResult = null;
        try {
          sendResult = await sendOtpEmail(email, otp);
        } catch (sendError) {
          // Sending failed - don't save OTP to database
          logger.error("OTP send failed in forgot password:", sendError.message);
        }

        // Only save OTP if sending was successful
        if (sendResult && sendResult.success) {
          // SECURITY FIX 2.12.1: Hash OTP before storing in database
          // Prevents account takeover if database is compromised
          const hashedOtp = await bcrypt.hash(otp, 10);

          // Save OTP to user document (HASHED) - only after successful send
          user.forgotPasswordOtp = hashedOtp; // Store HASHED OTP (was plain text, now encrypted)
          user.forgotPasswordOtpExpiresAt = otpExpiresAt;
          user.forgotPasswordOtpVerified = false;
          await user.save();

          otpSent = true;
        } else {
          // Email/SMS failed - don't save OTP
          if (sendResult) {
            logger.error("OTP send failed in forgot password:", sendResult.message);
          }
        }
      } catch (otpError) {
        // Log error but don't reveal to user (OTP won't be saved)
        logger.error("Error generating/sending OTP in forgot password:", otpError);
      }
    } else {
      // User not found - log this but don't send any indication to client
      logger.warn("Forgot password attempt for non-existent account:", { email });
    }

    // SECURITY FIX 3.21.1: Always return same generic message
    // Prevents account enumeration regardless of whether user exists
    return res.status(200).json({
      success: true,
      message: "If this email address is registered with us, you will receive an OTP shortly. Please check your email.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const verifyForgotPasswordOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }

    const query = { email };
    const user = await User.findOne(query);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    // FIX: Check OTP expiry FIRST (before validation) to give accurate error message
    const otpExpired = new Date() > new Date(user.forgotPasswordOtpExpiresAt);
    if (otpExpired) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // SECURITY FIX 2.12.1: Use bcrypt.compare() for OTP verification
    // Compares plain text OTP with stored hash (prevents plain text comparison)
    const otpValid = await bcrypt.compare(otp.toString(), user.forgotPasswordOtp || "");

    if (!otpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please check and try again.",
      });
    }

    // Mark OTP as verified
    user.forgotPasswordOtpVerified = true;
    user.forgotPasswordOtp = undefined;
    user.forgotPasswordOtpExpiresAt = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

export const ForgotResetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    if (!isValidEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }

    if (!isValidPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8+ characters with a mix of uppercase, lowercase, number & special character.",
      });
    }

    const query = { email };
    const user = await User.findOne(query);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    if (!user.forgotPasswordOtpVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Please verify OTP first" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and reset OTP fields
    user.password = hashedPassword;
    user.forgotPasswordOtpVerified = false;
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//logout
export const logoutUser = async (req, res) => {
  logger.debug("Logout API called for user:", req.userId);
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }

    logger.debug("Updating user with id:", req.userId);

    const user = await User.findById(req.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    logger.debug("Found user:", user._id, "current status:", user.status);

    const currentTime = new Date();

    // Find the latest login session without a logoutTime
    const latestSession = user.loginHistory.find(
      (session) => !session.logoutTime,
    );
    if (latestSession) {
      latestSession.logoutTime = currentTime;
      latestSession.sessionDuration = Math.floor(
        (currentTime - latestSession.loginTime) / (1000 * 60),
      ); // in minutes
    }

    user.status = "inactive";
    user.lastLogout = currentTime;

    // SECURITY FIX 3.32.8: Revoke all active refresh tokens on logout
    // This prevents token reuse if refresh token is compromised
    // User must login again to get new tokens
    try {
      await RefreshToken.updateMany(
        {
          user: user._id,
          isRevoked: false,
        },
        {
          isRevoked: true,
          revokedAt: new Date(),
        },
      );
      logger.debug("Refresh tokens revoked for user:", user._id);
    } catch (tokenError) {
      logger.error("Error revoking refresh tokens:", tokenError);
      // Don't fail logout if token revocation fails, but log it
    }

    user.currentRefreshTokenId = null;

    try {
      await user.save();
      logger.debug("User saved successfully");
    } catch (saveError) {
      logger.error("Error saving user:", saveError.message);
      throw saveError;
    }

    logger.debug("After logout - User status:", user.status);

    // Calculate days since last logout
    const daysSinceLogout = Math.floor(
      (currentTime - user.lastLogout) / (1000 * 60 * 60 * 24),
    );

    // SECURITY FIX 3.32.9: Clear authentication cookies on logout
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none", // Must match Set-Cookie attributes from login
      path: "/",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none", // Must match Set-Cookie attributes from login
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
      daysSinceLogout: daysSinceLogout,
    });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
