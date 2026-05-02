import logger from "../Utils/logger.js";

import path from "path";
import fs from "fs";
import sharp from "sharp";
import mongoose from "mongoose";
import Payment from "../Models/Payment-Model/Payment-Model.js";
import User from "../Models/User-Model/User-Model.js";
import Course from "../Models/Course-Model/Course-Model.js";
import CoursePlayerState from "../Models/CoursePlayerState-Model.js";
import transporter from "../Notification/EmailTransport.js"; // SECURITY FIX 3.26.1: Use canonical EmailTransport location

function escapeXml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveTemplatePath() {
  const envPath = process.env.CERTIFICATE_TEMPLATE_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  const assets = path.join(process.cwd(), "assets", "irai-aram-certificate.jpg");
  if (fs.existsSync(assets)) return assets;
  return null;
}


export const sendCourseCompletionCertificate = async (req, res) => {
  try {
    const userIdRaw = req.userId;
    const { courseId } = req.body;

    if (!userIdRaw || !mongoose.Types.ObjectId.isValid(userIdRaw)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid courseId" });
    }

    const userId = new mongoose.Types.ObjectId(userIdRaw);
    const cid = new mongoose.Types.ObjectId(courseId);

    const enrolled = await Payment.findOne({
      userId,
      courseId: cid,
      paymentStatus: "completed",
    });
    if (!enrolled) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course.",
      });
    }

    const user = await User.findById(userId).lean();
    const course = await Course.findById(cid).select("coursename").lean();
    if (!user?.email) {
      return res.status(400).json({
        success: false,
        message: "User email not found.",
      });
    }

    const displayName =
      user.username || user.email?.split("@")[0] || "Learner";
    const courseTitle = course?.coursename || "Course";
    const year = String(new Date().getFullYear());
    const dated = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const state = await CoursePlayerState.findOne({ userId, courseId: cid });
    if (state?.certificateEmailSentAt) {
      return res.json({
        success: true,
        message: "Certificate email was already sent for this course.",
        alreadySent: true,
      });
    }

    const templatePath = resolveTemplatePath();
    let attachment = null;

    if (templatePath) {
      const meta = await sharp(templatePath).metadata();
      const w = meta.width || 1600;
      const h = meta.height || 1200;

      const svg = `
        <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
          <text x="${w * 0.5}" y="${h * 0.42}" text-anchor="middle" font-family="Times New Roman, Georgia, serif" font-size="${Math.round(
  w * 0.028,
)}" fill="#1a1a1a">${escapeXml(displayName)}</text>
          <text x="${w * 0.5}" y="${h * 0.5}" text-anchor="middle" font-family="Times New Roman, Georgia, serif" font-size="${Math.round(
  w * 0.022,
)}" fill="#1a1a1a">${escapeXml(courseTitle)}</text>
          <text x="${w * 0.5}" y="${h * 0.58}" text-anchor="middle" font-family="Times New Roman, Georgia, serif" font-size="${Math.round(
  w * 0.018,
)}" fill="#333">${escapeXml(year)}</text>
          <text x="${w * 0.5}" y="${h * 0.66}" text-anchor="middle" font-family="Times New Roman, Georgia, serif" font-size="${Math.round(
  w * 0.018,
)}" fill="#333">${escapeXml(dated)}</text>
        </svg>`;

      const overlay = Buffer.from(svg);
      const pngBuffer = await sharp(templatePath)
        .composite([{ input: overlay, blend: "over" }])
        .png()
        .toBuffer();

      attachment = {
        filename: "certificate.png",
        content: pngBuffer,
        contentType: "image/png",
      };
    }

    const from = process.env.EMAIL_ADMIN;
    await transporter.sendMail({
      from,
      to: user.email,
      subject: `Certificate of Completion — ${courseTitle}`,
      html: `
        <p>Hi ${escapeXml(displayName)},</p>
        <p>Congratulations on completing <strong>${escapeXml(courseTitle)}</strong>.</p>
        <p>Year: <strong>${escapeXml(year)}</strong><br/>
        Dated: <strong>${escapeXml(dated)}</strong></p>
        <p>Your certificate is attached as an image.</p>
        <p>— Schoolemy</p>
      `,
      ...(attachment ? { attachments: [attachment] } : {}),
    });

    await CoursePlayerState.findOneAndUpdate(
      { userId, courseId: cid },
      {
        $set: { certificateEmailSentAt: new Date() },
        $setOnInsert: { completedLessons: [], attemptedExams: {} },
      },
      { upsert: true, new: true },
    );

    return res.status(201).json({
      success: true,
      message: attachment
        ? "Certificate emailed with image attachment."
        : "Certificate details emailed (template image not found on server — set CERTIFICATE_TEMPLATE_PATH or add assets/irai-aram-certificate.jpg).",
    });
  } catch (err) {
    logger.error("Certificate email error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send certificate email.",
    });
  }
};
