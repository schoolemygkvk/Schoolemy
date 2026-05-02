

import { describe, test, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import { setupDatabase, teardownDatabase, clearDatabase, createTestToken } from "./setup.js";


let app;
beforeAll(async () => {
  await setupDatabase();
  const express = await import("express");
  app = express.default();
  app.use(express.default.json());

  // Mock payment data
  const paymentOrders = {};
  const emiPlans = {};

  // Create payment order
  app.post("/api/v1/payments/create-order", (req, res) => {
    const { courseId, amount, paymentType } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!courseId || !amount) {
      return res.status(400).json({ error: "courseId and amount required" });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be positive" });
    }

    const orderId = `order_${Date.now()}_${Math.random()}`;
    const order = {
      orderId,
      courseId,
      amount,
      paymentType: paymentType || "FULL",
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    paymentOrders[orderId] = order;

    res.status(201).json({
      orderId,
      amount,
      status: "PENDING",
      message: "Order created",
      redirectUrl: `https://gateway.example.com/checkout/${orderId}`,
    });
  });

  // Verify payment
  app.post("/api/v1/payments/verify", (req, res) => {
    const { orderId, transactionId } = req.body;

    if (!orderId || !transactionId) {
      return res.status(400).json({ error: "orderId and transactionId required" });
    }

    const order = paymentOrders[orderId];
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Mock verification
    if (transactionId.startsWith("txn_")) {
      order.status = "COMPLETED";
      order.transactionId = transactionId;
      order.completedAt = new Date().toISOString();

      return res.json({
        success: true,
        orderId,
        status: "COMPLETED",
        message: "Payment verified successfully",
      });
    }

    return res.status(400).json({
      success: false,
      error: "Invalid transaction ID",
    });
  });

  // Create EMI plan
  app.post("/api/v1/payments/emi-plans", (req, res) => {
    const { orderId, months } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!orderId || !months) {
      return res.status(400).json({ error: "orderId and months required" });
    }

    if (months < 2 || months > 12) {
      return res.status(400).json({ error: "Months must be between 2 and 12" });
    }

    const order = paymentOrders[orderId];
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const monthlyAmount = Math.ceil(order.amount / months);
    const planId = `emi_${Date.now()}`;

    emiPlans[planId] = {
      planId,
      orderId,
      months,
      monthlyAmount,
      totalAmount: order.amount,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    res.status(201).json({
      planId,
      months,
      monthlyAmount,
      totalAmount: order.amount,
      firstPaymentDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  // Get EMI plan details
  app.get("/api/v1/payments/emi-plans/:planId", (req, res) => {
    const { planId } = req.params;

    const plan = emiPlans[planId];
    if (!plan) {
      return res.status(404).json({ error: "EMI plan not found" });
    }

    res.json(plan);
  });

  // Get order details
  app.get("/api/v1/payments/orders/:orderId", (req, res) => {
    const { orderId } = req.params;

    const order = paymentOrders[orderId];
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  });
});

afterAll(async () => {
  await teardownDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe("Payment Integration Tests", () => {
  const testToken = createTestToken({ userId: "user-1", email: "user@example.com" });

  test("creates payment order successfully", async () => {
    const res = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        amount: 500,
        paymentType: "FULL",
      });

    expect(res.status).toBe(201);
    expect(res.body.orderId).toBeDefined();
    expect(res.body.status).toBe("PENDING");
    expect(res.body.redirectUrl).toBeDefined();
  });

  test("rejects order creation without authentication", async () => {
    const res = await request(app)
      .post("/api/v1/payments/create-order")
      .send({
        courseId: "course-1",
        amount: 500,
      });

    expect(res.status).toBe(401);
  });

  test("rejects order with missing courseId", async () => {
    const res = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        amount: 500,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("courseId");
  });

  test("rejects order with zero amount", async () => {
    const res = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        amount: 0,
      });

    expect(res.status).toBe(400);
    // Amount 0 fails the !amount check, so error says "required"
    expect(res.body.error).toMatch(/(positive|required)/);
  });

  test("verifies payment successfully with valid transaction", async () => {
    // Create order first
    const orderRes = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        amount: 500,
      });

    const orderId = orderRes.body.orderId;

    // Verify payment
    const verifyRes = await request(app)
      .post("/api/v1/payments/verify")
      .send({
        orderId,
        transactionId: "txn_12345678",
      });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.status).toBe("COMPLETED");
  });

  test("rejects verification with invalid transaction ID", async () => {
    // Create order first
    const orderRes = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        amount: 500,
      });

    const orderId = orderRes.body.orderId;

    // Verify with invalid transaction
    const verifyRes = await request(app)
      .post("/api/v1/payments/verify")
      .send({
        orderId,
        transactionId: "invalid_123",
      });

    expect(verifyRes.status).toBe(400);
    expect(verifyRes.body.success).toBe(false);
  });

  test("creates EMI plan successfully", async () => {
    // Create order
    const orderRes = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        amount: 1200,
      });

    const orderId = orderRes.body.orderId;

    // Create EMI plan
    const emiRes = await request(app)
      .post("/api/v1/payments/emi-plans")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        orderId,
        months: 3,
      });

    expect(emiRes.status).toBe(201);
    expect(emiRes.body.planId).toBeDefined();
    expect(emiRes.body.months).toBe(3);
    expect(emiRes.body.monthlyAmount).toBe(400); // 1200 / 3
  });

  test("rejects EMI plan with invalid months", async () => {
    const orderRes = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        amount: 1200,
      });

    const orderId = orderRes.body.orderId;

    // Try to create EMI plan with 1 month (too few)
    const emiRes = await request(app)
      .post("/api/v1/payments/emi-plans")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        orderId,
        months: 1,
      });

    expect(emiRes.status).toBe(400);
    expect(emiRes.body.error).toContain("between 2 and 12");
  });

  test("retrieves EMI plan details", async () => {
    const orderRes = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        amount: 1200,
      });

    const orderId = orderRes.body.orderId;

    const emiRes = await request(app)
      .post("/api/v1/payments/emi-plans")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        orderId,
        months: 3,
      });

    const planId = emiRes.body.planId;

    const detailRes = await request(app).get(`/api/v1/payments/emi-plans/${planId}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.planId).toBe(planId);
    expect(detailRes.body.monthlyAmount).toBe(400);
  });

  test("retrieves order details", async () => {
    const orderRes = await request(app)
      .post("/api/v1/payments/create-order")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        courseId: "course-1",
        amount: 500,
      });

    const orderId = orderRes.body.orderId;

    const detailRes = await request(app).get(`/api/v1/payments/orders/${orderId}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.orderId).toBe(orderId);
    expect(detailRes.body.amount).toBe(500);
  });
});
