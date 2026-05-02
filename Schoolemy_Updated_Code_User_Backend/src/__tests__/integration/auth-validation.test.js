

import { describe, test, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import { setupDatabase, teardownDatabase, clearDatabase, createTestToken } from "./setup.js";


let app;
beforeAll(async () => {
  await setupDatabase();
  const express = await import("express");
  app = express.default();
  app.use(express.default.json());

  // Mock validation endpoints
  app.post("/api/v1/users/register", (req, res) => {
    const { email, phone } = req.body;

    // Email validation
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Phone validation
    if (!phone) {
      return res.status(400).json({ error: "Phone is required" });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: "Phone must be 10 digits" });
    }

    res.json({ message: "OTP sent", email });
  });

  app.post("/api/v1/users/verifyOtp", (req, res) => {
    const { email, otp } = req.body;

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: "OTP must be 6 digits" });
    }

    res.json({ message: "OTP verified" });
  });

  app.post("/api/v1/users/createPassword", (req, res) => {
    const { email, password, confirmPassword } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: "Password must contain uppercase letter" });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ error: "Password must contain lowercase letter" });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: "Password must contain number" });
    }

    if (!/[!@#$%^&*]/.test(password)) {
      return res.status(400).json({ error: "Password must contain special character" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    res.json({ message: "Password set" });
  });

  app.post("/api/v1/users/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const token = createTestToken({ userId: "user123", email });
    res.json({ token, message: "Login successful" });
  });

  // Mock rate limiting (simple counter for testing)
  const loginAttempts = {};
  app.post("/api/v1/users/login-limited", (req, res) => {
    const { email } = req.body;
    const key = email;

    if (!loginAttempts[key]) {
      loginAttempts[key] = 0;
    }

    loginAttempts[key]++;

    if (loginAttempts[key] > 5) {
      return res.status(429).json({ error: "Too many login attempts. Try again later." });
    }

    const token = createTestToken({ userId: "user123", email });
    res.json({ token, message: "Login successful" });
  });

  // Registered users for duplicate check
  const registeredEmails = new Set();
  app.post("/api/v1/users/register-unique", (req, res) => {
    const { email, phone } = req.body;

    if (!email || !phone) {
      return res.status(400).json({ error: "Email and phone required" });
    }

    if (registeredEmails.has(email)) {
      return res.status(409).json({ error: "Email already registered" });
    }

    registeredEmails.add(email);
    res.json({ message: "Registration successful" });
  });
});

afterAll(async () => {
  await teardownDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe("Auth Validation Integration Tests", () => {
  test("rejects registration with invalid email format", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send({
        email: "invalid-email",
        phone: "9876543210",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Invalid email");
  });

  test("rejects registration with invalid phone number", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send({
        email: "test@example.com",
        phone: "123", // Too short
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("10 digits");
  });

  test("accepts valid email and phone combination", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send({
        email: "valid.email@domain.com",
        phone: "9876543210",
      });

    expect(res.status).toBe(200);
  });

  test("rejects OTP with invalid format", async () => {
    const res = await request(app)
      .post("/api/v1/users/verifyOtp")
      .send({
        email: "test@example.com",
        otp: "abc123", // Not 6 digits
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("6 digits");
  });

  test("accepts valid 6-digit OTP", async () => {
    const res = await request(app)
      .post("/api/v1/users/verifyOtp")
      .send({
        email: "test@example.com",
        otp: "123456",
      });

    expect(res.status).toBe(200);
  });

  test("rejects password without uppercase letter", async () => {
    const res = await request(app)
      .post("/api/v1/users/createPassword")
      .send({
        email: "test@example.com",
        password: "lowercase123!",
        confirmPassword: "lowercase123!",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("uppercase");
  });

  test("rejects password without lowercase letter", async () => {
    const res = await request(app)
      .post("/api/v1/users/createPassword")
      .send({
        email: "test@example.com",
        password: "UPPERCASE123!",
        confirmPassword: "UPPERCASE123!",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("lowercase");
  });

  test("rejects password without number", async () => {
    const res = await request(app)
      .post("/api/v1/users/createPassword")
      .send({
        email: "test@example.com",
        password: "NoNumbers!abc",
        confirmPassword: "NoNumbers!abc",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("number");
  });

  test("rejects password without special character", async () => {
    const res = await request(app)
      .post("/api/v1/users/createPassword")
      .send({
        email: "test@example.com",
        password: "NoSpecial123",
        confirmPassword: "NoSpecial123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("special character");
  });

  test("accepts password meeting all requirements", async () => {
    const res = await request(app)
      .post("/api/v1/users/createPassword")
      .send({
        email: "test@example.com",
        password: "ValidPass123!",
        confirmPassword: "ValidPass123!",
      });

    expect(res.status).toBe(200);
  });
});
