

import { describe, test, expect, beforeAll, afterAll, afterEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import { setupDatabase, teardownDatabase, clearDatabase, createTestToken } from "./setup.js";

// Create test app with payment endpoints
const app = express();
app.use(express.json());

// Mock payment data
let paymentOrders = [];
let emiPlans = [];

// Payment order creation
app.post("/api/payments/create-order", (req, res) => {
  const { courseId, amount, paymentType, userId } = req.body;

  if (!courseId || !amount || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const orderId = `order_${Date.now()}`;
  const order = {
    id: orderId,
    courseId,
    amount,
    paymentType: paymentType || "FULL",
    userId,
    status: "PENDING",
    createdAt: new Date(),
  };

  paymentOrders.push(order);

  res.status(201).json({
    orderId,
    amount,
    status: "PENDING",
    redirectUrl: `https://cashfree-gateway.com/checkout/${orderId}`,
  });
});

// Payment verification
app.post("/api/payments/verify", (req, res) => {
  const { orderId, transactionId, paymentStatus } = req.body;

  if (!orderId || !paymentStatus) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const order = paymentOrders.find(o => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: "Payment order not found" });
  }

  if (paymentStatus === "SUCCESS") {
    order.status = "COMPLETED";
    order.transactionId = transactionId;
    order.completedAt = new Date();

    res.json({
      orderId,
      status: "SUCCESS",
      transactionId,
      message: "Payment verified successfully",
    });
  } else if (paymentStatus === "FAILED") {
    order.status = "FAILED";
    res.status(400).json({
      orderId,
      status: "FAILED",
      error: "Payment failed",
    });
  } else {
    res.json({
      orderId,
      status: "PENDING",
      message: "Payment status pending",
    });
  }
});

// Get payment status
app.get("/api/payments/:orderId", (req, res) => {
  const order = paymentOrders.find(o => o.id === req.params.orderId);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json({
    orderId: order.id,
    amount: order.amount,
    status: order.status,
    paymentType: order.paymentType,
    createdAt: order.createdAt,
  });
});

// Create EMI plan
app.post("/api/payments/emi/create-plan", (req, res) => {
  const { courseId, userId, amount, monthlyInstallments } = req.body;

  if (!courseId || !userId || !amount || !monthlyInstallments) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Validate EMI eligibility (minimum ₹5000)
  if (amount < 5000) {
    return res.status(400).json({
      error: "Amount too low for EMI",
      minAmount: 5000,
    });
  }

  if (monthlyInstallments < 3 || monthlyInstallments > 24) {
    return res.status(400).json({
      error: "Invalid number of installments (3-24 allowed)",
    });
  }

  const planId = `emi_${Date.now()}`;
  const monthlyAmount = Math.round(amount / monthlyInstallments);
  const gstPercent = 18;
  const gstAmount = Math.round((amount * gstPercent) / 100);

  const plan = {
    id: planId,
    courseId,
    userId,
    amount,
    gstAmount,
    totalAmount: amount + gstAmount,
    monthlyInstallments,
    monthlyAmount,
    status: "ACTIVE",
    createdAt: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  };

  emiPlans.push(plan);

  res.status(201).json({
    planId,
    monthlyAmount,
    totalAmount: plan.totalAmount,
    monthlyInstallments,
    status: "ACTIVE",
    firstDueDate: plan.dueDate,
  });
});

// Get EMI plan details
app.get("/api/payments/emi/plan/:planId", (req, res) => {
  const plan = emiPlans.find(p => p.id === req.params.planId);

  if (!plan) {
    return res.status(404).json({ error: "EMI plan not found" });
  }

  res.json({
    planId: plan.id,
    amount: plan.amount,
    gstAmount: plan.gstAmount,
    totalAmount: plan.totalAmount,
    monthlyAmount: plan.monthlyAmount,
    monthlyInstallments: plan.monthlyInstallments,
    status: plan.status,
    dueDate: plan.dueDate,
  });
});

// Get user's active EMI plans
app.get("/api/payments/emi/user/:userId", (req, res) => {
  const userPlans = emiPlans.filter(p => p.userId === req.params.userId);

  res.json({
    userId: req.params.userId,
    plans: userPlans.map(p => ({
      planId: p.id,
      courseId: p.courseId,
      monthlyAmount: p.monthlyAmount,
      status: p.status,
    })),
    totalPlans: userPlans.length,
  });
});

