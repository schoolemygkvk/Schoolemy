import Tutor from "../../Models/Tutor/TutorModel.js";
import TutorCourse from "../../Models/Tutor/Tutor-CourseModel.js";
import Payment from "../../Models/Payment/Payment-Model.js";
import { hashPassword } from "../../Utils/passwordHash.js";
import { sendTutorCredentialsEmail } from "../../Notification/TutorEmailService.js";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";


const isHttpUrl = (value) =>
  typeof value === "string" && /^https?:\/\//i.test(value);

// 🔹 Create Tutor Account
export const createTutor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      mobilenumber,
      qualification,
      subject,
      experience,
      address,
      govtIdProofs,
      gender,
      role,
      age,
      profilePictureUpload,
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !mobilenumber) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and mobile number are required fields",
      });
    }

    // Validate profile picture if provided
    if (profilePictureUpload && !isHttpUrl(profilePictureUpload)) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile picture URL. Please upload image to S3 first",
      });
    }

    // Validate government ID proofs if provided
    if (govtIdProofs && govtIdProofs.length > 0) {
      for (const proof of govtIdProofs) {
        if (proof.documentImage && !isHttpUrl(proof.documentImage)) {
          return res.status(400).json({
            success: false,
            message: `Invalid document image URL for ${proof.idType}. Please upload to S3 first`,
          });
        }
      }
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate mobile number format
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobilenumber)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit mobile number",
      });
    }

    // Validate password strength
    const passwordRegex =
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters long and contain at least one lowercase letter, one uppercase letter, one number and one special character",
      });
    }

    // Check if email already exists
    const existingTutorEmail = await Tutor.findOne({ email });
    if (existingTutorEmail) {
      return res.status(400).json({
        success: false,
        message: "Tutor with this email already exists",
      });
    }

    // Check if mobile number already exists
    const existingTutorMobile = await Tutor.findOne({ mobilenumber });
    if (existingTutorMobile) {
      return res.status(400).json({
        success: false,
        message: "Tutor with this mobile number already exists",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new Tutor
    const newTutor = new Tutor({
      name,
      email,
      mobilenumber,
      password: hashedPassword,
      qualification,
      subject,
      experience,
      address,
      govtIdProofs,
      role,
      gender,
      age,
      profilePictureUpload,
      isApproved: false,
      subscriptionStatus: "active",
      isFirstTime: true,
      passwordUpdatedAt: new Date(),
      otpAttempts: 0,
    });

    // Save to database
    await newTutor.save();

    // Attempt to send credentials email to the tutor (non-blocking for success)
    let emailResult = null;
    try {
      // loginEmail is the same as the provided email here
      emailResult = await sendTutorCredentialsEmail(
        email,
        name,
        email,
        password,
      );
    } catch (emailErr) {
      console.error("Error while sending credentials email:", emailErr);
      emailResult = {
        success: false,
        message: emailErr.message || "Error sending email",
      };
    }

    res.status(201).json({
      success: true,
      message: "Tutor account created successfully",
      tutor: {
        tutorId: newTutor.tutorId,
        name: newTutor.name,
        email: newTutor.email,
        subject: newTutor.subject,
        qualification: newTutor.qualification,
      },
      email: emailResult,
    });
  } catch (error) {
    console.error("Error creating tutor:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create tutor account",
      error: error.message,
    });
  }
};

// 🔹 Get single tutor by ID
export const getTutorById = async (req, res) => {
  try {
    const { id } = req.params;
    const tutor = await Tutor.findById(id).lean();
    if (!tutor) {
      return res
        .status(404)
        .json({ success: false, message: "Tutor not found" });
    }
    sendSuccess(res, 200, "Success", tutor );
  } catch (error) {
    console.error("Error fetching tutor by id:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tutor" });
  }
};

