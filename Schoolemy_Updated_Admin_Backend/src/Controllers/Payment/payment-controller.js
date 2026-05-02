import Payment from "../../Models/Payment/Payment-Model.js";
import TutorCommissionPayout from "../../Models/Payment/TutorCommissionPayoutModel.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Get all payments with basic filters & pagination
export const getAllPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      order = "desc",
      search = "",
    } = req.query;

    const query = {};

    // Optional search filter by email, mobile, studentRegisterNumber, or username
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { email: searchRegex },
        { mobile: searchRegex },
        { studentRegisterNumber: searchRegex },
        { username: searchRegex },
        { transactionId: searchRegex },
      ];
    }

    const payments = await Payment.find(query)
      .populate(
        "userId",
        "username email studentRegisterNumber mobile gender dateofBirth fatherName bloodGroup Nationality Occupation address status role createdAt"
      )
      .populate("courseId", "courseName category")
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalCount = await Payment.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total: totalCount,
        page: Number(page),
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payments",
      error: error.message,
    });
  }
};

// Get payment history for a specific TutorCourse and include Tutor details
// Query params:
//  - tutorCourseId (required): get payments of a specific TutorCourse
export const getTutorCoursePaymentHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      order = "desc",
      tutorCourseId,
      search = "",
    } = req.query;

    if (!tutorCourseId) {
      return res.status(400).json({
        success: false,
        message: "tutorCourseId is required",
      });
    }

    const query = {
      tutorCourseId,
    };

    // Optional text search on user / payment fields
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { email: searchRegex },
        { mobile: searchRegex },
        { studentRegisterNumber: searchRegex },
        { username: searchRegex },
        { transactionId: searchRegex },
      ];
    }

    const payments = await Payment.find(query)
      .populate(
        "userId",
        "username email studentRegisterNumber mobile gender dateofBirth fatherName bloodGroup Nationality Occupation address status role createdAt"
      )
      .populate({
        path: "tutorCourseId",
        select:
          "coursename CourseMotherId category price tutor",
        populate: {
          path: "tutor",
          select: "name email mobilenumber tutorId",
        },
      })
      .sort({ [sortBy]: order === "asc" ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalCount = await Payment.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        total: totalCount,
        page: Number(page),
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tutor course payment history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve tutor course payment history",
      error: error.message,
    });
  }
};


export const calculateAdminPaymentToTutors = async (req, res) => {
  try {
    const { dateFrom, dateTo, tutorId, periodId } = req.query;

    // Build query for completed tutor course payments
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
          tutors: [],
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

    // Group payments by tutor and calculate totals
    const tutorsMap = {};
    const paymentDetails = [];

    payments.forEach((payment) => {
      if (!payment.tutorCourseId || !payment.tutorCourseId.tutor) {
        return; // Skip if no tutor course or tutor
      }

      const tutor = payment.tutorCourseId.tutor;
      const tutorIdStr = tutor._id.toString();

      // Filter by tutorId if provided
      if (tutorId && tutorIdStr !== tutorId) {
        return;
      }

      // Calculate commission (30% of payment amount)
      const commissionAmount = parseFloat(
        (payment.amount * (commissionRate / 100)).toFixed(2)
      );

      // Calculate payment period
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

      const paymentPeriod = calculatePaymentPeriod(payment.createdAt);

      // Filter by periodId if provided
      if (periodId && paymentPeriod !== periodId) {
        return;
      }

      // Initialize tutor in map if not exists
      if (!tutorsMap[tutorIdStr]) {
        tutorsMap[tutorIdStr] = {
          tutorId: tutor._id,
          tutorName: tutor.name,
          tutorEmail: tutor.email,
          tutorMobile: tutor.mobilenumber,
          tutorIdNumber: tutor.tutorId,
          payments: [],
          totalPurchaseAmount: 0,
          totalCommission: 0,
          paymentCount: 0,
        };
      }

      // Add payment details
      const paymentDetail = {
        paymentId: payment._id,
        transactionId: payment.transactionId,
        courseId: payment.tutorCourseId._id,
        courseName: payment.courseName,
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

      tutorsMap[tutorIdStr].payments.push(paymentDetail);
      tutorsMap[tutorIdStr].totalPurchaseAmount += payment.amount;
      tutorsMap[tutorIdStr].totalCommission += commissionAmount;
      tutorsMap[tutorIdStr].paymentCount += 1;

      // Add to payment details array
      paymentDetails.push({
        ...paymentDetail,
        tutorId: tutor._id,
        tutorName: tutor.name,
      });
    });

    // Convert map to array
    const tutorsData = Object.values(tutorsMap);

    // Calculate grand totals
    const totals = tutorsData.reduce(
      (acc, tutor) => {
        acc.totalPayments += tutor.paymentCount;
        acc.totalPurchaseAmount += tutor.totalPurchaseAmount;
        acc.totalCommission += tutor.totalCommission;
        return acc;
      },
      {
        totalPayments: 0,
        totalPurchaseAmount: 0,
        totalCommission: 0,
      }
    );

    // Round totals to 2 decimal places
    totals.totalPurchaseAmount = parseFloat(
      totals.totalPurchaseAmount.toFixed(2)
    );
    totals.totalCommission = parseFloat(totals.totalCommission.toFixed(2));

    // Round individual tutor totals
    tutorsData.forEach((tutor) => {
      tutor.totalPurchaseAmount = parseFloat(
        tutor.totalPurchaseAmount.toFixed(2)
      );
      tutor.totalCommission = parseFloat(tutor.totalCommission.toFixed(2));
    });

    return res.status(200).json({
      success: true,
      message: "Admin payment calculation completed",
      data: {
        tutors: tutorsData,
        paymentDetails: paymentDetails,
        totals: totals,
        commissionRate: commissionRate,
        filters: {
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          tutorId: tutorId || null,
          periodId: periodId || null,
        },
      },
    });
  } catch (error) {
    console.error("Error calculating admin payment to tutors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to calculate admin payment to tutors",
      error: error.message,
    });
  }
};


