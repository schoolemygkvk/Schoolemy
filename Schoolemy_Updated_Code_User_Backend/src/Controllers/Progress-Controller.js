import mongoose from "mongoose";
import Progress from "../Models/Progress-Model.js";
import Course from "../Models/Course-Model/Course-Model.js";
import Payment from "../Models/Payment-Model/Payment-Model.js";
import CoursePlayerState from "../Models/CoursePlayerState-Model.js";

import { logger } from "../Utils/logger.js";

function normalizeUserId(req) {
  const raw = req.userId;
  if (!raw || !mongoose.Types.ObjectId.isValid(raw)) return null;
  return new mongoose.Types.ObjectId(raw);
}

async function assertEnrolled(userId, courseId) {
  const enrolled = await Payment.findOne({
    userId,
    courseId,
    paymentStatus: "completed",
  });
  return !!enrolled;
}


function countLessonsInCourse(course) {
  if (!course?.chapters?.length) return 0;
  return course.chapters.reduce(
    (sum, ch) => sum + (ch.lessons?.length || 0),
    0,
  );
}


export const getPlayerState = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const { courseId } = req.params;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid courseId" });
    }
    const cid = new mongoose.Types.ObjectId(courseId);
    if (!(await assertEnrolled(userId, cid))) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const doc = await CoursePlayerState.findOne({ userId, courseId: cid }).lean();
    return res.json({
      success: true,
      data: {
        completedLessons: doc?.completedLessons || [],
        attemptedExams: doc?.attemptedExams || {},
      },
    });
  } catch (error) {
    logger.error("getPlayerState:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load player state",
      error: error.message,
    });
  }
};


export const upsertPlayerState = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const { courseId } = req.params;
    const { completedLessons, attemptedExams } = req.body || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid courseId" });
    }
    const cid = new mongoose.Types.ObjectId(courseId);
    if (!(await assertEnrolled(userId, cid))) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const update = {};
    if (Array.isArray(completedLessons)) {
      update.completedLessons = completedLessons.map(String);
    }
    if (attemptedExams && typeof attemptedExams === "object") {
      update.attemptedExams = attemptedExams;
    }

    const doc = await CoursePlayerState.findOneAndUpdate(
      { userId, courseId: cid },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return res.json({
      success: true,
      data: {
        completedLessons: doc.completedLessons || [],
        attemptedExams: doc.attemptedExams || {},
      },
    });
  } catch (error) {
    logger.error("upsertPlayerState:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save player state",
      error: error.message,
    });
  }
};

export const getLessonProgress = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const { courseId, lessonId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid courseId" });
    }
    const cid = new mongoose.Types.ObjectId(courseId);

    if (!(await assertEnrolled(userId, cid))) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const progress = await Progress.findOne({
      userId,
      courseId: cid,
      lessonId: lid,  // FIX: Use ObjectId
    });

    res.json({
      success: true,
      data: progress || {
        progress: 0,
        status: "not-started",
        duration: 0,
        currentTime: 0,
      },
    });
  } catch (error) {
    logger.error("Error fetching lesson progress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch progress",
      error: error.message,
    });
  }
};

export const getCourseProgress = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const { courseId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid courseId" });
    }
    const cid = new mongoose.Types.ObjectId(courseId);

    if (!(await assertEnrolled(userId, cid))) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const progress = await Progress.find({
      userId,
      courseId: cid,
    }).sort({ lastAccessed: -1 });

    const courseDoc = await Course.findById(cid).select("chapters");
    const totalLessonsInCourse = countLessonsInCourse(courseDoc);

    const completedLessons = progress.filter((p) => p.status === "completed").length;
    const inProgressLessons = progress.filter((p) => p.status === "in-progress").length;
    const trackedLessonCount = progress.length;

    const courseProgress =
      totalLessonsInCourse > 0
        ? Math.min(
          100,
          Math.round((completedLessons / totalLessonsInCourse) * 100),
        )
        : trackedLessonCount > 0
          ? Math.round((completedLessons / trackedLessonCount) * 100)
          : 0;

    res.json({
      success: true,
      data: {
        lessons: progress,
        statistics: {
          totalLessons: trackedLessonCount,
          totalLessonsInCourse,
          completedLessons,
          inProgressLessons,
          courseProgress,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching course progress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch progress",
      error: error.message,
    });
  }
};

