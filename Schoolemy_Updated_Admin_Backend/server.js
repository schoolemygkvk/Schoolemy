import "./src/config/env.js"; // must be first — loads .env before any module reads process.env
import "express-async-errors"; // patches express so async route errors call next(err) automatically
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import connectDB from "./src/DB/db.js";
import { autoSeedRBAC } from "./src/Utils/autoSeed.js";
import { verifyToken } from "./src/Middleware/authMiddleware.js";
import { csrfProtection, getCsrfToken } from "./src/Middleware/csrfProtection.js";
import logger from "./src/Utils/logger.js";
import { globalErrorHandler, notFoundHandler } from "./src/Middleware/errorHandler.js";

//Routs imports
import Login from "./src/Routes/Admin/loginRoutes.js";

// Admin
import AdminRoutes from "./src/Routes/Admin/AdminRoutes.js";
import GetAdminRoutes from "./src/Routes/Admin/AdmingetRoutes.js";

//courses
import Course from "./src/Routes/Courses/courseroutes.js";
import S3CourseUploadRoutes from "./src/Routes/Courses/S3CourseUploadRoutes.js";
import S3UploadRoutes from "./src/Routes/Courses/S3UploadRoutes.js";
import Exam from "./src/Routes/Courses/ExamQuestionRoutes.js";
import UserExamAnswerRoutes from "./src/Routes/Courses/UserExamAnswerRoutes.js";

//Data Maintenance

import ExamMarkRecords from "./src/Routes/Data-maintenance/exam-mark-records-routes.js";

import StaffDetails from "./src/Routes/Data-maintenance/staff-details-routes.js";
import InstructorsRoutes from "./src/Routes/Data-maintenance/instructors-routes.js";
import StudentComplaintRecords from "./src/Routes/Data-maintenance/sudent-complain-records-routes.js";

//user info
import userRoutes from "./src/Routes/User/User-routes.js";

//Payment
import PaymentRoutes from "./src/Routes/Payment/payment-routes.js";
import EMIPlanRoutes from "./src/Routes/Payment/Emi-routes.js";

//BOS
import bosMeetingRoutes from "./src/Routes/BOS/bos-meetingRoutes.js";
import bosCourseProposalRoutes from "./src/Routes/BOS/bos-CourseproposalRoutes.js";
import recentDecisionRoutes from "./src/Routes/BOS/recentDecisionRoutes.js";
import bosmom from "./src/Routes/BOS/bos-momRoutes.js";
import bosTaskRoutes from "./src/Routes/BOS/bos-taskRoutes.js";
import bosVotingRoutes from "./src/Routes/BOS/bos-votingRoutes.js";

// Meet management: canonical CourseMeet API. Legacy /api/direct-meets returns 410 Gone (see DirectMeetRoutes.js).
import DirectMeetRoutes from "./src/Routes/DirectMeet/DirectMeetRoutes.js";
import CourseMeetRoutes from "./src/Routes/DirectMeet/CourseMeetRoutes.js";

// Voting Scheduler
import {
  startPollStatusScheduler,
  startDeadlineChecker,
} from "./src/Utils/voting-scheduler.js";
// Announcement
import announcementRoutes from "./src/Routes/Announcement/AnnouncementRoutes.js";
// Advertisement
import advertisementRoutes from "./src/Routes/Advertisement/AdvertisementRoutes.js";
import marketingRoutes from "./src/Routes/Marketing/MarketingRoutes.js";

// Notification
import notificationRoutes from "./src/Routes/Notification-Routes/routes.js";

//notification bell
import notificationBellRoutes from "./src/Routes/NotificationBell/NotificationBellRoutes.js";
import joinRequestRoutes from "./src/Routes/NotificationBell/joinRequestRoutes.js";
import materialRoutes from "./src/Routes/NotificationBell/materialRoutes.js";

// Tutor Management
import tutorRoutes from "./src/Routes/Tutor/Tutor-Routes.js";
import courseRoutes from "./src/Routes/Tutor/Tutor-course-routes.js";

// PCM routes for managing PCM-class meetings
import pcmRoutes from "./src/Routes/Student-PCM/pcmRoutes.js";