export const calculateAdminPaymentForLoggedInTutor = async (req, res) => {
  try {
    const { dateFrom, dateTo, periodId } = req.query;

    // Get tutor ID from authenticated user (set by verifyToken middleware)
    const loggedInTutorId = req.user?.id;

    if (!loggedInTutorId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Tutor ID not found in token",
      });
    }

    // Build query for completed tutor course payments
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
          tutors: [],
          paymentDetails: [],
          totals: {
            totalPayments: 0,
            totalPurchaseAmount: 0,
            totalCommission: 0,
          },
          commissionRate: 30,
          filters: {
            dateFrom: dateFrom || null,
            dateTo: dateTo || null,
            tutorId: loggedInTutorId,
            periodId: periodId || null,
          },
        },
      });
    }

    // Commission rate (match admin calculation)
    const commissionRate = 30;

    const tutorsMap = {};
    const paymentDetails = [];

    payments.forEach((payment) => {
      if (!payment.tutorCourseId || !payment.tutorCourseId.tutor) {
        return; // Skip if no tutor course or tutor
      }

      const tutor = payment.tutorCourseId.tutor;
      const tutorIdStr = tutor._id.toString();

      // Only include payments for the logged-in tutor
      if (tutorIdStr !== loggedInTutorId.toString()) {
        return;
      }

      // Calculate commission (30% of payment amount)
      const commissionAmount = parseFloat(
        (payment.amount * (commissionRate / 100)).toFixed(2)
      );

      // Calculate payment period
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

      const paymentPeriod = calculatePaymentPeriod(payment.createdAt);

      // Filter by periodId if provided
      if (periodId && paymentPeriod !== periodId) {
        return;
      }

      // Initialize tutor in map if not exists
      if (!tutorsMap[tutorIdStr]) {
        tutorsMap[tutorIdStr] = {
          tutorId: tutor._id,
          tutorName: tutor.name,
          tutorEmail: tutor.email,
          tutorMobile: tutor.mobilenumber,
          tutorIdNumber: tutor.tutorId,
          payments: [],
          totalPurchaseAmount: 0,
          totalCommission: 0,
          paymentCount: 0,
        };
      }

      // Add payment details
      const paymentDetail = {
        paymentId: payment._id,
        transactionId: payment.transactionId,
        courseId: payment.tutorCourseId._id,
        courseName: payment.courseName,
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

      tutorsMap[tutorIdStr].payments.push(paymentDetail);
      tutorsMap[tutorIdStr].totalPurchaseAmount += payment.amount;
      tutorsMap[tutorIdStr].totalCommission += commissionAmount;
      tutorsMap[tutorIdStr].paymentCount += 1;

      // Add to payment details array
      paymentDetails.push({
        ...paymentDetail,
        tutorId: tutor._id,
        tutorName: tutor.name,
      });
    });

    // Convert map to array (will be max 1 tutor for logged-in tutor)
    const tutorsData = Object.values(tutorsMap);

    // Calculate grand totals
    const totals = tutorsData.reduce(
      (acc, tutor) => {
        acc.totalPayments += tutor.paymentCount;
        acc.totalPurchaseAmount += tutor.totalPurchaseAmount;
        acc.totalCommission += tutor.totalCommission;
        return acc;
      },
      {
        totalPayments: 0,
        totalPurchaseAmount: 0,
        totalCommission: 0,
      }
    );

    // Round totals to 2 decimal places
    totals.totalPurchaseAmount = parseFloat(
      totals.totalPurchaseAmount.toFixed(2)
    );
    totals.totalCommission = parseFloat(totals.totalCommission.toFixed(2));

    // Round individual tutor totals
    tutorsData.forEach((tutor) => {
      tutor.totalPurchaseAmount = parseFloat(
        tutor.totalPurchaseAmount.toFixed(2)
      );
      tutor.totalCommission = parseFloat(tutor.totalCommission.toFixed(2));
    });

    return res.status(200).json({
      success: true,
      message: "Admin-style payment calculation for logged-in tutor completed",
      data: {
        tutors: tutorsData,
        paymentDetails: paymentDetails,
        totals: totals,
        commissionRate: commissionRate,
        filters: {
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
          tutorId: loggedInTutorId,
          periodId: periodId || null,
        },
      },
    });
  } catch (error) {
    console.error(
      "Error calculating admin payment for logged-in tutor:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to calculate admin payment for logged-in tutor",
      error: error.message,
    });
  }
};

