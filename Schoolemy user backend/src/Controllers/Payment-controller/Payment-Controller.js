import Payment from "../../Models/Payment-Model/Payment-Model.js";
// Migrated from Razorpay to Cashfree - Using REST API instead of SDK
import crypto from "crypto";
import axios from "axios";
import User from "../../Models/User-Model/User-Model.js";
import CourseNewModel from "../../Models/Course-Model/Course-Model.js";
import TutorCourse from "../../Models/Tutor-Course/Tutor-course-model.js";
import EMIPlan from "../../Models/Emi-Plan/Emi-Plan-Model.js";
import {
  getEmiDetails,
  validateCourseForEmi,
} from "../../Services/EMI-Utils.js";
import {
  getNextDueDate,
  getMonthNameFromDate,
} from "../../Services/EMI-DateUtils.js";
import { sendNotification } from "../../Notification/EMI-Notification.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { withTransaction } from "../../Utils/TransactionHelper.js";
import {
  createInvoice,
  markInvoiceAsSent,
} from "../../Services/Invoice-Service.js";

dotenv.config();

// Cashfree API Configuration (Using REST API instead of SDK)
const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === "PRODUCTION"
    ? "https://api.cashfree.com"
    : "https://sandbox.cashfree.com";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

// Helper function to create Cashfree API request headers
const getCashfreeHeaders = () => ({
  "x-client-id": CASHFREE_APP_ID,
  "x-client-secret": CASHFREE_SECRET_KEY,
  "x-api-version": "2023-08-01", // Required by Cashfree v3 API
  "Content-Type": "application/json",
});

// Small helper to pause execution (used for retry/backoff)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const validatePaymentData = (data) => {
  const errors = [];
  if (!data.userId) errors.push("User ID is required");
  if (!data.courseId && !data.tutorCourseId)
    errors.push("Course ID or Tutor Course ID is required");
  if (data.courseId && data.tutorCourseId)
    errors.push("Cannot provide both courseId and tutorCourseId");
  if (!data.amount || isNaN(data.amount))
    errors.push("Valid amount is required");
  return errors;
};

