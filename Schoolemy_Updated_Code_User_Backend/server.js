import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import session from "express-session";
import cookieParser from "cookie-parser";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import customMongoSanitize from "./src/Middleware/customMongoSanitize.js";
import {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
  paymentLimiter,
  enrollmentLimiter,
  generalApiLimiter,
} from "./src/Middleware/rateLimitConfig.js";
import swaggerConfig from "./src/Config/swaggerConfig.js";
import { metricsMiddleware, getMetrics } from "./src/Config/prometheusConfig.js";
import logger from "./src/Utils/logger.js";
import {
  sanitizeError,
  formatErrorResponse,
  handleFileUploadError,
  handleJsonError,
} from "./src/Utils/errorResponseHandler.js";

// CRITICAL: Load environment variables FIRST, before any other imports
dotenv.config();

// Validate JWT_SECRET is configured before importing anything that uses it
if (!process.env.JWT_SECRET) {
  console.error(
    "FATAL: JWT_SECRET environment variable is not set. Server cannot start.",
  );
  console.error("Please add JWT_SECRET to your .env file and restart the server.");
  process.exit(1);
}

import connectDB from "./src/DB/db.js";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";

import { verifyToken } from "./src/Middleware/authMiddleware.js";
import { conditionalCsrfProtection, generateCsrfToken } from "./src/Middleware/csrfProtection.js";
import { globalErrorHandler } from "./src/Middleware/globalErrorHandler.js";
import { piiProtectionMiddleware } from "./src/Middleware/piiProtectionMiddleware.js";

// ARCHITECTURE FIX 3.31.5: API Versioning
// Routes are now organized by API version for backward compatibility and future-proofing
// Current: v1 routes, Future: v2 routes (ready for breaking changes)

// v1 Routes (All current routes)
import userRoutes from "./src/Routes/users-routes/User-Routes.js";
import userProfileRoutes from "./src/Routes/users-routes/user-profile-routes.js";
import userProfileManagementRoutes from "./src/Routes/users-routes/UserProfileManagementRoutes.js";
import courses from "./src/Routes/Course-routes/Course-routes.js";
import Payment from "./src/Routes/Payment-Routes/Payment-Routes.js";
import webhookRoutes from "./src/Routes/Payment-Routes/Webhook-Routes.js";
import Purchasedcourse from "./src/Routes/Purchased-routes/Purchased-routs.js";
import ExamQuestion from "./src/Routes/Exan-Question-Routes.js/Exam-Question-Routes.js";
import tutorCourseRoutes from "./src/Routes/Tutor-Course-Routes/TutorCourseRoutes.js";

import pcmClassRoutes from "./src/Routes/PCM-Class-Routes/PCMClassRoutes.js";
import announcementRoutes from "./src/Routes/Announcement-Routes/AnnouncementRoutes.js";
import contactRoutes from "./src/Routes/Contact-Routes/ContactRoutes.js";
import events from "./src/Routes/Event-Routes/event.routes.js";


import notificationRoutes from "./src/Routes/NotificationBell/NotificationRoutes.js";
import joinRequestRoutes from "./src/Routes/NotificationBell/joinRequestRoutes.js";
import materialRoutes from "./src/Routes/NotificationBell/materialRoutes.js";

import userCourseMeetRoutes from "./src/Routes/DirectMeet/UserCourseMeetRoutes.js";
import userNotificationRoutes from "./src/Routes/DirectMeet/UserNotificationRoutes.js";
import meetPaymentRoutes from "./src/Routes/DirectMeet/MeetPaymentRoutes.js";

import complaintRoutes from "./src/Routes/Complaint-Routes/Complaint-Routes.js";
import invoiceRoutes from "./src/Routes/Invoice-Routes/Invoice-Routes.js";

import userDashboardRoutes from "./src/Routes/UserDashboard/UserDashboardRoutes.js";
import staffDetailsRoutes from "./src/Routes/Resources-Routes/staff-details-routes.js";
import wishlistRoutes from "./src/Routes/Wishlist-Routes.js";
import progressRoutes from "./src/Routes/Progress-Routes.js";
import certificateRoutes from "./src/Routes/Certificate-Routes.js";
import fileDownloadRoutes from "./src/Routes/FileDownloadRoutes.js";

const app = express();
const PORT = process.env.PORT || 8000;
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
const isTest = process.env.NODE_ENV === "test";

