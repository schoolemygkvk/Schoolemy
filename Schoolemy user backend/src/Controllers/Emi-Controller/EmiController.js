import EMIPlan from "../../Models/Emi-Plan/Emi-Plan-Model.js";
import Payment from "../../Models/Payment-Model/Payment-Model.js";
import Course from "../../Models/Course-Model/Course-Model.js";
import TutorCourse from "../../Models/Tutor-Course/Tutor-course-model.js";
import User from "../../Models/User-Model/User-Model.js";
import {
  calculateEmiStatus,
  calculatePaymentAllocation,
  updateEmiAfterPayment,
  createEmiPaymentRecord,
} from "../../Services/EMI-Utils.js";
import mongoose from "mongoose";
// Migrated from Razorpay to Cashfree - Using REFT API
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// Helper: Get or calculate GST breakdown from EMI plan
const getEmiPriceBreakdown = (emiPlan) => {
  if (emiPlan.priceBreakdown && emiPlan.priceBreakdown.courseValue) {
    return emiPlan.priceBreakdown;
  }
  // Fallback: calculate from coursePrice (finalPrice = courseValue * 1.20)
  const coursePrice = emiPlan.coursePrice || emiPlan.totalAmount;
  const courseValue = Math.round((coursePrice / 1.2) * 100) / 100;
  const cgst = Math.round(courseValue * 0.09 * 100) / 100;
  const sgst = Math.round(courseValue * 0.09 * 100) / 100;
  const gstTotal = Math.round((cgst + sgst) * 100) / 100;
  const transactionFee =
    Math.round((courseValue + gstTotal) * 0.02 * 100) / 100;
  return {
    courseValue,
    gst: { cgst, sgst, total: gstTotal },
    transactionFee,
  };
};

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

// Helper function to determine payment type for a user and course
export const getPaymentType = async (userId, courseId) => {
  try {
    // 🔥 FIX: Check if this is a tutor course (tutors only have one-time payments, no EMI)
    const tutorCourse = await TutorCourse.findById(courseId)
      .select("_id coursename")
      .lean();
    const isTutorCourse = !!tutorCourse;

    if (isTutorCourse) {
      // For tutor courses, only check for one-time payment using tutorCourseId
      const tutorPayment = await Payment.findOne({
        userId,
        tutorCourseId: courseId,
        paymentStatus: "completed",
        paymentType: { $in: ["one-time", "full", null] },
      });

      if (tutorPayment) {
        return {
          type: "full",
          hasAccess: true,
          payment: tutorPayment,
          isTutorCourse: true,
        };
      }

      return {
        type: "none",
        hasAccess: false,
        message: "No payment found for this tutor course",
        isTutorCourse: true,
      };
    }

    // Check for EMI plan first (priority over full payment for payment processing)
    const emiPlan = await EMIPlan.findOne({
      userId,
      courseId,
    });

    if (emiPlan) {
      const today = new Date();
      const overdueEmis = emiPlan.emis.filter(
        (emi) => emi.status === "pending" && emi.gracePeriodEnd < today,
      );

      return {
        type: "emi",
        hasAccess: overdueEmis.length === 0 && emiPlan.status === "active",
        emiPlan,
        overdueCount: overdueEmis.length,
      };
    }

    // For regular courses, check for full payment only if no EMI plan exists
    const fullPayment = await Payment.findOne({
      userId,
      courseId,
      paymentStatus: "completed",
      paymentType: { $in: ["full", "one-time", null] }, // Include legacy payments
    });

    if (fullPayment) {
      return {
        type: "full",
        hasAccess: true,
        payment: fullPayment,
      };
    }

    return {
      type: "none",
      hasAccess: false,
      message: "No payment found for this course",
    };
  } catch (error) {
    throw error;
  }
};