export const createPayment = async (req, res) => {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("💳 PAYMENT CREATION REQUEST RECEIVED");
    console.log("=".repeat(80));

    const userId = req.userId;

    const {
      courseId,
      tutorCourseId,
      amount,
      paymentMethod,
      paymentType,
      emiDueDay,
    } = req.body;

    console.log("📋 Request Body:", {
      userId: userId ? "✓" : "✗",
      courseId: courseId ? `✓ ${courseId.substring(0, 10)}...` : "✗",
      tutorCourseId: tutorCourseId
        ? `✓ ${tutorCourseId.substring(0, 10)}...`
        : "✗",
      amount,
      paymentMethod,
      paymentType,
      emiDueDay,
    });

    // Validate input data
    const validationErrors = validatePaymentData({
      userId,
      courseId,
      tutorCourseId,
      amount,
    });

    if (validationErrors.length > 0) {
      console.error("❌ Validation errors:", validationErrors);
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    console.log("✅ Basic validation passed");

    // Tutor courses: Only one-time full payment (no EMI)
    if (tutorCourseId && paymentType === "emi") {
      console.error("❌ EMI not allowed for tutor courses");
      return res.status(400).json({
        success: false,
        message:
          "EMI is not available for tutor courses. Only one-time full payment is supported.",
      });
    }

    if (paymentType === "emi") {
      if (
        !emiDueDay ||
        !Number.isInteger(emiDueDay) ||
        emiDueDay < 1 ||
        emiDueDay > 31
      ) {
        console.error("❌ Invalid EMI due day:", emiDueDay);
        return res
          .status(400)
          .json({ success: false, message: "Invalid EMI due day (1-31)" });
      }
    }

    // Validate course ID format
    const courseIdToValidate = tutorCourseId || courseId;
    if (!mongoose.Types.ObjectId.isValid(courseIdToValidate)) {
      console.error("❌ Invalid course ID format:", courseIdToValidate);
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID format" });
    }

    console.log("✅ Validation checks passed");

    // Check if user is already enrolled
    if (courseId) {
      const isEnrolled = await User.exists({
        _id: userId,
        "enrolledCourses.course": courseId,
      });

      if (isEnrolled) {
        return res.status(400).json({
          success: false,
          message: "User already enrolled in this course",
        });
      }
    }

    // For tutor courses, check if already paid (simple check - no enrollment tracking yet)
    if (tutorCourseId) {
      const existingTutorPayment = await Payment.findOne({
        userId,
        tutorCourseId,
        paymentStatus: "completed",
      });

      if (existingTutorPayment) {
        return res.status(400).json({
          success: false,
          message: "User has already purchased this tutor course",
        });
      }
    }

    //  APPROACH 3: Smart Hybrid - Check for existing pending payments
    console.log("🔍 Checking for existing pending payments...");

    try {
      const queryForPending = tutorCourseId
        ? { userId, tutorCourseId, paymentStatus: "pending" }
        : { userId, courseId, paymentStatus: "pending" };

      const existingPendingPayment = await Payment.findOne(
        queryForPending,
      ).sort({
        createdAt: -1,
      });

      if (existingPendingPayment) {
        console.log(
          "⚠️ Found existing pending payment:",
          existingPendingPayment._id,
        );

        const timeDiff =
          Date.now() - new Date(existingPendingPayment.createdAt).getTime();
        const minutesSinceCreated = timeDiff / (1000 * 60);
        const hoursSinceCreated = timeDiff / (1000 * 60 * 60);
        const daysSinceCreated = timeDiff / (1000 * 60 * 60 * 24);

        console.log("⏱️ Time since creation:", {
          minutes: minutesSinceCreated.toFixed(2),
          hours: hoursSinceCreated.toFixed(2),
          days: daysSinceCreated.toFixed(2),
        });

        //  RULE 1: Within 1 hour - Always reuse (user is actively trying)
        if (hoursSinceCreated < 1) {
          console.log("📌 RULE 1: Within 1 hour - Reusing existing payment");
          return await reuseExistingPayment(
            existingPendingPayment,
            courseId || tutorCourseId,
            paymentType,
            emiDueDay,
            res,
            null,
            tutorCourseId ? true : false,
          );
        }
        //  RULE 2: 1-24 hours - Reuse but warn user
        else if (hoursSinceCreated < 24) {
          console.log("📌 RULE 2: 1-24 hours - Reusing with warning");
          return await reuseExistingPayment(
            existingPendingPayment,
            courseId || tutorCourseId,
            paymentType,
            emiDueDay,
            res,
            {
              warningMessage:
                "You have a pending payment from earlier. Resuming your previous session...",
            },
            tutorCourseId ? true : false,
          );
        }
        // RULE 3: 1-7 days - Expire old, create new
        else if (daysSinceCreated < 7) {
          console.log(
            "📌 RULE 3: 1-7 days - Expiring old payment, creating new",
          );
          await Payment.findByIdAndUpdate(existingPendingPayment._id, {
            paymentStatus: "expired",
          });

          // Continue to create new payment below...
        }
        //  RULE 4: >7 days - Cancel old, create new
        else {
          console.log(
            "📌 RULE 4: >7 days - Cancelling old payment, creating new",
          );
          await Payment.findByIdAndUpdate(existingPendingPayment._id, {
            paymentStatus: "cancelled",
          });

          // Continue to create new payment below...
        }
      } else {
        console.log("✅ No existing pending payments found - creating new");
      }
    } catch (pendingCheckError) {
      console.error("❌ Error checking pending payments:", {
        message: pendingCheckError.message,
        stack: pendingCheckError.stack,
      });
      // Don't fail here - just log and continue with new payment creation
    }

    //  Continue with creating new payment
    console.log("\n📥 Loading user and course data...");

    let user, course;
    try {
      // Load user and course/tutor course based on which ID is provided
      const userPromise = User.findById(userId)
        .select("username email mobile studentRegisterNumber")
        .lean();

      const coursePromise = tutorCourseId
        ? TutorCourse.findById(tutorCourseId)
            .select(
              "coursename price courseduration thumbnail CourseMotherId status",
            )
            .lean()
        : CourseNewModel.findById(courseId)
            .select(
              "coursename price courseduration thumbnail CourseMotherId emi",
            )
            .lean();

      [user, course] = await Promise.all([userPromise, coursePromise]);

      if (!user) {
        console.error("❌ User not found:", userId);
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (!course) {
        console.error("❌ Course not found:", courseId || tutorCourseId);
        return res.status(404).json({
          success: false,
          message: tutorCourseId
            ? "Tutor course not found"
            : "Course not found",
        });
      }

      console.log("✅ User and course loaded");
      console.log("   User:", {
        id: user._id.toString().substring(0, 10),
        name: user.username,
      });
      console.log("   Course:", {
        id: course._id.toString().substring(0, 10),
        name: course.coursename,
      });
    } catch (loadError) {
      console.error("❌ Error loading user/course data:", {
        message: loadError.message,
        stack: loadError.stack,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to load user or course details",
        error: loadError.message,
      });
    }

    // For tutor courses, ensure it's approved
    if (tutorCourseId && course.status !== "approved") {
      return res.status(400).json({
        success: false,
        message:
          "This tutor course is not available for purchase. Only approved courses can be purchased.",
      });
    }

    let expectedAmount, emiDetails;

    // Tolerance for rounding differences between frontend GST/transaction calc and backend (INR)
    const AMOUNT_TOLERANCE = 10;

    // Tutor courses: Only full payment (one-time), no EMI
    // Compute expected amount with GST + transaction fee (same formula as frontend)
    if (tutorCourseId) {
      const mrp = course.price.amount || course.price.finalPrice;
      const discountPercent = course.price.discount || 0;
      const courseValue = Math.round(mrp * (1 - discountPercent / 100));
      const cgst = Math.round(courseValue * 0.09);
      const sgst = Math.round(courseValue * 0.09);
      const gstAmount = cgst + sgst;
      const transactionFee = Math.round((courseValue + gstAmount) * 0.02);
      expectedAmount = courseValue + gstAmount + transactionFee;

      if (Math.abs(amount - expectedAmount) > AMOUNT_TOLERANCE) {
        return res.status(400).json({
          success: false,
          message: "Amount doesn't match tutor course price",
        });
      }
    } else if (paymentType === "emi") {
      try {
        emiDetails = validateCourseForEmi(course);

        expectedAmount = emiDetails.monthlyAmount;

        if (Math.abs(amount - expectedAmount) > AMOUNT_TOLERANCE) {
          return res.status(400).json({
            success: false,
            message: `First EMI amount must be ₹${expectedAmount}`,
          });
        }
      } catch (emiError) {
        return res.status(400).json({
          success: false,
          message: emiError.message || "EMI not available for this course",
          errorCode: "EMI_NOT_AVAILABLE",
        });
      }
    } else {
      // Full payment for regular course (non-EMI)
      // Use stored finalPrice when breakdown exists, otherwise recompute with current GST/txn logic
      if (course.price?.breakdown?.courseValue) {
        expectedAmount = course.price.finalPrice;
      } else {
        const mrp = course.price.amount;
        const discountPercent = course.price.discount || 0;

        // Step 1: Course value after discount
        const courseValue = Math.round(mrp * (1 - discountPercent / 100));

        // Step 2: 18% GST on course value (added on top)
        const cgst = Math.round(courseValue * 0.09);
        const sgst = Math.round(courseValue * 0.09);
        const gstAmount = cgst + sgst;

        // Step 3: Transaction fee (2%) on (course value + GST)
        const transactionFee = Math.round((courseValue + gstAmount) * 0.02);

        // Step 4: Final price = course value + GST + transaction fee
        expectedAmount = courseValue + gstAmount + transactionFee;
      }

      if (amount !== expectedAmount) {
        return res.status(400).json({
          success: false,
          message: "Amount doesn't match course price",
        });
      }
    }

    // Generate a unique order ID for Cashfree
    // Cashfree order_id requirements: 3-50 characters, alphanumeric with _ and -
    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Create Cashfree Order (Migrated from Razorpay)
    // Using Cashfree REST API instead of SDK to avoid browser dependencies
    try {
      // Validate Cashfree credentials are set
      if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
        console.error("❌ Cashfree credentials missing");
        return res.status(500).json({
          success: false,
          message: "Payment gateway is not configured. Please contact support.",
          error: "Missing Cashfree API credentials",
        });
      }

      // Validate required environment URLs
      if (!process.env.FRONTEND_URL || !process.env.BACKEND_URL) {
        console.error("❌ Required environment URLs missing", {
          FRONTEND_URL: process.env.FRONTEND_URL ? "✓ set" : "✗ missing",
          BACKEND_URL: process.env.BACKEND_URL ? "✓ set" : "✗ missing",
        });
        return res.status(500).json({
          success: false,
          message:
            "Payment gateway configuration incomplete. Please contact support.",
          error: "Missing FRONTEND_URL or BACKEND_URL environment variables",
        });
      }

      const cashfreeOrderRequest = {
        order_id: orderId,
        order_amount: amount, // Use actual amount user pays (Total Payable / 1st EMI) - matches frontend display
        order_currency: "INR",
        customer_details: {
          customer_id: userId.toString(),
          customer_name: user.username || "Customer",
          customer_email: user.email || "customer@example.com",
          customer_phone: user.mobile?.toString() || "9999999999",
        },
        order_meta: {
          return_url: `${process.env.FRONTEND_URL}/payment/callback?order_id={order_id}`,
          notify_url: `${process.env.BACKEND_URL}/api/user/payment/webhook/cashfree`,
        },
        order_note: `Payment for ${course.coursename}`,
        order_tags: {
          ...(courseId ? { courseId: courseId.toString() } : {}),
          ...(tutorCourseId ? { tutorCourseId: tutorCourseId.toString() } : {}),
          courseName: course.coursename,
          paymentType: tutorCourseId ? "one-time" : paymentType || "full",
          studentRegisterNumber: user.studentRegisterNumber || "N/A",
        },
      };

      console.log("📝 Creating Cashfree order with request:", {
        orderId,
        amount,
        userId: userId.toString(),
        ...(courseId ? { courseId: courseId.toString() } : {}),
        ...(tutorCourseId ? { tutorCourseId: tutorCourseId.toString() } : {}),
      });

      // Create order via Cashfree REST API - use /pg/orders endpoint for v3 API
      const cashfreeUrl = `${CASHFREE_BASE_URL}/pg/orders`;
      console.log("🌐 Calling Cashfree API:", cashfreeUrl);
      console.log("📋 Environment:", {
        CASHFREE_ENV: process.env.CASHFREE_ENV,
        CASHFREE_APP_ID: CASHFREE_APP_ID ? "✓ set" : "✗ missing",
        CASHFREE_SECRET_KEY: CASHFREE_SECRET_KEY ? "✓ set" : "✗ missing",
      });

      const cashfreeOrder = await axios.post(
        cashfreeUrl,
        cashfreeOrderRequest,
        {
          headers: getCashfreeHeaders(),
          timeout: 10000, // 10 second timeout
        },
      );

      console.log("✅ Cashfree API response:", cashfreeOrder.data);

      // Extract payment_session_id from response
      const paymentSessionId = cashfreeOrder?.data?.payment_session_id;

      if (!paymentSessionId) {
        console.error(
          "❌ No payment_session_id in response:",
          cashfreeOrder.data,
        );
        return res.status(500).json({
          success: false,
          message: "Failed to create payment session",
          error: "Invalid Cashfree response: missing payment_session_id",
          details: cashfreeOrder.data,
        });
      }

      // Create payment record with Cashfree details
      const payment = new Payment({
        userId,
        ...(courseId ? { courseId } : {}),
        ...(tutorCourseId ? { tutorCourseId } : {}),
        CourseMotherId: course.CourseMotherId,
        studentRegisterNumber: user.studentRegisterNumber || "N/A",
        username: user.username,
        email: user.email || "N/A",
        mobile: user.mobile || "N/A",
        courseName: course.coursename,
        amount,
        currency: "INR",
        transactionId: orderId, // Using Cashfree order ID as transaction ID
        paymentMethod,
        // Cashfree specific fields (Migrated from Razorpay)
        cashfreeOrderId: orderId,
        cashfreePaymentSessionId: paymentSessionId,
        ipAddress:
          req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        paymentStatus: "pending",
        paymentGateway: "cashfree", // Changed from "razorpay"
        paymentType: tutorCourseId ? "one-time" : paymentType || "full",
        emiDueDay: paymentType === "emi" ? emiDueDay : undefined,
        refundPolicyAcknowledged: true,
      });

      await payment.save();

      // Get the saved payment _id for returning to frontend
      const paymentId = payment._id.toString();

      console.log("💾 Payment record created successfully");
      console.log("📊 Payment Details:", {
        paymentId: paymentId,
        orderId: orderId,
        userId: userId,
        ...(courseId ? { courseId: courseId } : {}),
        ...(tutorCourseId ? { tutorCourseId: tutorCourseId } : {}),
        courseType: tutorCourseId ? "tutor" : "regular",
      });

      // Prepare response with Cashfree payment session
      const response = {
        success: true,
        message: "Payment session created successfully",
        // Changed: Return payment_session_id instead of order object
        payment_session_id: paymentSessionId,
        order_id: orderId,
        paymentId: paymentId, // Already converted to string above
        courseDetails: {
          name: course.coursename,
          duration: course.courseduration,
          totalAmount: course.price.finalPrice,
          thumbnail:
            course.thumbnail || "https://schoolemy.com/default-thumbnail.jpg",
          noRefundPolicy: "As per our policy, this course is non-refunded.",
        },
      };

      // Only include EMI details for regular courses with EMI payment type
      if (paymentType === "emi" && !tutorCourseId) {
        response.emiDetails = {
          monthlyAmount: emiDetails.monthlyAmount,
          totalEmis: emiDetails.months,
          nextDueDate: getNextDueDate(new Date(), emiDueDay, 1),
        };
      }

      console.log("✅ Payment creation response:", {
        success: response.success,
        paymentId: response.paymentId,
        orderId: response.order_id,
      });

      return res.status(201).json(response);
    } catch (cashfreeError) {
      console.error("❌ Cashfree order creation error:", {
        message: cashfreeError.message,
        code: cashfreeError.code,
        status: cashfreeError.response?.status,
        data: cashfreeError.response?.data,
      });

      // Handle different types of errors
      let errorMessage = "Failed to create payment session";
      let statusCode = 500;

      if (cashfreeError.response?.status === 400) {
        errorMessage =
          cashfreeError.response?.data?.message || "Invalid payment request";
        statusCode = 400;
      } else if (
        cashfreeError.response?.status === 401 ||
        cashfreeError.response?.status === 403
      ) {
        errorMessage =
          "Payment gateway authentication failed. Please check credentials.";
        statusCode = 500;
      } else if (
        cashfreeError.code === "ECONNREFUSED" ||
        cashfreeError.code === "ENOTFOUND"
      ) {
        errorMessage =
          "Unable to reach payment gateway. Please check your internet connection.";
        statusCode = 503;
      } else if (cashfreeError.code === "ECONNABORTED") {
        errorMessage = "Payment gateway request timeout. Please try again.";
        statusCode = 504;
      }

      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: cashfreeError.message,
        details:
          process.env.NODE_ENV === "development"
            ? cashfreeError.response?.data
            : undefined,
      });
    }
  } catch (error) {
    console.error("\n" + "=".repeat(80));
    console.error("❌ CRITICAL ERROR IN PAYMENT CREATION");
    console.error("=".repeat(80));
    console.error("Error Message:", error.message);
    console.error("Error Type:", error.name);
    console.error("Error Code:", error.code);
    console.error("Stack Trace:");
    console.error(error.stack);
    console.error("=".repeat(80));

    return res.status(500).json({
      success: false,
      message: "Failed to create payment - " + error.message,
      error: error.message,
      errorType: error.name,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    // Migrated from Razorpay to Cashfree: Changed parameter names
    const {
      orderId, // Cashfree order_id
      orderToken, // Cashfree payment session token (optional)
      paymentId, // Our internal payment record ID
      refundRequested,
    } = req.body;

    console.log("🔐 Payment Verification Request Received:");
    console.log("📦 Raw Body:", req.body);
    console.log("📊 Extracted Values:", {
      orderId: orderId ? `${orderId.substring(0, 20)}...` : "MISSING",
      paymentId: paymentId ? `${paymentId.substring(0, 20)}...` : "MISSING",
      refundRequested,
    });

    if (!orderId || !paymentId) {
      console.error("❌ Validation Failed - Missing orderId or paymentId");
      console.error("📋 Details:", {
        orderId: !!orderId,
        paymentId: !!paymentId,
      });
      return res.status(400).json({
        success: false,
        message: "Order ID and Payment ID are required",
        received: { orderId: !!orderId, paymentId: !!paymentId },
      });
    }

    if (refundRequested) {
      console.warn("⚠️ Refund requested - not permitted");
      return res.status(400).json({
        success: false,
        message: "Refunds not permitted as per policy",
      });
    }

    // Validate paymentId format early to avoid DB errors
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      console.error("❌ Invalid paymentId format:", paymentId);
      console.error(
        "📋 Expected MongoDB ObjectId, got:",
        typeof paymentId,
        paymentId,
      );
      return res.status(400).json({
        success: false,
        message: "Invalid paymentId format",
        details: {
          received: paymentId,
          type: typeof paymentId,
          length: paymentId?.length,
        },
      });
    }

    console.log("✅ Validation passed - proceeding with Cashfree verification");

    // Verify payment status with Cashfree (Migrated from Razorpay)
    let cashfreePaymentDetails;
    try {
      console.log("🔍 Verifying payment for order:", orderId);

      // Fetch order details from Cashfree REST API - use /pg/orders endpoint for v3 API
      const cashfreeUrl = `${CASHFREE_BASE_URL}/pg/orders/${orderId}/payments`;
      console.log("🌐 Calling Cashfree API:", cashfreeUrl);

      const response = await axios.get(cashfreeUrl, {
        headers: getCashfreeHeaders(),
        timeout: 10000, // 10 second timeout
      });

      console.log("✅ Cashfree verification response:", response.data);

      // Cashfree may return either { payments: [...] } OR an array directly depending
      // on API version / environment. Normalize to an array if possible.
      const extractPaymentsFrom = (resp) => {
        if (!resp) return null;
        const d = resp.data ?? resp;
        if (Array.isArray(d)) return d;
        if (d?.payments && Array.isArray(d.payments)) return d.payments;
        if (d?.data && Array.isArray(d.data)) return d.data;
        if (d?.data?.payments && Array.isArray(d.data.payments))
          return d.data.payments;
        return null;
      };

      cashfreePaymentDetails = extractPaymentsFrom(response);

      if (!cashfreePaymentDetails || cashfreePaymentDetails.length === 0) {
        console.warn("⚠️ No payments found for order:", orderId);

        // Before failing, attempt a few retries with short backoff. Sometimes the
        // payment record becomes available a moment after the redirect.
        const maxRetries = 3;
        let attempt = 0;
        let refreshedResponse = null;

        while (attempt < maxRetries) {
          attempt += 1;
          console.log(`🔁 Retry attempt ${attempt} for order ${orderId}`);
          await sleep(1000 * attempt); // backoff: 1s, 2s, 3s

          try {
            refreshedResponse = await axios.get(cashfreeUrl, {
              headers: getCashfreeHeaders(),
              timeout: 10000,
            });

            const refreshedPayments = extractPaymentsFrom(refreshedResponse);
            if (refreshedPayments && refreshedPayments.length > 0) {
              console.log("✅ Payments found on retry", {
                orderId,
                retry: attempt,
                paymentsCount: refreshedPayments.length,
              });
              cashfreePaymentDetails = refreshedPayments;
              break;
            }
          } catch (retryErr) {
            console.warn("Retry fetch error:", retryErr.message);
          }
        }

        // If still no payments, check DB in case webhook already processed the payment
        if (!cashfreePaymentDetails || cashfreePaymentDetails.length === 0) {
          console.log(
            "🗄️ Checking local payment record as a fallback for:",
            orderId,
          );
          const existingPaymentRecord =
            await Payment.findById(paymentId).lean();

          if (
            existingPaymentRecord &&
            existingPaymentRecord.paymentStatus === "completed"
          ) {
            console.log(
              "🔁 Found completed payment in DB (likely via webhook). Proceeding to finalize enrollment.",
              {
                paymentId,
                orderId,
              },
            );

            // Build a minimal success response (without re-fetching Cashfree details)
            // Handle both regular courses and tutor courses
            const isTutorCourse = !!existingPaymentRecord.tutorCourseId;
            const courseIdToFetch =
              existingPaymentRecord.tutorCourseId ||
              existingPaymentRecord.courseId;
            const course = isTutorCourse
              ? await TutorCourse.findById(courseIdToFetch).select(
                  "coursename price courseduration thumbnail CourseMotherId status",
                )
              : await CourseNewModel.findById(courseIdToFetch).select(
                  "coursename price courseduration thumbnail CourseMotherId emi",
                );

            return res.status(200).json({
              success: true,
              message:
                "Payment already processed (via webhook). Enrollment completed",
              payment: existingPaymentRecord,
              courseDetails: course
                ? {
                    name: course.coursename,
                    duration: course.courseduration,
                    totalAmount: course.price?.finalPrice,
                    thumbnail: course.thumbnail,
                  }
                : null,
            });
          }

          // Still not found: return helpful debug info in development / staging
          console.warn(
            "❌ No payments found after retries and DB fallback for order:",
            orderId,
          );
          return res.status(400).json({
            success: false,
            message: "No payment found for this order",
            details:
              process.env.NODE_ENV !== "production"
                ? {
                    cashfreeResponse: response?.data || null,
                    retriesAttempted: attempt,
                  }
                : undefined,
          });
        }
      }

      // Get the latest payment (in case of multiple attempts)
      const latestPayment = cashfreePaymentDetails[0];

      // Check payment status - Cashfree statuses: SUCCESS, FAILED, PENDING, USER_DROPPED
      if (latestPayment.payment_status !== "SUCCESS") {
        return res.status(400).json({
          success: false,
          message: "Payment not successful",
          paymentStatus: latestPayment.payment_status,
        });
      }

      // Extract payment details from Cashfree response
      const cashfreePaymentId = latestPayment.cf_payment_id;
      const paymentAmount = latestPayment.payment_amount;
      const paymentMethod = latestPayment.payment_group; // card, upi, netbanking, wallet, etc.
      const paymentTime = latestPayment.payment_time;

      // Map Cashfree payment method to your enum
      const paymentMethodMap = {
        credit_card: "CREDIT_CARD",
        debit_card: "DEBIT_CARD",
        net_banking: "NETBANKING",
        upi: "UPI",
        wallet: "WALLET",
        pay_later: "PAYLATER",
        cardless_emi: "EMI",
        debit_card_emi: "EMI",
        credit_card_emi: "EMI",
      };

      const finalPaymentMethod = paymentMethodMap[paymentMethod] || "CARD";

      // Additional payment details
      const cardDetails = latestPayment.payment_method?.card;
      const upiDetails = latestPayment.payment_method?.upi;
      const netbankingDetails = latestPayment.payment_method?.netbanking;
      const walletDetails = latestPayment.payment_method?.app;

      // Determine if this is a test payment
      const isTestPayment = process.env.CASHFREE_ENV !== "PRODUCTION";

      // Execute all database operations within a transaction
      const result = await withTransaction(async (session) => {
        // Update payment with Cashfree details (Migrated from Razorpay)
        const updatedPayment = await Payment.findByIdAndUpdate(
          paymentId,
          {
            paymentStatus: "completed",
            cashfreePaymentId: cashfreePaymentId,
            paymentMethod: finalPaymentMethod, // Update with actual method
            // Store additional payment details
            ...(cardDetails && {
              cardDetails: {
                cardBrand: cardDetails.network || cardDetails.channel,
                last4: cardDetails.card_number?.slice(-4),
                bank: cardDetails.card_bank_name,
              },
            }),
            ...(upiDetails && {
              upiDetails: {
                upiId: upiDetails.upi_id,
              },
            }),
            ...(netbankingDetails && {
              bankDetails: {
                bankName: netbankingDetails.netbanking_bank_name,
              },
            }),
            ...(walletDetails && { walletProvider: walletDetails.provider }),
          },
          { new: true, session },
        );

        if (!updatedPayment) {
          console.error("Payment record not found for id:", paymentId);
          throw new Error("Payment record not found");
        }

        // Fetch course/tutor course and user within transaction
        const isTutorCourse = !!updatedPayment.tutorCourseId;
        const courseIdToFetch =
          updatedPayment.tutorCourseId || updatedPayment.courseId;

        const course = isTutorCourse
          ? await TutorCourse.findById(courseIdToFetch)
              .select(
                "coursename price courseduration thumbnail CourseMotherId status",
              )
              .session(session)
          : await CourseNewModel.findById(courseIdToFetch)
              .select(
                "coursename price courseduration thumbnail CourseMotherId emi",
              )
              .session(session);

        const user = await User.findById(updatedPayment.userId)
          .select("username email mobile studentRegisterNumber")
          .session(session);

        if (!course || !user) {
          throw new Error("Course/User not found");
        }

        let emiPlan = null;
        let emiDetails = null;

        // Tutor courses: Only one-time full payment (no EMI, no enrollment tracking yet)
        if (isTutorCourse) {
          // For tutor courses, just mark payment as completed
          // Enrollment tracking can be added later if needed
          // Update tutor course enrollment count
          await TutorCourse.findByIdAndUpdate(
            courseIdToFetch,
            { $inc: { studentEnrollmentCount: 1 } },
            { session },
          );
        } else if (updatedPayment.paymentType === "emi") {
          // Initial EMI plan creation (first payment)
          emiDetails = getEmiDetails(course);
          emiPlan = await createEmiPlan(
            updatedPayment.userId,
            updatedPayment.courseId,
            course,
            user,
            updatedPayment.emiDueDay,
            emiDetails,
            session, // Pass session to createEmiPlan
          );
        } else if (updatedPayment.paymentType === "emi_installment") {
          // 🔥 EMI installment payment (overdue/monthly payment)
          console.log("💰 Processing EMI installment payment verification...");
          console.log("📦 Payment ID:", updatedPayment._id);
          console.log("📚 EMI Plan ID:", updatedPayment.emiPlanId);

          // Get EMI plan
          const existingEmiPlan = await EMIPlan.findById(
            updatedPayment.emiPlanId,
          ).session(session);
          if (!existingEmiPlan) {
            throw new Error("EMI Plan not found for installment payment");
          }

          // Mark EMIs as paid
          const paymentDate = new Date();
          const updateOperations = updatedPayment.emiInstallments.map(
            (inst) => ({
              updateOne: {
                filter: {
                  _id: existingEmiPlan._id,
                  "emis._id": inst.emiId,
                },
                update: {
                  $set: {
                    "emis.$.status": "paid",
                    "emis.$.paymentDate": paymentDate,
                    "emis.$.cashfreeOrderId": updatedPayment.cashfreeOrderId,
                    "emis.$.cashfreePaymentId": cashfreePaymentId,
                  },
                },
              },
            }),
          );

          if (updateOperations.length > 0) {
            await EMIPlan.bulkWrite(updateOperations, { session });
            console.log(
              "✅ Updated",
              updateOperations.length,
              "EMI installment(s) to paid",
            );
          }

          // Reload plan to check status
          const { calculateEmiStatus } =
            await import("../../Services/EMI-Utils.js");
          const refreshedPlan = await EMIPlan.findById(
            existingEmiPlan._id,
          ).session(session);
          const emiStatus = calculateEmiStatus(refreshedPlan);

          // Unlock plan if no more overdue payments
          let planUpdates = {};
          if (
            !emiStatus.hasOverduePayments &&
            refreshedPlan.status === "locked"
          ) {
            planUpdates.status = "active";
            planUpdates["$push"] = {
              lockHistory: {
                action: "unlocked",
                reason: "overdue_cleared",
                date: new Date(),
              },
            };
            console.log("🔓 Unlocking EMI plan - all overdue payments cleared");
          }

          // Complete plan if all EMIs paid
          if (emiStatus.paidCount === emiStatus.totalEmis) {
            planUpdates.status = "completed";
            planUpdates.completedAt = new Date();
            console.log("🎉 EMI plan completed!");
          }

          if (Object.keys(planUpdates).length > 0) {
            await EMIPlan.findByIdAndUpdate(existingEmiPlan._id, planUpdates, {
              session,
            });
          }

          // 🔥 CRITICAL: Unlock user course access
          const shouldUnlock =
            planUpdates.status === "active" ||
            (refreshedPlan.status === "active" &&
              !emiStatus.hasOverduePayments) ||
            planUpdates.status === "completed";

          if (shouldUnlock) {
            console.log("🔓 Unlocking user course access...");
            await User.updateOne(
              {
                _id: updatedPayment.userId,
                "enrolledCourses.course": updatedPayment.courseId,
              },
              {
                $set: {
                  "enrolledCourses.$.accessStatus": "active",
                },
              },
              { session },
            );
            console.log("✅ User course access unlocked!");
          }

          emiPlan = refreshedPlan;
        } else {
          // Full payment enrollment for regular courses
          await User.findByIdAndUpdate(
            updatedPayment.userId,
            {
              $addToSet: {
                enrolledCourses: {
                  course: updatedPayment.courseId,
                  coursename: course.coursename,
                  accessStatus: "active",
                },
              },
            },
            { new: true, session },
          );
        }

        // 🔥 FIX: Only increment enrollment count for new enrollments (not installment payments)
        // Tutor courses are handled above, so only handle regular courses here
        if (
          !isTutorCourse &&
          updatedPayment.paymentType !== "emi_installment"
        ) {
          await CourseNewModel.findByIdAndUpdate(
            updatedPayment.courseId,
            { $inc: { studentEnrollmentCount: 1 } },
            { session },
          );
        }

        return {
          updatedPayment,
          course,
          user,
          emiPlan,
          emiDetails,
        };
      });

      // Determine if this is a tutor course payment
      const isTutorCourse = !!result.updatedPayment.tutorCourseId;

      // Generate Invoice AUTOMATICALLY
      let invoice = null;
      try {
        console.log(
          "📄 Starting AUTOMATIC invoice generation for payment:",
          result.updatedPayment._id,
        );
        console.log("📄 Is Tutor Course:", isTutorCourse);

        const invoiceType = isTutorCourse
          ? "tutor"
          : result.updatedPayment.paymentType === "emi" ||
              result.updatedPayment.paymentType === "emi_installment"
            ? "emi"
            : "payment";

        console.log("📄 Invoice type determined:", invoiceType);
        console.log("📄 User details:", {
          userId: result.updatedPayment.userId,
          username: result.user.username,
          email: result.user.email,
        });

        // Compute GST breakdown for the invoice
        const paidAmount = result.updatedPayment.amount;
        let invoiceBreakdown;

        if (
          result.updatedPayment.paymentType === "emi" &&
          result.emiDetails?.breakdown
        ) {
          invoiceBreakdown = {
            courseValue: result.emiDetails.breakdown.courseValue || 0,
            cgst: result.emiDetails.breakdown.cgst || 0,
            sgst: result.emiDetails.breakdown.sgst || 0,
            gstTotal: result.emiDetails.breakdown.gstTotal || 0,
            transactionFee: result.emiDetails.breakdown.transactionFee || 0,
          };
        } else if (result.course.price?.breakdown) {
          invoiceBreakdown = {
            courseValue: result.course.price.breakdown.courseValue || 0,
            cgst: result.course.price.breakdown.gst?.cgst || 0,
            sgst: result.course.price.breakdown.gst?.sgst || 0,
            gstTotal: result.course.price.breakdown.gst?.total || 0,
            transactionFee: result.course.price.breakdown.transactionFee || 0,
          };
        } else {
          const baseValue = Math.round(paidAmount / 1.2);
          invoiceBreakdown = {
            courseValue: baseValue,
            cgst: Math.round(baseValue * 0.09),
            sgst: Math.round(baseValue * 0.09),
            gstTotal: Math.round(baseValue * 0.18),
            transactionFee: Math.round(baseValue * 0.02),
          };
        }

        const invoiceData = {
          invoiceType,
          userId: result.updatedPayment.userId,
          username: result.user.username,
          email: result.user.email,
          mobile: result.user.mobile,
          studentRegisterNumber: result.user.studentRegisterNumber,
          paymentId: result.updatedPayment._id,
          transactionId: result.updatedPayment.transactionId,
          courseId: result.updatedPayment.courseId,
          tutorCourseId: result.updatedPayment.tutorCourseId,
          emiPlanId: result.emiPlan?._id,
          emiInstallmentNumber:
            result.updatedPayment.emiInstallments?.[0]?.month,
          itemDescription: `${isTutorCourse ? "Tutor Course" : result.updatedPayment.paymentType === "emi" ? "EMI Payment" : "Course"} - ${result.course.coursename}`,
          courseName: result.course.coursename,
          CourseMotherId: result.updatedPayment.CourseMotherId,
          amount: paidAmount,
          currency: result.updatedPayment.currency,
          taxAmount: invoiceBreakdown.gstTotal,
          taxPercentage: 18,
          breakdown: invoiceBreakdown,
          paymentType: result.updatedPayment.paymentType,
          paymentMethod: result.updatedPayment.paymentMethod,
          paymentGateway: result.updatedPayment.paymentGateway,
          paymentDate: result.updatedPayment.updatedAt,
        };

        console.log(
          "📄 Calling createInvoice with data:",
          JSON.stringify(invoiceData, null, 2),
        );
        invoice = await createInvoice(invoiceData);
        console.log(
          `✅ Invoice generated successfully: ${invoice.invoiceNumber}`,
        );
        console.log(`✅ Invoice ID: ${invoice._id}`);
        console.log(`✅ Invoice saved to database`);
      } catch (invoiceError) {
        console.error("❌ ========================================");
        console.error("❌ INVOICE GENERATION FAILED");
        console.error("❌ ========================================");
        console.error("❌ Error name:", invoiceError.name);
        console.error("❌ Error message:", invoiceError.message);
        console.error("❌ Error stack:", invoiceError.stack);

        if (invoiceError.errors) {
          console.error("❌ Validation errors:");
          Object.keys(invoiceError.errors).forEach((key) => {
            console.error(`❌   - ${key}: ${invoiceError.errors[key].message}`);
          });
        }

        console.error("❌ Payment will proceed without invoice");
        console.error("❌ ========================================");
        // Don't fail the payment if invoice generation fails
      }

      // Send notifications outside transaction (non-critical operations)

      if (result.updatedPayment.paymentType === "emi") {
        // Initial EMI plan creation - welcome notification (only for regular courses, tutor courses don't support EMI)
        await sendNotification(result.updatedPayment.userId, "welcome", {
          courseName: result.course.coursename,
          courseDuration: result.course.courseduration,
          amountPaid: result.updatedPayment.amount,
          totalAmount: result.course.price.finalPrice,
          isEmi: true,
          emiTotalMonths: result.emiDetails.months,
          emiMonthlyAmount: result.emiDetails.monthlyAmount,
          nextDueDate: getNextDueDate(
            new Date(),
            result.updatedPayment.emiDueDay,
            1,
          ).toDateString(),
          courseUrl: `https://schoolemy.com/course/${result.course._id}`,
          courseThumbnail:
            result.course.thumbnail ||
            "https://schoolemy.com/default-thumbnail.jpg",
          noRefundPolicy: "As per our policy, this course is non-refunded.",
          invoiceNumber: invoice?.invoiceNumber,
        });
      } else if (result.updatedPayment.paymentType === "emi_installment") {
        // EMI installment payment - payment received notification (optional)
        console.log(
          "✅ EMI installment payment completed - skipping welcome notification",
        );
        // Could send a different notification here if needed
        // await sendNotification(result.updatedPayment.userId, "payment_received", {...});
      } else {
        // Full payment - welcome notification
        await sendNotification(result.updatedPayment.userId, "welcome", {
          courseName: result.course.coursename,
          courseDuration: result.course.courseduration,
          amountPaid: result.updatedPayment.amount,
          totalAmount: result.course.price.finalPrice,
          isEmi: false,
          isTutorCourse: isTutorCourse,
          courseUrl: `https://schoolemy.com/${isTutorCourse ? "tutor-course" : "course"}/${result.course._id}`,
          courseThumbnail:
            result.course.thumbnail ||
            "https://schoolemy.com/default-thumbnail.jpg",
          noRefundPolicy: "As per our policy, this course is non-refunded.",
          invoiceNumber: invoice?.invoiceNumber,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Payment verified and course enrolled successfully",
        payment: result.updatedPayment,
        paymentMethodUsed: finalPaymentMethod, //  Return actual method used
        invoice: invoice
          ? {
              invoiceNumber: invoice.invoiceNumber,
              invoiceType: invoice.invoiceType,
              amount: invoice.amount,
              currency: invoice.currency,
              paymentDate: invoice.paymentDate,
            }
          : null,
        courseDetails: {
          name: result.course.coursename,
          duration: result.course.courseduration,
          totalAmount: result.course.price.finalPrice,
          thumbnail:
            result.course.thumbnail ||
            "https://schoolemy.com/default-thumbnail.jpg",
          noRefundPolicy: "As per our policy, this course is non-refunded.",
        },
        // 🔥 FIX: Only include emiDetails if it exists (not for installment payments)
        emiDetails:
          result.emiPlan && result.emiDetails
            ? {
                monthlyAmount: result.emiDetails.monthlyAmount,
                totalEmis: result.emiDetails.months,
                nextDueDate: getNextDueDate(
                  new Date(),
                  result.updatedPayment.emiDueDay,
                  1,
                ),
              }
            : null,
        isTutorCourse: !!result.updatedPayment.tutorCourseId,
        isTestPayment,
      });
    } catch (cashfreeErr) {
      console.error("Cashfree payment fetch error:", cashfreeErr);
      return res.status(502).json({
        success: false,
        message: "Failed to verify payment with Cashfree",
        error: cashfreeErr.message,
      });
    }
  } catch (error) {
    console.error("verifyPayment error:", error);
    const responsePayload = {
      success: false,
      message: "Payment verification failed",
      error: error.message,
    };
    if (process.env.NODE_ENV !== "production" && error.stack) {
      responsePayload.stack = error.stack;
    }
    return res.status(500).json(responsePayload);
  }
};

export const getEmiDetailsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    const course = await CourseNewModel.findById(courseId).select(
      "coursename price courseduration",
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const emiDetails = getEmiDetails(course);

    return res.status(200).json({
      success: true,
      eligible: emiDetails.eligible,
      monthlyAmount: emiDetails.monthlyAmount,
      totalAmount: emiDetails.totalAmount,
      duration: course.courseduration,
      emiPeriod: emiDetails.months,
      notes: emiDetails.notes,
      emiConfiguration: course.emi,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Helper: Create EMI Plan (Optimized) - Exported for webhook use
export const createEmiPlan = async (
  userId,
  courseId,
  course,
  user,
  dueDay,
  emiDetails,
  session = null, // Optional session parameter for transactions
) => {
  const emis = [];
  const now = new Date();

  const monthlyBreakdown = emiDetails.breakdown
    ? {
        baseValue: emiDetails.breakdown.courseValue,
        cgst: emiDetails.breakdown.cgst,
        sgst: emiDetails.breakdown.sgst,
        gstTotal: emiDetails.breakdown.gstTotal,
        transactionFee: emiDetails.breakdown.transactionFee,
      }
    : null;

  // First EMI (paid now)
  emis.push({
    month: 1,
    monthName: getMonthNameFromDate(now),
    dueDate: now,
    amount: emiDetails.monthlyAmount,
    breakdown: monthlyBreakdown,
    status: "paid",
    paymentDate: now,
  });

  // Subsequent EMIs
  for (let month = 2; month <= emiDetails.months; month++) {
    const dueDate = getNextDueDate(now, dueDay, month - 1);
    emis.push({
      month,
      monthName: getMonthNameFromDate(dueDate),
      dueDate,
      amount: emiDetails.monthlyAmount,
      breakdown: monthlyBreakdown,
      status: "pending",
      gracePeriodEnd: new Date(dueDate.getTime() + 3 * 24 * 60 * 60 * 1000), // 3-day grace period
    });
  }

  // Build GST breakdown from course price breakdown
  const priceBreakdown = course.price?.breakdown
    ? {
        courseValue: course.price.breakdown.courseValue || 0,
        gst: {
          cgst: course.price.breakdown.gst?.cgst || 0,
          sgst: course.price.breakdown.gst?.sgst || 0,
          total: course.price.breakdown.gst?.total || 0,
        },
        transactionFee: course.price.breakdown.transactionFee || 0,
      }
    : null;

  const emiPlan = new EMIPlan({
    userId,
    courseId,
    CourseMotherId: course.CourseMotherId,
    coursename: course.coursename,
    coursePrice: course.price.finalPrice,
    courseduration: course.courseduration,
    username: user.username,
    studentRegisterNumber: user.studentRegisterNumber,
    email: user.email,
    mobile: user.mobile,
    totalAmount: emiDetails.totalAmount,
    monthlyAmount: emiDetails.monthlyAmount,
    emiPeriod: emiDetails.months,
    processingFee: emiDetails.processingFee || 0,
    selectedDueDay: dueDay,
    startDate: now,
    status: "active",
    emis,
    ...(priceBreakdown && { priceBreakdown }),
  });

  // Save with session if provided
  const saveOptions = session ? { session } : {};
  const savedPlan = await emiPlan.save(saveOptions);

  // Update user enrollment with session
  const userUpdateOptions = session ? { session, new: true } : { new: true };
  await User.findByIdAndUpdate(
    userId,
    {
      $addToSet: {
        enrolledCourses: {
          course: courseId,
          coursename: course.coursename,
          emiPlan: savedPlan._id,
          accessStatus: "active",
        },
      },
    },
    userUpdateOptions,
  );

  // Update course enrollment count with session
  const courseUpdateOptions = session ? { session } : {};
  await CourseNewModel.findByIdAndUpdate(
    courseId,
    { $inc: { studentEnrollmentCount: 1 } },
    courseUpdateOptions,
  );

  return savedPlan;
};

//  Helper function: Reuse existing payment
async function reuseExistingPayment(
  existingPayment,
  courseId,
  paymentType,
  emiDueDay,
  res,
  options = {},
  isTutorCourse = false,
) {
  const course = isTutorCourse
    ? await TutorCourse.findById(courseId)
        .select(
          "coursename price courseduration thumbnail CourseMotherId status",
        )
        .lean()
    : await CourseNewModel.findById(courseId)
        .select("coursename price courseduration thumbnail CourseMotherId emi")
        .lean();

  if (!course) {
    return res.status(404).json({
      success: false,
      message: isTutorCourse ? "Tutor course not found" : "Course not found",
    });
  }

  let emiDetails;
  if (paymentType === "emi" && !isTutorCourse) {
    try {
      emiDetails = validateCourseForEmi(course);
    } catch (emiError) {
      return res.status(400).json({
        success: false,
        message: emiError.message || "EMI not available for this course",
        errorCode: "EMI_NOT_AVAILABLE",
      });
    }
  }

  // Migrated from Razorpay to Cashfree: Return payment session details
  const response = {
    success: true,
    message: options.warningMessage || "Resuming your previous payment session",
    // Changed: Return Cashfree payment_session_id instead of Razorpay order
    payment_session_id: existingPayment.cashfreePaymentSessionId,
    order_id: existingPayment.cashfreeOrderId,
    order: {
      id: existingPayment.cashfreeOrderId || existingPayment.razorpayOrderId, // Fallback for legacy
      amount: existingPayment.amount, // Cashfree uses rupees, not paise
      currency: existingPayment.currency,
    },
    paymentId: existingPayment._id,
    courseDetails: {
      name: course.coursename,
      duration: course.courseduration,
      totalAmount: course.price.finalPrice,
      thumbnail:
        course.thumbnail || "https://schoolemy.com/default-thumbnail.jpg",
      noRefundPolicy: "As per our policy, this course is non-refunded.",
    },
  };

  if (paymentType === "emi" && !isTutorCourse) {
    response.emiDetails = {
      monthlyAmount: emiDetails.monthlyAmount,
      totalEmis: emiDetails.months,
      nextDueDate: getNextDueDate(new Date(), emiDueDay, 1),
    };
  }

  return res.status(200).json(response);
}

/**
 * =========== GET APIS
 */

export const getUserPayments = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 5, status = "", sort = "-createdAt" } = req.query;

    // Build the query
    const query = { userId };

    // Status filter
    if (status) {
      query.paymentStatus = status;
    }

    // Execute query with pagination
    // Populate both courseId and tutorCourseId
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate("courseId", "coursename thumbnail courseduration")
        .populate("tutorCourseId", "coursename thumbnail courseduration")
        .lean(),
      Payment.countDocuments(query),
    ]);

    // Get user's total spending
    const totalSpent = await Payment.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          paymentStatus: "completed",
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const completed = await Payment.countDocuments({
      userId,
      paymentStatus: "completed",
    });

    const pending = await Payment.countDocuments({
      userId,
      paymentStatus: "pending",
    });

    res.status(200).json({
      success: true,
      data: {
        payments,
        summary: {
          totalPayments: total,
          totalSpent,
          completed,
          pending,
        },
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment history",
      error: error.message,
    });
  }
};