// Blog Management
import blogRoutes from "./src/Routes/Blog/blogRoutes.js";

// UserDashboard (Homepage Content Management)
import userDashboardRoutes from "./src/Routes/UserDashboard/UserDashboardRoutes.js";

//Event Management
import eventManageRoutes from "./src/Routes/Event-Manage-Routes/event-manage-routes.js";

// Financial Management
import donationRoutes from "./src/Routes/Financial/DonationRoutes.js";
import expenseRoutes from "./src/Routes/Financial/ExpenseRoutes.js";
import invoiceRoutes from "./src/Routes/Financial/InvoiceRoutes.js";

// S3 Direct Upload (for unlimited file size uploads)
import S3PresignedRoutes from "./src/Routes/S3-Direct-Upload/S3PresignedRoutes.js";
import PreSignedUrlRoutes from "./src/Routes/S3-Direct-Upload/PreSignedUrlRoutes.js";
import S3MultipartRoutes from "./src/Routes/S3-Direct-Upload/S3MultipartRoutes.js";

// Audit Log Management
import auditLogRoutes from "./src/Routes/Auditing/AuditLogRoutes.js";

// Dashboard Analytics
import dashboardRoutes from "./src/Routes/Dashboard/DashboardRoutes.js";

// RBAC Management
import rbacRoutes from "./src/Routes/RBAC/RbacRoutes.js";

import path from "path";

const app = express();
const PORT = process.env.PORT;

// Express/Node can accumulate multiple Access-Control-Allow-Origin values; serverless-http
// joins them with ", " (invalid per CORS). Ensure at most one value is ever set.
app.use((req, res, next) => {
  const origSetHeader = res.setHeader.bind(res);
  res.setHeader = function (name, value) {
    if (String(name).toLowerCase() === "access-control-allow-origin") {
      try {
        res.removeHeader("Access-Control-Allow-Origin");
      } catch {
        /* ignore */
      }
    }
    return origSetHeader(name, value);
  };
  next();
});

// =============================================================================
// PRODUCTION-READY CORS CONFIGURATION
// =============================================================================
// Works identically in development and production
// No proxy needed - frontend calls backend directly using REACT_APP_API_URL
// =============================================================================

const allowedOrigins = [
  "http://localhost:3000", // React dev server
  "http://localhost:3001", // Alternative dev port
  "http://localhost:5000", // Backend testing
  "https://schoolemyadmin.schoolemy.com", // Production frontend
  "https://schoolemy.com", // Production domain
  "https://www.schoolemy.com", // Production domain (www)
  "https://www.schoolemyadmin.schoolemy.com", // Production domain (www)
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Cache-Control",
    "X-CSRF-Token",
    "X-Access-Token",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

// =============================================================================
// RATE LIMITING CONFIGURATION (IPv6 safe with ipKeyGenerator)
// =============================================================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: "Too many login attempts. Please try again in 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const ip = ipKeyGenerator(req, res);
    return `${ip}-${req.body.email || "unknown"}`;
  },
});

const otpLimiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3, // 3 OTP attempts per 30 minutes
  message: "Too many OTP attempts. Please request a new OTP.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const ip = ipKeyGenerator(req, res);
    return `${ip}-${req.body.email || "unknown"}`;
  },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: "Too many password reset attempts. Please try again in 1 hour.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    const ip = ipKeyGenerator(req, res);
    return `${ip}-${req.body.email || "unknown"}`;
  },
});

// =============================================================================
// SECURITY HEADERS (Helmet) - MUST be before other middleware
// =============================================================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],  // Needed for inline styles (can be removed with refactoring)
      imgSrc: ["'self'", "data:", "https:", "https://*.cloudfront.net"],
      mediaSrc: ["'self'", "https://*.s3.ap-south-1.amazonaws.com", "https://*.cloudfront.net"],
      fontSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://z3zj7b6tpb.execute-api.ap-south-1.amazonaws.com",  // schoolemy-test-admin Lambda
        "https://*.s3.ap-south-1.amazonaws.com",  // S3 buckets
        "https://*.cloudfront.net",  // CloudFront CDN
      ],
      frameSrc: ["'none'"],  // Cannot be embedded in iframes
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true,  // Allow HSTS preload list submission
  },
  frameguard: {
    action: "deny",  // Cannot be embedded (prevents clickjacking)
  },
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",  // Send referrer only for same-origin
  },
  xssFilter: true,  // Enable X-XSS-Protection header
  noSniff: true,  // Prevent MIME sniffing
  dnsPrefetchControl: {
    allow: false,  // Disable DNS prefetching
  },
  permittedCrossDomainPolicies: {
    permittedPolicies: "none",  // Flash/PDF restrictions
  },
  permissionsPolicy: {
    geolocation: [],
    microphone: [],
    camera: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    accelerometer: [],
  },
}));

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================
app.use(cors(corsOptions));
// Preflight is handled by app.use(cors(...)) — do not register cors again on app.options.

