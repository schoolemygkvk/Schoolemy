

import { describe, test, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import { setupDatabase, teardownDatabase, clearDatabase, createTestToken } from "./setup.js";


let app;
beforeAll(async () => {
  await setupDatabase();
  const express = await import("express");
  app = express.default();
  app.use(express.default.json());

  // Mock course data
  const courses = [
    {
      id: "course-1",
      title: "JavaScript Basics",
      description: "Learn JavaScript",
      price: 500,
      instructor: "John Doe",
      requiresPurchase: true,
    },
    {
      id: "course-2",
      title: "Free Course",
      description: "Free content",
      price: 0,
      instructor: "Jane Smith",
      requiresPurchase: false,
    },
  ];

  // Mock user purchases
  const userPurchases = {
    "user-1": ["course-2"], // Has purchased course-2 only
    "user-2": ["course-1", "course-2"], // Has purchased both
  };

  // Get course details
  app.get("/api/v1/courses/:courseId", (req, res) => {
    const { courseId } = req.params;
    const course = courses.find((c) => c.id === courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  });

  // Check access to course
  app.get("/api/v1/courses/:courseId/access", (req, res) => {
    const { courseId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Extract userId from token (mock)
    const userId = "user-1"; // In real app, extract from JWT

    // Free courses always accessible
    if (!course.requiresPurchase) {
      return res.json({
        courseId,
        hasAccess: true,
        purchased: false,
        reason: "Free course",
      });
    }

    // Check if user purchased
    const hasPurchased = userPurchases[userId] && userPurchases[userId].includes(courseId);

    if (!hasPurchased) {
      return res.status(403).json({
        error: "Access denied",
        courseId,
        hasAccess: false,
        purchased: false,
        reason: "Course requires purchase",
      });
    }

    res.json({
      courseId,
      hasAccess: true,
      purchased: true,
    });
  });

  // Mock purchase course endpoint
  app.post("/api/v1/courses/:courseId/purchase", (req, res) => {
    const { courseId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (!course.requiresPurchase) {
      return res.status(400).json({ error: "Course is free, no purchase needed" });
    }

    const userId = "user-1";
    if (!userPurchases[userId]) {
      userPurchases[userId] = [];
    }

    if (userPurchases[userId].includes(courseId)) {
      return res.status(400).json({ error: "Already purchased" });
    }

    userPurchases[userId].push(courseId);

    res.json({
      courseId,
      message: "Course purchased successfully",
      purchaseDate: new Date().toISOString(),
    });
  });

  // List all courses (public)
  app.get("/api/v1/courses", (req, res) => {
    const courseList = courses.map((c) => ({
      id: c.id,
      title: c.title,
      price: c.price,
      instructor: c.instructor,
    }));

    res.json({ courses: courseList, total: courseList.length });
  });
});

afterAll(async () => {
  await teardownDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe("Course Access Integration Tests", () => {
  const testToken = createTestToken({ userId: "user-1", email: "user@example.com" });

  test("lists all available courses without authentication", async () => {
    const res = await request(app).get("/api/v1/courses");

    expect(res.status).toBe(200);
    expect(res.body.courses).toBeDefined();
    expect(res.body.courses.length).toBeGreaterThan(0);
  });

  test("retrieves course details without authentication", async () => {
    const res = await request(app).get("/api/v1/courses/course-1");

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("JavaScript Basics");
    expect(res.body.price).toBe(500);
  });

  test("returns 404 for non-existent course", async () => {
    const res = await request(app).get("/api/v1/courses/non-existent");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Course not found");
  });

  test("denies access to paid course without purchase", async () => {
    const res = await request(app)
      .get("/api/v1/courses/course-1/access")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(403);
    expect(res.body.hasAccess).toBe(false);
    expect(res.body.purchased).toBe(false);
  });

  test("grants access to free course without purchase", async () => {
    const res = await request(app)
      .get("/api/v1/courses/course-2/access")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.hasAccess).toBe(true);
    expect(res.body.requiresPurchase).not.toBe(true);
  });

  test("purchases course successfully and grants access", async () => {
    // First attempt should fail (no purchase)
    const accessBefore = await request(app)
      .get("/api/v1/courses/course-1/access")
      .set("Authorization", `Bearer ${testToken}`);

    expect(accessBefore.status).toBe(403);

    // Purchase course
    const purchaseRes = await request(app)
      .post("/api/v1/courses/course-1/purchase")
      .set("Authorization", `Bearer ${testToken}`)
      .send({});

    expect(purchaseRes.status).toBe(200);
    expect(purchaseRes.body.message).toContain("purchased");

    // After purchase, should have access
    const accessAfter = await request(app)
      .get("/api/v1/courses/course-1/access")
      .set("Authorization", `Bearer ${testToken}`);

    expect(accessAfter.status).toBe(200);
    expect(accessAfter.body.hasAccess).toBe(true);
  });
});
