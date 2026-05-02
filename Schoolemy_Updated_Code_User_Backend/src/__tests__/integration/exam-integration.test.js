

import { describe, test, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import { setupDatabase, teardownDatabase, clearDatabase, createTestToken } from "./setup.js";


let app;
beforeAll(async () => {
  await setupDatabase();
  const express = await import("express");
  app = express.default();
  app.use(express.default.json());

  // Mock exam data
  const exams = {
    "exam-1": {
      id: "exam-1",
      title: "JavaScript Basics Quiz",
      totalQuestions: 10,
      passingScore: 60,
      maxAttempts: 3,
    },
    "exam-2": {
      id: "exam-2",
      title: "Advanced Concepts",
      totalQuestions: 20,
      passingScore: 70,
      maxAttempts: 2,
    },
  };

  // Mock user exam attempts
  const examAttempts = {};

  // Get exam details
  app.get("/api/v1/exams/:examId", (req, res) => {
    const { examId } = req.params;

    const exam = exams[examId];
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    res.json(exam);
  });

  // Submit exam answers
  app.post("/api/v1/exams/:examId/submit", (req, res) => {
    const { examId } = req.params;
    const { answers } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!answers) {
      return res.status(400).json({ error: "Answers required" });
    }

    const exam = exams[examId];
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const userId = "user-1"; // Mock user

    // Check attempt limit
    const key = `${userId}-${examId}`;
    if (!examAttempts[key]) {
      examAttempts[key] = [];
    }

    if (examAttempts[key].length >= exam.maxAttempts) {
      return res.status(400).json({
        error: "Maximum attempts exceeded",
        maxAttempts: exam.maxAttempts,
      });
    }

    // Mock score calculation
    const correctAnswers = Math.floor(answers.length * 0.7); // 70% correct
    const score = (correctAnswers / exam.totalQuestions) * 100;
    const passed = score >= exam.passingScore;

    const attempt = {
      attemptNumber: examAttempts[key].length + 1,
      score: Math.round(score),
      passed,
      totalQuestions: exam.totalQuestions,
      correctAnswers,
      timestamp: new Date().toISOString(),
    };

    examAttempts[key].push(attempt);

    res.json({
      examId,
      ...attempt,
      message: passed ? "Exam passed!" : "Exam failed. Try again.",
    });
  });

  // Get exam result
  app.get("/api/v1/exams/:examId/result/:attemptNumber", (req, res) => {
    const { examId, attemptNumber } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = "user-1";
    const key = `${userId}-${examId}`;

    if (!examAttempts[key] || !examAttempts[key][attemptNumber - 1]) {
      return res.status(404).json({ error: "Result not found" });
    }

    const result = examAttempts[key][attemptNumber - 1];
    res.json(result);
  });

  // Check reattempt eligibility
  app.get("/api/v1/exams/:examId/reattempt-eligible", (req, res) => {
    const { examId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const exam = exams[examId];
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const userId = "user-1";
    const key = `${userId}-${examId}`;

    const attempts = examAttempts[key] || [];
    const remainingAttempts = exam.maxAttempts - attempts.length;
    const eligible = remainingAttempts > 0;

    // Check if last attempt passed
    const lastAttempt = attempts[attempts.length - 1];
    const lastAttemptPassed = lastAttempt ? lastAttempt.passed : false;

    res.json({
      examId,
      eligible,
      remainingAttempts,
      maxAttempts: exam.maxAttempts,
      attemptsUsed: attempts.length,
      lastAttemptPassed,
    });
  });

  // Get all attempts for exam
  app.get("/api/v1/exams/:examId/attempts", (req, res) => {
    const { examId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = "user-1";
    const key = `${userId}-${examId}`;

    const attempts = examAttempts[key] || [];
    res.json({
      examId,
      attempts,
      totalAttempts: attempts.length,
    });
  });

  // Test-only endpoint to reset exam attempts
  app.post("/api/v1/test/reset-exam-attempts", (req, res) => {
    const { userId, examId } = req.body;
    const key = `${userId}-${examId}`;
    delete examAttempts[key];
    res.json({ message: "Exam attempts reset" });
  });
});

afterAll(async () => {
  await teardownDatabase();
});

afterEach(async () => {
  await clearDatabase();
  // Reset exam attempts between tests to prevent data pollution
  await request(app)
    .post("/api/v1/test/reset-exam-attempts")
    .send({ userId: "user-1", examId: "exam-1" });
});

describe("Exam Integration Tests", () => {
  const testToken = createTestToken({ userId: "user-1", email: "user@example.com" });

  test("retrieves exam details", async () => {
    const res = await request(app).get("/api/v1/exams/exam-1");

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("JavaScript Basics Quiz");
    expect(res.body.totalQuestions).toBe(10);
    expect(res.body.passingScore).toBe(60);
  });

  test("returns 404 for non-existent exam", async () => {
    const res = await request(app).get("/api/v1/exams/exam-invalid");

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Exam not found");
  });

  test("submits exam answers successfully", async () => {
    const res = await request(app)
      .post("/api/v1/exams/exam-1/submit")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        answers: [1, 1, 2, 1, 2, 1, 2, 1, 1, 2],
      });

    expect(res.status).toBe(200);
    expect(res.body.examId).toBe("exam-1");
    expect(res.body.score).toBeDefined();
    expect(res.body.passed).toBeDefined();
    expect(res.body.attemptNumber).toBe(1);
  });

  test("rejects exam submission without authentication", async () => {
    const res = await request(app)
      .post("/api/v1/exams/exam-1/submit")
      .send({
        answers: [1, 1, 2, 1, 2, 1, 2, 1, 1, 2],
      });

    expect(res.status).toBe(401);
  });

  test("rejects exam submission without answers", async () => {
    const res = await request(app)
      .post("/api/v1/exams/exam-1/submit")
      .set("Authorization", `Bearer ${testToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Answers");
  });

  test("returns exam result after submission", async () => {
    // Submit exam
    const submitRes = await request(app)
      .post("/api/v1/exams/exam-1/submit")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        answers: [1, 1, 2, 1, 2, 1, 2, 1, 1, 2],
      });

    const attemptNumber = submitRes.body.attemptNumber;

    // Get result
    const resultRes = await request(app)
      .get(`/api/v1/exams/exam-1/result/${attemptNumber}`)
      .set("Authorization", `Bearer ${testToken}`);

    expect(resultRes.status).toBe(200);
    expect(resultRes.body.score).toBeDefined();
    expect(resultRes.body.passed).toBeDefined();
  });

  test("enforces maximum attempt limit", async () => {
    // Exam-2 has maxAttempts=2, so submit 2 times
    await request(app)
      .post("/api/v1/exams/exam-2/submit")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ answers: new Array(20).fill(1) });

    await request(app)
      .post("/api/v1/exams/exam-2/submit")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ answers: new Array(20).fill(1) });

    // Third attempt should fail
    const res = await request(app)
      .post("/api/v1/exams/exam-2/submit")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ answers: new Array(20).fill(1) });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Maximum attempts exceeded");
  });

  test("checks reattempt eligibility", async () => {
    // Get current eligibility first
    const beforeRes = await request(app)
      .get("/api/v1/exams/exam-1/reattempt-eligible")
      .set("Authorization", `Bearer ${testToken}`);

    const currentAttempts = beforeRes.body.attemptsUsed || 0;

    // Submit once
    await request(app)
      .post("/api/v1/exams/exam-1/submit")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ answers: [1, 1, 2, 1, 2, 1, 2, 1, 1, 2] });

    // Check eligibility
    const res = await request(app)
      .get("/api/v1/exams/exam-1/reattempt-eligible")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.eligible).toBe(true);
    expect(res.body.attemptsUsed).toBe(currentAttempts + 1);
    expect(res.body.remainingAttempts).toBeGreaterThan(0);
  });

  test("denies reattempt when all attempts exhausted", async () => {
    const exams = ["exam-1", "exam-1", "exam-1"]; // 3 attempts (max)

    for (const exam of exams) {
      await request(app)
        .post(`/api/v1/exams/${exam}/submit`)
        .set("Authorization", `Bearer ${testToken}`)
        .send({ answers: [1, 1, 2, 1, 2, 1, 2, 1, 1, 2] });
    }

    // Check eligibility after 3 attempts
    const res = await request(app)
      .get("/api/v1/exams/exam-1/reattempt-eligible")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.eligible).toBe(false);
    expect(res.body.remainingAttempts).toBe(0);
  });

  test("retrieves all attempt history", async () => {
    // Get baseline attempt count
    const beforeRes = await request(app)
      .get("/api/v1/exams/exam-1/attempts")
      .set("Authorization", `Bearer ${testToken}`);

    const baselineAttempts = beforeRes.body.attempts.length;

    // Submit twice
    await request(app)
      .post("/api/v1/exams/exam-1/submit")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ answers: [1, 1, 2, 1, 2, 1, 2, 1, 1, 2] });

    await request(app)
      .post("/api/v1/exams/exam-1/submit")
      .set("Authorization", `Bearer ${testToken}`)
      .send({ answers: [1, 1, 2, 1, 2, 1, 2, 1, 1, 2] });

    // Get attempt history
    const res = await request(app)
      .get("/api/v1/exams/exam-1/attempts")
      .set("Authorization", `Bearer ${testToken}`);

    expect(res.status).toBe(200);
    expect(res.body.attempts.length).toBe(baselineAttempts + 2);
    expect(res.body.totalAttempts).toBe(baselineAttempts + 2);
  });
});