// Helper: Calculate 15-day period from date
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
  const formatDate = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  return `${formatDate(periodStart)}_to_${formatDate(periodEnd)}`;
};


export const getTutorCommissionDue = async (req, res) => {
  try {
    const { periodId, status: statusFilter } = req.query;
    const commissionRate = 30;

    const payments = await Payment.find({
      paymentStatus: "completed",
      tutorCourseId: { $ne: null },
    })
      .populate({
        path: "tutorCourseId",
        select: "coursename CourseMotherId tutor",
        populate: {
          path: "tutor",
          select: "name email mobilenumber tutorId",
        },
      })
      .sort({ createdAt: -1 });

    const tutorsMap = {};
    const periodsSet = new Set();

    for (const payment of payments) {
      if (!payment.tutorCourseId?.tutor) continue;
      const tutor = payment.tutorCourseId.tutor;
      const tutorIdStr = tutor._id.toString();
      const period = calculatePaymentPeriod(payment.createdAt);
      periodsSet.add(period);

      if (periodId && period !== periodId) continue;

      const commissionAmount = parseFloat(
        (payment.amount * (commissionRate / 100)).toFixed(2)
      );

      if (!tutorsMap[tutorIdStr]) {
        tutorsMap[tutorIdStr] = {
          tutorId: tutor._id,
          tutorName: tutor.name,
          tutorEmail: tutor.email,
          tutorMobile: tutor.mobilenumber,
          tutorIdNumber: tutor.tutorId,
          periods: {},
          totalCommission: 0,
          totalPayments: 0,
        };
      }

      const t = tutorsMap[tutorIdStr];
      if (!t.periods[period]) {
        t.periods[period] = {
          periodId: period,
          commissionAmount: 0,
          paymentCount: 0,
          status: "pending",
          paidAt: null,
        };
      }
      t.periods[period].commissionAmount += commissionAmount;
      t.periods[period].commissionAmount = parseFloat(
        t.periods[period].commissionAmount.toFixed(2)
      );
      t.periods[period].paymentCount += 1;
      t.totalCommission += commissionAmount;
      t.totalPayments += 1;
    }

    const payouts = await TutorCommissionPayout.find({
      status: "paid",
    }).lean();

    for (const po of payouts) {
      const tid = po.tutorId?.toString?.() || po.tutorId;
      if (tutorsMap[tid]?.periods?.[po.periodId]) {
        tutorsMap[tid].periods[po.periodId].status = "paid";
        tutorsMap[tid].periods[po.periodId].paidAt = po.paidAt;
      }
    }

    const periodsArr = Array.from(periodsSet).sort().reverse();
    const tutorsData = Object.values(tutorsMap).map((t) => ({
      ...t,
      totalCommission: parseFloat(t.totalCommission.toFixed(2)),
      periods: Object.values(t.periods),
    }));

    const byPeriod = {};
    for (const p of periodsArr) {
      byPeriod[p] = tutorsData
        .filter((t) => t.periods.some((pr) => pr.periodId === p))
        .map((t) => ({
          ...t,
          periodData: t.periods.find((pr) => pr.periodId === p),
        }))
        .filter((t) => {
          if (!statusFilter) return true;
          return t.periodData?.status === statusFilter;
        })
        .sort((a, b) => (b.periodData?.commissionAmount || 0) - (a.periodData?.commissionAmount || 0));
    }

    const flatList = tutorsData.flatMap((t) =>
      t.periods.map((pr) => ({
        tutorId: t.tutorId,
        tutorName: t.tutorName,
        tutorEmail: t.tutorEmail,
        tutorMobile: t.tutorMobile,
        tutorIdNumber: t.tutorIdNumber,
        periodId: pr.periodId,
        commissionAmount: pr.commissionAmount,
        paymentCount: pr.paymentCount,
        status: pr.status,
        paidAt: pr.paidAt,
      }))
    );

    let filteredFlat = flatList;
    if (periodId) filteredFlat = flatList.filter((r) => r.periodId === periodId);
    if (statusFilter) filteredFlat = filteredFlat.filter((r) => r.status === statusFilter);

    return res.status(200).json({
      success: true,
      message: "Tutor commission due list retrieved",
      data: {
        tutors: filteredFlat,
        byPeriod,
        periods: periodsArr,
        commissionRate,
      },
    });
  } catch (error) {
    console.error("Error getting tutor commission due:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get tutor commission due",
      error: error.message,
    });
  }
};


