import Admin from "../../Models/Admin/Admin-login-Model.js";
import Tutor from "../../Models/Tutor/TutorModel.js";
import RolePermission from "../../Models/RBAC/RolePermission.js";
import { getRoleSeedDefinition, mergePermissionMaps } from "../../config/rbacRoleDefinitions.js";
import CONFIG from "../../config/constants.js";

import crypto from "crypto";

import { JwtToken, generateAccessToken, generateRefreshTokenString } from "../../Utils/JwtToken.js";
import { generateOtp } from "../../Utils/OTPGenerate.js";
import { sendOtpEmail } from "../../Notification/Email-otp.js";
import { createRefreshTokenDoc, revokeRefreshToken } from "../Token-Controller/Refresh-Token-Controller.js";
import { comparePassword, hashPassword } from "../../Utils/passwordHash.js";
import { sendSuccess, sendError } from "../../Utils/responseHandler.js";


const MAX_LOGIN_HISTORY = 7;


const timingSafeCompare = (a, b) => {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(String(a)),
      Buffer.from(String(b))
    );
  } catch {
    return false;
  }
};


const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === "production";
  const cookieOpts = { httpOnly: true, secure: isProd, sameSite: isProd ? "none" : "strict" };
  res.cookie("accessToken", accessToken, { ...cookieOpts, maxAge: CONFIG.ACCESS_TOKEN_EXPIRY_MS });
  res.cookie("refreshToken", refreshToken, { ...cookieOpts, maxAge: CONFIG.REFRESH_TOKEN_EXPIRY_MS, path: "/refresh-token" });
};


const fetchRolePermissions = async (roleName) => {
  try {
    if (!roleName) {
      return { menuAccess: {}, routeAccess: {} };
    }
    const key = roleName.toLowerCase();
    const seed = getRoleSeedDefinition(key);
    const rolePerms = await RolePermission.findOne({
      roleName: key,
      isActive: true,
    });
    if (rolePerms) {
      if (seed) {
        return {
          menuAccess: mergePermissionMaps(seed.menuAccess, rolePerms.menuAccess),
          routeAccess: mergePermissionMaps(seed.routeAccess, rolePerms.routeAccess),
        };
      }
      return {
        menuAccess: rolePerms.menuAccess || {},
        routeAccess: rolePerms.routeAccess || {},
      };
    }
    if (seed) {
      return {
        menuAccess: { ...seed.menuAccess },
        routeAccess: { ...seed.routeAccess },
      };
    }
    return { menuAccess: {}, routeAccess: {} };
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return { menuAccess: {}, routeAccess: {} };
  }
};

// First Time OTP Verification
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    // Try Admin first, then Tutor
    let user = await Admin.findOne({ email });
    let modelType = "Admin";
    if (!user) {
      user = await Tutor.findOne({ email });
      modelType = user ? "Tutor" : modelType;
    }

    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Check expiry BEFORE value to prevent timing attacks on expired OTPs
    if (user.otpExpiresAt < new Date())
      return res.status(400).json({ message: "OTP has expired" });

    if (!timingSafeCompare(user.otp, otp))
      return res.status(400).json({ message: "Invalid OTP" });

    // Clear first time flags
    user.isFirstTime = false;
    user.otp = undefined;
    user.otpExpiresAt = undefined;

    // Track login time (include placeholders for logout/session duration)
    const loginEntry = {
      loginTime: new Date(),
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
      logoutTime: null,
      sessionDuration: null,
    };
    if (!Array.isArray(user.loginHistory)) user.loginHistory = [];
    user.loginHistory.push(loginEntry);
    user.loginHistory = user.loginHistory.slice(-MAX_LOGIN_HISTORY);

    await user.save();

    // Generate new token pair
    const accessToken = generateAccessToken(user._id, user.role, user.email, user.name);
    const { plainToken, doc } = await createRefreshTokenDoc({
      userId: user._id,
      userModel: modelType === "Tutor" ? "Tutor" : "Admin-data-login",
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
    });
    user.currentRefreshTokenId = doc._id;
    await user.save();
    setAuthCookies(res, accessToken, plainToken);

    // Fetch role permissions from DB (or empty objects if not found)
    const { menuAccess, routeAccess } = await fetchRolePermissions(user.role);

    // httpOnly cookies set above; body still includes accessToken + RBAC for the client
    return res.status(200).json({
      success: true,
      message: "Email verified and login successful",
      accessToken: accessToken,
      id: user.id,
      role: user.role || modelType,
      name: user.name,
      menuAccess,
      routeAccess,
      ...(modelType === "Tutor" ? { isApproved: user.isApproved } : {}),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return sendError(res, 400, "Email and password are required");
    }

    // Lookup in Admin then Tutor with normalized email
    const normalizedEmail = email.toLowerCase().trim();
    let user = await Admin.findOne({ $or: [{ email: normalizedEmail }, { mobilenumber: email }] });
    let modelType = "Admin";
    if (!user) {
      // Tutor model uses `mobilenumber` (not `phone`). Try both email and mobilenumber.
      user = await Tutor.findOne({ $or: [{ email: normalizedEmail }, { mobilenumber: email }] });
      modelType = user ? "Tutor" : modelType;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // For first-time users, still require password verification before sending OTP
    // This prevents OTP bombing attacks on known email addresses
    const isPasswordMatch = await comparePassword(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    if (user.isFirstTime) {
      const { otp, otpExpiresAt } = generateOtp();
      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();
      await sendOtpEmail(user.email, otp);

      return res.status(200).json({
        success: true,
        message: "OTP sent to email for first-time verification",
        isFirstTime: true,
      });
    }

    // Track login history
    // Create login history entry matching the schema fields
    const loginEntry = {
      loginTime: new Date(),
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "Unknown",
      userAgent: req.headers["user-agent"] || "Unknown",
      // Set placeholders for logout and duration (will be updated on logout)
      logoutTime: null,
      sessionDuration: null,
    };
    if (!Array.isArray(user.loginHistory)) user.loginHistory = [];
    user.loginHistory.push(loginEntry);
    user.loginHistory = user.loginHistory.slice(-MAX_LOGIN_HISTORY);

    // Generate new token pair
    const accessToken = generateAccessToken(user._id, user.role, user.email, user.name);

    // Parallelize token creation and permission fetch (two independent DB operations)
    const [{ plainToken, doc }, { menuAccess, routeAccess }] = await Promise.all([
      createRefreshTokenDoc({
        userId: user._id,
        userModel: modelType === "Tutor" ? "Tutor" : "Admin-data-login",
        ipAddress: req.ip || req.headers["x-forwarded-for"] || "Unknown",
        userAgent: req.headers["user-agent"] || "Unknown",
      }),
      fetchRolePermissions(user.role),
    ]);

    user.currentRefreshTokenId = doc._id;
    await user.save();
    setAuthCookies(res, accessToken, plainToken);

    return sendSuccess(res, 200, "Login successful", {
      accessToken: accessToken,
      refreshToken: plainToken,
      id: user.id,
      role: user.role || modelType,
      name: user.name,
      menuAccess,
      routeAccess,
      ...(modelType === "Tutor" ? { isApproved: user.isApproved } : {}),
    });
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, 500, "Login failed", error.message);
  }
};

