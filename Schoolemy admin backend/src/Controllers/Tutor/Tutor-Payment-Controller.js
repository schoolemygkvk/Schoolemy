import Payment from "../../Models/Payment/Payment-Model.js";
import TutorCourse from "../../Models/Tutor/Tutor-CourseModel.js";
import Tutor from "../../Models/Tutor/TutorModel.js";

/**
 * Get tutor's own payment calculations based on completed tutor course payments
 * Query params: dateFrom, dateTo, periodId (optional)
 * Returns: Payment details with commission calculations for logged-in tutor
 * Note: Tutor ID is automatically taken from the JWT token (req.user.id)
 */
export const getTutorPaymentCalculations = async (req, res) => {
  try {
    const { dateFrom, dateTo, periodId } = req.query;

    // Get tutor ID from authenticated user (set by verifyToken middleware)
    const tutorId = req.user?.id;

    if (!tutorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Tutor ID not found in token",
      });
    }

    // Verify tutor exists
    const tutor = await Tutor.findById(tutorId).select(
      "name email mobilenumber tutorId"
    );

    if (!tutor) {
      return res.status(404).json({
        success: false,
        message: "Tutor not found",
      });
    }

    // Build query for completed tutor course payments for this tutor
    const query = {
      paymentStatus: "completed",
      tutorCourseId: { $ne: null }, // Only tutor courses
    };

    // Add date filters
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo);
      }
    }

    // Get all completed payments for tutor courses
    const payments = await Payment.find(query)
      .populate({
        path: "tutorCourseId",
        select: "coursename CourseMotherId tutor",
        populate: {
          path: "tutor",
          select: "name email mobilenumber tutorId",
        },
      })
      .populate("userId", "username email studentRegisterNumber mobile")
      .sort({ createdAt: -1 });

    if (payments.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No completed tutor course payments found",
        data: {
          tutor: {
            tutorId: tutor._id,
            tutorName: tutor.name,
            tutorEmail: tutor.email,
            tutorMobile: tutor.mobilenumber,
            tutorIdNumber: tutor.tutorId,
          },
          payments: [],
          totals: {
            totalPayments: 0,
            totalPurchaseAmount: 0,
            totalCommission: 0,
          },
        },
      });
    }

    // Calculate commission rate (30%)
    const commissionRate = 30;

    // Filter payments for this tutor and calculate totals
    const paymentDetails = [];
    let totalPurchaseAmount = 0;
    let totalCommission = 0;
    let paymentCount = 0;

    // Calculate payment period helper function
    const calculatePaymentPeriod = (date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const day = d.getDate();

      let periodStart, periodEnd;

      if (day <= 15) {
        periodStart = new Date(year, month, 1);
        periodEnd = new Date(year, month, 15);
      } else {
        periodStart = new Date(year, month, 16);
        periodEnd = new Date(year, month + 1, 0);
      }

      const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const d = String(date.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      };

      return `${formatDate(periodStart)}_to_${formatDate(periodEnd)}`;
    };

    payments.forEach((payment) => {
      if (!payment.tutorCourseId || !payment.tutorCourseId.tutor) {
        return; // Skip if no tutor course or tutor
      }

      const paymentTutor = payment.tutorCourseId.tutor;
      const paymentTutorIdStr = paymentTutor._id.toString();

      // Only process payments for the logged-in tutor
      if (paymentTutorIdStr !== tutorId.toString()) {
        return;
      }

      // Calculate commission (30% of payment amount)
      const commissionAmount = parseFloat(
        (payment.amount * (commissionRate / 100)).toFixed(2)
      );

      const paymentPeriod = calculatePaymentPeriod(payment.createdAt);

      // Filter by periodId if provided
      if (periodId && paymentPeriod !== periodId) {
        return;
      }

      // Add payment details
      const paymentDetail = {
        paymentId: payment._id,
        transactionId: payment.transactionId,
        courseId: payment.tutorCourseId._id,
        courseName: payment.courseName,
        CourseMotherId: payment.tutorCourseId.CourseMotherId,
        userId: payment.userId._id,
        username: payment.username,
        studentRegisterNumber: payment.studentRegisterNumber,
        email: payment.email,
        mobile: payment.mobile,
        purchaseAmount: payment.amount,
        commissionRate: commissionRate,
        commissionAmount: commissionAmount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.createdAt,
        paymentPeriod: paymentPeriod,
      };

      paymentDetails.push(paymentDetail);
      totalPurchaseAmount += payment.amount;
      totalCommission += commissionAmount;
      paymentCount += 1;
    });

    // Round totals to 2 decimal places
    totalPurchaseAmount = parseFloat(totalPurchaseAmount.toFixed(2));
    totalCommission = parseFloat(totalCommission.toFixed(2));

    return res.status(200).json({
      success: true,
      message: "Tutor payment calculation completed",
      data: {
        tutor: {
          tutorId: tutor._id,
          tutorName: tutor.name,
          tutorEmail: tutor.email,
          tutorMobile: tutor.mobilenumber,
          tutorIdNumber: tutor.tutorId,
        },
        payments: paymentDetails,
        totals: {
          totalPayments: paymentCount,
          totalPurchaseAmount: totalPurchaseAmount,
          totalCommission: totalCommission,
        },
        commissionRate: commissionRate,
        filters: {
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          periodId: periodId || null,
        },
      },
    });
  } catch (error) {
    console.error("Error calculating tutor payment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate tutor payment",
      error: error.message,
    });
  }
};
