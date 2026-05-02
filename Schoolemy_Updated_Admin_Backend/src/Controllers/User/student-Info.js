
// Data Maintenance Controller for Student Information
import mongoose from 'mongoose';
import User from '../../Models/User/User-Model.js';
import Payment from '../../Models/Payment/Payment-Model.js';
import EMIPlan from '../../Models/Payment/Emi-Plan-Model.js';
import UserExamAttempt from '../../Models/Courses/UserExamAnswer.js';
import Course from "../../Models/Courses/coursemodel.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// Get a specific user's details
export const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params; // Can be studentRegisterNumber or _id
    const query = {};
    if (mongoose.isValidObjectId(id)) {
      query.$or = [{ _id: id }, { studentRegisterNumber: id }];
    } else {
      query.studentRegisterNumber = id;
    }

    const user = await User.findOne(query)
      .populate({
        path: "enrolledCourses.course",
        select: "coursename category courseduration price",
        model: Course,
      })
      .populate({
        path: "enrolledCourses.emiPlan",
        model: EMIPlan,
        select: "coursename totalAmount emiPeriod selectedDueDay status emis",
      })
      .lean();

    if (!user) {
      return sendError(res, 404, "User not found");
    }
    const payments = await Payment.find({ userId: user._id })
      .select(
        "courseId courseName amount paymentStatus paymentMethod transactionId createdAt"
      )
      .populate({ path: "courseId", select: "coursename", model: Course })
      .lean();

    const examAttempts = await UserExamAttempt.find({ userId: user._id })
      .select(
        "courseId chapterTitle examId totalMarks obtainedMarks attemptedAt"
      )
      .populate({ path: "courseId", select: "coursename", model: Course })
      .populate({
        path: "examId",
        select: "examinationName subject totalMarks",
        model: "ExamQuestion",
      })
      .lean();

    const emiPlans = await EMIPlan.find({ userId: user._id })
      .select("coursename totalAmount emiPeriod selectedDueDay status emis")
      .populate({ path: "courseId", select: "coursename", model: Course })
      .lean();

    const userDetails = {
      userInfo: {
        studentRegisterNumber: user.studentRegisterNumber,
        email: user.email,
        mobile: user.mobile,
        username: user.username,
        role: user.role,
        fatherName: user.fatherName,
        dateofBirth: user.dateofBirth,
        gender: user.gender,
        address: user.address,
        bloodGroup: user.bloodGroup,
        Nationality: user.Nationality,
        Occupation: user.Occupation,
        profilePicture: user.profilePicture,
        status: user.status,
        lastActivity: user.lastActivity,
        lastLogout: user.lastLogout,
        loginHistory: user.loginHistory,
      },
      enrolledCourses: (user.enrolledCourses || []).map((course) => ({
        course: course.course,
        courseName: course.courseName,
        emiPlan: course.emiPlan,
        accessStatus: course.accessStatus,
      })),
      payments,
      examAttempts,
      emiPlans,
    };

    res.status(200).json({
      message: "User details fetched successfully",
      data: userDetails,
    });
  } catch (error) {
    console.error("Error in getUserDetails:", error.message);
    sendError(res, 500, "Server error", { details: error.message });
  }
};

// Get all users' details with pagination
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;

    // Build query with search and status filters
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { studentRegisterNumber: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const pageLimit = parseInt(limit);

    // Fetch paginated users with their enrolled courses
    const [paginatedUsers, total] = await Promise.all([
      User.find(query)
        .populate({
          path: "enrolledCourses.course",
          select: "coursename category courseduration price",
          model: Course,
        })
        .populate({
          path: "enrolledCourses.emiPlan",
          model: EMIPlan,
          select: "coursename totalAmount emiPeriod selectedDueDay status emis",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      User.countDocuments(query)
    ]);

    // Fetch related data only for the current page of users
    const userDetails = await Promise.all(
      paginatedUsers.map(async (user) => {
        const [payments, examAttempts, emiPlans] = await Promise.all([
          Payment.find({ userId: user._id })
            .select("courseId courseName amount paymentStatus paymentMethod transactionId createdAt")
            .populate({ path: "courseId", select: "coursename", model: Course })
            .lean(),
          UserExamAttempt.find({ userId: user._id })
            .select("courseId chapterTitle examId totalMarks obtainedMarks attemptedAt")
            .populate({ path: "courseId", select: "coursename", model: Course })
            .populate({ path: "examId", select: "examinationName subject totalMarks", model: "ExamQuestion" })
            .lean(),
          EMIPlan.find({ userId: user._id })
            .select("coursename totalAmount emiPeriod selectedDueDay status emis")
            .populate({ path: "courseId", select: "coursename", model: Course })
            .lean()
        ]);

        return {
          userInfo: {
            studentRegisterNumber: user.studentRegisterNumber,
            email: user.email,
            mobile: user.mobile,
            username: user.username,
            role: user.role,
            fatherName: user.fatherName,
            dateofBirth: user.dateofBirth,
            gender: user.gender,
            address: user.address,
            bloodGroup: user.bloodGroup,
            Nationality: user.Nationality,
            Occupation: user.Occupation,
            profilePicture: user.profilePicture,
            status: user.status,
            lastActivity: user.lastActivity,
            lastLogout: user.lastLogout,
            loginHistory: user.loginHistory,
            },
          enrolledCourses: user.enrolledCourses.map((course) => ({
            course: course.course,
            courseName: course.courseName,
            emiPlan: course.emiPlan,
            accessStatus: course.accessStatus,
          })),
          payments,
          examAttempts,
          emiPlans,
        };
      })
    );

    res.status(200).json({
      message: "All users' details fetched successfully",
      data: userDetails,
      pagination: {
        total,
        page: parseInt(page),
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit)
      }
    });
  } catch (error) {
    sendError(res, 500, "Server error", { details: error.message });
  }
};