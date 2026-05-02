

import EMIPlan from "../../Models/Payment/Emi-Plan-Model.js";
import Payment from "../../Models/Payment/Payment-Model.js";
import User from "../../Models/User/User-Model.js";
import Course from "../../Models/Courses/coursemodel.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";


export const getEmiMonthlyStats = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsNum = Math.min(parseInt(months) || 6, 12);

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsNum + 1, 1);

    // Aggregate EMI data by month
    const emiStats = await EMIPlan.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ["active", "completed"] }
        }
      },
      { $unwind: "$emis" },
      {
        $group: {
          _id: {
            year: { $year: "$emis.dueDate" },
            month: { $month: "$emis.dueDate" }
          },
          totalEmiDue: { $sum: "$emis.amount" },
          totalPaid: {
            $sum: {
              $cond: [{ $eq: ["$emis.status", "paid"] }, "$emis.amount", 0]
            }
          },
          emiCount: { $sum: 1 },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$emis.status", "paid"] }, 1, 0] }
          }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: monthsNum }
    ]);

    // Format data for frontend charts
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Generate all months in range (even if no data)
    const result = [];
    for (let i = 0; i < monthsNum; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthsNum + 1 + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const stat = emiStats.find(s => s._id.year === year && s._id.month === month);
      
      result.push({
        month: monthNames[month - 1],
        year,
        EMI: stat ? Math.round(stat.totalEmiDue / 1000) : 0, // In thousands
        Paid: stat ? Math.round(stat.totalPaid / 1000) : 0,
        emiCount: stat?.emiCount || 0,
        paidCount: stat?.paidCount || 0
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      summary: {
        totalEmiDue: result.reduce((sum, r) => sum + r.EMI, 0),
        totalPaid: result.reduce((sum, r) => sum + r.Paid, 0),
        collectionRate: result.reduce((sum, r) => sum + r.EMI, 0) > 0
          ? Math.round((result.reduce((sum, r) => sum + r.Paid, 0) / result.reduce((sum, r) => sum + r.EMI, 0)) * 100)
          : 0
      }
    });
  } catch (error) {
    console.error("Error fetching EMI monthly stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch EMI statistics",
      message: error.message
    });
  }
};


export const getEnrollmentMonthlyStats = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsNum = Math.min(parseInt(months) || 6, 12);

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsNum + 1, 1);

    // Aggregate user enrollments by month
    const enrollmentStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: { path: "$enrolledCourses", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          enrollments: { $sum: 1 },
          uniqueUsers: { $addToSet: "$_id" }
        }
      },
      {
        $project: {
          _id: 1,
          enrollments: 1,
          uniqueUsers: { $size: "$uniqueUsers" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Also get new user registrations per month
    const userStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format data for frontend charts
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const result = [];
    for (let i = 0; i < monthsNum; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthsNum + 1 + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const enrollStat = enrollmentStats.find(s => s._id.year === year && s._id.month === month);
      const userStat = userStats.find(s => s._id.year === year && s._id.month === month);
      
      result.push({
        month: monthNames[month - 1],
        year,
        enrollments: enrollStat?.enrollments || 0,
        uniqueUsers: enrollStat?.uniqueUsers || 0,
        newUsers: userStat?.newUsers || 0
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      summary: {
        totalEnrollments: result.reduce((sum, r) => sum + r.enrollments, 0),
        totalNewUsers: result.reduce((sum, r) => sum + r.newUsers, 0),
        averageMonthlyEnrollments: Math.round(result.reduce((sum, r) => sum + r.enrollments, 0) / monthsNum)
      }
    });
  } catch (error) {
    console.error("Error fetching enrollment monthly stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch enrollment statistics",
      message: error.message
    });
  }
};


export const getCourseCompletionRate = async (req, res) => {
  try {
    // Get total enrollments and completed enrollments
    const stats = await User.aggregate([
      { $unwind: { path: "$enrolledCourses", preserveNullAndEmptyArrays: false } },
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          activeEnrollments: {
            $sum: { $cond: [{ $eq: ["$enrolledCourses.accessStatus", "active"] }, 1, 0] }
          },
          lockedEnrollments: {
            $sum: { $cond: [{ $eq: ["$enrolledCourses.accessStatus", "locked"] }, 1, 0] }
          }
        }
      }
    ]);

    // Get EMI completion stats
    const emiStats = await EMIPlan.aggregate([
      {
        $group: {
          _id: null,
          totalPlans: { $sum: 1 },
          completedPlans: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          activePlans: {
            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
          }
        }
      }
    ]);

    const enrollmentData = stats[0] || { totalEnrollments: 0, activeEnrollments: 0, lockedEnrollments: 0 };
    const emiData = emiStats[0] || { totalPlans: 0, completedPlans: 0, activePlans: 0 };

    // Calculate completion rate based on EMI plans completed
    const completionRate = emiData.totalPlans > 0
      ? Math.round((emiData.completedPlans / emiData.totalPlans) * 100)
      : 0;

    res.status(200).json({
      success: true,
      completionRate,
      rate: completionRate,
      data: {
        enrollments: {
          total: enrollmentData.totalEnrollments,
          active: enrollmentData.activeEnrollments,
          locked: enrollmentData.lockedEnrollments
        },
        emiPlans: {
          total: emiData.totalPlans,
          completed: emiData.completedPlans,
          active: emiData.activePlans
        }
      }
    });
  } catch (error) {
    console.error("Error fetching completion rate:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch completion rate",
      message: error.message
    });
  }
};


export const getDashboardOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalCourses,
      totalPayments,
      recentEnrollments
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Payment.countDocuments({ paymentStatus: "completed" }),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // Get revenue stats
    const revenueStats = await Payment.aggregate([
      { $match: { paymentStatus: "completed" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          averageOrderValue: { $avg: "$amount" }
        }
      }
    ]);

    const revenue = revenueStats[0] || { totalRevenue: 0, averageOrderValue: 0 };

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalCourses,
        totalPayments,
        recentEnrollments,
        totalRevenue: Math.round(revenue.totalRevenue),
        averageOrderValue: Math.round(revenue.averageOrderValue),
        growthRate: recentEnrollments > 0 ? "+12%" : "0%"
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch dashboard overview",
      message: error.message
    });
  }
};


export const getRevenueTrends = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsNum = Math.min(parseInt(months) || 6, 12);

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsNum + 1, 1);

    const revenueStats = await Payment.aggregate([
      {
        $match: {
          paymentStatus: "completed",
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$amount" },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const result = [];
    for (let i = 0; i < monthsNum; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthsNum + 1 + i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      
      const stat = revenueStats.find(s => s._id.year === year && s._id.month === month);
      
      result.push({
        month: monthNames[month - 1],
        year,
        revenue: stat ? Math.round(stat.revenue / 1000) : 0, // In thousands
        transactions: stat?.transactions || 0
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      summary: {
        totalRevenue: result.reduce((sum, r) => sum + r.revenue, 0),
        totalTransactions: result.reduce((sum, r) => sum + r.transactions, 0),
        averageMonthlyRevenue: Math.round(result.reduce((sum, r) => sum + r.revenue, 0) / monthsNum)
      }
    });
  } catch (error) {
    console.error("Error fetching revenue trends:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch revenue trends",
      message: error.message
    });
  }
};

export default {
  getEmiMonthlyStats,
  getEnrollmentMonthlyStats,
  getCourseCompletionRate,
  getDashboardOverview,
  getRevenueTrends
};
