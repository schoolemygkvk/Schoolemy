import  logger  from "../../Utils/logger.js";

import Course from "../../Models/Course-Model/Course-Model.js";
import Payment from "../../Models/Payment-Model/Payment-Model.js";
import ExamQuestion from "../../Models/Exam-Model/Exam-Question-Model.js";
import User from "../../Models/User-Model/User-Model.js";
import { sanitizeLessonMediaUrls } from "../../Utils/lessonMediaUrl.js";

// Enhanced helper function to check comprehensive payment/EMI status
export const checkCourseAccess = async (userId, courseId) => {
  if (!userId) {
    return {
      hasAccess: false,
      reason: "payment_required",
      accessType: "limited",
      message: "Payment required to access this course.",
    };
  }

  // Check for full payment
  const fullPayment = await Payment.findOne({
    userId,
    courseId,
    paymentStatus: "completed",
    paymentType: { $ne: "emi" },
  });

  if (fullPayment) {
    return { hasAccess: true, reason: "full_payment", accessType: "full" };
  }

  // Check for EMI access
  const user = await User.findOne(
    {
      _id: userId,
      "enrolledCourses.course": courseId,
    },
    { "enrolledCourses.$": 1 },
  ).populate("enrolledCourses.emiPlan");

  if (user && user.enrolledCourses[0]) {
    const enrolledCourse = user.enrolledCourses[0];

    // **NEW: Check if course access is locked due to EMI non-payment**
    if (enrolledCourse.accessStatus === "locked") {
      return {
        hasAccess: false,
        reason: "emi_locked",
        accessType: "locked",
        message:
          "Course access locked due to overdue EMI payments. Please clear pending payments to restore access.",
      };
    }

    // Check if EMI plan exists and is active
    if (enrolledCourse.emiPlan?.status === "active") {
      const emiPlan = enrolledCourse.emiPlan;

      // Check if any EMI is past its grace period
      const today = new Date();
      const overdueEmis = emiPlan.emis.filter(
        (emi) => emi.status === "pending" && emi.gracePeriodEnd < today,
      );

      if (overdueEmis.length > 0) {
        return {
          hasAccess: false,
          reason: "emi_overdue",
          accessType: "limited",
          overdueCount: overdueEmis.length,
          message: `You have ${overdueEmis.length} overdue EMI payment(s). Course access may be restricted soon.`,
        };
      }

      return { hasAccess: true, reason: "emi_active", accessType: "full" };
    }
  }

  // No payment or EMI found
  return {
    hasAccess: false,
    reason: "payment_required",
    accessType: "limited",
    message: "Payment required to access this course.",
  };
};

// Legacy helper function for backward compatibility
const checkPaymentStatus = async (userId, courseId) => {
  const payment = await Payment.findOne({
    userId,
    courseId,
    paymentStatus: "completed",
  });
  return !!payment;
};

// Helper function to safely format EMI data
const formatEmiData = (course) => {
  if (!course.emi || !course.emi.isAvailable) {
    return {
      isAvailable: false,
      emiDurationMonths: null,
      monthlyAmount: null,
      totalAmount: null,
      notes: null,
    };
  }
  return {
    isAvailable: course.emi.isAvailable,
    emiDurationMonths: course.emi.emiDurationMonths || null,
    monthlyAmount: course.emi.monthlyAmount || null,
    totalAmount: course.emi.totalAmount || null,
    notes: course.emi.notes || null,
  };
};

