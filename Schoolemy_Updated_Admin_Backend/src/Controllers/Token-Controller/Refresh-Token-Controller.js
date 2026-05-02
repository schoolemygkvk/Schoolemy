import RefreshToken from "../../Models/RefreshToken-Model/RefreshToken-Model.js";
import Admin from "../../Models/Admin/Admin-login-Model.js";
import Tutor from "../../Models/Tutor/TutorModel.js";
import jwt from "jsonwebtoken";
import CONFIG from "../../config/constants.js";
import {
  generateAccessToken,
  generateRefreshTokenString,
} from "../../Utils/JwtToken.js";
import { hashToken, compareToken, hashTokenSHA256, verifyTokenSHA256 } from "../../Utils/passwordHash.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

const REFRESH_TOKEN_EXPIRY_MS = CONFIG.REFRESH_TOKEN_EXPIRY_MS;


export const revokeRefreshToken = async (userId) => {
  await RefreshToken.updateMany(
    { userRef: userId, isRevoked: false },
    { $set: { isRevoked: true, revokedAt: new Date() } }
  );
};


export const createRefreshTokenDoc = async ({
  userId,
  userModel,
  ipAddress,
  userAgent,
}) => {
  const plainToken = generateRefreshTokenString();
  const tokenHash = hashTokenSHA256(plainToken); // SHA-256 for fast O(1) lookup
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

  const doc = await RefreshToken.create({
    userRef: userId,
    userModel,
    tokenHash,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return { plainToken, doc };
};


export const refreshAccessToken = async (req, res) => {
  try {
    let incomingToken = req.cookies?.refreshToken || req.body?.refreshToken;

    // Fallback to Authorization Bearer header if token not found in cookie/body
    if (!incomingToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        incomingToken = authHeader.substring(7);
      }
    }

    if (!incomingToken) {
      return res.status(401).json({
        success: false,
        code: "NO_REFRESH_TOKEN",
        message: "Refresh token not found",
      });
    }

    // Primary path: O(1) lookup using SHA-256 hash index (new token format)
    const tokenHash = hashTokenSHA256(incomingToken);
    let matchedDoc = await RefreshToken.findOne({
      tokenHash,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    // Fallback path: handle tokens created before SHA-256 migration (bcrypt format)
    // Decode the (possibly expired) access token to get userId as a hint, then
    // scan only that user's old-format tokens — avoids the global bcrypt loop.
    if (!matchedDoc) {
      let hintUserId = null;
      try {
        const decoded = jwt.decode(req.cookies?.accessToken || "");
        if (decoded?.id) hintUserId = decoded.id;
      } catch (_) {}

      const query = {
        token: { $exists: true, $ne: null },
        tokenHash: { $exists: false },
        isRevoked: false,
        expiresAt: { $gt: new Date() },
        ...(hintUserId ? { userRef: hintUserId } : {}),
      };

      const oldFormatCandidates = await RefreshToken.find(query).limit(10);
      for (const candidate of oldFormatCandidates) {
        const isMatch = await compareToken(incomingToken, candidate.token);
        if (isMatch) {
          matchedDoc = candidate;
          // Migrate this token to SHA-256 in the background
          candidate.tokenHash = tokenHash;
          candidate.save().catch(() => {});
          break;
        }
      }
    }

    if (!matchedDoc) {
      // Could be a replayed/stolen token. Clear cookies defensively.
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken", { path: "/refresh-token" }); // Must match original path
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Refresh token is invalid or expired",
      });
    }

    // Mark old token as rotated (not revoked — revoked is for logout)
    matchedDoc.isRevoked = true;
    matchedDoc.rotatedAt = new Date();
    await matchedDoc.save();

    // Look up the user to confirm they still exist and get their role
    let user = null;
    let userModelName = matchedDoc.userModel;

    if (userModelName === "Admin-data-login") {
      user = await Admin.findById(matchedDoc.userRef).select(
        "_id role email name"
      );
    } else {
      user = await Tutor.findById(matchedDoc.userRef).select(
        "_id role email name"
      );
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "User associated with this token no longer exists",
      });
    }

    // Issue new token pair
    const newAccessToken = generateAccessToken(
      user._id,
      user.role,
      user.email,
      user.name
    );
    const { plainToken: newRefreshPlain, doc: newRefreshDoc } =
      await createRefreshTokenDoc({
        userId: user._id,
        userModel: userModelName,
        ipAddress: req.ip || req.headers["x-forwarded-for"] || "Unknown",
        userAgent: req.headers["user-agent"] || "Unknown",
      });

    // Update currentRefreshTokenId on the user document
    user.currentRefreshTokenId = newRefreshDoc._id;
    await user.save();

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "strict",
      maxAge: CONFIG.ACCESS_TOKEN_EXPIRY_MS,
    });

    res.cookie("refreshToken", newRefreshPlain, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "strict",
      maxAge: REFRESH_TOKEN_EXPIRY_MS,
      path: "/refresh-token", // restrict refresh token cookie to the one endpoint that needs it
    });

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshPlain,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during token refresh",
      error:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
