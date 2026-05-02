import jwt from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../../Models/User-Model/User-Model.js";
import RefreshToken from "../../Models/RefreshToken-Model/RefreshToken-Model.js";
import {
  ACCESS_TOKEN_EXPIRY,
  ACCESS_TOKEN_COOKIE_MAX_MS,
  expiryStringToMs,
} from "../../Utils/tokenExpiry.js";
import { logger } from "../../Utils/logger.js";
import { getJwtSecret } from "../../Utils/jwtSecret.js";
import { decodeAccessTokenIgnoreExpiry } from "../../Utils/accessTokenCandidates.js";

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
  // Generate a cryptographically secure random token
  return crypto.randomBytes(32).toString("hex");
};


const hashRefreshToken = async (token) => {
  return await bcrypt.hash(token, 10);
};


const verifyRefreshTokenString = async (plainToken, hashedToken) => {
  return await bcrypt.compare(plainToken, hashedToken);
};

export const refreshAccessToken = async (req, res) => {
  try {
    // SECURITY FIX 3.32.13: Read refresh token from HTTP-only cookie
    const refreshTokenCookie = req.cookies?.refreshToken;

    if (!refreshTokenCookie) {
      logger.warn("Refresh token endpoint called without token", {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      return res.status(401).json({
        success: false,
        message: "Refresh token not found. Please login again.",
        code: "NO_REFRESH_TOKEN",
      });
    }


    let userId = null;
    const decodedAccess = decodeAccessTokenIgnoreExpiry(req);
    if (decodedAccess) {
      userId = decodedAccess.id;
    } else {
      logger.debug(
        "Could not decode access token for refresh (cookie/Bearer invalid or missing)",
      );
    }

    // If we couldn't get userId from access token, we have a problem
    // Refresh tokens are tied to user, so we need user context
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid session. Please login again.",
        code: "INVALID_SESSION",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      logger.warn("Refresh token called for non-existent user", { userId });
      return res.status(401).json({
        success: false,
        message: "User not found. Please login again.",
        code: "USER_NOT_FOUND",
      });
    }


    const storedTokenRecord = await RefreshToken.findOne({
      user: userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    if (!storedTokenRecord) {
      logger.warn("No valid refresh token found for user", { userId });
      return res.status(401).json({
        success: false,
        message: "Refresh token invalid or expired. Please login again.",
        code: "INVALID_REFRESH_TOKEN",
      });
    }

    // Verify the token string against hashed DB token
    const tokenValid = await verifyRefreshTokenString(
      refreshTokenCookie,
      storedTokenRecord.token,
    );

    if (!tokenValid) {
      logger.warn("Refresh token signature mismatch", {
        userId,
        tokenId: storedTokenRecord._id,
      });
      // SECURITY: Mark this token as potentially compromised (stolen/guessed)
      storedTokenRecord.isRevoked = true;
      storedTokenRecord.revokedAt = new Date();
      await storedTokenRecord.save();

      return res.status(401).json({
        success: false,
        message: "Refresh token invalid. Please login again.",
        code: "INVALID_REFRESH_TOKEN",
      });
    }


    storedTokenRecord.rotatedAt = new Date();
    await storedTokenRecord.save();

    // Generate new tokens
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshTokenString = generateRefreshTokenString();
    const newRefreshTokenHash = await hashRefreshToken(newRefreshTokenString);


    const newRefreshTokenRecord = new RefreshToken({
      user: user._id,
      token: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + expiryStringToMs(process.env.REFRESH_TOKEN_EXPIRY || "30d")),
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get("User-Agent"),
      isRevoked: false,
    });

    await newRefreshTokenRecord.save();

    // Update user's current refresh token pointer
    user.currentRefreshTokenId = newRefreshTokenRecord._id;
    await user.save();


    res.cookie("accessToken", newAccessToken, {
      httpOnly: true, // JavaScript cannot access (prevents XSS theft)
      secure: true, // Required for SameSite=None to work across origins
      sameSite: "none", // Allow cross-origin cookie sending; CSRF protected by X-CSRF-Token header
      maxAge: ACCESS_TOKEN_COOKIE_MAX_MS,
      path: "/", // Available to entire application
    });

    // Refresh token: 30 days
    res.cookie("refreshToken", newRefreshTokenString, {
      httpOnly: true,
      secure: true, // Required for SameSite=None
      sameSite: "none", // Allow cross-origin cookie sending; CSRF protected by X-CSRF-Token header
      maxAge: expiryStringToMs(process.env.REFRESH_TOKEN_EXPIRY || "30d"),
      path: "/", // Available to entire application
    });

    logger.info("Refresh token rotation successful", {
      userId: user._id,
      oldTokenId: storedTokenRecord._id,
      newTokenId: newRefreshTokenRecord._id,
    });

    return res.status(200).json({
      success: true,
      message: "Access token refreshed successfully",
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error("Refresh token error:", {
      message: error.message,
      stack: error.stack,
      userId: req.userId,
    });
    return res.status(500).json({
      success: false,
      message: "Token refresh failed",
      code: "REFRESH_ERROR",
    });
  }
};


export const revokeRefreshToken = async (userId) => {
  try {
    // Revoke all active refresh tokens for user
    const result = await RefreshToken.updateMany(
      {
        user: userId,
        isRevoked: false,
      },
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
    );

    logger.info("Refresh tokens revoked", {
      userId,
      count: result.modifiedCount,
    });

    return result;
  } catch (error) {
    logger.error("Error revoking refresh tokens:", {
      userId,
      error: error.message,
    });
    throw error;
  }
};

export default {
  refreshAccessToken,
  revokeRefreshToken,
};