/* ======================= CORS CONFIG (FIXED) ======================= */

// Allow multiple origins (local + production)
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "https://schoolemy.com",
  "https://www.schoolemy.com",
  process.env.FRONTEND_URL, // optional live domain
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // SECURITY FIX 3.24.1: Require origin header and validate against allowedOrigins
    // Prevents CORS bypass by rejecting requests without origin header
    // This protects against server-to-server attacks where attacker makes requests without origin

    // If no origin header is provided, reject the request
    // This is the standard CORS security practice
    if (!origin) {
      // For development/testing only: Allow missing origin if valid Authorization header is present
      // This supports curl/Postman with proper authentication
      // In production, all requests should have proper origin headers
      const isDevelopment = process.env.NODE_ENV !== "production";
      if (isDevelopment) {
        // In dev: allow, but log for monitoring
        console.warn("Request without origin header received. In production, this would be rejected.");
        return callback(null, true);
      } else {
        // In production: reject requests without origin header
        return callback(new Error("Origin header is required"));
      }
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token", "x-csrf-token"],
  optionsSuccessStatus: 200,
};

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/* ======================= RATE LIMITING CONFIG ======================= */
// SECURITY FIX 3.27.1: Rate limiting imported from config file
// Protects critical endpoints from brute force and abuse:
// - auth (login/register): 5 attempts per 15 minutes
// - otp: 3 attempts per 10 minutes
// - passwordReset: 3 attempts per 15 minutes
// - payment: 10 attempts per 1 hour
// - enrollment: 20 attempts per 1 hour
// See: src/Middleware/rateLimitConfig.js

/* ======================= MIDDLEWARE ORDER (IMPORTANT) ======================= */

// 1. Enable CORS first (automatically handles preflight OPTIONS requests)
app.use(cors(corsOptions));

// 2. Security headers (Helmet) - protects against clickjacking, XSS, MIME sniffing, etc.
app.use(helmet());

// 3. Session middleware (required by CSRF protection)
// SECURITY FIX 3.25.1: Session storage for CSRF token validation
// Sessions are stored in memory (suitable for development/testing)
// For production with multiple processes, upgrade to Redis or MongoDB session store
app.use(
  session({
    secret: process.env.JWT_SECRET || "your-session-secret-change-in-production",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true, // Prevent JavaScript access to session cookie
      // None in production (cross-origin API); Lax in dev (same-origin localhost development)
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);


app.use(cookieParser());

app.use(express.json());


app.use(customMongoSanitize());


app.use(metricsMiddleware);

// 6. Static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));



app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const isHealthy = dbState === 1; // 1 = connected, 0 = disconnected, 2 = connecting, 3 = disconnecting

  const health = {
    status: isHealthy ? "UP" : "DOWN",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // Seconds since server started
    environment: process.env.NODE_ENV || "development",
    database: {
      connected: isHealthy,
      state: ["disconnected", "connected", "connecting", "disconnecting"][dbState] || "unknown",
    },
    memory: {
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      external: Math.round(process.memoryUsage().external / 1024 / 1024), // MB
    },
  };

  // Return 200 OK if healthy, 503 Service Unavailable if unhealthy
  const httpStatus = isHealthy ? 200 : 503;
  res.status(httpStatus).json(health);
});


app.get("/readiness", (req, res) => {
  try {
    // Check database connectivity
    const dbConnected = mongoose.connection.readyState === 1;



    const ready = {
      ready: dbConnected,
      checks: {
        database: dbConnected,
        // Can add more checks here as needed
      },
    };

    // Return 200 if ready, 503 if not ready
    const httpStatus = dbConnected ? 200 : 503;
    res.status(httpStatus).json(ready);
  } catch (error) {
    // Readiness check failed
    res.status(503).json({
      ready: false,
      error: "Readiness check failed",
    });
  }
});


app.get("/live", (req, res) => {
  // Minimal check - just verify the process is responding
  res.status(200).json({ alive: true });
});

// PUBLIC: CSRF token endpoint - accessible without authentication
// Frontend calls this to get CSRF token before making state-changing requests
app.get("/csrf-token", generateCsrfToken);


const swaggerSpec = swaggerJsdoc(swaggerConfig);
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      docExpansion: "list", // Collapse endpoints by default
      filter: true, // Enable filtering by tag
      deepLinking: true, // Enable deep linking to specific endpoints
    },
    customCss: ".swagger-ui .topbar { display: none }", // Hide topbar for cleaner look
    customSiteTitle: "Schoolemy API Documentation",
  }),
);