// Get EMI status for a specific course
export const getEmiStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    console.log("\n" + "=".repeat(60));
    console.log("🔍 EMI STATUS CHECK REQUEST");
    console.log("👤 User ID from auth:", userId);
    console.log("📚 Course ID from params:", courseId);
    console.log("=".repeat(60));

    if (!userId) {
      console.error(
        "❌ No userId found in request - authentication middleware issue!",
      );
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.error("❌ Invalid courseId format:", courseId);
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("❌ Invalid userId format:", userId);
      return res.status(401).json({
        success: false,
        message: "Invalid user authentication",
      });
    }

    // 🔥 FIX: Check if this is a tutor course (tutors only have one-time payments, no EMI)
    const tutorCourse = await TutorCourse.findById(courseId)
      .select("_id coursename")
      .lean();
    const isTutorCourse = !!tutorCourse;

    if (isTutorCourse) {
      console.log(
        "📚 This is a tutor course - checking for one-time payment only (no EMI)",
      );

      // For tutor courses, only check for one-time payment using tutorCourseId
      const tutorPayment = await Payment.findOne({
        userId,
        tutorCourseId: courseId,
        paymentStatus: "completed",
        paymentType: { $in: ["one-time", "full", null] },
      });

      if (tutorPayment) {
        console.log("✅ Tutor course payment found:", {
          amount: tutorPayment.amount,
          paymentType: tutorPayment.paymentType,
          transactionId: tutorPayment.transactionId,
          date: tutorPayment.createdAt,
        });
        return res.status(200).json({
          success: true,
          data: {
            paymentType: "one-time",
            paymentStatus: "completed",
            paidAmount: tutorPayment.amount,
            paymentDate: tutorPayment.createdAt,
            transactionId: tutorPayment.transactionId,
            hasFullAccess: true,
            isTutorCourse: true,
            message:
              "Tutor course fully paid - one-time payment only (no EMI available)",
          },
        });
      } else {
        console.log("❌ No payment found for tutor course");
        return res.status(404).json({
          success: false,
          message:
            "No payment found for this tutor course. Please purchase the course first.",
          paymentType: "none",
          isTutorCourse: true,
        });
      }
    }

    // For regular courses, check BOTH full payment AND EMI plan (user might have both due to data migration or payment method change)

    // 🔥 CRITICAL FIX: Check EMI plan FIRST
    console.log("💰 Checking for EMI plan...");
    const emiPlan = await EMIPlan.findOne({
      userId,
      courseId,
    });

    // 🔥 NEW LOGIC: If active/locked EMI plan exists, ALWAYS use it (ignore historical full payments)
    if (
      emiPlan &&
      (emiPlan.status === "active" || emiPlan.status === "locked")
    ) {
      console.log(
        "✅ ACTIVE/LOCKED EMI PLAN FOUND - Using EMI (highest priority):",
        {
          planId: emiPlan._id,
          status: emiPlan.status,
          totalAmount: emiPlan.totalAmount,
          totalEmis: emiPlan.emis?.length,
          createdAt: emiPlan.createdAt,
        },
      );
      // Continue to EMI processing below (skip payment checking)
    } else if (emiPlan) {
      // EMI plan exists but is not active/locked (completed or cancelled)
      console.log("⚠️ EMI plan exists but status is:", emiPlan.status);
      // Check if there's a full payment as fallback
      console.log("💳 Checking for full payment (EMI plan is not active)...");
      const fullPayment = await Payment.findOne({
        userId,
        courseId,
        paymentStatus: "completed",
        paymentType: { $in: ["full", "one-time", null] },
      });

      if (fullPayment) {
        console.log("✅ Full payment found (EMI plan not active)");
        return res.status(200).json({
          success: true,
          data: {
            paymentType: "full",
            paymentStatus: "completed",
            paidAmount: fullPayment.amount,
            paymentDate: fullPayment.createdAt,
            transactionId: fullPayment.transactionId,
            hasFullAccess: true,
            message: "Course fully paid - no EMI required",
          },
        });
      }
    } else {
      // No EMI plan - check for full payment only
      console.log("💳 Checking for full payment (no EMI plan)...");
      const fullPayment = await Payment.findOne({
        userId,
        courseId,
        paymentStatus: "completed",
        paymentType: { $in: ["full", "one-time", null] },
      });

      if (fullPayment) {
        console.log("✅ Full payment found (no EMI plan):", {
          amount: fullPayment.amount,
          paymentType: fullPayment.paymentType,
          transactionId: fullPayment.transactionId,
          date: fullPayment.createdAt,
        });
        return res.status(200).json({
          success: true,
          data: {
            paymentType: "full",
            paymentStatus: "completed",
            paidAmount: fullPayment.amount,
            paymentDate: fullPayment.createdAt,
            transactionId: fullPayment.transactionId,
            hasFullAccess: true,
            message: "Course fully paid - no EMI required",
          },
        });
      }

      // No payment at all
      console.log(
        "❌ No EMI plan or full payment found for userId:",
        userId,
        "courseId:",
        courseId,
      );
      return res.status(404).json({
        success: false,
        message:
          "No payment found for this course. Please purchase the course to access EMI options.",
        paymentType: "none",
      });
    }

    // If no EMI plan exists and we reach here (shouldn't happen due to logic above)
    if (!emiPlan) {
      console.log("❌ EMI plan is null - this should not happen!");
      return res.status(404).json({
        success: false,
        message: "EMI plan not found",
        paymentType: "none",
      });
    }

    console.log("✅ EMI plan found:", {
      planId: emiPlan._id,
      status: emiPlan.status,
      totalAmount: emiPlan.totalAmount,
      totalEmis: emiPlan.emis?.length,
      createdAt: emiPlan.createdAt,
    });

    // Handle EMI users
    const emiStatus = calculateEmiStatus(emiPlan);

    console.log("\n" + "=".repeat(60));
    console.log("🔍 EMI Status Calculation for course", courseId);
    console.log("=".repeat(60));
    console.log("📊 EMI Status Details:");
    console.log("   - Total EMIs:", emiStatus.totalEmis);
    console.log("   - Paid EMIs:", emiStatus.paidCount);
    console.log("   - Pending EMIs:", emiStatus.pendingCount);
    console.log("   - Overdue Count:", emiStatus.overdueCount);
    console.log("   - Grace Period Count:", emiStatus.gracePeriodCount);
    console.log("   - Upcoming Count:", emiStatus.upcomingCount);
    console.log("=".repeat(60));
    console.log("💰 Amount Details:");
    console.log("   - Total Amount:", emiStatus.totalAmount);
    console.log("   - Total Paid:", emiStatus.totalPaid);
    console.log("   - Total Overdue:", emiStatus.totalOverdue);
    console.log("   - Total Remaining:", emiStatus.totalRemaining);
    console.log("   - Next Due Amount:", emiStatus.nextDueAmount);
    console.log("=".repeat(60));
    console.log("🔐 Access Control:");
    console.log("   - Has Overdue Payments:", emiStatus.hasOverduePayments);
    console.log("   - Is Current On Payments:", emiStatus.isCurrentOnPayments);
    console.log("   - Has Access To Content:", emiStatus.hasAccessToContent);
    console.log("   - Plan Status:", emiPlan.status);
    console.log("=".repeat(60) + "\n");

    // Determine if access should be locked
    const shouldBeLocked =
      emiPlan.status === "locked" ||
      emiStatus.hasAnyDuePayments || // 🔥 FIXED: Lock if due OR overdue (was only overdue before)
      emiStatus.overdueCount > 0;

    console.log("🚪 ACCESS DECISION:");
    console.log("   - Should Be Locked:", shouldBeLocked);
    console.log("   - Has Due Payments:", emiStatus.hasDuePayments);
    console.log("   - Has Overdue Payments:", emiStatus.hasOverduePayments);
    console.log(
      "   - Reason:",
      shouldBeLocked
        ? emiPlan.status === "locked"
          ? "Plan is locked"
          : emiStatus.hasDuePayments
            ? "Has due EMI payments"
            : "Has overdue payments"
        : "No due or overdue payments",
    );
    console.log("=".repeat(60) + "\n");

    res.status(200).json({
      success: true,
      data: {
        paymentType: "emi",
        planStatus: emiPlan.status,
        planId: emiPlan._id,

        // Course details
        courseId: emiPlan.courseId,
        courseName: emiPlan.courseName || "Course",
        courseCategory: emiPlan.courseCategory || "",
        courseThumbnail: emiPlan.courseThumbnail || "",
        courseAmount: emiPlan.courseAmount || emiStatus.totalAmount,
        monthlyAmount:
          emiPlan.monthlyAmount || emiStatus.totalAmount / emiStatus.totalEmis,
        tenure: emiPlan.emiPeriod || emiStatus.totalEmis,
        processingFee: emiPlan.processingFee || 0,

        // GST Breakdown
        priceBreakdown: getEmiPriceBreakdown(emiPlan),

        // Enhanced EMI statistics
        totalEmis: emiStatus.totalEmis,
        paidEmis: emiStatus.paidCount,
        pendingEmis: emiStatus.pendingCount,
        dueEmis: emiStatus.dueCount, // 🔥 NEW: EMIs that are due but not overdue
        overdueEmis: emiStatus.overdueCount,
        upcomingEmis: emiStatus.upcomingCount,
        gracePeriodEmis: emiStatus.gracePeriodCount,

        // Enhanced amount calculations
        totalAmount: emiStatus.totalAmount,
        totalPaid: emiStatus.totalPaid,
        totalDue: emiStatus.totalDue, // 🔥 NEW: Amount due (not yet overdue)
        totalOverdue: emiStatus.totalOverdue,
        totalRemaining: emiStatus.totalRemaining,
        nextDueAmount: emiStatus.nextDueAmount,
        nextDueDate: emiStatus.nextDueDate,

        emis: emiPlan.emis.map((emi) => ({
          _id: emi._id,
          emiNumber: emi.month || emi.emiNumber,
          month: emi.month,
          monthName: emi.monthName,
          amount: emi.amount,
          breakdown: emi.breakdown || null,
          dueDate: emi.dueDate,
          gracePeriodEnd: emi.gracePeriodEnd,
          status: emi.status,
          paymentDate: emi.paymentDate,
          transactionId: emi.transactionId,
        })),

        // Access status
        isAccessLocked:
          emiPlan.status === "locked" || emiStatus.hasAnyDuePayments, // 🔥 FIXED: Lock if due OR overdue
        hasFullAccess: emiStatus.hasAccessToContent,
        hasOverduePayments: emiStatus.hasOverduePayments,
        hasDuePayments: emiStatus.hasDuePayments, // 🔥 NEW: Show if EMI is due
        hasAnyDuePayments: emiStatus.hasAnyDuePayments, // 🔥 NEW: Combines both due and overdue
        hasAccess: !emiStatus.hasAnyDuePayments && emiPlan.status !== "locked", // 🔥 FIXED
        isCurrentOnPayments: emiStatus.isCurrentOnPayments,
        duePaymentRequired: emiStatus.hasDuePayments, // 🔥 NEW: Flag for frontend alert

        // Detailed EMI information
        gracePeriodInfo:
          emiStatus.gracePeriodEmis.length > 0
            ? {
                count: emiStatus.gracePeriodEmis.length,
                totalAmount: emiStatus.gracePeriodEmis.reduce(
                  (sum, emi) => sum + emi.amount,
                  0,
                ),
                nextDueDate: emiStatus.gracePeriodEmis[0]?.dueDate,
                gracePeriodEnd: emiStatus.gracePeriodEmis[0]?.gracePeriodEnd,
              }
            : null,

        // 🔥 NEW: Due EMI info for notifications and course locking
        duePaymentInfo:
          emiStatus.dueEmis.length > 0
            ? {
                count: emiStatus.dueEmis.length,
                totalAmount: emiStatus.totalDue,
                nextDueDate: emiStatus.dueEmis[0]?.dueDate,
                gracePeriodEnd: emiStatus.dueEmis[0]?.gracePeriodEnd,
                message: `⚠️ URGENT: You have ${emiStatus.dueEmis.length} EMI payment(s) due. Your course access is temporarily locked. Please pay immediately to restore access.`,
                alertType: "warning",
              }
            : null,

        overdueInfo:
          emiStatus.overdueEmis.length > 0
            ? {
                count: emiStatus.overdueEmis.length,
                totalAmount: emiStatus.totalOverdue,
                oldestDueDate: emiStatus.overdueEmis[0]?.dueDate,
              }
            : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get EMI status",
      error: error.message,
    });
  }
};

