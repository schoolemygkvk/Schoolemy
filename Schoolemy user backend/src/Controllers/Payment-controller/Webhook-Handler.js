import crypto from "crypto";
import dotenv from "dotenv";
import Payment from "../../Models/Payment-Model/Payment-Model.js";
import User from "../../Models/User-Model/User-Model.js";
import Course from "../../Models/Course-Model/Course-Model.js";
import EMIPlan from "../../Models/Emi-Plan/Emi-Plan-Model.js";
import { createEmiPlan } from "../Payment-controller/Payment-Controller.js";
import { calculateEmiStatus } from "../../Services/EMI-Utils.js";
import { withTransaction } from "../../Utils/TransactionHelper.js";
dotenv.config();

// Cashfree Webhook signature verification (Migrated from Razorpay)
// Cashfree uses HMAC SHA-256 with timestamp concatenation
const verifyCashfreeWebhookSignature = (body, timestamp, signature) => {
  try {
    // Cashfree signature verification format: timestamp + raw body
    const signatureData = timestamp + JSON.stringify(body);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.CASHFREE_SECRET_KEY)
      .update(signatureData)
      .digest("base64");

    return expectedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
};

// Main Cashfree webhook handler (Migrated from Razorpay)
export const handleCashfreeWebhook = async (req, res) => {
  try {
    // Cashfree sends signature in headers
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];

    if (!signature || !timestamp) {
      return res.status(400).json({
        success: false,
        message: "Missing webhook signature or timestamp",
      });
    }

    // Verify webhook signature
    if (!verifyCashfreeWebhookSignature(req.body, timestamp, signature)) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const { type, data } = req.body;
    let result;

    // Cashfree webhook event types (Migrated from Razorpay events)
    switch (type) {
      case "PAYMENT_SUCCESS_WEBHOOK":
        result = await handlePaymentSuccess(data.payment);
        break;

      case "PAYMENT_FAILED_WEBHOOK":
        result = await handlePaymentFailed(data.payment);
        break;

      case "PAYMENT_USER_DROPPED_WEBHOOK":
        result = await handlePaymentDropped(data.payment);
        break;

      default:
        return res.status(200).json({
          success: true,
          message: `Webhook event ${type} received but not processed`,
          event: type,
        });
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      event: type,
      data: result,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({
      success: false,
      message: "Webhook processing failed",
      error: error.message,
    });
  }
};

// Handle successful payment (Migrated from Razorpay payment.captured)
const handlePaymentSuccess = async (paymentData) => {
  try {
    const {
      cf_payment_id: cashfreePaymentId,
      order_id: cashfreeOrderId,
      order_amount,
      payment_group: paymentMethod,
      payment_status,
    } = paymentData;

    if (payment_status !== "SUCCESS") {
      console.log("Payment not successful, status:", payment_status);
      return {
        success: false,
        message: "Payment status is not SUCCESS",
        status: payment_status,
      };
    }

    // Execute all operations within a transaction
    const result = await withTransaction(async (session) => {
      // Find payment record using Cashfree order ID
      const payment = await Payment.findOne({
        cashfreeOrderId: cashfreeOrderId,
        paymentStatus: "pending",
      }).session(session);

      if (!payment) {
        console.log("Payment record not found for order:", cashfreeOrderId);
        throw new Error("Payment record not found");
      }

      // Update payment status with Cashfree details
      payment.paymentStatus = "completed";
      payment.cashfreePaymentId = cashfreePaymentId;
      payment.paymentMethod = paymentMethod.toUpperCase();
      await payment.save({ session });

      // Handle course enrollment based on payment type
      let enrollmentResult;
      if (payment.paymentType === "emi") {
        // Initial EMI plan creation
        enrollmentResult = await handleEmiEnrollment(payment, session);
      } else if (payment.paymentType === "emi_installment") {
        // EMI installment payment (overdue/monthly)
        enrollmentResult = await handleEmiInstallmentPayment(payment, session);
      } else {
        // Full payment enrollment
        enrollmentResult = await handleFullPaymentEnrollment(payment, session);
      }

      return {
        payment,
        enrollmentResult,
      };
    });

    return {
      success: true,
      paymentId: cashfreePaymentId,
      orderId: cashfreeOrderId,
      paymentType: result.payment.paymentType,
      enrollment: result.enrollmentResult,
    };
  } catch (error) {
    console.error("handlePaymentSuccess error:", error);
    return {
      success: false,
      message: "Failed to handle payment success",
      error: error.message,
    };
  }
};