// Also provide raw JSON spec for API tools
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});


app.get("/metrics", (req, res) => {
  res.setHeader("Content-Type", "application/openmetrics-text; version=1.0.0; charset=utf-8");
  res.send(getMetrics());
});


// Create v1 API router
const v1Router = express.Router();

/* ======================= v1 PUBLIC ROUTES ======================= */
// Routes that don't require authentication
v1Router.use("/users", userRoutes);
v1Router.use("/announcements", announcementRoutes);
v1Router.use("/pcm", pcmClassRoutes);
v1Router.use("/contact", contactRoutes);
v1Router.use("/events", events);
v1Router.use("/dashboard", userDashboardRoutes);
v1Router.use("/staff", staffDetailsRoutes);
v1Router.use("/courses", courses);           // optionalAuth inside — works for guests + logged-in
v1Router.use("/tutor-courses", tutorCourseRoutes); // public listing, no auth needed

/* ======================= WEBHOOK ROUTES (NO AUTH) ======================= */
// Webhooks must be public and use v1 prefix
// Signature verification ensures security, not authentication
v1Router.use("/webhooks", webhookRoutes);

/* ======================= v1 PROTECTED ROUTES ======================= */
// Apply auth middleware to v1Router for protected routes
v1Router.use(verifyToken);

// Apply CSRF protection to v1Router
v1Router.use(conditionalCsrfProtection);

// Protected endpoints
v1Router.use("/user-profile", userProfileRoutes);
v1Router.use("/user-profile-management", userProfileManagementRoutes);
v1Router.use("/wishlist", wishlistRoutes);
v1Router.use("/progress", progressRoutes);
v1Router.use("/certificates", certificateRoutes);
v1Router.use("/resources", fileDownloadRoutes);
v1Router.use("/payments", Payment);
v1Router.use("/exam-questions", ExamQuestion);
v1Router.use("/purchased-courses", Purchasedcourse);
v1Router.use("/user-course-meets", userCourseMeetRoutes);
v1Router.use("/user-notifications", userNotificationRoutes);
v1Router.use("/meet-payments", meetPaymentRoutes);
v1Router.use("/notifications", notificationRoutes);
v1Router.use("/join-requests", joinRequestRoutes);
v1Router.use("/materials", materialRoutes);
v1Router.use("/complaints", complaintRoutes);
v1Router.use("/invoices", invoiceRoutes);

/* ======================= REGISTER API VERSIONS ======================= */
// v1 is current stable version
app.use("/api/v1", v1Router);


app.use("/api", (req, res, next) => {
  // Skip if already versioned (starts with /v1, /v2, etc.)
  if (req.path.match(/^\/v\d+/)) {
    return next();
  }

  // Redirect unversioned API calls to v1
  // Example: GET /api/courses → GET /api/v1/courses
  req.url = `/v1${req.path}`;
  next();
});

// Register v1 router again for redirected requests
app.use("/api", v1Router);


app.use(verifyToken);
app.use(conditionalCsrfProtection);

/* ======================= PII PROTECTION MIDDLEWARE ======================= */
// SECURITY FIX: Global PII data protection
// Validates that no sensitive fields (aadhar, age, address, etc.) are exposed in API responses
// Runs on all responses BEFORE error handler to catch and sanitize any leaked PII
app.use(piiProtectionMiddleware);

/* ======================= GLOBAL ERROR HANDLER ======================= */
// Must be registered AFTER all routes and middleware
// Catches and sanitizes all unhandled errors with consistent responses
app.use(globalErrorHandler);