export const payOverdueEmis = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId, amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    // Check payment type first
    const paymentInfo = await getPaymentType(userId, courseId);

    if (paymentInfo.type === "full") {
      return res.status(400).json({
        success: false,
        message: "Course is already fully paid. No EMI payments required.",
        paymentType: "full",
        paymentDetails: {
          amount: paymentInfo.payment.amount,
          paymentDate: paymentInfo.payment.createdAt,
          transactionId: paymentInfo.payment.transactionId,
        },
      });
    }

    if (paymentInfo.type === "none") {
      return res.status(404).json({
        success: false,
        message:
          "No payment or EMI plan found for this course. Please purchase the course first.",
      });
    }

    // Handle EMI users only
    const emiPlan = paymentInfo.emiPlan;
    const emiStatus = calculateEmiStatus(emiPlan);

    // Check if there are any payments due (overdue or in grace period)
    if (
      emiStatus.totalOverdue === 0 &&
      emiStatus.gracePeriodEmis.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No overdue or due EMI payments found for this course.",
        paymentType: "emi",
        emiStatus: "up-to-date",
        nextDueAmount: emiStatus.nextDueAmount,
        nextDueDate: emiStatus.nextDueDate,
      });
    }

    // Calculate payment allocation
    const paymentAllocation = calculatePaymentAllocation(emiPlan, amount);

    if (!paymentAllocation.isValidAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ₹${amount} is not valid. You can pay ₹${
          paymentAllocation.suggestedAmount
        } to clear ${paymentAllocation.emisToPay.length + 1} EMI(s).`,
        overdueDetails: {
          totalOverdue: emiStatus.totalOverdue,
          gracePeriodAmount: emiStatus.gracePeriodEmis.reduce(
            (sum, emi) => sum + emi.amount,
            0,
          ),
          suggestedPayments: [
            paymentAllocation.nextEmiAmount && {
              amount: paymentAllocation.nextEmiAmount,
              description: "Next single EMI payment",
            },
            paymentAllocation.suggestedAmount && {
              amount: paymentAllocation.suggestedAmount,
              description: `Pay ${
                paymentAllocation.emisToPay.length + 1
              } EMI(s)`,
            },
          ].filter(Boolean),
        },
      });
    }

    // Get course EMI configuration for receipt details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Create Cashfree order (Migrated from Razorpay)
    const orderId = `emi_payment_${Date.now()}`;

    const user = await User.findById(userId).select("username email mobile");

    const cashfreeOrderRequest = {
      order_id: orderId,
      order_amount: amount, // Cashfree uses rupees, not paise
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
      order_note: `Overdue EMI payment for course`,
      order_tags: {
        courseId: courseId.toString(),
        emiPlanId: emiPlan._id.toString(),
        paymentType: "emi_installment",
        emisCount: paymentAllocation.emisToPay.length.toString(),
      },
    };

    // Create order via Cashfree REST API - use /pg/orders endpoint for v3 API
    const cashfreeOrderResponse = await axios.post(
      `${CASHFREE_BASE_URL}/pg/orders`,
      cashfreeOrderRequest,
      { headers: getCashfreeHeaders(), timeout: 10000 },
    );
    const paymentSessionId = cashfreeOrderResponse?.data?.payment_session_id;

    if (!paymentSessionId) {
      throw new Error("Failed to create Cashfree payment session");
    }

    console.log("✅ Cashfree order created successfully:", {
      orderId,
      paymentSessionId,
      amount,
    });

    // 🔥 REAL PAYMENT FLOW: Create pending payment record
    // Payment will be completed by webhook after user pays through Cashfree

    const payment = new Payment({
      // Basic payment info
      userId,
      courseId,
      username: emiPlan.username,
      studentRegisterNumber: emiPlan.studentRegisterNumber,
      email: emiPlan.email,
      mobile: emiPlan.mobile || "N/A",
      CourseMotherId: emiPlan.CourseMotherId,
      courseName: emiPlan.coursename,

      // Payment details
      amount: amount,
      currency: "INR",
      transactionId: orderId,
      paymentMethod: "CARD",
      paymentStatus: "pending", // ✅ Pending until webhook confirms
      paymentGateway: "cashfree",
      paymentType: "emi_installment", // ✅ Mark as EMI installment for webhook

      // EMI specific tracking
      emiPlanId: emiPlan._id,
      emiDueDay: emiPlan.selectedDueDay,
      emiInstallments: paymentAllocation.emisToPay.map((emi) => ({
        emiId: emi.emiId,
        month: emi.month,
        monthName: emi.monthName,
        amount: emi.amount,
        dueDate: emi.dueDate,
        wasOverdue: emi.isOverdue,
      })),

      // Cashfree details
      cashfreeOrderId: orderId,
      cashfreePaymentSessionId: paymentSessionId,

      // Technical details
      ipAddress:
        req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      platform: "web",
      isInternational: false,
    });

    await payment.save();

    console.log("💾 Pending payment record created:", payment._id);
    console.log("🔄 User will be redirected to Cashfree for payment");
    console.log("📞 Webhook will process payment completion");

    // Construct Cashfree hosted checkout URL
    // Format: https://payments.cashfree.com/order/#/checkout?order_id={order_id}
    const cashfreeEnv =
      process.env.CASHFREE_ENV === "PRODUCTION"
        ? "payments.cashfree.com"
        : "payments-test.cashfree.com";
    const paymentUrl = `https://${cashfreeEnv}/order/#/checkout?order_id=${orderId}`;

    // Return payment session details for frontend redirect
    res.status(200).json({
      success: true,
      message: "Payment session created. Redirecting to payment gateway...",
      payment_session_id: paymentSessionId,
      order_id: orderId,
      paymentUrl: paymentUrl, // ✅ Cashfree checkout URL
      paymentId: payment._id.toString(),
      amount: amount,
      emisToPay: paymentAllocation.emisToPay.length,
      // ℹ️ These will be set after webhook confirms payment
      requiresPaymentCompletion: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process EMI payment",
      error: error.message,
    });
  }
};