// 🔹 Update existing tutor
export const updateTutor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // prevent updating email/mobile to values that collide with others
    if (updates.email) {
      const existing = await Tutor.findOne({
        email: updates.email,
        _id: { $ne: id },
      });
      if (existing) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Another tutor with this email already exists",
          });
      }
    }
    if (updates.mobilenumber) {
      const existing = await Tutor.findOne({
        mobilenumber: updates.mobilenumber,
        _id: { $ne: id },
      });
      if (existing) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Another tutor with this mobile number already exists",
          });
      }
    }

    // If password is being updated, hash it
    if (updates.password) {
      const hashed = await hashPassword(updates.password);
      updates.password = hashed;
    }

    if (updates.profilePictureUpload && !isHttpUrl(updates.profilePictureUpload)) {
      throw new Error("Invalid profile picture URL");
    }

    if (updates.govtIdProofs && updates.govtIdProofs.length > 0) {
      for (const proof of updates.govtIdProofs) {
        if (proof.documentImage && !isHttpUrl(proof.documentImage)) {
          throw new Error("Invalid government ID document image URL");
        }
      }
    }

    const updatedTutor = await Tutor.findByIdAndUpdate(id, updates, {
      new: true,
    });
    if (!updatedTutor) {
      return res
        .status(404)
        .json({ success: false, message: "Tutor not found" });
    }
    sendSuccess(res, 200, "Tutor updated successfully", updatedTutor,
    );
  } catch (error) {
    console.error("Error updating tutor:", error);
    res.status(500).json({ success: false, message: "Failed to update tutor" });
  }
};

// 🔹 Get All Tutors with Pagination and Filters
export const getAllTutors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      subject,
      qualification,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
    } = req.query;

    // Build query based on filters
    const query = {};

    // Add filters if provided
    if (status) {
      query.subscriptionStatus = status;
    }
    if (subject) {
      query.subject = { $regex: subject, $options: "i" };
    }
    if (qualification) {
      query.qualification = { $regex: qualification, $options: "i" };
    }

    // Add search functionality across multiple fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { tutorId: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Build sort object
    const sortObject = {};
    sortObject[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Fetch tutors with all details except sensitive information
    const tutors = await Tutor.find(query)
      .select(
        "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -otpAttempts",
      )
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit));

    const totalTutors = await Tutor.countDocuments(query);

    // Get subscription status counts
    const statusCounts = await Tutor.aggregate([
      {
        $group: {
          _id: "$subscriptionStatus",
          count: { $sum: 1 },
        },
      },
    ]);

    // Calculate additional statistics
    const statistics = {
      totalTutors,
      subscriptionStatus: Object.fromEntries(
        statusCounts.map((status) => [status._id, status.count]),
      ),
      activePercentage: (
        ((statusCounts.find((s) => s._id === "active")?.count || 0) /
          totalTutors) *
        100
      ).toFixed(2),
    };

    return res.status(200).json({
      success: true,
      data: {
        tutors: tutors,
        statistics,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalTutors / limit),
          totalTutors,
          limit: parseInt(limit),
        },
        filters: {
          status,
          subject,
          qualification,
          search,
        },
      },
    });
  } catch (error) {
    console.error("Get all tutors error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch tutors",
      error: error.message,
    });
  }
};

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


function buildWeekDaysLikeFrontend() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((currentDay + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return {
      label: days[i],
      key: date.toISOString().split("T")[0],
      logins: 0,
    };
  });
}


