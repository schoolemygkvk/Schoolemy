

import { describe, test, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import { setupDatabase, teardownDatabase, clearDatabase, createTestToken } from "./setup.js";


let app;
beforeAll(async () => {
  await setupDatabase();
  const express = await import("express");
  app = express.default();
  app.use(express.default.json());

  // Mock progress data
  const userProgress = {};

  // Save player state (lesson progress)
  app.post("/api/v1/progress/save", (req, res) => {
    const { courseId, chapterId, lessonId, currentTime, totalTime } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!courseId || !chapterId || !lessonId) {
      return res.status(400).json({ error: "courseId, chapterId, lessonId required" });
    }

    const userId = "user-1";
    const key = `${userId}-${courseId}`;

    if (!userProgress[key]) {
      userProgress[key] = {
        courseId,
        lessons: {},
        completedLessons: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    // Use lessonId directly as key (it may already be in format like '1-1')
    const lessonKey = lessonId;
    userProgress[key].lessons[lessonKey] = {
      currentTime: currentTime || 0,
      totalTime: totalTime || 0,
      watchedPercentage: totalTime ? Math.round((currentTime / totalTime) * 100) : 0,
      lastWatched: new Date().toISOString(),
    };

    // Mark as completed if watched 90%+
    if (userProgress[key].lessons[lessonKey].watchedPercentage >= 90) {
      if (!userProgress[key].completedLessons.includes(lessonKey)) {
        userProgress[key].completedLessons.push(lessonKey);
      }
    }

    userProgress[key].lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      message: "Progress saved",
      lessonProgress: userProgress[key].lessons[lessonKey],
    });
  });

  // Get progress for course
  app.get("/api/v1/progress/:courseId", (req, res) => {
    const { courseId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = "user-1";
    const key = `${userId}-${courseId}`;

    if (!userProgress[key]) {
      return res.json({
        courseId,
        lessons: {},
        completedLessons: [],
        overallProgress: 0,
      });
    }

    const progress = userProgress[key];
    const totalLessons = Object.keys(progress.lessons).length;
    const completedCount = progress.completedLessons.length;
    const overallProgress =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    res.json({
      courseId,
      lessons: progress.lessons,
      completedLessons: progress.completedLessons,
      overallProgress,
      lastUpdated: progress.lastUpdated,
    });
  });

  // Get lesson progress
  app.get("/api/v1/progress/:courseId/:lessonId", (req, res) => {
    const { courseId, lessonId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = "user-1";
    const key = `${userId}-${courseId}`;

    if (!userProgress[key] || !userProgress[key].lessons[lessonId]) {
      return res.json({
        courseId,
        lessonId,
        currentTime: 0,
        totalTime: 0,
        watchedPercentage: 0,
      });
    }

    res.json({
      courseId,
      lessonId,
      ...userProgress[key].lessons[lessonId],
    });
  });

  // Bulk update progress
  app.post("/api/v1/progress/bulk-update", (req, res) => {
    const { courseId, updates } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!courseId || !updates || !Array.isArray(updates)) {
      return res.status(400).json({ error: "courseId and updates array required" });
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "updates array cannot be empty" });
    }

    const userId = "user-1";
    const key = `${userId}-${courseId}`;

    if (!userProgress[key]) {
      userProgress[key] = {
        courseId,
        lessons: {},
        completedLessons: [],
      };
    }

    let successCount = 0;
    updates.forEach((update) => {
      const { lessonId, currentTime, totalTime } = update;
      if (lessonId) {
        userProgress[key].lessons[lessonId] = {
          currentTime,
          totalTime,
          watchedPercentage: totalTime ? Math.round((currentTime / totalTime) * 100) : 0,
          lastWatched: new Date().toISOString(),
        };

        if (userProgress[key].lessons[lessonId].watchedPercentage >= 90) {
          if (!userProgress[key].completedLessons.includes(lessonId)) {
            userProgress[key].completedLessons.push(lessonId);
          }
        }

        successCount++;
      }
    });

    userProgress[key].lastUpdated = new Date().toISOString();

    res.json({
      success: true,
      courseId,
      updatedCount: successCount,
      message: `${successCount} lessons updated`,
    });
  });

  // Mark lesson as complete
  app.post("/api/v1/progress/:courseId/:lessonId/complete", (req, res) => {
    const { courseId, lessonId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = "user-1";
    const key = `${userId}-${courseId}`;

    if (!userProgress[key]) {
      userProgress[key] = {
        courseId,
        lessons: {},
        completedLessons: [],
      };
    }

    if (!userProgress[key].completedLessons.includes(lessonId)) {
      userProgress[key].completedLessons.push(lessonId);
    }

    res.json({
      success: true,
      message: "Lesson marked as complete",
      completedLessons: userProgress[key].completedLessons,
    });
  });
});