// Get general payment status for any course (works for both EMI and full payment users)
export const getPaymentStatus = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    const paymentInfo = await getPaymentType(userId, courseId);

    res.status(200).json({
      success: true,
      data: paymentInfo,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get payment status",
      error: error.message,
    });
  }
};

// Get monthly due amount for existing EMI users
export const getMonthlyDueAmount = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    const paymentInfo = await getPaymentType(userId, courseId);

    if (paymentInfo.type === "full") {
      return res.status(200).json({
        success: true,
        paymentType: "full",
        message: "Course is fully paid. No monthly payments required.",
        data: {
          isDue: false,
          dueAmount: 0,
          currentMonth: null,
        },
      });
    }

    if (paymentInfo.type === "none") {
      return res.status(404).json({
        success: false,
        message: "No EMI plan found. Please purchase the course first.",
      });
    }

    const emiPlan = paymentInfo.emiPlan;
    const emiStatus = calculateEmiStatus(emiPlan);
    const today = new Date();

    // Find current month's EMI
    const currentMonthEmi = emiPlan.emis.find((emi) => {
      const emiDate = new Date(emi.dueDate);
      return (
        emi.status === "pending" &&
        emiDate.getMonth() === today.getMonth() &&
        emiDate.getFullYear() === today.getFullYear()
      );
    });

    // Find next unpaid EMI if current month is not available
    const nextDueEmi = emiPlan.emis
      .filter((emi) => emi.status === "pending")
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];

    const targetEmi = currentMonthEmi || nextDueEmi;

    if (!targetEmi) {
      return res.status(200).json({
        success: true,
        paymentType: "emi",
        message: "All EMI payments are completed.",
        data: {
          isDue: false,
          dueAmount: 0,
          currentMonth: null,
          allPaid: true,
        },
      });
    }

    const isOverdue = targetEmi.gracePeriodEnd < today;
    const isInGracePeriod =
      targetEmi.dueDate <= today && targetEmi.gracePeriodEnd >= today;

    res.status(200).json({
      success: true,
      paymentType: "emi",
      data: {
        isDue: true,
        dueAmount: targetEmi.amount,
        currentMonth: targetEmi.monthName,
        dueDate: targetEmi.dueDate,
        gracePeriodEnd: targetEmi.gracePeriodEnd,
        isOverdue,
        isInGracePeriod,
        emiStatus: isOverdue
          ? "overdue"
          : isInGracePeriod
            ? "grace"
            : "upcoming",
        daysOverdue: isOverdue
          ? Math.ceil(
              (today - targetEmi.gracePeriodEnd) / (1000 * 60 * 60 * 24),
            )
          : 0,
        totalOverdueAmount: emiStatus.totalOverdue,
        hasOtherOverdue: emiStatus.overdueCount > (isOverdue ? 1 : 0),
        paymentOptions: {
          singleEmi: {
            amount: targetEmi.amount,
            description: `Pay ${targetEmi.monthName} EMI`,
          },
          allOverdue:
            emiStatus.totalOverdue > 0
              ? {
                  amount: emiStatus.totalOverdue,
                  description: `Pay all ${emiStatus.overdueCount} overdue EMI(s)`,
                }
              : null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get monthly due amount",
      error: error.message,
    });
  }
};

