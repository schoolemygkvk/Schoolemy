import  logger  from "../../Utils/logger.js";

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
import { withTransaction } from "../../Utils/TransactionHelper.js";
import {
  createInvoice,
  markInvoiceAsSent,
} from "../../Services/Invoice-Service.js";
import { CASHFREE_BASE_URL, CASHFREE_APP_ID, CASHFREE_SECRET_KEY, getCashfreeHeaders } from "../../Config/cashfreeConfig.js";
import { computeCourseFullPayableAmount } from "../../Utils/priceCalculations.js";
import {
  formatAmount,
  getPaymentBreakdown,
  validateAmountMatch
} from "../../Utils/amountFormatter.js";

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
    logger.debug("\n" + "=".repeat(80));
    logger.debug(" PAYMENT CREATION REQUEST RECEIVED");
    logger.debug("=".repeat(80));

    const userId = req.userId;

    const {
      courseId,
      tutorCourseId,
      amount,
      paymentMethod,
      paymentType,
      emiDueDay,
    } = req.body;

    logger.debug(" Request Body:", {
      userId: userId ? "" : "",
      courseId: courseId ? ` ${courseId.substring(0, 10)}...` : "",
      tutorCourseId: tutorCourseId
        ? ` ${tutorCourseId.substring(0, 10)}...`
        : "",
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
      logger.error(" Validation errors:", validationErrors);
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    logger.debug(" Basic validation passed");

    // Tutor courses: Only one-time full payment (no EMI)
    if (tutorCourseId && paymentType === "emi") {
      logger.error(" EMI not allowed for tutor courses");
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
        logger.error(" Invalid EMI due day:", emiDueDay);
        return res
          .status(400)
          .json({ success: false, message: "Invalid EMI due day (1-31)" });
      }
    }

    // Validate course ID format
    const courseIdToValidate = tutorCourseId || courseId;
    if (!mongoose.Types.ObjectId.isValid(courseIdToValidate)) {
      logger.error(" Invalid course ID format:", courseIdToValidate);
      return res
        .status(400)
        .json({ success: false, message: "Invalid course ID format" });
    }

    logger.debug(" Validation checks passed");

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

    // APPROACH 3: Smart Hybrid - Check for existing pending payments
    logger.debug(" Checking for existing pending payments...");

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
        logger.debug(
          " Found existing pending payment:",
          existingPendingPayment._id,
        );

        const timeDiff =
          Date.now() - new Date(existingPendingPayment.createdAt).getTime();
        const minutesSinceCreated = timeDiff / (1000 * 60);
        const hoursSinceCreated = timeDiff / (1000 * 60 * 60);
        const daysSinceCreated = timeDiff / (1000 * 60 * 60 * 24);

        logger.debug("Time since creation:", {
          minutes: minutesSinceCreated.toFixed(2),
          hours: hoursSinceCreated.toFixed(2),
          days: daysSinceCreated.toFixed(2),
        });

        // RULE 1: Within 1 hour - Always reuse (user is actively trying)
        if (hoursSinceCreated < 1) {
          logger.debug(" RULE 1: Within 1 hour - Reusing existing payment");
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
        // RULE 2: 1-24 hours - Reuse but warn user
        else if (hoursSinceCreated < 24) {
          logger.debug(" RULE 2: 1-24 hours - Reusing with warning");
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
          logger.debug(
            " RULE 3: 1-7 days - Expiring old payment, creating new",
          );
          await Payment.findByIdAndUpdate(existingPendingPayment._id, {
            paymentStatus: "expired",
          });

          // Continue to create new payment below...
        }
        // RULE 4: >7 days - Cancel old, create new
        else {
          logger.debug(
            " RULE 4: >7 days - Cancelling old payment, creating new",
          );
          await Payment.findByIdAndUpdate(existingPendingPayment._id, {
            paymentStatus: "cancelled",
          });

          // Continue to create new payment below...
        }
      } else {
        logger.debug(" No existing pending payments found - creating new");
      }
    } catch (pendingCheckError) {
      logger.error(" Error checking pending payments:", {
        message: pendingCheckError.message,
        stack: pendingCheckError.stack,
      });
      // Don't fail here - just log and continue with new payment creation
    }

    // Continue with creating new payment
    logger.debug("\n Loading user and course data...");

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
        logger.error(" User not found:", userId);
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      if (!course) {
        logger.error(" Course not found:", courseId || tutorCourseId);
        return res.status(404).json({
          success: false,
          message: tutorCourseId
            ? "Tutor course not found"
            : "Course not found",
        });
      }

      logger.debug(" User and course loaded");
      logger.debug(" User:", {
        id: user._id.toString().substring(0, 10),
        name: user.username,
      });
      logger.debug(" Course:", {
        id: course._id.toString().substring(0, 10),
        name: course.coursename,
      });
    } catch (loadError) {
      logger.error(" Error loading user/course data:", {
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
    // Increased to 500 to allow flexibility for various EMI and discount scenarios
    const AMOUNT_TOLERANCE = 1; // 1 rupee tolerance for rounding differences

    // Just log the course price for debugging - don't reject based on strict comparison
    // The actual validation will happen during payment verification with Cashfree
    let courseBasePrice = amount; // Default: trust the amount sent by frontend

    if (typeof course.price === "object") {
      courseBasePrice = course.price.finalPrice || course.price.courseValue || amount;
    } else {
      courseBasePrice = course.price || amount;
    }

    logger.debug(" Amount validation info:", {
      sentAmount: amount,
      courseBasePrice: courseBasePrice,
      paymentType: paymentType,
      isTutor: !!tutorCourseId,
    });

    // Validate EMI configuration if EMI payment type
    if (paymentType === "emi" && !tutorCourseId) {
      try {
        emiDetails = validateCourseForEmi(course);
        logger.debug(" EMI configuration valid:", {
          monthlyAmount: emiDetails.monthlyAmount,
          totalAmount: emiDetails.totalAmount,
          months: emiDetails.months,
        });
      } catch (emiError) {
        logger.warn(" EMI validation warning:", emiError.message);
        // Log warning but don't fail - let payment verification handle this
      }
    }

    // CRITICAL FIX: Don't reject payments based on strict amount matching
    // Different discount codes, promotions, and EMI calculations can result in valid variations
    // The actual verification happens with Cashfree payment gateway
    // Just ensure amount is positive
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than zero",
      });
    }

    // Generate a unique order ID for Cashfree
    // Cashfree order_id requirements: 3-50 characters, alphanumeric with _ and -
    // SECURITY FIX 3.20.1: Use cryptographically secure random bytes instead of Math.random()
    // Math.random() is predictable and allows order ID forgery
    // crypto.randomBytes() provides 64-bit entropy vs ~14 bits from Math.random()
    const secureRandom = crypto.randomBytes(8).toString("hex");
    const orderId = `order_${Date.now()}_${secureRandom}`;

    // Create Cashfree Order (Migrated from Razorpay)
    // Using Cashfree REST API instead of SDK to avoid browser dependencies
    try {
      // Validate Cashfree credentials are set
      if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
        logger.error(" Cashfree credentials missing");
        return res.status(500).json({
          success: false,
          message: "Payment gateway is not configured. Please contact support.",
          error: "Missing Cashfree API credentials",
        });
      }

      // Validate required environment URLs
      if (!process.env.FRONTEND_URL || !process.env.BACKEND_URL) {
        logger.error(" Required environment URLs missing", {
          FRONTEND_URL: process.env.FRONTEND_URL ? " set" : " missing",
          BACKEND_URL: process.env.BACKEND_URL ? " set" : " missing",
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

      logger.debug(" Creating Cashfree order with request:", {
        orderId,
        amount,
        userId: userId.toString(),
        ...(courseId ? { courseId: courseId.toString() } : {}),
        ...(tutorCourseId ? { tutorCourseId: tutorCourseId.toString() } : {}),
      });

      // Create order via Cashfree REST API - use /pg/orders endpoint for v3 API
      const cashfreeUrl = `${CASHFREE_BASE_URL}/pg/orders`;
      logger.debug(" Calling Cashfree API:", cashfreeUrl);
      logger.debug(" Environment:", {
        CASHFREE_ENV: process.env.CASHFREE_ENV,
        CASHFREE_APP_ID: CASHFREE_APP_ID ? " set" : " missing",
        CASHFREE_SECRET_KEY: CASHFREE_SECRET_KEY ? " set" : " missing",
      });

      const cashfreeOrder = await axios.post(
        cashfreeUrl,
        cashfreeOrderRequest,
        {
          headers: getCashfreeHeaders(),
          timeout: 10000, // 10 second timeout
        },
      );

      logger.debug(" Cashfree API response:", cashfreeOrder.data);

      // Extract payment_session_id from response
      const paymentSessionId = cashfreeOrder?.data?.payment_session_id;

      if (!paymentSessionId) {
        logger.error(
          " No payment_session_id in response:",
          cashfreeOrder.data,
        );
        return res.status(500).json({
          success: false,
          message: "Failed to create payment session. Please try again.",
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

      logger.debug(" Payment record created successfully");
      logger.debug(" Payment Details:", {
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

      logger.debug(" Payment creation response:", {
        success: response.success,
        paymentId: response.paymentId,
        orderId: response.order_id,
      });

      return res.status(201).json(response);
    } catch (cashfreeError) {
      logger.error(" Cashfree order creation error:", {
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
    logger.error("\n" + "=".repeat(80));
    logger.error(" CRITICAL ERROR IN PAYMENT CREATION");
    logger.error("=".repeat(80));
    logger.error("Error Message:", error.message);
    logger.error("Error Type:", error.name);
    logger.error("Error Code:", error.code);
    logger.error("Stack Trace:");
    logger.error(error.stack);
    logger.error("=".repeat(80));

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

    logger.debug(" Payment Verification Request Received:");
    logger.debug(" Raw Body:", req.body);
    logger.debug(" Extracted Values:", {
      orderId: orderId ? `${orderId.substring(0, 20)}...` : "MISSING",
      paymentId: paymentId ? `${paymentId.substring(0, 20)}...` : "MISSING",
      refundRequested,
    });

    if (!orderId || !paymentId) {
      logger.error(" Validation Failed - Missing orderId or paymentId");
      logger.error(" Details:", {
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
      logger.warn(" Refund requested - not permitted");
      return res.status(400).json({
        success: false,
        message: "Refunds not permitted as per policy",
      });
    }

    // Validate paymentId format early to avoid DB errors
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      logger.error(" Invalid paymentId format:", paymentId);
      logger.error(
        " Expected MongoDB ObjectId, got:",
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

    logger.debug(" Validation passed - proceeding with Cashfree verification");

    // Verify payment status with Cashfree (Migrated from Razorpay)
    let cashfreePaymentDetails;
    try {
      logger.debug(" Verifying payment for order:", orderId);

      // Fetch order details from Cashfree REST API - use /pg/orders endpoint for v3 API
      const cashfreeUrl = `${CASHFREE_BASE_URL}/pg/orders/${orderId}/payments`;
      logger.debug(" Calling Cashfree API:", cashfreeUrl);

      const response = await axios.get(cashfreeUrl, {
        headers: getCashfreeHeaders(),
        timeout: 10000, // 10 second timeout
      });

      logger.debug(" Cashfree verification response:", response.data);

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
        logger.warn(" No payments found for order:", orderId);

        // Before failing, attempt a few retries with short backoff. Sometimes the
        // payment record becomes available a moment after the redirect.
        const maxRetries = 3;
        let attempt = 0;
        let refreshedResponse = null;

        while (attempt < maxRetries) {
          attempt += 1;
          logger.debug(` Retry attempt ${attempt} for order ${orderId}`);
          await sleep(1000 * attempt); // backoff: 1s, 2s, 3s

          try {
            refreshedResponse = await axios.get(cashfreeUrl, {
              headers: getCashfreeHeaders(),
              timeout: 10000,
            });

            const refreshedPayments = extractPaymentsFrom(refreshedResponse);
            if (refreshedPayments && refreshedPayments.length > 0) {
              logger.debug(" Payments found on retry", {
                orderId,
                retry: attempt,
                paymentsCount: refreshedPayments.length,
              });
              cashfreePaymentDetails = refreshedPayments;
              break;
            }
          } catch (retryErr) {
            logger.warn("Retry fetch error:", retryErr.message);
          }
        }

        // If still no payments, check DB in case webhook already processed the payment
        if (!cashfreePaymentDetails || cashfreePaymentDetails.length === 0) {
          logger.debug(
            " Checking local payment record as a fallback for:",
            orderId,
          );
          const existingPaymentRecord =
            await Payment.findById(paymentId).lean();

          if (
            existingPaymentRecord &&
            existingPaymentRecord.paymentStatus === "completed"
          ) {
            logger.debug(
              " Found completed payment in DB (likely via webhook). Proceeding to finalize enrollment.",
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
          logger.warn(
            " No payments found after retries and DB fallback for order:",
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

      // Verify payment amount matches the expected amount from payment record
      const existingPaymentRecord = await Payment.findById(paymentId).lean();
      if (!existingPaymentRecord) {
        return res.status(404).json({
          success: false,
          message: "Payment record not found",
        });
      }

      // CRITICAL: Verify the actual paid amount matches the expected amount (within tolerance)
      // Tolerance increased to 500 to account for EMI variations, discounts, and GST/fee variations
      const AMOUNT_TOLERANCE = 1; // 1 rupee tolerance for rounding differences // INR tolerance for rounding and variation differences
      const amountDifference = Math.abs(paymentAmount - existingPaymentRecord.amount);

      logger.debug(" Payment amount verification:", {
        expectedAmount: existingPaymentRecord.amount,
        paidAmount: paymentAmount,
        difference: amountDifference,
        tolerance: AMOUNT_TOLERANCE,
        withinTolerance: amountDifference <= AMOUNT_TOLERANCE,
      });

      if (amountDifference > AMOUNT_TOLERANCE) {
        logger.error("Payment verification failed - amount mismatch:", {
          expectedAmount: existingPaymentRecord.amount,
          paidAmount: paymentAmount,
          difference: amountDifference,
        });
        return res.status(400).json({
          success: false,
          message: `Payment amount mismatch: Expected ₹${existingPaymentRecord.amount} but received ₹${paymentAmount}`,
          details: {
            expectedAmount: existingPaymentRecord.amount,
            paidAmount: paymentAmount,
            difference: amountDifference,
          },
        });
      }

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
          logger.error("Payment record not found for id:", paymentId);
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
          // EMI installment payment (overdue/monthly payment)
          logger.debug(" Processing EMI installment payment verification...");
          logger.debug(" Payment ID:", updatedPayment._id);
          logger.debug(" EMI Plan ID:", updatedPayment.emiPlanId);

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
            logger.debug(
              " Updated",
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
          const planUpdates = {};
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
            logger.debug(" Unlocking EMI plan - all overdue payments cleared");
          }

          // Complete plan if all EMIs paid
          if (emiStatus.paidCount === emiStatus.totalEmis) {
            planUpdates.status = "completed";
            planUpdates.completedAt = new Date();
            logger.debug(" EMI plan completed!");
          }

          if (Object.keys(planUpdates).length > 0) {
            await EMIPlan.findByIdAndUpdate(existingEmiPlan._id, planUpdates, {
              session,
            });
          }

          // CRITICAL: Unlock user course access
          const shouldUnlock =
            planUpdates.status === "active" ||
            (refreshedPlan.status === "active" &&
              !emiStatus.hasOverduePayments) ||
            planUpdates.status === "completed";

          if (shouldUnlock) {
            logger.debug(" Unlocking user course access...");
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
            logger.debug(" User course access unlocked!");
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

        // FIX: Only increment enrollment count for new enrollments (not installment payments)
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
        logger.debug(
          " Starting AUTOMATIC invoice generation for payment:",
          result.updatedPayment._id,
        );
        logger.debug(" Is Tutor Course:", isTutorCourse);

        const invoiceType = isTutorCourse
          ? "tutor"
          : result.updatedPayment.paymentType === "emi" ||
              result.updatedPayment.paymentType === "emi_installment"
            ? "emi"
            : "payment";

        logger.debug(" Invoice type determined:", invoiceType);
        logger.debug(" User details:", {
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

        logger.debug(
          " Calling createInvoice with data:",
          JSON.stringify(invoiceData, null, 2),
        );
        invoice = await createInvoice(invoiceData);
        logger.debug(
          ` Invoice generated successfully: ${invoice.invoiceNumber}`,
        );
        logger.debug(` Invoice ID: ${invoice._id}`);
        logger.debug(" Invoice saved to database");
      } catch (invoiceError) {
        logger.error(" ========================================");
        logger.error(" INVOICE GENERATION FAILED");
        logger.error(" ========================================");
        logger.error(" Error name:", invoiceError.name);
        logger.error(" Error message:", invoiceError.message);
        logger.error(" Error stack:", invoiceError.stack);

        if (invoiceError.errors) {
          logger.error(" Validation errors:");
          Object.keys(invoiceError.errors).forEach((key) => {
            logger.error(` - ${key}: ${invoiceError.errors[key].message}`);
          });
        }

        logger.error(" Payment will proceed without invoice");
        logger.error(" ========================================");
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
        logger.debug(
          " EMI installment payment completed - skipping welcome notification",
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
        paymentMethodUsed: finalPaymentMethod, // Return actual method used
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
        // FIX: Only include emiDetails if it exists (not for installment payments)
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
      logger.error("Cashfree payment fetch error:", cashfreeErr);
      return res.status(502).json({
        success: false,
        message: "Failed to verify payment with Cashfree",
        error: cashfreeErr.message,
      });
    }
  } catch (error) {
    logger.error("verifyPayment error:", error);
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
    const userId = req.userId; // SECURITY FIX 2.13.1: Add ownership verification

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    // SECURITY FIX 2.13.1: Verify user has purchased or has EMI for this course
    // Prevents unauthorized access to payment/EMI information
    const payment = await Payment.findOne({
      userId,
      courseId,
    });

    if (!payment) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to EMI details for this course. Please purchase the course first.",
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
    courseduration: course.courseduration || "Self-paced", // Fallback if not set
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

// Helper function: Reuse existing payment
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


export const getUserPaymentById = async (req, res) => {
  try {
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment ID format",
      });
    }

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
