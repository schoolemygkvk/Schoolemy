import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
import Payment from "../../Models/Payment-Model/Payment-Model.js";
import DirectMeetFees from "../../Models/Data-Maintenance/DirectMeetFees.js";
import CourseMeet from "../../Models/DirectMeet/CourseMeetModel.js";
import MeetParticipant from "../../Models/DirectMeet/MeetParticipantModel.js";
import User from "../../Models/User-Model/User-Model.js";
import { createInvoice } from "../../Services/Invoice-Service.js";

dotenv.config();

// Cashfree API Configuration
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
  "x-api-version": "2023-08-01",
  "Content-Type": "application/json",
});

/**
 * Create Cashfree order for meet payment
 */
export const createMeetPaymentOrder = async (req, res) => {
  try {
    const { meet_id, user_id, customer_details } = req.body;

    console.log("📝 Creating meet payment order:", {
      meet_id,
      user_id,
      customer_details,
    });
    console.log("📋 Request body:", req.body);

    // Validate inputs
    if (!meet_id || !user_id) {
      console.log("❌ Validation failed: Missing meet_id or user_id");
      return res.status(400).json({
        success: false,
        message: "meet_id and user_id are required",
        received: { meet_id, user_id },
      });
    }

    console.log("🔍 Fetching meet:", meet_id);

    // Fetch meet details
    const meet = await CourseMeet.findById(meet_id).populate("course_id");
    if (!meet) {
      console.log("❌ Meet not found:", meet_id);
      return res.status(404).json({
        success: false,
        message: "Meet not found",
        meet_id,
      });
    }

    console.log("✅ Meet found:", {
      id: meet._id,
      title: meet.title,
      price: meet.price,
      is_paid_meet: meet.is_paid_meet,
    });

    // Check if meet is paid
    if (!meet.is_paid_meet || meet.price <= 0) {
      console.log("❌ Meet is not a paid meet or price is 0");
      return res.status(400).json({
        success: false,
        message: "This meet does not require payment",
        meet_details: {
          is_paid_meet: meet.is_paid_meet,
          price: meet.price,
        },
      });
    }

    console.log("🔍 Fetching user:", user_id);

    // Check if user exists
    // Use same field names as main payment flow (username, email, mobile)
    const user = await User.findById(user_id).select(
      "username email mobile studentRegisterNumber",
    );
    if (!user) {
      console.log("❌ User not found:", user_id);
      return res.status(404).json({
        success: false,
        message: "User not found",
        user_id,
      });
    }

    console.log("✅ User found:", {
      id: user._id,
      username: user.username,
      email: user.email,
      mobile: user.mobile,
    });

    // Check if already paid
    const participant = await MeetParticipant.findOne({ meet_id, user_id });
    if (participant && participant.payment_status === "completed") {
      console.log("❌ Payment already completed");
      return res.status(400).json({
        success: false,
        message: "Payment already completed for this meet",
      });
    }

    // Check Cashfree configuration
    if (!CASHFREE_APP_ID || !CASHFREE_SECRET_KEY) {
      console.error("❌ Cashfree credentials not configured");
      return res.status(500).json({
        success: false,
        message: "Payment gateway not configured. Please contact support.",
      });
    }

    // Generate unique order ID
    const orderId = `MEET_${Date.now()}_${user_id.toString().slice(-6)}`;

    console.log("💰 Creating Cashfree order:", orderId);

    // Calculate GST + transaction fee on meet price
    const baseAmount = Math.round(meet.price); // Treat meet.price as base (before GST/fees)
    const cgst = Math.round(baseAmount * 0.09);
    const sgst = Math.round(baseAmount * 0.09);
    const gstTotal = cgst + sgst;
    // Transaction fee (2%) on (base + GST), same rule as courses
    const transactionFee = Math.round((baseAmount + gstTotal) * 0.02);
    const finalAmount = baseAmount + gstTotal + transactionFee;

    // Prepare Cashfree order data
    const orderData = {
      order_id: orderId,
      order_amount: finalAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: user_id.toString(),
        customer_name:
          customer_details?.customer_name ||
          user.username ||
          "Guest",
        customer_email:
          customer_details?.customer_email ||
          user.email ||
          `user${user_id}@schoolemy.com`,
        customer_phone:
          customer_details?.customer_phone ||
          user.mobile?.toString() ||
          "9999999999",
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL || "https://schoolemy.com"}/user/meets/${meet_id}/payment-callback?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL || "https://2sxaoo5hlk.execute-api.ap-south-1.amazonaws.com/dev"}/api/meet-payment/webhook/cashfree`,
        payment_methods: "cc,dc,nb,upi,app,paylater",
      },
      order_note: `Payment for meet: ${meet.title}`,
    };

    console.log("🔐 Creating Cashfree order:", orderId);

    // Create order in Cashfree
    const cashfreeResponse = await axios.post(
      `${CASHFREE_BASE_URL}/pg/orders`,
      orderData,
      { headers: getCashfreeHeaders() },
    );

    const { payment_session_id, order_status } = cashfreeResponse.data;

    console.log("✅ Cashfree order created:", orderId, order_status);

    // Create payment record in database
    const payment = new Payment({
      userId: user_id,
      courseId: meet.course_id._id,
      username: user.username || "Guest",
      email: user.email || `user${user_id}@schoolemy.com`,
      mobile: user.mobile || "9999999999",
      CourseMotherId: meet.course_id._id.toString(),
      courseName: meet.course_name || "Direct Meet",
      paymentType: "one-time",
      amount: finalAmount,
      currency: "INR",
      paymentStatus: "pending",
      transactionId: orderId,
      paymentMethod: "UPI", // Default, will be updated after actual payment
      paymentGateway: "cashfree",
      cashfreeOrderId: orderId,
      cashfreePaymentSessionId: payment_session_id,
      paymentFor: "meet",
      metadata: {
        meet_id: meet._id.toString(),
        meet_title: meet.title,
        meet_date: meet.scheduled_date,
        breakdown: {
          courseValue: baseAmount,
          cgst,
          sgst,
          gstTotal,
          transactionFee,
        },
      },
    });

    await payment.save();

    console.log("💾 Payment record created:", payment._id);

    // Update participant with pending payment
      if (participant) {
      // Fix invalid payment_status values from old records
      if (participant.payment_status === "not_required") {
        console.log(
          "🔧 Fixing invalid payment_status 'not_required' in existing participant",
        );
        participant.payment_status = "completed";
      }

      participant.payment_status = "pending";
      participant.payment_amount = finalAmount;
      participant.payment_id = payment._id;
      await participant.save();
      console.log("✅ Updated existing participant");
    } else {
      // Create new participant with pending payment
      const newParticipant = new MeetParticipant({
        meet_id: meet._id,
        user_id: user_id,
        course_id: meet.course_id._id,
        assigned_by: user_id, // Self-assigned through payment
        is_payment_required: true,
        payment_status: "pending",
        payment_amount: finalAmount,
        payment_id: payment._id,
        attendance_status: "not_joined",
      });
      await newParticipant.save();
      console.log("✅ Created new participant");
    }

    res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      order: {
        order_id: orderId,
        payment_session_id: payment_session_id,
        amount: finalAmount,
        currency: "INR",
        cashfree_env: process.env.CASHFREE_ENV || "sandbox",
      },
      payment_id: payment._id,
    });
  } catch (error) {
    console.error("❌ Error creating meet payment order:", error);

    if (error.response) {
      console.error("Cashfree API Error:", error.response.data);
      return res.status(error.response.status).json({
        success: false,
        message: "Payment gateway error",
        error: error.response.data.message || error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating payment order",
      error: error.message,
    });
  }
};

/**
 * Verify meet payment after completion
 */
export const verifyMeetPayment = async (req, res) => {
  try {
    const { order_id } = req.body;

    console.log("🔍 Verifying meet payment:", order_id);

    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "order_id is required",
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ cashfreeOrderId: order_id });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Verify order status with Cashfree
    const cashfreeResponse = await axios.get(
      `${CASHFREE_BASE_URL}/pg/orders/${order_id}`,
      { headers: getCashfreeHeaders() },
    );

    const orderData = cashfreeResponse.data;
    console.log("📊 Cashfree order status:", orderData.order_status);

    if (orderData.order_status === "PAID") {
      // Update payment record
      payment.paymentStatus = "completed";
      payment.cashfreePaymentId = orderData.cf_order_id;
      payment.paidAt = new Date();
      await payment.save();

      // Get meet_id with multiple fallback options
      let meet_id = payment.metadata?.meet_id;

      console.log(
        "🔍 Full payment metadata:",
        JSON.stringify(payment.metadata),
      );
      console.log("🔍 Extracted meet_id:", meet_id);
      console.log("🔍 Payment userId:", payment.userId);
      console.log("🔍 Payment ID:", payment._id);

      // If meet_id is not in metadata, try to find it from participant
      if (!meet_id) {
        console.log(
          "⚠️ meet_id not found in metadata, searching participant by payment_id",
        );
        const participantByPayment = await MeetParticipant.findOne({
          payment_id: payment._id,
        });
        if (participantByPayment) {
          meet_id = participantByPayment.meet_id.toString();
          console.log("✅ Found meet_id from participant:", meet_id);
        }
      }

      if (meet_id) {
        // First, fix any invalid payment_status values
        await MeetParticipant.updateOne(
          {
            meet_id: meet_id,
            user_id: payment.userId,
            payment_status: "not_required",
          },
          {
            $set: { payment_status: "completed" },
          },
        );

        // Update participant using direct update query to ensure it works
        const updateResult = await MeetParticipant.updateOne(
          {
            meet_id: meet_id,
            user_id: payment.userId,
          },
          {
            $set: {
              payment_status: "completed",
              payment_date: new Date(),
              payment_id: payment._id,
            },
          },
        );

        console.log("📊 Update result:", updateResult);
        console.log("✅ Matched:", updateResult.matchedCount);
        console.log("✅ Modified:", updateResult.modifiedCount);

        // Verify the update
        const participant = await MeetParticipant.findOne({
          meet_id: meet_id,
          user_id: payment.userId,
        });

        if (participant) {
          console.log("✅ Participant found after update");
          console.log("✅ Payment status:", participant.payment_status);

          console.log("✅ Payment status:", participant.payment_status);

          // Create DirectMeetFees record
          const meet = await CourseMeet.findById(meet_id);
          const user = await User.findById(payment.userId).select(
            "username mobile",
          );

          const feeRecord = new DirectMeetFees({
            studentID: payment.userId,
            name: user?.username || "Unknown",
            gender: "Other",
            amount: payment.amount,
            paymentType: "Online",
            course: meet?.course_name || "Unknown",
            meet_id: meet_id,
            meet_title: meet?.title || "Unknown",
            payment_status: "completed",
          });

          await feeRecord.save();
          console.log("✅ DirectMeetFees record created");

          // Generate Invoice for Meet Payment
          try {
            console.log(
              "📄 Starting meet invoice generation for payment:",
              payment._id,
            );
            console.log("📄 Meet details:", {
              meet_id,
              meetTitle: meet?.title,
            });

            // Compute GST breakdown from paid amount.
            // Formula: final = base + 18% GST + 2% of (base + GST) ≈ base * 1.2036
            const baseValue =
              Math.round((payment.amount / 1.2036) * 100) / 100;
            const cgst = Math.round(baseValue * 0.09 * 100) / 100;
            const sgst = Math.round(baseValue * 0.09 * 100) / 100;
            const gstTotal = Math.round((cgst + sgst) * 100) / 100;
            const transactionFee =
              Math.round((baseValue + gstTotal) * 0.02 * 100) / 100;

            const invoiceData = {
              invoiceType: "meet",
              userId: payment.userId,
              username: user?.username || "Unknown",
              email: payment.email,
              mobile: user?.mobile || payment.mobile,
              paymentId: payment._id,
              transactionId: payment.transactionId,
              meetId: meet_id,
              courseId: meet?.course_id,
              itemDescription: `Meet Payment - ${meet?.title || "Direct Meet"}`,
              courseName: meet?.course_name || meet?.title || "Direct Meet",
              CourseMotherId: meet?.course_id?.toString(),
              amount: payment.amount,
              currency: payment.currency,
              taxAmount: gstTotal,
              taxPercentage: 18, // GST percentage
              breakdown: {
                courseValue: baseValue,
                cgst,
                sgst,
                gstTotal,
                transactionFee,
              },
              paymentType: payment.paymentType,
              paymentMethod: payment.paymentMethod,
              paymentGateway: payment.paymentGateway,
              paymentDate: payment.paidAt || new Date(),
              metadata: {
                meet_id: meet_id,
                meet_title: meet?.title,
                meet_date: meet?.scheduled_date,
              },
            };

            console.log("📄 Calling createInvoice for meet payment");
            const invoice = await createInvoice(invoiceData);
            console.log(
              `✅ Meet Invoice generated successfully: ${invoice.invoiceNumber}`,
            );
            console.log(`✅ Invoice ID: ${invoice._id}`);

            // Store invoice reference in payment metadata
            payment.metadata = {
              ...payment.metadata,
              invoiceNumber: invoice.invoiceNumber,
              invoiceId: invoice._id.toString(),
            };
            await payment.save();
            console.log("✅ Invoice reference stored in payment metadata");
          } catch (invoiceError) {
            console.error("❌ ========================================");
            console.error("❌ MEET INVOICE GENERATION FAILED");
            console.error("❌ ========================================");
            console.error("❌ Error name:", invoiceError.name);
            console.error("❌ Error message:", invoiceError.message);
            console.error("❌ Error stack:", invoiceError.stack);

            if (invoiceError.errors) {
              console.error("❌ Validation errors:");
              Object.keys(invoiceError.errors).forEach((key) => {
                console.error(
                  `❌   - ${key}: ${invoiceError.errors[key].message}`,
                );
              });
            }

            console.error("❌ Payment will proceed without invoice");
            console.error("❌ ========================================");
            // Don't fail the payment if invoice generation fails
          }
        } else {
          console.error(
            "❌ Participant not found after update for meet_id:",
            meet_id,
            "user_id:",
            payment.userId,
          );
          // Try to create participant if payment was successful but participant doesn't exist
          const meet = await CourseMeet.findById(meet_id);
          if (meet) {
            const newParticipant = new MeetParticipant({
              meet_id: meet_id,
              user_id: payment.userId,
              course_id: meet.course_id,
              assigned_by: payment.userId,
              is_payment_required: true,
              payment_status: "completed",
              payment_amount: payment.amount,
              payment_id: payment._id,
              payment_date: new Date(),
              attendance_status: "not_joined",
            });
            await newParticipant.save();
            console.log("✅ Created new participant after payment completion");
          }
        }
      } else {
        console.error("❌ meet_id not found in payment metadata");
        console.error("❌ Cannot update participant without meet_id");
        console.error("❌ Payment details:", {
          paymentId: payment._id,
          userId: payment.userId,
          amount: payment.amount,
          metadata: payment.metadata,
        });
      }

      return res.json({
        success: true,
        message: "Payment verified successfully",
        payment_status: "completed",
        payment: {
          id: payment._id,
          amount: payment.amount,
          status: payment.paymentStatus,
          paidAt: payment.paidAt,
        },
      });
    } else if (orderData.order_status === "ACTIVE") {
      return res.json({
        success: false,
        message: "Payment is still pending",
        payment_status: "pending",
      });
    } else {
      // Payment failed
      payment.paymentStatus = "failed";
      await payment.save();

      return res.json({
        success: false,
        message: "Payment failed or cancelled",
        payment_status: "failed",
      });
    }
  } catch (error) {
    console.error("❌ Error verifying meet payment:", error);

    if (error.response) {
      console.error("Cashfree API Error:", error.response.data);
    }

    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
  }
};

/**
 * Handle Cashfree webhook for meet payments
 */
export const handleMeetPaymentWebhook = async (req, res) => {
  try {
    console.log("🔔 Meet payment webhook received");

    const webhookData = req.body;
    const { order_id, order_status } = webhookData.data || webhookData;

    console.log("📦 Webhook data:", { order_id, order_status });

    if (!order_id) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid webhook data" });
    }

    // Find payment record
    const payment = await Payment.findOne({ cashfreeOrderId: order_id });
    if (!payment) {
      console.log("⚠️ Payment not found for order:", order_id);
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    if (order_status === "PAID") {
      console.log("✅ Payment successful via webhook");

      payment.paymentStatus = "completed";
      payment.paidAt = new Date();
      await payment.save();

      // Get meet_id with fallback
      let meet_id = payment.metadata?.meet_id;

      console.log("🔔 Webhook: meet_id from metadata:", meet_id);

      if (!meet_id) {
        const participantByPayment = await MeetParticipant.findOne({
          payment_id: payment._id,
        });
        if (participantByPayment) {
          meet_id = participantByPayment.meet_id.toString();
          console.log("✅ Webhook: Found meet_id from participant:", meet_id);
        }
      }

      if (meet_id) {
        // First, fix any invalid payment_status values
        await MeetParticipant.updateOne(
          {
            meet_id: meet_id,
            user_id: payment.userId,
            payment_status: "not_required",
          },
          {
            $set: { payment_status: "completed" },
          },
        );

        const updateResult = await MeetParticipant.updateOne(
          {
            meet_id: meet_id,
            user_id: payment.userId,
          },
          {
            $set: {
              payment_status: "completed",
              payment_date: new Date(),
              payment_id: payment._id,
            },
          },
        );

        console.log("🔔 Webhook: Update result:", updateResult);

        if (updateResult.matchedCount > 0) {
          // Create fee record
          const meet = await CourseMeet.findById(meet_id);
          const user = await User.findById(payment.userId).select("username");

          const feeRecord = new DirectMeetFees({
            studentID: payment.userId,
            name: user?.username || "Unknown",
            gender: "Other",
            amount: payment.amount,
            paymentType: "Online",
            course: meet?.course_name || "Unknown",
            meet_id: meet_id,
            meet_title: meet?.title || "Unknown",
            payment_status: "completed",
          });

          await feeRecord.save();
          console.log("✅ Webhook: DirectMeetFees record created");
        } else {
          console.error("❌ Webhook: No participant matched for update");
        }
      } else {
        console.error("❌ Webhook: Could not find meet_id");
      }
    } else if (order_status === "FAILED" || order_status === "CANCELLED") {
      payment.paymentStatus = "failed";
      await payment.save();
    }

    res.json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    res
      .status(500)
      .json({ success: false, message: "Webhook processing failed" });
  }
};

/**
 * Get payment status for a meet
 */
export const getMeetPaymentStatus = async (req, res) => {
  try {
    const { meet_id, user_id } = req.params;

    const participant = await MeetParticipant.findOne({
      meet_id,
      user_id,
    }).populate("payment_id");

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "Participant not found",
      });
    }

    res.json({
      success: true,
      payment_required: participant.is_payment_required,
      payment_status: participant.payment_status,
      payment_amount: participant.payment_amount,
      payment_date: participant.payment_date,
      payment_details: participant.payment_id,
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching payment status",
      error: error.message,
    });
  }
};

export default {
  createMeetPaymentOrder,
  verifyMeetPayment,
  handleMeetPaymentWebhook,
  getMeetPaymentStatus,
};
