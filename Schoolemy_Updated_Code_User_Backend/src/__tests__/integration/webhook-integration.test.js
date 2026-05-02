

import { describe, test, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import { setupDatabase, teardownDatabase, clearDatabase, createTestToken } from "./setup.js";
import crypto from "crypto";


let app;
const WEBHOOK_SECRET = "test-webhook-secret";

beforeAll(async () => {
  await setupDatabase();
  const express = await import("express");
  app = express.default();
  app.use(express.default.json());

  // Mock payment orders and enrollments
  const paymentOrders = {};
  const userEnrollments = {};

  // Helper to verify webhook signature
  const verifyWebhookSignature = (payload, signature) => {
    const hash = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");
    return hash === signature;
  };

  // Webhook endpoint for payment verification
  app.post("/api/v1/webhooks/payment", (req, res) => {
    const { payload, signature } = req.body;

    // Validate signature
    if (!signature || !verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { orderId, status, transactionId } = payload;

    if (!orderId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Update order status
    if (paymentOrders[orderId]) {
      paymentOrders[orderId].status = status;
      paymentOrders[orderId].transactionId = transactionId;
      paymentOrders[orderId].webhookProcessedAt = new Date().toISOString();

      // Trigger enrollment if payment successful
      if (status === "SUCCESS") {
        const userId = paymentOrders[orderId].userId;
        const courseId = paymentOrders[orderId].courseId;

        if (!userEnrollments[userId]) {
          userEnrollments[userId] = [];
        }

        if (!userEnrollments[userId].includes(courseId)) {
          userEnrollments[userId].push(courseId);
        }
      }

      return res.json({
        success: true,
        message: "Webhook processed",
        orderId,
        status,
      });
    }

    return res.status(404).json({ error: "Order not found" });
  });

  // Webhook endpoint for enrollment
  app.post("/api/v1/webhooks/enrollment", (req, res) => {
    const { payload, signature } = req.body;

    if (!signature || !verifyWebhookSignature(payload, signature)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { userId, courseId, enrollmentDate } = payload;

    if (!userId || !courseId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!userEnrollments[userId]) {
      userEnrollments[userId] = [];
    }

    if (!userEnrollments[userId].includes(courseId)) {
      userEnrollments[userId].push(courseId);
    }

    res.json({
      success: true,
      message: "User enrolled",
      userId,
      courseId,
      enrollmentDate: enrollmentDate || new Date().toISOString(),
    });
  });

  // Create order for webhook testing
  app.post("/api/v1/test/create-order", (req, res) => {
    const { userId, courseId, amount } = req.body;

    const orderId = `order_${Date.now()}`;
    paymentOrders[orderId] = {
      orderId,
      userId,
      courseId,
      amount,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    res.json({ orderId });
  });

  // Get order status
  app.get("/api/v1/test/orders/:orderId", (req, res) => {
    const { orderId } = req.params;

    if (!paymentOrders[orderId]) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(paymentOrders[orderId]);
  });

  // Get user enrollments
  app.get("/api/v1/test/enrollments/:userId", (req, res) => {
    const { userId } = req.params;

    const courses = userEnrollments[userId] || [];
    res.json({ userId, enrolledCourses: courses });
  });

  // Export secret for signing
  app.get("/api/v1/test/webhook-secret", (req, res) => {
    res.json({ secret: WEBHOOK_SECRET });
  });
});

afterAll(async () => {
  await teardownDatabase();
});

afterEach(async () => {
  await clearDatabase();
});

describe("Webhook Integration Tests", () => {
  test("rejects webhook without signature", async () => {
    const res = await request(app)
      .post("/api/v1/webhooks/payment")
      .send({
        payload: {
          orderId: "order-123",
          status: "SUCCESS",
        },
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain("signature");
  });

  test("rejects webhook with invalid signature", async () => {
    const payload = {
      orderId: "order-123",
      status: "SUCCESS",
      transactionId: "txn-123",
    };

    const res = await request(app)
      .post("/api/v1/webhooks/payment")
      .send({
        payload,
        signature: "invalid-signature",
      });

    expect(res.status).toBe(401);
  });

  test("processes webhook with valid signature", async () => {
    // Create order first
    const orderRes = await request(app)
      .post("/api/v1/test/create-order")
      .send({
        userId: "user-1",
        courseId: "course-1",
        amount: 500,
      });

    const orderId = orderRes.body.orderId;

    // Create valid signature
    const payload = {
      orderId,
      status: "SUCCESS",
      transactionId: "txn-12345",
    };

    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");

    const res = await request(app)
      .post("/api/v1/webhooks/payment")
      .send({ payload, signature });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("updates payment status via webhook", async () => {
    const orderRes = await request(app)
      .post("/api/v1/test/create-order")
      .send({
        userId: "user-1",
        courseId: "course-1",
        amount: 500,
      });

    const orderId = orderRes.body.orderId;

    const payload = {
      orderId,
      status: "SUCCESS",
      transactionId: "txn-12345",
    };

    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");

    await request(app)
      .post("/api/v1/webhooks/payment")
      .send({ payload, signature });

    // Verify order status was updated
    const statusRes = await request(app).get(`/api/v1/test/orders/${orderId}`);

    expect(statusRes.body.status).toBe("SUCCESS");
    expect(statusRes.body.transactionId).toBe("txn-12345");
  });

  test("triggers enrollment on successful payment", async () => {
    const orderRes = await request(app)
      .post("/api/v1/test/create-order")
      .send({
        userId: "user-1",
        courseId: "course-1",
        amount: 500,
      });

    const orderId = orderRes.body.orderId;

    const payload = {
      orderId,
      status: "SUCCESS",
      transactionId: "txn-12345",
    };

    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");

    await request(app)
      .post("/api/v1/webhooks/payment")
      .send({ payload, signature });

    // Check enrollments
    const enrollRes = await request(app).get("/api/v1/test/enrollments/user-1");

    expect(enrollRes.body.enrolledCourses).toContain("course-1");
  });

  test("does not enroll on failed payment", async () => {
    const orderRes = await request(app)
      .post("/api/v1/test/create-order")
      .send({
        userId: "user-2",
        courseId: "course-2",
        amount: 500,
      });

    const orderId = orderRes.body.orderId;

    const payload = {
      orderId,
      status: "FAILED",
      transactionId: "txn-12345",
    };

    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");

    await request(app)
      .post("/api/v1/webhooks/payment")
      .send({ payload, signature });

    // Check enrollments (should be empty)
    const enrollRes = await request(app).get("/api/v1/test/enrollments/user-2");

    expect(enrollRes.body.enrolledCourses).not.toContain("course-2");
  });

  test("processes enrollment webhook with valid signature", async () => {
    const payload = {
      userId: "user-3",
      courseId: "course-3",
      enrollmentDate: new Date().toISOString(),
    };

    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");

    const res = await request(app)
      .post("/api/v1/webhooks/enrollment")
      .send({ payload, signature });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test("idempotent enrollment - does not duplicate on repeated webhook", async () => {
    const payload = {
      userId: "user-4",
      courseId: "course-4",
    };

    const signature = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");

    // Send webhook twice
    await request(app)
      .post("/api/v1/webhooks/enrollment")
      .send({ payload, signature });

    await request(app)
      .post("/api/v1/webhooks/enrollment")
      .send({ payload, signature });

    const enrollRes = await request(app).get("/api/v1/test/enrollments/user-4");

    // Should have only one enrollment, not two
    expect(enrollRes.body.enrolledCourses.length).toBe(1);
    expect(enrollRes.body.enrolledCourses[0]).toBe("course-4");
  });
});
