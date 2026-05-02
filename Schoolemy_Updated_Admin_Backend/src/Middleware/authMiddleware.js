import jwt from "jsonwebtoken";
import { isValidToken, isTokenExpiringSoon } from "../Utils/security.js";

const verifyToken = async (req, res, next) => {
  try {
    const PATH = req.path;

    // Allow public routes without token
    const publicPaths = [
      "/adminlogin",
      "/verify-otp",
      "/forgot-password",
      "/reset-password",
      "/csrf-token",
      "/refresh-token",
      "/api/blog/published",
      "/api/blog/search",
      "/api/blog/admin/all",
      "/api/announcements/latest",
      "/api/my-materials",
      "/api/advertisements/active",
      "/api/courses/getcoursesname",
      "/api/userdashboard/top-banner",
      "/api/userdashboard/hero",
      "/api/userdashboard/why-choose-us",
      "/api/userdashboard/courses",
      "/api/userdashboard/categories",
      "/api/userdashboard/what-we-offer",
      "/api/userdashboard/demo-video",
      "/api/userdashboard/feedback",
      "/api/userdashboard/cta"
    ];

    // Check exact match for public paths
    if (publicPaths.includes(PATH)) {
      return next();
    }

    // Track advertisement events (POST to /api/advertisements/track)
    if (PATH === "/api/advertisements/track" && req.method === "POST") {
      return next();
    }

    // Check pattern match for dynamic routes (materials access)
    if (PATH.startsWith("/api/course-meets/materials/s3/")) {
      return next();
    }

    // Check pattern match for public meets access
    if (PATH.startsWith("/api/course-meets/meets/")) {
      return next();
    }

    // Read token from httpOnly cookie or Authorization Bearer header
    let token = req.cookies?.accessToken;

    // Fallback to Authorization Bearer header if cookie not found
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7); // Remove "Bearer " prefix (length of "Bearer " is 7)
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "NO_ACCESS_TOKEN",
        message: "Access token not found",
      });
    }

    // Pre-validate token format before verification (defense in depth)
    if (!isValidToken(token)) {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN_FORMAT",
        message: "Token format is invalid",
      });
    }

    // Check if token is expiring soon (within 2 minutes) and notify client (don't block)
    if (isTokenExpiringSoon(token, 2)) {
      res.set("X-Token-Expiring-Soon", "true");
      // Continue — do NOT block the request, client can refresh proactively
    }

    // Decode and verify token (validates signature and expiry)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    next();
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        code: "TOKEN_EXPIRED",
        message: "Access token has expired",
      });
    }
    return res.status(401).json({
      success: false,
      code: "INVALID_TOKEN",
      message: "Token verification failed",
    });
  }
};

export { verifyToken };