// HTTP request logging (skips health-check pings to reduce noise)
app.use(
  morgan("combined", {
    stream: { write: (msg) => logger.http(msg.trim()) },
    skip: (req) => req.url === "/health" || req.url === "/",
  })
);

// Body parsing with UTF-8 support
app.use(bodyParser.json({ limit: "100mb", charset: "utf-8" }));
app.use(
  bodyParser.urlencoded({ limit: "100mb", extended: true, charset: "utf-8" }),
);
app.use(express.json({ limit: "100mb", charset: "utf-8" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

// UTF-8 encoding for all responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Cache control headers for sensitive endpoints
app.use((req, res, next) => {
  const isAuthEndpoint = req.path.includes("/login") ||
                         req.path.includes("/auth") ||
                         req.path.includes("/verify") ||
                         req.path.includes("/refresh");

  if (isAuthEndpoint || req.path.includes("/admin") || req.path.includes("/api")) {
    // Don't cache sensitive responses
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

app.use(express.static("public"));

// Public Routes (before authentication middleware)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Cookie parsing (required before verifyToken reads req.cookies.accessToken)
app.use(cookieParser());

// CSRF protection for all state-mutating requests
app.use(csrfProtection);

// Middleware to extend timeout for S3 upload routes (10 minutes)
// Note: Lambda/serverless doesn't support setTimeout, so check first
const extendedTimeoutForUploads = (req, res, next) => {
  try {
    if (res.setTimeout && typeof res.setTimeout === 'function') {
      res.setTimeout(600000); // 10 minutes for upload operations
    }
  } catch (e) {
    // Silently ignore - Lambda/serverless doesn't support socket timeout
  }
  next();
};

// Blog Management (public routes first)
app.use("/api/blog", blogRoutes);

// CSRF Token endpoint (public — no auth required)
app.get("/csrf-token", getCsrfToken);

//Admin Login and Auth (MUST be before verifyToken middleware)
app.use("/", Login);

// S3 Direct Upload Routes (Public - for unlimited file uploads)
// Note: Add authentication if needed by moving after verifyToken
app.use("/api/s3", extendedTimeoutForUploads, S3PresignedRoutes);

// Apply authentication middleware for protected routes
app.use(verifyToken);

//Routes

//Admin Management
app.use("/", AdminRoutes);

//RBAC Management (Dynamic Role Permissions)
app.use(rbacRoutes);

//Courses - mounted at /api/courses for frontend compatibility
app.use("/api/courses", extendedTimeoutForUploads, S3CourseUploadRoutes); // S3 direct upload for courses (MUST be before general course routes)
app.use("/api/courses", Course);
app.use("/api/courses", extendedTimeoutForUploads, S3UploadRoutes);
// Also mount at /api for singular routes (update, delete, etc)
app.use("/api", Course);
app.use("/api", Exam);
app.use("/api", UserExamAnswerRoutes);

//Data Maintenance

app.use("/api", ExamMarkRecords);
app.use("/", StaffDetails);
app.use("/", InstructorsRoutes);
app.use("/api", StudentComplaintRecords);

//User Info
app.use("/", userRoutes);

//Payment
app.use("/", PaymentRoutes);
app.use("/", EMIPlanRoutes);

//BOS
app.use("/", bosMeetingRoutes);
app.use("/", bosCourseProposalRoutes);
app.use("/", recentDecisionRoutes);
app.use("/", bosmom);
app.use("/", bosTaskRoutes);
app.use("/", bosVotingRoutes);

// Retired legacy prefix: returns 410 Gone (no duplicate CRUD vs course-meets).
app.use("/api/direct-meets", DirectMeetRoutes);
app.use("/api/course-meets", CourseMeetRoutes);

// PCM class routes (namespaced under /api/pcm — see pcmRoutes.js)
app.use("/api/pcm", pcmRoutes);

// Tutor routes (Tutor-course-routes.js: /createcourses-tutors-with-s3-urls, etc.)
app.use("/", tutorRoutes);
app.use("/", courseRoutes);

// Notification
app.use("/", notificationRoutes);
app.use("/api/bell-notifications", notificationBellRoutes);
app.use("/api/notifications", notificationBellRoutes); // Frontend also uses this path
app.use("/notifications", notificationBellRoutes); // Support both paths
app.use("/api/join-requests", joinRequestRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// matra app.use() lines
app.use("/api/materials", materialRoutes);

// Announcement and Advertisement
app.use("/api/announcements", announcementRoutes);
app.use("/api/advertisements", advertisementRoutes);
app.use("/api/marketing", marketingRoutes);

// Event Management
app.use("/", eventManageRoutes);

// Financial Management
app.use("/api", donationRoutes);
app.use("/api", expenseRoutes);
app.use("/api", invoiceRoutes);

// S3 Pre-Signed URL Routes (Direct Upload)
app.use("/api/s3", extendedTimeoutForUploads, PreSignedUrlRoutes);

// S3 Multipart Upload Routes (Large Files - GBs)
app.use("/api/s3", extendedTimeoutForUploads, S3MultipartRoutes);

// UserDashboard (Homepage Content) - Public GET routes, protected PUT routes use verifyToken middleware
app.use("/api/userdashboard", userDashboardRoutes);

// admin get
app.use("/", GetAdminRoutes);

// Audit Log Management
app.use("/api/audit", auditLogRoutes);

// Dashboard Analytics
app.use("/api/dashboard", dashboardRoutes);

// 404 handler — must come after all routes but before the error handler
app.use(notFoundHandler);

// Global error handler — MUST be last middleware (4-arg signature)
// Do not set CORS headers here — cors() already ran at the start of the request.
app.use(globalErrorHandler);

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error({ message: "Unhandled Promise Rejection", reason: String(reason), promise: String(promise) });
});

// Handle uncaught exceptions — log and exit so the process manager can restart cleanly
process.on("uncaughtException", (err) => {
  logger.error({ message: "Uncaught Exception — exiting process", error: err.message, stack: err.stack });
  process.exit(1);
});

// Create HTTP server and setup Socket.IO
import http from "http";
import { Server as SocketIOServer } from "socket.io";

const server = http.createServer(app);

// Global timeout: 30 seconds (default for most requests)
// Upload routes will override to 10 minutes per-request
server.timeout = 30000; // 30 seconds
server.keepAliveTimeout = 35000;
server.headersTimeout = 40000;

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    socket.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    socket.userId = decoded.id;
    socket.userRole = decoded.role;

    next();
  } catch (error) {
    next(new Error("Invalid token"));
  }
});

// Socket.IO connection handler
io.on("connection", (socket) => {

  socket.on("disconnect", () => {
  });

  // Example: Role-based room access
  socket.on("join-admin-room", (roomName) => {
    if (socket.userRole !== "superadmin" && socket.userRole !== "admin") {
      socket.emit("error", "Unauthorized: Admin access required");
      socket.disconnect(true);
      return;
    }
    socket.join(roomName);
  });
});

// Note: MongoDB connection is handled in handler.js for Lambda environment
// For local development, connection is established when server starts

// Conditionally start server for local development
if (process.env.NODE_ENV !== "lambda") {
  server.listen(PORT, async () => {
    await connectDB();

    // Auto-seed RBAC roles if database is empty
    try {
      await autoSeedRBAC();
    } catch (seedError) {
      console.error(
        "⚠️  Auto-seed failed, continuing without seeding:",
        seedError.message,
      );
    }

    // Start voting system schedulers
    startPollStatusScheduler();
    startDeadlineChecker();
  });
}

// Export the app for serverless
export default app;