// Handle EMI enrollment after payment
const handleEmiEnrollment = async (payment, session = null) => {
  try {
    const [user, course] = await Promise.all([
      User.findById(payment.userId).session(session || null),
      Course.findById(payment.courseId).session(session || null),
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    if (!course) {
      throw new Error("Course not found");
    }

    // Create EMI plan with session
    const emiPlan = await createEmiPlan(
      payment.userId,
      payment.courseId,
      course,
      user,
      payment.emiDueDay,
      {
        monthlyAmount: payment.amount,
        totalAmount: course.price.finalPrice,
        //months: Math.ceil(course.price.finalPrice / payment.amount),
        months: course.emi.emiDurationMonths,
      },
      session, // Pass session to createEmiPlan
    );

    return {
      success: true,
      emiPlanId: emiPlan._id,
      userId: payment.userId,
      courseId: payment.courseId,
    };
  } catch (error) {
    throw error; // Re-throw to trigger transaction rollback
  }
};

// Handle EMI installment payment (overdue/monthly EMI payments)
const handleEmiInstallmentPayment = async (payment, session = null) => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("💰 PROCESSING EMI INSTALLMENT PAYMENT");
    console.log("📦 Payment ID:", payment._id);
    console.log("📚 EMI Plan ID:", payment.emiPlanId);
    console.log("💵 Amount:", payment.amount);
    console.log("=".repeat(60) + "\n");

    // Get EMI plan
    const emiPlan = await EMIPlan.findById(payment.emiPlanId).session(
      session || null,
    );
    if (!emiPlan) {
      throw new Error("EMI Plan not found");
    }

    console.log("✅ EMI Plan found:", {
      planId: emiPlan._id,
      status: emiPlan.status,
      userId: emiPlan.userId,
      courseId: emiPlan.courseId,
    });

    // Prepare payment details for EMI update
    const paymentDetails = {
      cashfreeOrderId: payment.cashfreeOrderId,
      cashfreePaymentSessionId: payment.cashfreePaymentSessionId,
      cashfreePaymentId: payment.cashfreePaymentId,
    };

    // Prepare payment allocation from stored EMI installments
    const paymentAllocation = {
      emisToPay: payment.emiInstallments.map((inst) => ({
        emiId: inst.emiId,
        month: inst.month,
        monthName: inst.monthName,
        amount: inst.amount,
        dueDate: inst.dueDate,
        isOverdue: inst.wasOverdue,
      })),
    };

    console.log(
      "📋 Updating EMI plan with payment for",
      paymentAllocation.emisToPay.length,
      "installment(s)...",
    );

    // Update EMI plan - mark EMIs as paid
    const updateOperations = [];
    const paymentDate = new Date();

    for (const emiToPay of paymentAllocation.emisToPay) {
      updateOperations.push({
        updateOne: {
          filter: {
            _id: emiPlan._id,
            "emis._id": emiToPay.emiId,
          },
          update: {
            $set: {
              "emis.$.status": "paid",
              "emis.$.paymentDate": paymentDate,
              "emis.$.cashfreeOrderId": paymentDetails.cashfreeOrderId,
              "emis.$.cashfreePaymentId": paymentDetails.cashfreePaymentId,
            },
          },
        },
      });
    }

    // Execute all EMI updates
    if (updateOperations.length > 0) {
      await EMIPlan.bulkWrite(updateOperations, { session: session || null });
      console.log(
        "✅ Updated",
        updateOperations.length,
        "EMI installment(s) to 'paid' status",
      );
    }

    // Check if plan should be unlocked or completed
    const updatedPlan = await EMIPlan.findById(emiPlan._id).session(
      session || null,
    );
    const emiStatus = calculateEmiStatus(updatedPlan);

    let planUpdates = {};
    let previousStatus = updatedPlan.status;

    // If no more overdue payments and plan was locked, unlock it
    if (!emiStatus.hasOverduePayments && updatedPlan.status === "locked") {
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

    // If all EMIs paid, mark plan as completed
    if (emiStatus.paidCount === emiStatus.totalEmis) {
      planUpdates.status = "completed";
      planUpdates.completedAt = new Date();
      console.log("🎉 EMI plan completed - all installments paid!");
    }

    // Apply plan updates
    if (Object.keys(planUpdates).length > 0) {
      await EMIPlan.findByIdAndUpdate(emiPlan._id, planUpdates, {
        session: session || null,
      });
      console.log(
        "✅ EMI plan status updated:",
        previousStatus,
        "→",
        planUpdates.status,
      );
    }

    // 🔥 CRITICAL: Update user course access if plan unlocked
    const shouldUnlockAccess =
      planUpdates.status === "active" ||
      (updatedPlan.status === "active" && !emiStatus.hasOverduePayments) ||
      planUpdates.status === "completed";

    if (shouldUnlockAccess) {
      console.log("🔓 Updating user course access to 'active'...");

      const userUpdateResult = await User.updateOne(
        {
          _id: emiPlan.userId,
          "enrolledCourses.course": emiPlan.courseId,
        },
        {
          $set: {
            "enrolledCourses.$.accessStatus": "active",
          },
        },
        { session: session || null },
      );

      console.log("✅ User access updated:", {
        matched: userUpdateResult.matchedCount,
        modified: userUpdateResult.modifiedCount,
      });
    }

    return {
      success: true,
      emiPlanId: emiPlan._id,
      userId: emiPlan.userId,
      courseId: emiPlan.courseId,
      emisPaid: paymentAllocation.emisToPay.length,
      planStatus: planUpdates.status || updatedPlan.status,
      accessUnlocked: shouldUnlockAccess,
      emiStatus: {
        paidEmis: emiStatus.paidCount,
        totalEmis: emiStatus.totalEmis,
        overdueEmis: emiStatus.overdueCount,
      },
    };
  } catch (error) {
    console.error("❌ EMI installment payment error:", error);
    throw error; // Re-throw to trigger transaction rollback
  }
};

// Handle full payment enrollment
const handleFullPaymentEnrollment = async (payment, session = null) => {
  try {
    const updateOptions = session ? { session } : {};

    // Update user's enrolled courses
    await User.findByIdAndUpdate(
      payment.userId,
      {
        $addToSet: {
          enrolledCourses: {
            course: payment.courseId,
            coursename: payment.courseName,
            accessStatus: "active",
          },
        },
      },
      updateOptions,
    );

    // Update course enrollment count
    await Course.findByIdAndUpdate(
      payment.courseId,
      { $inc: { studentEnrollmentCount: 1 } },
      updateOptions,
    );

    console.log(
      `Full payment enrollment completed for payment: ${payment._id}`,
    );
  } catch (error) {
    throw error; // Re-throw to trigger transaction rollback
  }
};

// Handle failed payments (Migrated from Razorpay)
const handlePaymentFailed = async (paymentData) => {
  try {
    const {
      order_id: cashfreeOrderId,
      payment_status,
      payment_message,
    } = paymentData;

    // Use transaction for consistency
    const result = await withTransaction(async (session) => {
      const updatedPayment = await Payment.findOneAndUpdate(
        { cashfreeOrderId: cashfreeOrderId },
        {
          paymentStatus: "failed",
          errorDescription: payment_message || "Payment failed",
        },
        { new: true, session },
      );

      if (!updatedPayment) {
        throw new Error("Payment record not found");
      }

      return updatedPayment;
    });

    return {
      success: true,
      orderId: cashfreeOrderId,
      status: payment_status,
      message: payment_message,
      paymentId: result._id,
    };
  } catch (error) {
    console.error("handlePaymentFailed error:", error);
    return {
      success: false,
      message: "Failed to handle payment failure",
      error: error.message,
    };
  }
};

// Handle payment dropped by user (New for Cashfree)
const handlePaymentDropped = async (paymentData) => {
  try {
    const { order_id: cashfreeOrderId, payment_status } = paymentData;

    // Use transaction for consistency
    const result = await withTransaction(async (session) => {
      const updatedPayment = await Payment.findOneAndUpdate(
        { cashfreeOrderId: cashfreeOrderId },
        {
          paymentStatus: "cancelled",
          errorDescription: "Payment cancelled by user",
        },
        { new: true, session },
      );

      if (!updatedPayment) {
        throw new Error("Payment record not found");
      }

      return updatedPayment;
    });

    return {
      success: true,
      orderId: cashfreeOrderId,
      status: payment_status,
      paymentId: result._id,
    };
  } catch (error) {
    console.error("handlePaymentDropped error:", error);
    return {
      success: false,
      message: "Failed to handle payment cancellation",
      error: error.message,
    };
  }
};

export default {
  handleCashfreeWebhook, // Migrated from handleRazorpayWebhook
};