/**
 * @desc    Get single payment details (User)
 * @route   GET /api/user/payments/:id
 * @access  Private
 */
export const getUserPaymentById = async (req, res) => {
  try {
    const userId = req.userId;

    const payment = await Payment.findOne({
      _id: req.params.id,
      userId,
    })
      .populate("courseId", "coursename price courseduration instructor")
      .populate("tutorCourseId", "coursename price courseduration instructor");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found or unauthorized",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message,
    });
  }
};

/**
 * Get tutor course payments for the authenticated user
 * Returns all payments where tutorCourseId is not null
 */
export const getMyTutorCoursePayments = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10, status = "" } = req.query;

    // Build query for tutor course payments only
    const query = {
      userId,
      tutorCourseId: { $ne: null }, // Only tutor course payments
    };

    // Optional status filter
    if (status) {
      query.paymentStatus = status;
    }

    // Execute query with pagination
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate(
          "tutorCourseId",
          "coursename thumbnail courseduration price status",
        )
        .lean(),
      Payment.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch tutor course payments",
      error: error.message,
    });
  }
};

/**
 * Get payment details for a specific course ID (works for both regular courses and tutor courses)
 * @route   GET /user/payment/course/:courseId
 * @access  Private
 */
export const getPaymentForCourse = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;
    const { courseType } = req.query; // Optional: "regular" or "tutor" to specify course type

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    // Determine if this is a regular course or tutor course
    let isTutorCourse = false;
    let course = null;

    if (courseType === "tutor") {
      isTutorCourse = true;
    } else if (courseType === "regular") {
      isTutorCourse = false;
    } else {
      // Auto-detect: try tutor course first, then regular course
      course = await TutorCourse.findById(courseId)
        .select("_id coursename")
        .lean();
      if (course) {
        isTutorCourse = true;
      } else {
        course = await CourseNewModel.findById(courseId)
          .select("_id coursename")
          .lean();
        if (!course) {
          return res.status(404).json({
            success: false,
            message: "Course not found",
          });
        }
      }
    }

    // Build query based on course type
    const paymentQuery = isTutorCourse
      ? { userId, tutorCourseId: courseId }
      : { userId, courseId };

    // Get all payments for this course (including pending, completed, etc.)
    const payments = await Payment.find(paymentQuery)
      .sort({ createdAt: -1 })
      .populate(
        isTutorCourse ? "tutorCourseId" : "courseId",
        "coursename thumbnail courseduration price",
      )
      .lean();

    // Get the latest completed payment
    const completedPayment = payments.find(
      (p) => p.paymentStatus === "completed",
    );

    // Get pending payments
    const pendingPayments = payments.filter(
      (p) => p.paymentStatus === "pending",
    );

    // Calculate summary
    const totalPaid = payments
      .filter((p) => p.paymentStatus === "completed")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      data: {
        courseId,
        courseType: isTutorCourse ? "tutor" : "regular",
        hasPayment: payments.length > 0,
        hasCompletedPayment: !!completedPayment,
        totalPayments: payments.length,
        totalPaid,
        completedPayment: completedPayment || null,
        pendingPayments: pendingPayments.length > 0 ? pendingPayments : [],
        allPayments: payments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment for course",
      error: error.message,
    });
  }
};
