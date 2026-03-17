import express from "express";
import dotenv from "dotenv";
import connectDB from "./src/DB/db.js";
import cors from "cors";
import path from "path";
import mongoose from "mongoose";

import { verifyToken } from "./src/Middleware/authMiddleware.js";

import userRoutes from "./src/Routes/users-routes/User-Routes.js";
import userProfileRoutes from "./src/Routes/users-routes/user-profile-routes.js";
import courses from "./src/Routes/Course-routes/Course-routes.js";
import Payment from "./src/Routes/Payment-Routes/Payment-Routes.js";
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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

/* ======================= ✅ CORS CONFIG (FIXED) ======================= */

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
    // allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200,
};

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

/* ======================= 🔥 MIDDLEWARE ORDER (IMPORTANT) ======================= */

// 1️⃣ Enable CORS first (automatically handles preflight OPTIONS requests)
app.use(cors(corsOptions));

// 2️⃣ Webhook BEFORE body parser
app.use("/webhook", express.raw({ type: "application/json" }), Payment);

// 4️⃣ JSON parser
app.use(express.json());

// 5️⃣ Static files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

/* ======================= HEALTH CHECK ======================= */
app.get("/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  if (dbState !== 1) {
    return res.status(503).json({ status: "DB DOWN" });
  }
  res.json({ status: "OK", time: new Date().toISOString() });
});

/* ======================= PUBLIC ROUTES ======================= */
app.use("/", userRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/pcm", pcmClassRoutes);
app.use("/pcm", pcmClassRoutes);
app.use("/", contactRoutes);
app.use("/events", events);
app.use("/", userDashboardRoutes);
app.use("/", staffDetailsRoutes);

/* ======================= AUTH MIDDLEWARE ======================= */
app.use(verifyToken);

/* ======================= PROTECTED ROUTES ======================= */
app.use("/", userProfileRoutes);
app.use("/", courses);
app.use("/", tutorCourseRoutes);
app.use("/", Payment);
app.use("/", ExamQuestion);
app.use("/", Purchasedcourse);
app.use("/api/user-course-meets", userCourseMeetRoutes);
app.use("/api/user-notifications", userNotificationRoutes);
app.use("/api/meet-payment", meetPaymentRoutes);

app.use("/api/bell-notifications", notificationRoutes);
app.use("/api/join-requests", joinRequestRoutes);
app.use("/api/my-materials", materialRoutes);

app.use("/complaints", complaintRoutes);

// Invoice routes (protected)
app.use("/api", invoiceRoutes);

/* ======================= SERVER START ======================= */
if (isLambda) {
  connectDB().catch(console.error);
} else {
  app.listen(PORT, "0.0.0.0", async () => {
    await connectDB();
    console.log(`✅ Server running on port ${PORT}`);
  });
}

export default app;