export const getTutorAnalyticsLight = async (req, res) => {
  try {
    const search = (req.query.search || "").trim();
    const summaryOnly =
      req.query.summaryOnly === "1" || req.query.summaryOnly === "true";

    const baseMatch = {};
    if (search) {
      const safe = escapeRegex(search);
      baseMatch.$or = [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }

    const weekTemplate = buildWeekDaysLikeFrontend();
    const weekKeys = weekTemplate.map((d) => d.key);
    const weekStart = new Date(`${weekKeys[0]}T00:00:00.000Z`);
    const weekEnd = new Date(`${weekKeys[6]}T23:59:59.999Z`);
    const todayUtcKey = new Date().toISOString().split("T")[0];

    const [
      totalTutors,
      activeTutors,
      avgSessionAgg,
      roleAgg,
      weekLoginAgg,
      todayLoginCount,
      tutorsLight,
    ] = await Promise.all([
      Tutor.countDocuments(baseMatch),
      Tutor.countDocuments({
        ...baseMatch,
        loginHistory: { $elemMatch: { logoutTime: null } },
      }),
      Tutor.aggregate([
        { $match: baseMatch },
        { $unwind: { path: "$loginHistory", preserveNullAndEmptyArrays: false } },
        { $match: { "loginHistory.sessionDuration": { $gt: 0 } } },
        { $group: { _id: null, avg: { $avg: "$loginHistory.sessionDuration" } } },
      ]),
      Tutor.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: { $ifNull: ["$role", "unknown"] },
            value: { $sum: 1 },
          },
        },
        { $project: { _id: 0, name: "$_id", value: 1 } },
      ]),
      Tutor.aggregate([
        { $match: baseMatch },
        { $unwind: { path: "$loginHistory", preserveNullAndEmptyArrays: false } },
        {
          $match: {
            "loginHistory.loginTime": { $gte: weekStart, $lte: weekEnd },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$loginHistory.loginTime",
                timezone: "UTC",
              },
            },
            logins: { $sum: 1 },
          },
        },
      ]),
      Tutor.aggregate([
        { $match: baseMatch },
        { $unwind: { path: "$loginHistory", preserveNullAndEmptyArrays: false } },
        {
          $match: {
            "loginHistory.loginTime": {
              $gte: new Date(`${todayUtcKey}T00:00:00.000Z`),
              $lte: new Date(`${todayUtcKey}T23:59:59.999Z`),
            },
          },
        },
        { $count: "c" },
      ]),
      summaryOnly
        ? Promise.resolve([])
        : Tutor.aggregate([
            { $match: baseMatch },
            { $sort: { createdAt: -1 } },
            { $limit: 150 },
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                role: 1,
                loginHistory: { $slice: ["$loginHistory", -3] },
              },
            },
          ]),
    ]);

    const weekMap = Object.fromEntries(
      weekLoginAgg.map((r) => [r._id, r.logins]),
    );
    const loginsThisWeek = weekTemplate.map((d) => ({
      ...d,
      logins: weekMap[d.key] || 0,
    }));

    const avgSessionSeconds =
      avgSessionAgg.length > 0 && avgSessionAgg[0].avg != null
        ? Math.floor(avgSessionAgg[0].avg)
        : 0;

    const loginsToday =
      todayLoginCount.length > 0 ? todayLoginCount[0].c : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalTutors,
        activeTutors,
        avgSessionSeconds,
        loginsToday,
        loginsThisWeek,
        roleDistribution: roleAgg,
        tutors: tutorsLight,
      },
    });
  } catch (error) {
    console.error("Tutor analytics light error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load tutor analytics",
      error: error.message,
    });
  }
};