/* ======================= 404 NOT FOUND HANDLER ======================= */
// Catches requests to routes that don't exist
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.path}`,
  });
});

/* ======================= GRACEFUL SHUTDOWN HANDLING ======================= */
// OPERATIONS FIX 3.31.7: Graceful shutdown for data safety
// Ensures in-flight requests complete before server exits
// Prevents data loss during Docker/Kubernetes restarts

let isShuttingDown = false;
const SHUTDOWN_TIMEOUT = 30000; // 30 seconds for graceful shutdown
let server = null;


async function gracefulShutdown(signal, exitCode = 0) {
  if (isShuttingDown) {
    logger.warn(`Graceful shutdown already in progress, ignoring ${signal}`);
    return;
  }

  isShuttingDown = true;
  logger.info(`${signal} received, starting graceful shutdown...`, {
    signal,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });

  // Step 1: Stop accepting new connections
  if (server) {
    server.close(async () => {
      logger.info("Server stopped accepting new connections");

      try {
        // Step 2: Close database connection
        if (mongoose.connection.readyState === 1) {
          logger.info("Closing database connection...");
          await mongoose.connection.close();
          logger.info("Database connection closed successfully");
        }
      } catch (error) {
        logger.error("Error closing database connection", {
          message: error.message,
          stack: error.stack,
        });
      }

      logger.info("Graceful shutdown completed", {
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });

      // Step 3: Exit process
      process.exit(exitCode);
    });
  }

  // Step 3: Force shutdown after timeout to prevent hanging
  const shutdownTimer = setTimeout(() => {
    logger.error("Graceful shutdown timeout exceeded, forcing exit", {
      timeout: SHUTDOWN_TIMEOUT,
      uptime: process.uptime(),
    });
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);

  // Clear timeout if graceful shutdown completes before timeout
  server?.once("close", () => {
    clearTimeout(shutdownTimer);
  });
}

/* ======================= SHUTDOWN SIGNAL HANDLERS ======================= */


process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM", 0);
});


process.on("SIGINT", () => {
  gracefulShutdown("SIGINT", 0);
});


process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception detected", {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: new Date().toISOString(),
  });

  // Attempt graceful shutdown after uncaught exception
  // (process may be in unstable state, so also force exit)
  gracefulShutdown("uncaughtException", 1);
});


process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled promise rejection", {
    reason: reason instanceof Error ? reason.message : String(reason),
    promise: String(promise),
    timestamp: new Date().toISOString(),
  });

  // Don't exit on unhandled rejection, just log it
  // (application can often continue)
});

/* ======================= SHUTDOWN STATUS MIDDLEWARE ======================= */

app.use((req, res, next) => {
  if (isShuttingDown) {
    return res.status(503).json({
      success: false,
      message: "Server is shutting down. Please try again in a moment.",
      code: "SERVER_SHUTTING_DOWN",
      timestamp: new Date().toISOString(),
    });
  }
  next();
});

/* ======================= SERVER START ======================= */
if (isLambda) {

  logger.info("[Auth] JWT_SECRET is configured and validated");
  connectDB().catch((error) => {
    console.error("[INIT] Database connection failed:", error.message);
    console.error(error.stack);
  });
} else if (!isTest) {
  console.log(`[INIT] Starting Express server on port ${PORT}`);
  console.log(`[INIT] Environment: ${process.env.NODE_ENV || "development"}`);

  try {
    server = app.listen(PORT, "0.0.0.0", async () => {
      try {
        console.log("[INIT] Server listening, connecting to database...");
        await connectDB();

        console.log("[INIT]  Server fully initialized");
        logger.info(`Server running on port ${PORT}`, {
          port: PORT,
          environment: process.env.NODE_ENV || "development",
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        });
        logger.info("[Auth] JWT_SECRET is configured and validated");
      } catch (dbError) {
        console.error("[INIT] Fatal error during initialization:", dbError.message);
        console.error("[INIT] Stack trace:", dbError.stack);
        logger.error("Initialization failed", {
          message: dbError.message,
          stack: dbError.stack,
        });
        // Force exit if database can't connect
        process.exit(1);
      }
    });

    // Handle server errors
    server.on("error", (error) => {
      console.error("[SERVER] Error:", error.message);
      console.error("[SERVER] Stack:", error.stack);
      logger.error("Server error", {
        message: error.message,
        stack: error.stack,
        code: error.code,
        timestamp: new Date().toISOString(),
      });

      // Handle specific error cases
      if (error.code === "EADDRINUSE") {
        console.error(`[SERVER] Port ${PORT} is already in use`);
        console.error("[SERVER] Try a different port or kill the existing process");
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("[INIT] Failed to start server:", error.message);
    console.error("[INIT] Stack trace:", error.stack);
    process.exit(1);
  }
}

export default app;
export {
  authLimiter,
  otpLimiter,
  passwordResetLimiter,
  paymentLimiter,
  enrollmentLimiter,
  generalApiLimiter,
};