describe("Payment Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  }, 30000);

  afterAll(async () => {
    await teardownDatabase();
  }, 30000);

  afterEach(async () => {
    paymentOrders = [];
    emiPlans = [];
    await clearDatabase();
  }, 10000);

  describe("POST /api/payments/create-order - Create payment order", () => {
    test("creates payment order with valid data", async () => {
      const response = await request(app)
        .post("/api/payments/create-order")
        .send({
          courseId: "course123",
          amount: 1000,
          userId: "user123",
          paymentType: "FULL",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("orderId");
      expect(response.body).toHaveProperty("status", "PENDING");
      expect(response.body).toHaveProperty("redirectUrl");
    });

    test("rejects missing courseId", async () => {
      const response = await request(app)
        .post("/api/payments/create-order")
        .send({
          amount: 1000,
          userId: "user123",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    test("rejects invalid amount", async () => {
      const response = await request(app)
        .post("/api/payments/create-order")
        .send({
          courseId: "course123",
          amount: -100,
          userId: "user123",
        });

      expect(response.status).toBe(400);
    });

    test("rejects zero amount", async () => {
      const response = await request(app)
        .post("/api/payments/create-order")
        .send({
          courseId: "course123",
          amount: 0,
          userId: "user123",
        });

      expect(response.status).toBe(400);
    });

    test("includes redirect URL for payment gateway", async () => {
      const response = await request(app)
        .post("/api/payments/create-order")
        .send({
          courseId: "course123",
          amount: 5000,
          userId: "user123",
        });

      expect(response.body.redirectUrl).toContain("cashfree");
      expect(response.body.redirectUrl).toContain(response.body.orderId);
    });
  });

  describe("POST /api/payments/verify - Verify payment", () => {
    test("verifies successful payment", async () => {
      // First create an order
      const createResponse = await request(app)
        .post("/api/payments/create-order")
        .send({
          courseId: "course123",
          amount: 1000,
          userId: "user123",
        });

      const orderId = createResponse.body.orderId;

      // Then verify it
      const verifyResponse = await request(app)
        .post("/api/payments/verify")
        .send({
          orderId,
          transactionId: "txn_12345",
          paymentStatus: "SUCCESS",
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body).toHaveProperty("status", "SUCCESS");
      expect(verifyResponse.body).toHaveProperty("transactionId");
    });

    test("handles failed payment verification", async () => {
      const createResponse = await request(app)
        .post("/api/payments/create-order")
        .send({
          courseId: "course123",
          amount: 1000,
          userId: "user123",
        });

      const verifyResponse = await request(app)
        .post("/api/payments/verify")
        .send({
          orderId: createResponse.body.orderId,
          paymentStatus: "FAILED",
        });

      expect(verifyResponse.status).toBe(400);
      expect(verifyResponse.body).toHaveProperty("status", "FAILED");
    });

    test("returns 404 for non-existent order", async () => {
      const response = await request(app)
        .post("/api/payments/verify")
        .send({
          orderId: "fake_order_123",
          paymentStatus: "SUCCESS",
        });

      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/payments/:orderId - Get payment status", () => {
    test("returns payment order status", async () => {
      // Create order first
      const createResponse = await request(app)
        .post("/api/payments/create-order")
        .send({
          courseId: "course123",
          amount: 1000,
          userId: "user123",
        });

      const orderId = createResponse.body.orderId;

      // Get status
      const response = await request(app)
        .get(`/api/payments/${orderId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("orderId", orderId);
      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("amount", 1000);
    });

    test("returns 404 for non-existent order", async () => {
      const response = await request(app)
        .get("/api/payments/fake_order_999");

      expect(response.status).toBe(404);
    });
  });

  describe("EMI Plan Creation", () => {
    test("creates EMI plan with valid data", async () => {
      const response = await request(app)
        .post("/api/payments/emi/create-plan")
        .send({
          courseId: "course123",
          userId: "user123",
          amount: 12000,
          monthlyInstallments: 6,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("planId");
      expect(response.body).toHaveProperty("monthlyAmount");
      expect(response.body).toHaveProperty("totalAmount");
      expect(response.body).toHaveProperty("status", "ACTIVE");
    });

    test("rejects EMI for amount below ₹5000", async () => {
      const response = await request(app)
        .post("/api/payments/emi/create-plan")
        .send({
          courseId: "course123",
          userId: "user123",
          amount: 2000,
          monthlyInstallments: 6,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain("Amount too low");
      expect(response.body).toHaveProperty("minAmount", 5000);
    });

    test("rejects invalid installment count", async () => {
      const response = await request(app)
        .post("/api/payments/emi/create-plan")
        .send({
          courseId: "course123",
          userId: "user123",
          amount: 12000,
          monthlyInstallments: 30, // Too many
        });

      expect(response.status).toBe(400);
    });

    test("includes GST in EMI plan", async () => {
      const response = await request(app)
        .post("/api/payments/emi/create-plan")
        .send({
          courseId: "course123",
          userId: "user123",
          amount: 10000,
          monthlyInstallments: 6,
        });

      expect(response.body).toHaveProperty("totalAmount");
      expect(response.body.totalAmount).toBeGreaterThan(10000);
    });
  });

  describe("EMI Plan Retrieval", () => {
    test("retrieves EMI plan details by ID", async () => {
      const createResponse = await request(app)
        .post("/api/payments/emi/create-plan")
        .send({
          courseId: "course123",
          userId: "user123",
          amount: 12000,
          monthlyInstallments: 6,
        });

      const planId = createResponse.body.planId;

      const getResponse = await request(app)
        .get(`/api/payments/emi/plan/${planId}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body).toHaveProperty("planId", planId);
      expect(getResponse.body).toHaveProperty("monthlyAmount");
      expect(getResponse.body).toHaveProperty("status", "ACTIVE");
    });

    test("retrieves user EMI plans", async () => {
      // Create multiple plans
      await request(app)
        .post("/api/payments/emi/create-plan")
        .send({
          courseId: "course123",
          userId: "user123",
          amount: 12000,
          monthlyInstallments: 6,
        });

      await request(app)
        .post("/api/payments/emi/create-plan")
        .send({
          courseId: "course456",
          userId: "user123",
          amount: 15000,
          monthlyInstallments: 12,
        });

      const response = await request(app)
        .get("/api/payments/emi/user/user123");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("userId", "user123");
      expect(response.body).toHaveProperty("plans");
      expect(response.body.plans.length).toBe(2);
      expect(response.body).toHaveProperty("totalPlans", 2);
    });
  });
});
