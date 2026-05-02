
import { logger } from "../Utils/logger.js";
import dotenv from "dotenv";

dotenv.config();

// Middleware/authMiddleware.js
import {
  collectAccessTokenCandidates,
  verifyAccessTokenCandidates,
} from "../Utils/accessTokenCandidates.js";

// SECURITY FIX 3.25.1: Define public routes with clear patterns (exact and regex)
// Prevents confusion from string patterns like "/courses/:id" that don't work with exact matching
// All routes are now explicitly defined and properly matched using appropriate methods

const OBJECT_ID_PATTERN = "[a-fA-F0-9]{24}";

// Exact-match public paths (no auth required)
// Note: Paths must include their route prefix as they appear in req.path
const PUBLIC_ROUTES_EXACT = new Set([
  // Authentication endpoints - both v1 and non-versioned paths
  "/users/register",
  "/users/verify-otp",
  "/users/resend-otp",
  "/users/create-password",
  "/users/login",
  "/users/forgot-password",
  "/users/verify-forgot-password-otp",
  "/users/reset-password",
  "/users/form",
  "/users/complete-registration",
  "/users/refresh-token",
  // Also include /v1 prefixed versions for explicit API versioning
  "/v1/users/register",
  "/v1/users/verify-otp",
  "/v1/users/resend-otp",
  "/v1/users/create-password",
  "/v1/users/login",
  "/v1/users/forgot-password",
  "/v1/users/verify-forgot-password-otp",
  "/v1/users/reset-password",
  "/v1/users/form",
  "/v1/users/complete-registration",
  "/v1/users/refresh-token",
  // Course browsing (public)
  "/allcourses",
  "/courses/user-view",
  "/v1/courses/user-view",
  // Contact and forms
  "/contact",
  "/v1/contact",
]);

// Pattern-based public paths (regex)
// Each pattern should be clear about what it matches
const PUBLIC_ROUTES_PATTERNS = [
  {
    name: "Course category listing",
    pattern: /^\/courses\/category\//,
  },
  {
    name: "Course detail by ID",
    pattern: new RegExp(`^/courses/${OBJECT_ID_PATTERN}$`),
  },
  {
    name: "Course content by ID",
    pattern: new RegExp(`^/courses/${OBJECT_ID_PATTERN}/content$`),
  },
  {
    name: "Tutor courses approved listing",
    pattern: /^\/tutor-courses\/approved(\/|$)/,
  },
  {
    name: "Tutor course detail by ID",
    pattern: new RegExp(`^/tutor-courses/${OBJECT_ID_PATTERN}$`),
  },
  {
    name: "Tutor course content by ID",
    pattern: new RegExp(`^/tutor-courses/${OBJECT_ID_PATTERN}/content$`),
  },
  {
    name: "Tutor profile by tutor ID",
    pattern: new RegExp(`^/tutor-courses/tutor/${OBJECT_ID_PATTERN}$`),
  },
];


function isPublicRoute(path) {
  const p = (path || "").split("?")[0];

  // Check exact matches first (faster)
  if (PUBLIC_ROUTES_EXACT.has(p)) return true;

  // Check pattern-based matches
  for (const route of PUBLIC_ROUTES_PATTERNS) {
    if (route.pattern.test(p)) {
      return true;
    }
  }

  return false;
}


export const requireRole = (...allowedRoles) => (req, res, next) => {
  const role = req.userRole || "user";
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action.",
    });
  }
  next();
};

const verifyToken = async (req, res, next) => {
  try {
    // Allow CORS preflight to pass without auth
    if (req.method === "OPTIONS") return next();

    const PATH = req.path;

    if (isPublicRoute(PATH)) {
      return next();
    }

    // Prefer httpOnly cookie, then Bearer; verify each until one succeeds (see collectAccessTokenCandidates)
    const candidates = collectAccessTokenCandidates(req);

    if (candidates.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Access token not found. Please login.",
        code: "NO_ACCESS_TOKEN",
      });
    }

    const result = verifyAccessTokenCandidates(candidates);
    if (!result.ok) {
      if (result.code === "TOKEN_EXPIRED") {
        return res.status(401).json({
          success: false,
          message: "Access token has expired",
          code: "TOKEN_EXPIRED",
        });
      }
      return res.status(403).json({
        success: false,
        message: "Token verification failed",
        code: "INVALID_TOKEN",
        error: result.error?.message,
      });
    }

    const { decoded } = result;

    // Extract user info from token
    req.userId = decoded.id;

    // FIX 2.1.3: Extract and store role from JWT token for role-based authorization
    // This allows downstream middleware/controllers to check user.role without extra DB queries
    req.userRole = decoded.role || "user"; // Default to 'user' if not specified
    req.isAdmin = decoded.role === "admin";
    req.isUser = decoded.role === "user";

    next();
  } catch (error) {
    logger.error("Token verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
      code: "AUTH_ERROR",
    });
  }
};

// BUG 2.8.2: Optional auth middleware - extracts userId if token provided, doesn't fail if not
// SECURITY FIX 3.32.5: Read token from HTTP-only cookie (not Authorization header)
const optionalAuth = async (req, res, next) => {
  try {
    // Allow CORS preflight to pass
    if (req.method === "OPTIONS") return next();

    const candidates = collectAccessTokenCandidates(req);

    if (candidates.length === 0) {
      req.userId = null;
      req.userRole = "guest";
      req.isAdmin = false;
      req.isUser = false;
      return next();
    }

    const result = verifyAccessTokenCandidates(candidates);
    if (result.ok) {
      const { decoded } = result;
      req.userId = decoded.id;
      req.userRole = decoded.role || "user";
      req.isAdmin = decoded.role === "admin";
      req.isUser = decoded.role === "user";
    } else {
      logger.debug(
        "Optional auth: token invalid, continuing as guest:",
        result.error?.message,
      );
      req.userId = null;
      req.userRole = "guest";
      req.isAdmin = false;
      req.isUser = false;
    }

    next();
  } catch (error) {
    logger.warn("Optional auth error, continuing without user context:", error.message);
    req.userId = null;
    req.userRole = "guest";
    req.isAdmin = false;
    req.isUser = false;
    next();
  }
};

export { verifyToken, optionalAuth, isPublicRoute };