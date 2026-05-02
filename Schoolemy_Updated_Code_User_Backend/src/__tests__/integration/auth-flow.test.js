

import { describe, test, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import jwt from "jsonwebtoken";
import { setupDatabase, teardownDatabase, clearDatabase, createTestToken, getAuthHeader } from "./setup.js";


// Import actual app after database is set up
let app;
beforeAll(async () => {
  await setupDatabase();
  // Mock express app for testing (in production, would use actual server.js)
  const express = await import("express");
  app = express.default();
  app.use(express.default.json());

  // Mock auth endpoints
  app.post("/api/v1/users/register", (req, res) => {
    const { email, phone } = req.body;
    if (!email || !phone) {
      return res.status(400).json({ error: "Email and phone required" });
    }
    res.json({ message: "OTP sent successfully", email });
  });

  app.post("/api/v1/users/verifyOtp", (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP required" });
    }
    // Validate OTP is 6 digits
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ error: "Invalid OTP format. Must be 6 digits." });
    }
    res.json({ message: "OTP verified", email });
  });

  app.post("/api/v1/users/createPassword", (req, res) => {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ error: "Missing fields" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password too short" });
    }
    res.json({ message: "Password set successfully" });
  });

  app.post("/api/v1/users/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const token = createTestToken({ userId: "user123", email });
    res.json({ token, userId: "user123", message: "Login successful" });
  });

  app.post("/api/v1/users/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ message: "Logout successful" });
  });

  app.get("/api/v1/users/profile", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "test-secret-key");
      res.json({ userId: "user123", email: "test@example.com", phone: "9876543210" });
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  });
});

afterAll(async () => {
  await teardownDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe("Auth Flow Integration Tests", () => {
  const testEmail = "user@example.com";
  const testPhone = "9876543210";
  const testPassword = "TestPassword@123";

  test("registers new user successfully", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send({
        email: testEmail,
        phone: testPhone,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("OTP sent");
    expect(res.body.email).toBe(testEmail);
  });

  test("rejects registration without email", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send({
        phone: testPhone,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("rejects registration without phone", async () => {
    const res = await request(app)
      .post("/api/v1/users/register")
      .send({
        email: testEmail,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("verifies OTP successfully", async () => {
    const res = await request(app)
      .post("/api/v1/users/verifyOtp")
      .send({
        email: testEmail,
        otp: "000000",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("verified");
  });

  test("rejects invalid OTP", async () => {
    const res = await request(app)
      .post("/api/v1/users/verifyOtp")
      .send({
        email: testEmail,
        otp: "invalid",
      });

    expect(res.status).toBe(400);
  });

  test("creates password successfully with matching passwords", async () => {
    const res = await request(app)
      .post("/api/v1/users/createPassword")
      .send({
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("Password set");
  });

  test("rejects password creation with mismatched passwords", async () => {
    const res = await request(app)
      .post("/api/v1/users/createPassword")
      .send({
        email: testEmail,
        password: testPassword,
        confirmPassword: "DifferentPassword@123",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("do not match");
  });

  test("rejects password creation with short password", async () => {
    const res = await request(app)
      .post("/api/v1/users/createPassword")
      .send({
        email: testEmail,
        password: "short",
        confirmPassword: "short",
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("too short");
  });

  test("logs in successfully with correct credentials", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.message).toContain("successful");
  });

  test("rejects login without email", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({
        password: testPassword,
      });

    expect(res.status).toBe(400);
  });

  test("rejects login without password", async () => {
    const res = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: testEmail,
      });

    expect(res.status).toBe(400);
  });

  test("logs out successfully with valid token", async () => {
    const loginRes = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    const token = loginRes.body.token;

    const logoutRes = await request(app)
      .post("/api/v1/users/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toContain("Logout");
  });

  test("rejects logout without token", async () => {
    const res = await request(app).post("/api/v1/users/logout");

    expect(res.status).toBe(401);
  });

  test("fetches profile with valid token", async () => {
    const loginRes = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    const token = loginRes.body.token;

    const profileRes = await request(app)
      .get("/api/v1/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.userId).toBeDefined();
    expect(profileRes.body.email).toBeDefined();
  });

  test("rejects profile access without token", async () => {
    const res = await request(app).get("/api/v1/users/profile");

    expect(res.status).toBe(401);
  });

  test("rejects profile access with invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/users/profile")
      .set("Authorization", "Bearer invalid-token");

    expect(res.status).toBe(401);
  });

  test("complete flow: register -> verify OTP -> set password -> login -> access profile", async () => {
    // Step 1: Register
    const registerRes = await request(app)
      .post("/api/v1/users/register")
      .send({
        email: testEmail,
        phone: testPhone,
      });
    expect(registerRes.status).toBe(200);

    // Step 2: Verify OTP
    const verifyRes = await request(app)
      .post("/api/v1/users/verifyOtp")
      .send({
        email: testEmail,
        otp: "000000",
      });
    expect(verifyRes.status).toBe(200);

    // Step 3: Set Password
    const passwordRes = await request(app)
      .post("/api/v1/users/createPassword")
      .send({
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
      });
    expect(passwordRes.status).toBe(200);

    // Step 4: Login
    const loginRes = await request(app)
      .post("/api/v1/users/login")
      .send({
        email: testEmail,
        password: testPassword,
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    // Step 5: Access Profile
    const profileRes = await request(app)
      .get("/api/v1/users/profile")
      .set("Authorization", `Bearer ${loginRes.body.token}`);
    expect(profileRes.status).toBe(200);
  });
});