// Process monthly EMI payment for existing users
export const payMonthlyEmi = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId, amount, paymentType = "monthly" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment amount is required",
      });
    }

    const paymentInfo = await getPaymentType(userId, courseId);

    if (paymentInfo.type === "full") {
      return res.status(400).json({
        success: false,
        message: "Course is already fully paid. No EMI payments required.",
      });
    }

    if (paymentInfo.type === "none") {
      return res.status(404).json({
        success: false,
        message: "No EMI plan found for this course.",
      });
    }

    const emiPlan = paymentInfo.emiPlan;
    const emiStatus = calculateEmiStatus(emiPlan);

    // Validate payment amount
    const paymentAllocation = calculatePaymentAllocation(emiPlan, amount);
    if (!paymentAllocation.isValidAmount) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment amount ₹${amount}. Suggested amounts:`,
        suggestions: [
          {
            amount: emiStatus.nextDueAmount,
            description: "Next single EMI payment",
          },
          emiStatus.totalOverdue > 0 && {
            amount: emiStatus.totalOverdue,
            description: "All overdue EMI payments",
          },
        ].filter(Boolean),
      });
    }

    // Create Cashfree order for monthly EMI payment (Migrated from Razorpay)
    const orderId = `monthly_emi_${Date.now()}`;

    const user = await User.findById(userId).select("username email mobile");

    const cashfreeOrderRequest = {
      order_id: orderId,
      order_amount: amount, // Cashfree uses rupees, not paise
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
      order_note: `Monthly EMI payment`,
      order_tags: {
        courseId: courseId.toString(),
        emiPlanId: emiPlan._id.toString(),
        paymentType: "monthly_emi",
        emisCount: paymentAllocation.emisToPay.length.toString(),
      },
    };

    // Create order via Cashfree REST API - use /pg/orders endpoint for v3 API
    const cashfreeOrderResponse = await axios.post(
      `${CASHFREE_BASE_URL}/pg/orders`,
      cashfreeOrderRequest,
      { headers: getCashfreeHeaders(), timeout: 10000 },
    );
    const paymentSessionId = cashfreeOrderResponse?.data?.payment_session_id;

    if (!paymentSessionId) {
      throw new Error("Failed to create Cashfree payment session");
    }

    res.status(200).json({
      success: true,
      message: "Cashfree payment session created for monthly EMI payment",
      data: {
        payment_session_id: paymentSessionId,
        order_id: orderId,
        amount: amount,
        currency: "INR",
        paymentAllocation: {
          emisToPay: paymentAllocation.emisToPay.length,
          totalAmount: amount,
          willUnlockAccess:
            paymentAllocation.emisToPay.some((emi) => emi.isOverdue) &&
            emiPlan.status === "locked",
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process monthly EMI payment",
      error: error.message,
    });
  }
};

// Verify EMI payment after Razorpay success
export const verifyEmiPayment = async (req, res) => {
  try {
    const userId = req.userId;
    // Migrated from Razorpay to Cashfree payment verification
    const {
      orderId, // Cashfree order_id
      courseId,
      amount,
    } = req.body;

    // Validate required fields
    if (!orderId || !courseId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Order ID, course ID, and amount are required",
      });
    }

    // Verify payment with Cashfree REST API (Migrated from Razorpay)
    try {
      const response = await axios.get(
        `${CASHFREE_BASE_URL}/pg/orders/${orderId}/payments`,
        { headers: getCashfreeHeaders(), timeout: 10000 },
      );
      const cashfreePaymentDetails = response?.data?.payments;

      if (!cashfreePaymentDetails || cashfreePaymentDetails.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No payment found for this order",
        });
      }

      const latestPayment = cashfreePaymentDetails[0];

      if (latestPayment.payment_status !== "SUCCESS") {
        return res.status(400).json({
          success: false,
          message: "Payment not successful",
          paymentStatus: latestPayment.payment_status,
        });
      }
    } catch (cashfreeErr) {
      console.error("Cashfree payment verification error:", cashfreeErr);
      return res.status(502).json({
        success: false,
        message: "Failed to verify payment with Cashfree",
        error: cashfreeErr.message,
      });
    }

    // Find the EMI plan
    const emiPlan = await EMIPlan.findOne({ userId, courseId });
    if (!emiPlan) {
      return res.status(404).json({
        success: false,
        message: "EMI plan not found",
      });
    }

    // Calculate which EMIs to mark as paid
    const paymentAllocation = calculatePaymentAllocation(emiPlan, amount);
    if (!paymentAllocation.isValidAmount) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    // Validate payment allocation has EMIs to pay
    if (
      !paymentAllocation.emisToPay ||
      paymentAllocation.emisToPay.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "No EMIs found to process with this payment amount",
      });
    }

    // Update EMI plan - mark EMIs as paid
    const currentDate = new Date();
    let accessShouldBeUnlocked = false;

    paymentAllocation.emisToPay.forEach((emi) => {
      // Validate EMI object has required properties
      if (!emi.emiId) {
        throw new Error("Invalid EMI data: missing emiId");
      }

      const emiIndex = emiPlan.emis.findIndex(
        (e) => e._id.toString() === emi.emiId.toString(),
      );
      if (emiIndex !== -1) {
        emiPlan.emis[emiIndex].status = "paid";
        emiPlan.emis[emiIndex].paymentDate = currentDate;

        // If this was an overdue EMI, it might unlock access
        if (emi.isOverdue) {
          accessShouldBeUnlocked = true;
        }
      } else {
        throw new Error(`EMI not found in plan: ${emi.emiId}`);
      }
    });

    // Recalculate EMI status after payment
    const updatedStatus = calculateEmiStatus(emiPlan);

    // Update plan status based on new EMI status
    // If user is current on payments (no overdue EMIs), unlock the plan
    if (updatedStatus.isCurrentOnPayments && emiPlan.status === "locked") {
      emiPlan.status = "active";
      accessShouldBeUnlocked = true;
    }

    // Save EMI plan changes
    await emiPlan.save();

    // Recalculate final status after plan update
    const finalStatus = calculateEmiStatus(emiPlan);

    // Update user's course access status if needed
    if (accessShouldBeUnlocked) {
      await User.findOneAndUpdate(
        { _id: userId, "enrolledCourses.course": courseId },
        { $set: { "enrolledCourses.$.accessStatus": "active" } },
      );
    }

    res.status(200).json({
      success: true,
      message: "EMI payment verified and processed successfully",
      data: {
        paidEmis: paymentAllocation.emisToPay.length,
        accessUnlocked: accessShouldBeUnlocked,
        emiStatus: finalStatus,
        planStatus: emiPlan.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to verify EMI payment",
      error: error.message,
    });
  }
};

// Get comprehensive EMI summary for user dashboard
export const getUserEmiSummary = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all EMI plans for this user
    const emiPlans = await EMIPlan.find({ userId }).populate(
      "courseId",
      "coursename price",
    );

    if (emiPlans.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No EMI plans found for this user",
        data: {
          totalActivePlans: 0,
          totalOverdueAmount: 0,
          totalMonthlyDue: 0,
          upcomingPayments: [],
          overduePayments: [],
          activePlans: [],
        },
      });
    }

    let totalOverdueAmount = 0;
    let totalMonthlyDue = 0;
    let upcomingPayments = [];
    let overduePayments = [];
    const activePlans = [];

    const today = new Date();

    for (const emiPlan of emiPlans) {
      const emiStatus = calculateEmiStatus(emiPlan);

      // Add to active plans summary
      activePlans.push({
        planId: emiPlan._id,
        courseId: emiPlan.courseId,
        courseName: emiPlan.courseName || emiPlan.coursename,
        courseCategory: emiPlan.courseCategory || "",
        courseThumbnail: emiPlan.courseThumbnail || "",
        courseAmount: emiPlan.courseAmount || emiPlan.totalAmount,
        monthlyAmount:
          emiPlan.monthlyAmount || emiPlan.totalAmount / emiPlan.emis.length,
        tenure: emiPlan.emiPeriod || emiPlan.emis.length,
        processingFee: emiPlan.processingFee || 0,
        priceBreakdown: getEmiPriceBreakdown(emiPlan),
        paymentType: "emi",
        planStatus: emiPlan.status,
        totalAmount: emiPlan.totalAmount,
        totalEmis: emiPlan.emis.length,
        paidEmis: emiStatus.paidCount,
        totalPaid: emiStatus.totalPaid,
        totalRemaining: emiStatus.totalRemaining,
        overdueCount: emiStatus.overdueCount,
        overdueEmis: emiStatus.overdueCount, // Alias for frontend
        overdueAmount: emiStatus.totalOverdue,
        nextDueAmount: emiStatus.nextDueAmount,
        nextDueDate: emiStatus.nextDueDate,
        upcomingEmis: emiStatus.upcomingCount,
        hasAccess: emiStatus.hasAccessToContent,
        hasOverduePayments: emiStatus.hasOverduePayments,
        emis: emiPlan.emis.map((emi) => ({
          _id: emi._id,
          emiNumber: emi.emiNumber,
          amount: emi.amount,
          breakdown: emi.breakdown || null,
          dueDate: emi.dueDate,
          gracePeriodEnd: emi.gracePeriodEnd,
          status: emi.status,
          paymentDate: emi.paymentDate,
          transactionId: emi.transactionId,
        })),
      });

      // Add to totals
      totalOverdueAmount += emiStatus.totalOverdue;

      // Find current month's due EMI
      const currentMonthEmi = emiPlan.emis.find((emi) => {
        const emiDate = new Date(emi.dueDate);
        return (
          emi.status === "pending" &&
          emiDate.getMonth() === today.getMonth() &&
          emiDate.getFullYear() === today.getFullYear()
        );
      });

      if (currentMonthEmi && !emiStatus.hasOverduePayments) {
        totalMonthlyDue += currentMonthEmi.amount;
      }

      // Collect overdue payments
      const overdueEmis = emiPlan.emis.filter(
        (emi) => emi.status === "pending" && emi.gracePeriodEnd < today,
      );

      overdueEmis.forEach((emi) => {
        overduePayments.push({
          planId: emiPlan._id,
          courseId: emiPlan.courseId,
          courseName: emiPlan.coursename,
          month: emi.month,
          monthName: emi.monthName,
          amount: emi.amount,
          dueDate: emi.dueDate,
          daysOverdue: Math.ceil(
            (today - emi.gracePeriodEnd) / (1000 * 60 * 60 * 24),
          ),
        });
      });

      // Collect upcoming payments (all remaining months)
      const upcomingEmis = emiPlan.emis
        .filter((emi) => emi.status === "pending" && emi.dueDate > today)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      upcomingEmis.forEach((emi) => {
        upcomingPayments.push({
          planId: emiPlan._id,
          courseId: emiPlan.courseId,
          courseName: emiPlan.coursename,
          month: emi.month,
          monthName: emi.monthName,
          amount: emi.amount,
          dueDate: emi.dueDate,
          daysUntilDue: Math.ceil(
            (emi.dueDate - today) / (1000 * 60 * 60 * 24),
          ),
        });
      });
    }

    // Sort payments by date
    overduePayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    upcomingPayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.status(200).json({
      success: true,
      data: {
        totalActivePlans: emiPlans.length,
        totalOverdueAmount,
        totalMonthlyDue,
        hasOverduePayments: overduePayments.length > 0,
        hasUpcomingPayments: upcomingPayments.length > 0,
        upcomingPayments: upcomingPayments, // Show all upcoming payments
        overduePayments,
        activePlans,
        quickActions: {
          payAllOverdue:
            totalOverdueAmount > 0
              ? {
                  amount: totalOverdueAmount,
                  count: overduePayments.length,
                  description: `Pay all ${overduePayments.length} overdue EMI(s)`,
                }
              : null,
          payCurrentMonth:
            totalMonthlyDue > 0
              ? {
                  amount: totalMonthlyDue,
                  description: "Pay current month's EMI",
                }
              : null,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get user EMI summary",
      error: error.message,
    });
  }
};

// Get due amounts and payment options for EMI users
export const getEmiDueAmounts = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID format",
      });
    }

    // Check payment type first
    const paymentInfo = await getPaymentType(userId, courseId);

    if (paymentInfo.type === "full") {
      return res.status(200).json({
        success: true,
        paymentType: "full",
        message: "Course is fully paid. No EMI payments required.",
        data: {
          hasPayments: false,
          totalDue: 0,
          paymentOptions: [],
        },
      });
    }

    if (paymentInfo.type === "none") {
      return res.status(404).json({
        success: false,
        message: "No payment or EMI plan found for this course.",
      });
    }

    // Handle EMI users
    const emiPlan = paymentInfo.emiPlan;
    const emiStatus = calculateEmiStatus(emiPlan);

    // Calculate different payment options
    const paymentOptions = [];

    // Option 1: Pay next single EMI (overdue or current)
    if (emiStatus.nextDueAmount > 0) {
      const nextEmiAllocation = calculatePaymentAllocation(
        emiPlan,
        emiStatus.nextDueAmount,
      );
      paymentOptions.push({
        type: "single_emi",
        amount: emiStatus.nextDueAmount,
        description: "Pay next single EMI",
        emisCount: nextEmiAllocation.emisToPay.length,
        willUnlock:
          nextEmiAllocation.emisToPay.some((emi) => emi.isOverdue) &&
          emiPlan.status === "locked",
      });
    }

    // Option 2: Pay all overdue EMIs
    if (emiStatus.totalOverdue > 0) {
      const overdueAllocation = calculatePaymentAllocation(
        emiPlan,
        emiStatus.totalOverdue,
      );
      paymentOptions.push({
        type: "all_overdue",
        amount: emiStatus.totalOverdue,
        description: `Pay all ${emiStatus.overdueCount} overdue EMI(s)`,
        emisCount: overdueAllocation.emisToPay.length,
        willUnlock: emiPlan.status === "locked",
      });
    }

    // Option 3: Pay multiple EMIs (2-3 months ahead)
    const upcomingPaymentAmounts = [2, 3, 6]
      .map((months) => {
        const emis = [
          ...emiStatus.overdueEmis,
          ...emiStatus.gracePeriodEmis,
          ...emiStatus.upcomingEmis,
        ]
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, months);
        return {
          months,
          amount: emis.reduce((sum, emi) => sum + emi.amount, 0),
          count: emis.length,
        };
      })
      .filter(
        (option) =>
          option.count > 1 &&
          option.count <= emiStatus.totalEmis - emiStatus.paidCount,
      );

    upcomingPaymentAmounts.forEach((option) => {
      const allocation = calculatePaymentAllocation(emiPlan, option.amount);
      if (allocation.isValidAmount) {
        paymentOptions.push({
          type: "multiple_emis",
          amount: option.amount,
          description: `Pay ${option.count} EMI(s) in advance`,
          emisCount: allocation.emisToPay.length,
          willUnlock:
            allocation.emisToPay.some((emi) => emi.isOverdue) &&
            emiPlan.status === "locked",
        });
      }
    });

    // Option 4: Pay remaining balance
    if (emiStatus.totalRemaining > 0) {
      paymentOptions.push({
        type: "full_remaining",
        amount: emiStatus.totalRemaining,
        description: `Pay full remaining balance (${
          emiStatus.pendingCount + emiStatus.lateCount
        } EMI(s))`,
        emisCount: emiStatus.pendingCount + emiStatus.lateCount,
        willUnlock: true,
        willComplete: true,
      });
    }

    res.status(200).json({
      success: true,
      paymentType: "emi",
      data: {
        hasPayments: emiStatus.totalRemaining > 0,
        emiStatus: {
          totalPaid: emiStatus.totalPaid,
          totalRemaining: emiStatus.totalRemaining,
          totalOverdue: emiStatus.totalOverdue,
          nextDueAmount: emiStatus.nextDueAmount,
          nextDueDate: emiStatus.nextDueDate,
          hasOverduePayments: emiStatus.hasOverduePayments,
          hasAccessToContent: emiStatus.hasAccessToContent,
          planStatus: emiPlan.status,
        },
        paymentOptions: paymentOptions.slice(0, 5), // Limit to 5 options
        recommendations: {
          urgent: emiStatus.hasOverduePayments
            ? paymentOptions.find((opt) => opt.type === "all_overdue")
            : null,
          suggested:
            paymentOptions.find((opt) => opt.type === "single_emi") ||
            paymentOptions.find((opt) => opt.type === "multiple_emis"),
          economical: paymentOptions.find(
            (opt) => opt.type === "full_remaining",
          ),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get EMI due amounts",
      error: error.message,
    });
  }
};