export const updateLessonProgress = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const { courseId, lessonId } = req.params;
    const { progress, currentTime = 0, duration = 0, status = "in-progress" } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: "Invalid courseId" });
    }
    const cid = new mongoose.Types.ObjectId(courseId);

    // FIX: Validate and convert lessonId to ObjectId
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return res.status(400).json({ success: false, message: "Invalid lessonId" });
    }
    const lid = new mongoose.Types.ObjectId(lessonId);

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: "Progress must be between 0 and 100",
      });
    }

    if (!["not-started", "in-progress", "completed"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    if (!(await assertEnrolled(userId, cid))) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
      });
    }

    const course = await Course.findById(cid);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let lessonExists = false;
    for (const chapter of course.chapters || []) {
      if (chapter.lessons?.some((l) => l._id.toString() === lessonId)) {
        lessonExists = true;
        break;
      }
    }

    if (!lessonExists) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found",
      });
    }

    let progressRecord = await Progress.findOne({
      userId,
      courseId: cid,
      lessonId: lid,  // FIX: Use ObjectId
    });

    if (progressRecord) {
      progressRecord.progress = progress;
      progressRecord.currentTime = currentTime;
      progressRecord.duration = Math.max(progressRecord.duration, duration);
      progressRecord.status = status;
      progressRecord.lastAccessed = new Date();
    } else {
      progressRecord = new Progress({
        userId,
        courseId: cid,
        lessonId: lid,  // FIX: Use ObjectId
        progress,
        currentTime,
        duration,
        status,
      });
    }

    await progressRecord.save();

    res.json({
      success: true,
      message: "Progress updated successfully",
      data: progressRecord,
    });
  } catch (error) {
    logger.error("Error updating lesson progress:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update progress",
      error: error.message,
    });
  }
};

export const bulkUpdateProgress = async (req, res) => {
  try {
    const userId = normalizeUserId(req);
    const { updates = [] } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Updates array is required and cannot be empty",
      });
    }

    const results = [];

    for (const update of updates) {
      const {
        courseId,
        lessonId,
        progress,
        currentTime = 0,
        duration = 0,
        status = "in-progress",
      } = update;

      try {
        if (progress === undefined || progress < 0 || progress > 100) continue;
        if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) continue;
        const cid = new mongoose.Types.ObjectId(courseId);

        // FIX: Validate and convert lessonId to ObjectId
        if (!lessonId || !mongoose.Types.ObjectId.isValid(lessonId)) continue;
        const lid = new mongoose.Types.ObjectId(lessonId);

        if (!(await assertEnrolled(userId, cid))) continue;

        let progressRecord = await Progress.findOne({
          userId,
          courseId: cid,
          lessonId: lid,  // FIX: Use ObjectId, not string
        });

        if (progressRecord) {
          progressRecord.progress = progress;
          progressRecord.currentTime = currentTime;
          progressRecord.duration = Math.max(progressRecord.duration, duration);
          progressRecord.status = status;
          progressRecord.lastAccessed = new Date();
        } else {
          progressRecord = new Progress({
            userId,
            courseId: cid,
            lessonId: lid,  // FIX: Use ObjectId
            progress,
            currentTime,
            duration,
            status,
          });
        }

        await progressRecord.save();
        results.push({ courseId, lessonId, success: true });
      } catch (err) {
        logger.error("Error updating individual progress:", err);
        results.push({ courseId, lessonId, success: false, error: err.message });
      }
    }

    res.json({
      success: true,
      message: "Bulk update completed",
      data: results,
    });
  } catch (error) {
    logger.error("Error in bulk update:", error);
    res.status(500).json({
      success: false,
      message: "Failed to bulk update progress",
      error: error.message,
    });
  }
};