export const getTutorCourseAndEarningsStats = async (req, res) => {
  try {
    const [
      courseStatusAgg,
      perTutorCoursesAgg,
      earningsAgg,
    ] = await Promise.all([
      TutorCourse.aggregate([
        { $group: {
          _id: "$status",
          courses: { $sum: 1 },
          students: { $sum: "$studentEnrollmentCount" },
        }},
        { $project: {
          _id: 0,
          status: "$_id",
          courses: 1,
          students: 1,
        }},
      ]),
      TutorCourse.aggregate([
        { $match: { tutor: { $ne: null } }},
        { $group: {
          _id: "$tutor",
          totalCourses: { $sum: 1 },
          approvedCourses: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }},
          pendingCourses: { $sum: { $cond: [{ $eq: ["$status", "pending_review"] }, 1, 0] }},
          rejectedCourses: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }},
          studentEnrollments: { $sum: "$studentEnrollmentCount" },
        }},
      ]),
      Payment.aggregate([
        { $match: {
          paymentStatus: "completed",
          tutorCourseId: { $exists: true, $ne: null },
        }},
        { $lookup: {
          from: TutorCourse.collection.name,
          localField: "tutorCourseId",
          foreignField: "_id",
          as: "course",
        }},
        { $unwind: { path: "$course", preserveNullAndEmptyArrays: false }},
        { $group: {
          _id: "$course.tutor",
          totalRevenue: { $sum: "$amount" },
          totalPayments: { $sum: 1 },
        }},
      ]),
    ]);

    const courseMap = {};
    const earningsMap = {};
    const tutorIds = new Set();

    courseStatusAgg.forEach((s) => {
      if (!courseMap[s.status]) courseMap[s.status] = { courses: 0, students: 0 };
      courseMap[s.status].courses += s.courses;
      courseMap[s.status].students += s.students;
    });

    perTutorCoursesAgg.forEach((p) => {
      tutorIds.add(p._id.toString());
    });

    earningsAgg.forEach((e) => {
      tutorIds.add(e._id.toString());
      earningsMap[e._id.toString()] = {
        totalRevenue: parseFloat(e.totalRevenue.toFixed(2)),
        totalPayments: e.totalPayments,
        totalCommission: parseFloat((e.totalRevenue * 0.3).toFixed(2)),
      };
    });

    const tutorNames = await Tutor.find(
      { _id: { $in: Array.from(tutorIds).map(id => id) }},
      "_id name email"
    ).lean();

    const nameMap = {};
    tutorNames.forEach((t) => {
      nameMap[t._id.toString()] = { name: t.name, email: t.email };
    });

    const perTutorStats = {};
    let totalCourses = 0,
        totalApproved = 0,
        totalPending = 0,
        totalRejected = 0,
        totalStudentEnrollments = 0,
        totalRevenue = 0,
        totalCommission = 0;

    perTutorCoursesAgg.forEach((p) => {
      const tutorIdStr = p._id.toString();
      const earnings = earningsMap[tutorIdStr] || { totalRevenue: 0, totalPayments: 0, totalCommission: 0 };

      perTutorStats[tutorIdStr] = {
        totalCourses: p.totalCourses,
        approvedCourses: p.approvedCourses,
        pendingCourses: p.pendingCourses,
        rejectedCourses: p.rejectedCourses,
        studentEnrollments: p.studentEnrollments,
        totalRevenue: earnings.totalRevenue,
        totalCommission: earnings.totalCommission,
      };

      totalCourses += p.totalCourses;
      totalApproved += p.approvedCourses;
      totalPending += p.pendingCourses;
      totalRejected += p.rejectedCourses;
      totalStudentEnrollments += p.studentEnrollments;
      totalRevenue += earnings.totalRevenue;
      totalCommission += earnings.totalCommission;
    });

    earningsAgg.forEach((e) => {
      const tutorIdStr = e._id.toString();
      if (!perTutorStats[tutorIdStr]) {
        perTutorStats[tutorIdStr] = {
          totalCourses: 0,
          approvedCourses: 0,
          pendingCourses: 0,
          rejectedCourses: 0,
          studentEnrollments: 0,
          totalRevenue: e.totalRevenue,
          totalCommission: e.totalCommission,
        };
        totalRevenue += e.totalRevenue;
        totalCommission += e.totalCommission;
      }
    });

    const topEarners = earningsAgg
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10)
      .map((e) => {
        const tutorIdStr = e._id.toString();
        const info = nameMap[tutorIdStr] || { name: "Unknown", email: "" };
        return {
          tutorId: tutorIdStr,
          name: info.name,
          totalRevenue: parseFloat(e.totalRevenue.toFixed(2)),
          totalCommission: parseFloat((e.totalRevenue * 0.3).toFixed(2)),
          totalPayments: e.totalPayments,
        };
      });

    const courseStatusChartData = [
      { status: "approved", courses: courseMap.approved?.courses || 0, students: courseMap.approved?.students || 0 },
      { status: "pending_review", courses: courseMap.pending_review?.courses || 0, students: courseMap.pending_review?.students || 0 },
      { status: "rejected", courses: courseMap.rejected?.courses || 0, students: courseMap.rejected?.students || 0 },
      { status: "draft", courses: courseMap.draft?.courses || 0, students: courseMap.draft?.students || 0 },
    ];

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCourses,
          approvedCourses: totalApproved,
          pendingCourses: totalPending,
          rejectedCourses: totalRejected,
          totalStudentEnrollments,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalCommission: parseFloat(totalCommission.toFixed(2)),
        },
        courseStatusChartData,
        topEarners,
        perTutorStats,
      },
    });
  } catch (error) {
    console.error("Tutor course analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load tutor course analytics",
      error: error.message,
    });
  }
};

// 🔹 Approve Tutor terms & conditions
export const approveTutor = async (req, res) => {
  try {
    // Get email from JWT token (set by auth middleware)
    if (!req.user || !req.user.email) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Email not found in token",
      });
    }

    const email = req.user.email;

    // Atomic approve: only flip false -> true. If it's already true, return a clear message.
    const projection =
      "-password -otp -otpExpiresAt -forgotPasswordOtp -forgotPasswordOtpExpiresAt -otpAttempts";

    const updatedTutor = await Tutor.findOneAndUpdate(
      { email, isApproved: false },
      { $set: { isApproved: true } },
      { new: true, projection },
    );

    // If nothing was updated, tutor is either missing or already approved.
    if (!updatedTutor) {
      const existingTutor = await Tutor.findOne({ email }).select(projection);

      if (!existingTutor) {
        return res.status(404).json({
          success: false,
          message: "Tutor not found",
        });
      }

      if (existingTutor.isApproved === true) {
        return res.status(200).json({
          success: true,
          message: "Tutor already approved",
          tutor: existingTutor
        });
      }

      // Fallback (should be rare): tutor exists but update didn't happen.
      return res.status(500).json({
        success: false,
        message: "Failed to approve tutor",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tutor approved successfully",
      tutor: updatedTutor,
    });
  } catch (error) {
    console.error("Approve tutor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve tutor",
      error: error.message,
    });
  }
};