export const getTutorCommissionPaymentDetails = async (req, res) => {
  try {
    const { tutorId, periodId } = req.query;
    if (!tutorId || !periodId) {
      return res.status(400).json({
        success: false,
        message: "tutorId and periodId are required",
      });
    }

    const commissionRate = 30;
    const [periodFrom, periodTo] = periodId.split("_to_");
    if (!periodFrom || !periodTo) {
      return res.status(400).json({
        success: false,
        message: "Invalid periodId format. Use: YYYY-MM-DD_to_YYYY-MM-DD",
      });
    }

    const payments = await Payment.find({
      paymentStatus: "completed",
      tutorCourseId: { $ne: null },
      createdAt: {
        $gte: new Date(periodFrom),
        $lte: new Date(periodTo + "T23:59:59.999Z"),
      },
    })
      .populate({
        path: "tutorCourseId",
        select: "coursename tutor",
        populate: {
          path: "tutor",
          select: "name email mobilenumber tutorId",
        },
      })
      .populate("userId", "username email studentRegisterNumber mobile")
      .sort({ createdAt: -1 });

    const details = [];
    let totalPurchase = 0;
    let totalCommission = 0;

    for (const payment of payments) {
      if (!payment.tutorCourseId?.tutor) continue;
      const tutor = payment.tutorCourseId.tutor;
      if (tutor._id.toString() !== tutorId.toString()) continue;

      const period = calculatePaymentPeriod(payment.createdAt);
      if (period !== periodId) continue;

      const commissionAmount = parseFloat(
        (payment.amount * (commissionRate / 100)).toFixed(2)
      );
      totalPurchase += payment.amount;
      totalCommission += commissionAmount;

      details.push({
        paymentId: payment._id,
        transactionId: payment.transactionId,
        username: payment.username,
        studentRegisterNumber: payment.studentRegisterNumber,
        email: payment.email,
        mobile: payment.mobile,
        courseName: payment.courseName,
        purchaseAmount: payment.amount,
        commissionAmount,
        commissionRate,
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.createdAt,
      });
    }

    const tutorInfo = details.length > 0 && payments[0]?.tutorCourseId?.tutor
      ? {
          tutorId: payments[0].tutorCourseId.tutor._id,
          tutorName: payments[0].tutorCourseId.tutor.name,
          tutorEmail: payments[0].tutorCourseId.tutor.email,
          tutorIdNumber: payments[0].tutorCourseId.tutor.tutorId,
        }
      : null;

    return res.status(200).json({
      success: true,
      message: "Tutor commission payment details retrieved",
      data: {
        tutor: tutorInfo,
        periodId,
        details,
        totals: {
          totalPurchaseAmount: parseFloat(totalPurchase.toFixed(2)),
          totalCommission: parseFloat(totalCommission.toFixed(2)),
          paymentCount: details.length,
        },
      },
    });
  } catch (error) {
    console.error("Error getting tutor commission payment details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get payment details",
      error: error.message,
    });
  }
};


export const markTutorCommissionPaid = async (req, res) => {
  try {
    const { tutorId, periodId, commissionAmount } = req.body;
    const adminId = req.user?.id;

    if (!tutorId || !periodId) {
      return res.status(400).json({
        success: false,
        message: "tutorId and periodId are required",
      });
    }

    const payout = await TutorCommissionPayout.findOneAndUpdate(
      { tutorId, periodId },
      {
        status: "paid",
        paidAt: new Date(),
        paidBy: adminId,
        commissionAmount: commissionAmount ?? 0,
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Commission marked as paid",
      data: payout,
    });
  } catch (error) {
    console.error("Error marking commission paid:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark commission as paid",
      error: error.message,
    });
  }
};


export const markTutorCommissionPending = async (req, res) => {
  try {
    const { tutorId, periodId } = req.body;

    if (!tutorId || !periodId) {
      return res.status(400).json({
        success: false,
        message: "tutorId and periodId are required",
      });
    }

    await TutorCommissionPayout.findOneAndUpdate(
      { tutorId, periodId },
      { status: "pending", paidAt: null, paidBy: null },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Commission marked as pending",
    });
  } catch (error) {
    console.error("Error marking commission pending:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark commission as pending",
      error: error.message,
    });
  }
};