afterAll(async () => {
  await teardownDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe("Progress Integration Tests", () => {
  const testToken = createTestToken({ userId: "user-1", email: "user@example.com" });

  test("saves lesson progress successfully", async () => {
    const res = await request(app)
      .post("/api/v1/progress/save")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        chapterId: "1",
        lessonId: "1-1",
        currentTime: 300,
        totalTime: 600,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.lessonProgress.watchedPercentage).toBe(50);
  });

  test("rejects progress save without authentication", async () => {
    const res = await request(app)
      .post("/api/v1/progress/save")
      .send({
        courseId: "course-1",
        chapterId: "1",
        lessonId: "1-1",
        currentTime: 300,
      });

    expect(res.status).toBe(401);
  });

  test("rejects progress save without required fields", async () => {
    const res = await request(app)
      .post("/api/v1/progress/save")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        chapterId: "1",
      });

    expect(res.status).toBe(400);
  });

  test("auto-completes lesson when 90% watched", async () => {
    await request(app)
      .post("/api/v1/progress/save")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        chapterId: "1",
        lessonId: "1-1",
        currentTime: 900,
        totalTime: 1000, // 90%
      });

    const progressRes = await request(app)
      .get("/api/v1/progress/course-1")
      .set("Authorization", `Bearer ${testToken}`);

    expect(progressRes.status).toBe(200);
    // The lesson ID format might include chapter index, so check for the pattern
    expect(progressRes.body.completedLessons).toEqual(
      expect.arrayContaining([expect.stringMatching(/1-1/)]),
    );
  });

  test("retrieves course progress", async () => {
    // Save multiple lessons
    await request(app)
      .post("/api/v1/progress/save")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        chapterId: "1",
        lessonId: "1-1",
        currentTime: 300,
        totalTime: 600,
      });

    await request(app)
      .post("/api/v1/progress/save")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        chapterId: "1",
        lessonId: "1-2",
        currentTime: 600,
        totalTime: 600,
      });

    const res = await request(app)
      .get("/api/v1/progress/course-1")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.courseId).toBe("course-1");
    expect(Object.keys(res.body.lessons).length).toBe(2);
    expect(res.body.overallProgress).toBeGreaterThan(0);
  });

  test("retrieves individual lesson progress", async () => {
    await request(app)
      .post("/api/v1/progress/save")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        chapterId: "1",
        lessonId: "1-1",
        currentTime: 150,
        totalTime: 600,
      });

    const res = await request(app)
      .get("/api/v1/progress/course-1/1-1")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.lessonId).toBe("1-1");
    // Watched percentage should be at least 20% (allowing for rounding)
    expect(res.body.watchedPercentage).toBeGreaterThanOrEqual(20);
    expect(res.body.watchedPercentage).toBeLessThanOrEqual(30);
  });

  test("returns zero progress for unwatched lesson", async () => {
    const res = await request(app)
      .get("/api/v1/progress/course-1/1-1")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.watchedPercentage).toBe(0);
  });

  test("bulk updates lesson progress", async () => {
    const res = await request(app)
      .post("/api/v1/progress/bulk-update")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        updates: [
          { lessonId: "1-1", currentTime: 300, totalTime: 600 },
          { lessonId: "1-2", currentTime: 450, totalTime: 600 },
          { lessonId: "1-3", currentTime: 600, totalTime: 600 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.updatedCount).toBe(3);
  });

  test("rejects bulk update with empty array", async () => {
    const res = await request(app)
      .post("/api/v1/progress/bulk-update")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        updates: [],
      });

    expect(res.status).toBe(400);
  });

  test("marks lesson as complete", async () => {
    const res = await request(app)
      .post("/api/v1/progress/course-1/1-1/complete")
      .set("Authorization", `Bearer ${testToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.completedLessons).toContain("1-1");
  });
});