//course grid view for users
// BUG 2.8.2 FIX: Include enrollment status in course listing
export const getCoursesForUserView = async (req, res) => {
  try {
    const userId = req.userId; // Get userId from JWT token if authenticated

    // Only select fields needed for card/grid display
    const courses = await Course.find(
      {},
      {
        CourseMotherId: 1,
        coursename: 1,
        category: 1,
        courseduration: 1,
        thumbnail: 1,
        "price.amount": 1,
        "price.finalPrice": 1,
        emi: 1,
        rating: 1,
        level: 1,
        language: 1,
        studentEnrollmentCount: 1,
        instructor: 1,
        _id: 1, // for detail route
        createdAt: 1,
      },
    ).sort({ createdAt: -1 }); // latest first if needed

    // If user is authenticated, get their enrollment status for each course
    const enrolledCourseMap = new Map();
    if (userId) {
      // Fetch all completed payments for this user
      const enrollments = await Payment.find(
        {
          userId,
          paymentStatus: "completed",
          courseId: { $ne: null },
        },
        {
          courseId: 1,
          createdAt: 1,
          paymentType: 1,
        },
      );

      // Create map of courseId -> enrollment info
      enrollments.forEach((enrollment) => {
        const courseIdStr = enrollment.courseId.toString();
        enrolledCourseMap.set(courseIdStr, {
          is_enrolled: true,
          enrolled_date: enrollment.createdAt,
          payment_type: enrollment.paymentType,
        });
      });

      // Also check User's enrolledCourses for EMI courses
      const user = await User.findById(userId).select(
        "enrolledCourses",
      );
      if (user && user.enrolledCourses) {
        user.enrolledCourses.forEach((enrolledCourse) => {
          const courseIdStr = enrolledCourse.course.toString();
          // Update or add enrollment info
          if (!enrolledCourseMap.has(courseIdStr)) {
            enrolledCourseMap.set(courseIdStr, {
              is_enrolled: true,
              enrolled_date: enrolledCourse.enrolledAt || enrolledCourse.enrollmentDate,
              payment_type: "emi",
              progress_percentage: enrolledCourse.progressPercentage || 0,
              last_accessed: enrolledCourse.lastAccessedAt,
            });
          }
        });
      }
    }

    // Add enrollment status to each course
    const coursesWithEnrollment = courses.map((course) => {
      const courseObj = course.toObject();
      const courseIdStr = course._id.toString();

      const enrollmentData = enrolledCourseMap.get(courseIdStr);
      courseObj.enrollment_status = enrollmentData
        ? {
          is_enrolled: true,
          enrolled_date: enrollmentData.enrolled_date,
          progress_percentage: enrollmentData.progress_percentage || 0,
          last_accessed: enrollmentData.last_accessed || null,
          completion_status: enrollmentData.progress_percentage
            ? enrollmentData.progress_percentage === 100
              ? "completed"
              : "in_progress"
            : null,
        }
        : {
          is_enrolled: false,
          enrolled_date: null,
          progress_percentage: 0,
          last_accessed: null,
          completion_status: null,
        };

      return courseObj;
    });

    return res.status(200).json({
      success: true,
      message: "Courses fetched successfully for user view",
      data: coursesWithEnrollment,
    });
  } catch (error) {
    logger.error("Error in getCoursesForUserView:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//GET API to fetch a single course by ID with payment check
// Always returns course details but with different access levels
export const getCourseDetailWithPaymentCheck = async (req, res) => {
  try {
    const userId = req.userId;
    const courseId = req.params.id;

    // Get course details
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check comprehensive course access
    const accessInfo = await checkCourseAccess(userId, courseId);

    // Always return course details, but vary the access level
    if (accessInfo.hasAccess && accessInfo.accessType === "full") {
      // Full access - return complete course details with GST breakdown
      const courseData = {
        ...course.toObject(),
        emi: formatEmiData(course),
        // Ensure price breakdown is included
        price: {
          amount: course.price.amount,
          currency: course.price.currency,
          discount: course.price.discount,
          finalPrice: course.price.finalPrice,
          breakdown: {
            courseValue: course.price.breakdown?.courseValue || 0,
            gst: {
              cgst: course.price.breakdown?.gst?.cgst || 0,
              sgst: course.price.breakdown?.gst?.sgst || 0,
              total: course.price.breakdown?.gst?.total || 0,
            },
            transactionFee: course.price.breakdown?.transactionFee || 0,
          },
        },
      };

      return res.status(200).json({
        success: true,
        data: courseData,
        access: "full",
        accessReason: accessInfo.reason,
      });
    } else {
      // Limited access - return basic details with GST breakdown for transparency
      const basicDetails = {
        _id: course._id,
        CourseMotherId: course.CourseMotherId,
        coursename: course.coursename,
        category: course.category,
        courseduration: course.courseduration,
        thumbnail: course.thumbnail,
        previewvedio: course.previewvedio, // Allow preview video for course details page
        price: {
          amount: course.price.amount,
          currency: course.price.currency,
          discount: course.price.discount,
          finalPrice: course.price.finalPrice,
          breakdown: {
            courseValue: course.price.breakdown?.courseValue || 0,
            gst: {
              cgst: course.price.breakdown?.gst?.cgst || 0,
              sgst: course.price.breakdown?.gst?.sgst || 0,
              total: course.price.breakdown?.gst?.total || 0,
            },
            transactionFee: course.price.breakdown?.transactionFee || 0,
          },
        },
        emi: formatEmiData(course),
        rating: course.rating,
        level: course.level,
        language: course.language,
        certificates: course.certificates,
        studentEnrollmentCount: course.studentEnrollmentCount,
        instructor: course.instructor,
        description: course.description,
        whatYoullLearn: course.whatYoullLearn,
        review: course.review,
        contentduration: course.contentduration,
      };

      const responseData = {
        success: true,
        data: basicDetails,
        access: "limited",
        accessReason: accessInfo.reason,
      };

      // Add additional info for specific cases
      if (
        accessInfo.reason === "emi_overdue" ||
        accessInfo.reason === "emi_locked"
      ) {
        responseData.emiInfo = {
          overdueCount: accessInfo.overdueCount || 0,
          totalOverdue: accessInfo.totalOverdue || 0,
          nextDueAmount: accessInfo.nextDueAmount || 0,
          nextDueDate: accessInfo.nextDueDate,
          message:
            accessInfo.reason === "emi_overdue"
              ? "Course access is limited due to overdue EMI payments"
              : "Course access is locked. Please contact support or make payments.",
          paymentRequired: true,
          canMakePayment: true,
        };
      } else if (accessInfo.reason === "payment_required") {
        responseData.paymentInfo = {
          message: "Payment required for full course access",
          canPurchase: true,
        };
      }

      return res.status(200).json(responseData);
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//GET API to fetch course content (chapters + exams) if user has paid
export const getCourseContent = async (req, res) => {
  try {
    const userId = req.userId;
    const courseId = req.params.id;

    // Check comprehensive course access (from middleware or direct check)
    let accessInfo = req.courseAccess;
    if (!accessInfo) {
      accessInfo = await checkCourseAccess(userId, courseId);
    }

    // CRITICAL: Block access completely for EMI-locked courses (server-side enforcement)
    if (accessInfo.reason === "emi_locked") {
      return res.status(403).json({
        success: false,
        message: "Course access is locked due to unpaid EMI installments",
        code: "EMI_LOCKED",
        accessReason: accessInfo.reason,
        details: {
          type: "EMI_LOCKED",
          reason: accessInfo.message,
          requiresPayment: true,
          action: "Please complete your EMI payments to restore access",
        },
      });
    }

    // Block access for overdue EMI (server-side enforcement)
    if (accessInfo.reason === "emi_overdue") {
      return res.status(403).json({
        success: false,
        message: "Course access is limited due to overdue EMI payments",
        code: "EMI_OVERDUE",
        accessReason: accessInfo.reason,
        overdueCount: accessInfo.overdueCount || 0,
        totalOverdue: accessInfo.totalOverdue || 0,
        nextDueDate: accessInfo.nextDueDate,
        details: {
          type: "EMI_OVERDUE",
          reason: "You have overdue EMI payments",
          requiresPayment: true,
          action: "Please pay your overdue installments to access course content",
        },
      });
    }

    // Always allow some level of content access for course browsing
    const allowLimitedAccess =
      accessInfo.reason === "payment_required";

    // Get course content, name, and price details with GST breakdown
    const course = await Course.findById(courseId, {
      chapters: 1,
      coursename: 1,
      CourseMotherId: 1,
      price: 1, // Include price for GST and transaction fee details
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const chapterTitles = course.chapters.map((ch) => ch.title);
    const exams = await ExamQuestion.find({
      $or: [
        { courseId: course._id, chapterTitle: { $in: chapterTitles } },
        {
          coursename: course.coursename,
          chapterTitle: { $in: chapterTitles },
        },
      ],
    });

    // Prefer courseId-scoped exam when both exist for same chapter title
    const examMap = {};
    const pickExam = (existing, candidate) => {
      if (!existing) return candidate;
      const candHasCourse =
        candidate.courseId &&
        String(candidate.courseId) === String(course._id);
      const existHasCourse =
        existing.courseId && String(existing.courseId) === String(course._id);
      if (candHasCourse && !existHasCourse) return candidate;
      return existing;
    };

    exams.forEach((exam) => {
      const title = exam.chapterTitle;
      examMap[title] = pickExam(examMap[title], exam);
    });

    const buildExamPayload = (exam) => ({
      examId: exam._id,
      examinationName: exam.examinationName,
      subject: exam.subject,
      totalMarks: exam.totalMarks,
      durationMinutes: exam.durationMinutes ?? 60,
      examQuestions: exam.examQuestions.map((q) => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        marks: q.marks,
      })),
    });

    Object.keys(examMap).forEach((title) => {
      examMap[title] = buildExamPayload(examMap[title]);
    });

    // Add exam data and count stats
    let chaptersWithExamsCount = 0;
    const chaptersWithExams = course.chapters.map((chapter) => {
      const hasExam = !!examMap[chapter.title];
      if (hasExam) chaptersWithExamsCount++;

      const chapterObj = chapter.toObject();
      const lessons = (chapterObj.lessons || []).map(sanitizeLessonMediaUrls);

      return {
        ...chapterObj,
        lessons,
        exam: hasExam ? examMap[chapter.title] : null,
      };
    });

    // Create metadata
    const meta = {
      totalChapters: course.chapters.length,
      chaptersWithExams: chaptersWithExamsCount,
      chaptersWithoutExams: course.chapters.length - chaptersWithExamsCount,
    };

    // Prepare price breakdown for response
    const priceDetails = {
      amount: course.price.amount,
      currency: course.price.currency,
      discount: course.price.discount,
      finalPrice: course.price.finalPrice,
      breakdown: {
        courseValue: course.price.breakdown?.courseValue || 0,
        gst: {
          cgst: course.price.breakdown?.gst?.cgst || 0,
          sgst: course.price.breakdown?.gst?.sgst || 0,
          total: course.price.breakdown?.gst?.total || 0,
        },
        transactionFee: course.price.breakdown?.transactionFee || 0,
      },
    };

    // Handle different access levels
    if (accessInfo.hasAccess && accessInfo.accessType === "full") {
      // Full access - return complete content with price breakdown
      return res.status(200).json({
        success: true,
        message: "Course content fetched successfully",
        data: chaptersWithExams,
        CourseMotherId: course.CourseMotherId,
        coursename: course.coursename,
        price: priceDetails,
        meta,
        access: "full",
        accessReason: accessInfo.reason,
      });
    } else if (allowLimitedAccess) {
      // Limited access - show structure but limit actual content
      const limitedChapters = course.chapters.map((chapter, index) => {
        const hasExam = !!examMap[chapter.title];

        // Allow first chapter or first few lessons for preview
        const allowPreview = index === 0;
        const chapterObj = chapter.toObject();

        // FIX: Return lessons with sanitized media URLs (not "content")
        const lessons = allowPreview && chapterObj.lessons
          ? chapterObj.lessons.slice(0, 1).map(sanitizeLessonMediaUrls)
          : [];

        return {
          _id: chapter._id,
          title: chapter.title,
          description: chapter.description,
          duration: chapter.duration,
          // FIX: Use "lessons" field (consistent with full access response)
          lessons: lessons,
          exam: hasExam
            ? {
              examId: examMap[chapter.title].examId,
              examinationName: examMap[chapter.title].examinationName,
              subject: examMap[chapter.title].subject,
              totalMarks: examMap[chapter.title].totalMarks,
              // Don't include actual questions for limited access
              questionsCount: examMap[chapter.title].examQuestions.length,
            }
            : null,
          isPreview: allowPreview,
          isLocked: !allowPreview,
        };
      });

      const responseData = {
        success: true,
        message: "Limited course content (payment required for full access)",
        data: limitedChapters,
        CourseMotherId: course.CourseMotherId,
        coursename: course.coursename,
        price: priceDetails,
        meta,
        access: "limited",
        accessReason: accessInfo.reason,
      };

      // Add specific info based on reason
      if (
        accessInfo.reason === "emi_overdue" ||
        accessInfo.reason === "emi_locked"
      ) {
        responseData.emiInfo = {
          overdueCount: accessInfo.overdueCount || 0,
          totalOverdue: accessInfo.totalOverdue || 0,
          nextDueAmount: accessInfo.nextDueAmount || 0,
          nextDueDate: accessInfo.nextDueDate,
          message:
            accessInfo.reason === "emi_overdue"
              ? "Course access is limited due to overdue EMI payments"
              : "Course access is locked. Please make payments to restore access.",
          paymentRequired: true,
          canMakePayment: true,
        };
      } else if (accessInfo.reason === "payment_required") {
        responseData.paymentInfo = {
          message: "Payment required for full course access",
          canPurchase: true,
        };
      }

      return res.status(200).json(responseData);
    } else {
      // No access at all - this shouldn't happen with current logic, but handle gracefully
      return res.status(403).json({
        success: false,
        message: "Access denied to course content",
        code: "ACCESS_DENIED",
        accessReason: accessInfo.reason,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Get courses by category
export const getCoursesByCategory = async (req, res) => {
  try {
    // URL-லிருந்து category பெயரைப் பெறுகிறோம் (e.g., "Yoga", "Siddha Medicine")
    const { categoryName } = req.params;

    if (!categoryName) {
      return res.status(400).json({ error: "Category name is required" });
    }

    // category ஃபீல்டை வைத்து டேட்டாபேஸில் தேடுகிறோம்
    const courses = await Course.find({ category: categoryName });

    if (!courses || courses.length === 0) {
      return res
        .status(404)
        .json({ message: `No courses found for category: ${categoryName}` });
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
