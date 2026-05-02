import User from "../Models/User-Model/User-Model.js";
import Payment from "../Models/Payment-Model/Payment-Model.js";
import { calculateEmiStatus } from "../Services/EMI-Utils.js";
import mongoose from "mongoose";

export const checkCourseAccessMiddleware = async (req, res, next) => {
  const userId = req.userId;
  const courseId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid course ID format",
    });
  }

  // Anonymous users: public course metadata only; controllers use req.courseAccess
  if (!userId) {
    req.courseAccess = {
      hasAccess: false,
      reason: "payment_required",
      accessType: "limited",
      paymentType: "none",
    };
    return next();
  }

  try {
    // Full payment check
    const fullPayment = await Payment.findOne({
      userId,
      courseId,
      paymentStatus: "completed",
      paymentType: { $ne: "emi" },
    });

    if (fullPayment) {
      req.courseAccess = {
        hasAccess: true,
        reason: "full_payment",
        accessType: "full",
        paymentType: "full",
        paymentDetails: {
          amount: fullPayment.amount,
          paymentDate: fullPayment.createdAt,
          transactionId: fullPayment.transactionId,
        },
      };
      return next(); //  Grant access
    }

    // EMI access check - CRITICAL: Enforce EMI lock server-side
    const user = await User.findOne(
      {
        _id: userId,
        "enrolledCourses.course": courseId,
      },
      { "enrolledCourses.$": 1 },
    ).populate("enrolledCourses.emiPlan");

    if (user && user.enrolledCourses[0]) {
      const enrolledCourse = user.enrolledCourses[0];

      // CRITICAL: Check if course is marked as locked
      if (enrolledCourse.accessStatus === "locked") {
        req.courseAccess = {
          hasAccess: false,
          reason: "emi_locked",
          accessType: "locked",
          paymentType: "emi",
          message: "Course access locked due to overdue EMI payments. Please clear pending payments to restore access.",
        };
        return next();
      }

      // Check EMI plan if it exists
      if (enrolledCourse.emiPlan) {
        const emiPlan = enrolledCourse.emiPlan;
        const emiStatus = calculateEmiStatus(emiPlan);

        // Server-side validation: Deny access if EMI is overdue or payment required
        if (!emiStatus.hasAccessToContent) {
          // Fail-closed: Block access if payment is not current
          req.courseAccess = {
            hasAccess: false,
            reason: emiStatus.hasOverduePayments ? "emi_overdue" : "emi_locked",
            accessType: "locked",
            paymentType: "emi",
            overdueCount: emiStatus.overdueCount,
            totalOverdue: emiStatus.totalOverdue,
            nextDueAmount: emiStatus.nextDueAmount,
            nextDueDate: emiStatus.nextDueDate,
            nextPaymentDue: emiStatus.nextPaymentDue,
            emiStatus: emiStatus,
            emiPlan: emiPlan,
          };
          return next();
        }

        // EMI is current - grant access
        if (emiStatus.hasAccessToContent) {
          req.courseAccess = {
            hasAccess: true,
            reason: "emi_active",
            accessType: "full",
            paymentType: "emi",
            emiStatus: emiStatus,
            emiPlan: emiPlan,
            nextPaymentDue: emiStatus.nextPaymentDue,
          };
          return next();
        }
      }
    }

    // Set access info for the controller to handle
    req.courseAccess = {
      hasAccess: false,
      reason: "payment_required",
      accessType: "limited",
      paymentType: "none",
    };
    return next(); // Let controller handle the response
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export const checkPaymentStatus = async (userId, courseId) => {
  const { access } = await checkCourseAccessMiddleware(userId, courseId);
  return access;
};
