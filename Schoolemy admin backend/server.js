import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

import connectDB from "./src/DB/db.js";
import { verifyToken } from "./src/Middleware/authMiddleware.js";

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

// DirectMeet Management (OLD - Keeping for backward compatibility)
import DirectMeetRoutes from "./src/Routes/DirectMeet/DirectMeetRoutes.js";
// Course-based Meet Management (NEW - Refactored)
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

import path from "path";
dotenv.config();

const app = express();
const PORT = process.env.PORT;

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
      console.log("⚠️  CORS blocked origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Cache-Control",
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204,
};

// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Ensure ALL responses include CORS headers (especially errors)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
  } else if (!origin) {
    // For non-browser requests (Postman, curl, etc.)
    res.header("Access-Control-Allow-Origin", "*");
  }
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With,Cache-Control",
  );
  next();
});

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

app.use(express.static("public"));

// Public Routes (before authentication middleware)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Blog Management (public routes first)
app.use("/api/blog", blogRoutes);

//Admin Login and Auth (MUST be before verifyToken middleware)
app.use("/", Login);

// S3 Direct Upload Routes (Public - for unlimited file uploads)
// Note: Add authentication if needed by moving after verifyToken
app.use("/api/s3", S3PresignedRoutes);

// Apply authentication middleware for protected routes
app.use(verifyToken);

//Routes

//Admin Management
app.use("/", AdminRoutes);

//Courses - mounted at /api/courses for frontend compatibility
app.use("/api/courses", S3CourseUploadRoutes); // S3 direct upload for courses (MUST be before general course routes)
app.use("/api/courses", Course);
app.use("/api/courses", S3UploadRoutes);
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

// DirectMeet Management (OLD - deprecated but kept for compatibility)
app.use("/", DirectMeetRoutes);

// Course-based Meet Management (NEW - Refactored system)
app.use("/api/course-meets", CourseMeetRoutes);

// PCM class routes
app.use("/", pcmRoutes);

// Tutor routes
app.use("/", tutorRoutes);
app.use("/", courseRoutes); // Admin course routes (from courseroutes.js)

// Notification
app.use("/", notificationRoutes);
app.use("/api/bell-notifications", notificationBellRoutes);
app.use("/api/join-requests", joinRequestRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// matra app.use() lines
app.use("/api/materials", materialRoutes);

// Announcement and Advertisement
app.use("/api/announcements", announcementRoutes);
app.use("/api/advertisements", advertisementRoutes);

// Event Management
app.use("/", eventManageRoutes);

// Financial Management
app.use("/api", donationRoutes);
app.use("/api", expenseRoutes);
app.use("/api", invoiceRoutes);

// S3 Pre-Signed URL Routes (Direct Upload)
app.use("/api/s3", PreSignedUrlRoutes);

// S3 Multipart Upload Routes (Large Files - GBs)
app.use("/api/s3", S3MultipartRoutes);

// UserDashboard (Homepage Content) - Public GET routes, protected PUT routes use verifyToken middleware
app.use("/api/userdashboard", userDashboardRoutes);

// admin get
app.use("/", GetAdminRoutes);

// Global error handler - MUST be after all routes
app.use((err, req, res, next) => {
  console.error("❌ Global Error Handler:", err);

  // CRITICAL: Ensure CORS headers are set on ALL error responses
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS",
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,X-Requested-With,Cache-Control",
  );
  res.header("Access-Control-Allow-Credentials", "true");

  // Handle payload too large
  if (err.type === "entity.too.large") {
    return res.status(413).json({
      success: false,
      error: "Request payload too large. Use S3 direct upload for large files.",
      useS3Upload: true,
      maxSize: "100MB",
      s3UploadEndpoint: "/api/s3/presigned-urls",
    });
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON in request body",
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

// Create HTTP server and setup Socket.IO
import http from "http";
import { Server as SocketIOServer } from "socket.io";

const server = http.createServer(app);

// Increase server timeout for large file uploads (10 minutes)
server.timeout = 600000; // 10 minutes
server.keepAliveTimeout = 620000; // Slightly higher than timeout
server.headersTimeout = 630000; // Slightly higher than keepAliveTimeout

const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Example Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

// Note: MongoDB connection is handled in handler.js for Lambda environment
// For local development, connection is established when server starts

// Conditionally start server for local development
if (process.env.NODE_ENV !== "lambda") {
  server.listen(PORT, async () => {
    await connectDB();

    // Start voting system schedulers
    startPollStatusScheduler();
    startDeadlineChecker();

    console.log(`Server run with Socket.IO http://localhost:${PORT}`);
    console.log(
      `Server timeout set to ${server.timeout / 1000} seconds for large uploads`,
    );
    console.log(`I am Schoolemy Admin Backend`);
  });
}

// Export the app for serverless
export default app;