// Logout
export const logoutAdmin = async (req, res) => {
  try {
    // Make sure the user is authenticated via middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
    }
    // Support Admin or Tutor
    let user = await Admin.findById(req.user.id);
    let modelType = "Admin";
    if (!user) {
      user = await Tutor.findById(req.user.id);
      modelType = user ? "Tutor" : modelType;
    }
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: `${modelType} not found` });
    }

    const now = new Date();

    // Find the most recent login without logoutTime
    const latestSession = (user.loginHistory || [])
      .slice()
      .reverse()
      .find((session) => !session.logoutTime);

    if (latestSession) {
      latestSession.logoutTime = now;
      latestSession.sessionDuration = Math.floor(
        (now - new Date(latestSession.loginTime)) / (1000 * 60)
      ); // Duration in minutes
    }

    // Parallelize user save and token revocation (two independent DB operations)
    await Promise.all([
      user.save(),
      revokeRefreshToken(req.user.id),
    ]);

    // Clear auth cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken", { path: "/refresh-token" });

    res.status(200).json({
      success: true,
      message: "Logout successful and session recorded",
      lastSession: latestSession || null,
      modelType,
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message,
    });
  }
};

// Forgot Password OTP
export const sendForgetPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;
    // Find in Admin or Tutor with normalized email
    const normalizedEmail = email.toLowerCase().trim();
    let user = await Admin.findOne({ email: normalizedEmail });
    let modelType = "Admin";
    if (!user) {
      user = await Tutor.findOne({ email: normalizedEmail });
      modelType = user ? "Tutor" : modelType;
    }
    if (!user) return res.status(404).json({ message: `${modelType} not found` });

    const { otp, otpExpiresAt } = generateOtp();
    user.forgotPasswordOtp = otp;
    user.forgotPasswordOtpExpiresAt = otpExpiresAt;
    user.forgotPasswordOtpVerified = false;
    await user.save();

    await sendOtpEmail(email, otp);
    res.status(200).json({ message: "OTP sent to your email address." });
  } catch (err) {
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
};

// Reset Password
export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, password, confirmPassword } = req.body;

    // Input validation
    if (!email || !otp || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check password match (constant-time comparison)
    if (!timingSafeCompare(password, confirmPassword)) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Find user with normalized email (case-insensitive, trimmed)
    // Prevents NoSQL injection by using direct equality instead of regex
    const normalizedEmail = email.toLowerCase().trim();
    let user = await Admin.findOne({ email: normalizedEmail });
    let modelType = "Admin";
    if (!user) {
      user = await Tutor.findOne({ email: normalizedEmail });
      modelType = user ? "Tutor" : modelType;
    }
    if (!user) return res.status(404).json({ message: `${modelType} not found` });

    // Security: OTP attempt tracking
    if ((user.otpAttempts || 0) >= 3) {
      return res.status(429).json({
        message: "Too many attempts. Please request a new OTP.",
      });
    }

    // OTP validation (constant-time comparison to prevent timing attacks)
    if (!timingSafeCompare(user.forgotPasswordOtp, otp)) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Check expiration
    if (
      !user.forgotPasswordOtpExpiresAt ||
      user.forgotPasswordOtpExpiresAt < new Date()
    ) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    // Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must contain 8+ characters with uppercase, lowercase, number and special character",
      });
    }

    // Password history check (prevent reuse)
    const isPreviousPassword = await comparePassword(password, user.password);
    if (isPreviousPassword) {
      return res.status(400).json({
        message: "Cannot reuse previous password",
      });
    }

    // Hash password with consistent salt rounds
    const hashedPassword = await hashPassword(password);

    // Update user
    user.password = hashedPassword;
    user.forgotPasswordOtp = null;
    user.forgotPasswordOtpExpiresAt = null;
    user.forgotPasswordOtpVerified = true;
    user.otpAttempts = 0; // Reset attempts
    user.passwordUpdatedAt = Date.now();
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({
      message: "Error resetting password",
      error:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Internal server error",
    });
  }
};





