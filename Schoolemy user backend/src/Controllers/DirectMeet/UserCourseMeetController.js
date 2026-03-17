import CourseMeet from "../../Models/DirectMeet/CourseMeetModel.js";
import MeetParticipant from "../../Models/DirectMeet/MeetParticipantModel.js";
import Course from "../../Models/Course-Model/Course-Model.js";
import User from "../../Models/User-Model/User-Model.js";
import MeetNotification from "../../Models/DirectMeet/MeetNotificationModel.js";

// Get all available meets for a user
export const getUserMeets = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { status, search, page = 1, limit = 10 } = req.query;

    // Find courses the user has purchased
    const user = await User.findById(user_id).select("enrolledCourses");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userCourses = user.enrolledCourses?.map((ec) => ec.course) || [];

    if (userCourses.length === 0) {
      return res.json({
        success: true,
        meets: [],
        pagination: {
          current_page: parseInt(page),
          total_pages: 0,
          total_meets: 0,
          per_page: parseInt(limit),
        },
        message: "No courses purchased yet",
      });
    }

    // Build query based on filter
    let query = { course_id: { $in: userCourses } };

    // Handle status filter from participation status
    if (status && ["not_joined", "joined", "completed"].includes(status)) {
      // We'll filter after getting participation data
    } else {
      // If no status filter, show scheduled and ongoing meets
      query.status = { $in: ["scheduled", "ongoing"] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { course_name: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const meets = await CourseMeet.find(query)
      .populate("course_id", "coursename category")
      .sort({ scheduled_date: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get participation status for each meet
    let meetsWithStatus = await Promise.all(
      meets.map(async (meet) => {
        const participant = await MeetParticipant.findOne({
          meet_id: meet._id,
          user_id: user_id,
        });

        return {
          ...meet.toObject(),
          participation_status: participant?.attendance_status || "not_joined",
          can_access: participant?.can_access_materials || false,
          payment_status: participant?.payment_status || "pending",
          joined_at: participant?.joined_at,
          completed_at: participant?.completed_at,
        };
      }),
    );

    // Apply status filter if specified
    if (status && ["not_joined", "joined", "completed"].includes(status)) {
      meetsWithStatus = meetsWithStatus.filter(
        (m) => m.participation_status === status,
      );
    }

    const total = await CourseMeet.countDocuments(query);

    res.json({
      success: true,
      meets: meetsWithStatus,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_meets: total,
        per_page: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user meets:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching meets",
      error: error.message,
    });
  }
};

// Get single meet details for user
export const getUserMeetById = async (req, res) => {
  try {
    const { meet_id, user_id } = req.params;

    const meet = await CourseMeet.findById(meet_id).populate(
      "course_id",
      "coursename category description",
    );

    if (!meet) {
      return res
        .status(404)
        .json({ success: false, message: "Meet not found" });
    }

    // Check if user has access to this course
    const user = await User.findById(user_id).select("enrolledCourses");
    const hasAccess =
      user.enrolledCourses?.some(
        (ec) => ec.course.toString() === meet.course_id._id.toString(),
      ) || false;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this meet",
      });
    }

    // Get participation details
    const participant = await MeetParticipant.findOne({
      meet_id: meet_id,
      user_id: user_id,
    });

    res.json({
      success: true,
      meet: {
        ...meet.toObject(),
        participation_status: participant?.attendance_status || "not_joined",
        can_access: participant?.can_access_materials || false,
        payment_status: participant?.payment_status || "pending",
        joined_at: participant?.joined_at,
      },
    });
  } catch (error) {
    console.error("Error fetching meet:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching meet",
      error: error.message,
    });
  }
};

// Join a meet
export const joinMeet = async (req, res) => {
  try {
    const { meet_id } = req.params;
    const { user_id, payment_details } = req.body;

    // Validate input
    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
        canJoin: false,
        reason: "invalid_request",
      });
    }

    const meet = await CourseMeet.findById(meet_id).populate(
      "course_id",
      "coursename",
    );
    if (!meet) {
      return res.status(404).json({
        success: false,
        message: "Meet not found",
        canJoin: false,
        reason: "meet_not_found",
      });
    }

    // Check if meet is completed or cancelled
    if (meet.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "This meet has already been completed",
        canJoin: false,
        reason: "meet_completed",
      });
    }

    if (meet.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This meet has been cancelled",
        canJoin: false,
        reason: "meet_cancelled",
      });
    }

    // Check join window - 15 minutes before to meet end
    const now = new Date();
    const meetStart = new Date(meet.scheduled_date);
    const meetEnd = new Date(meetStart.getTime() + meet.duration * 60000);
    const joinWindowStart = new Date(meetStart.getTime() - 15 * 60000); // 15 min before

    if (now < joinWindowStart) {
      const minutesUntilOpen = Math.ceil((joinWindowStart - now) / 60000);
      return res.status(400).json({
        success: false,
        message: `Join window opens ${minutesUntilOpen} minutes before the meet starts`,
        canJoin: false,
        reason: "too_early",
        opens_at: joinWindowStart,
      });
    }

    if (now > meetEnd) {
      return res.status(400).json({
        success: false,
        message: "This meet has ended",
        canJoin: false,
        reason: "meet_ended",
      });
    }

    // Check if user has access to the course
    const user = await User.findById(user_id).select(
      "enrolledCourses name phone",
    );
    if (!user) {
      console.log("❌ User not found:", user_id);
      return res.status(404).json({
        success: false,
        message: "User not found",
        canJoin: false,
        reason: "user_not_found",
      });
    }

    console.log("📚 User enrolledCourses:", user.enrolledCourses);
    console.log("📚 Meet course_id:", meet.course_id._id);

    const hasAccess =
      user.enrolledCourses?.some(
        (ec) => ec.course.toString() === meet.course_id._id.toString(),
      ) || false;

    console.log("✅ User has access to course:", hasAccess);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You need to purchase this course first to join the meet",
        canJoin: false,
        reason: "course_not_purchased",
      });
    }

    // Check max participants
    if (meet.max_participants > 0) {
      const participantCount = await MeetParticipant.countDocuments({
        meet_id: meet_id,
        attendance_status: { $in: ["joined", "completed"] },
      });

      if (participantCount >= meet.max_participants) {
        return res.status(400).json({
          success: false,
          message: "This meet has reached maximum capacity",
          canJoin: false,
          reason: "capacity_full",
        });
      }
    }

    // Find or create participant record
    let participant = await MeetParticipant.findOne({
      meet_id: meet_id,
      user_id: user_id,
    });

    console.log("📋 Participant found:", participant ? "Yes" : "No");
    if (participant) {
      console.log("💳 Participant payment status:", participant.payment_status);
      console.log("💰 Meet is paid:", meet.is_paid_meet);
    }

    if (participant) {
      console.log("📋 Existing participant found");
      console.log("💳 Payment status:", participant.payment_status);
      console.log("👤 Attendance status:", participant.attendance_status);
      console.log("💰 Meet is_paid_meet:", meet.is_paid_meet);
      console.log("💵 Meet price:", meet.price);

      // Fix invalid payment_status values from old records
      if (participant.payment_status === "not_required") {
        console.log(
          "🔧 Fixing invalid payment_status 'not_required' to 'completed'",
        );
        participant.payment_status = "completed";
      }

      // Check payment if required for paid meets
      if (meet.is_paid_meet && participant.payment_status !== "completed") {
        console.log("❌ Payment required but not completed");
        if (!payment_details) {
          return res.status(403).json({
            success: false,
            message: "Payment required to join this meet",
            payment_required: true,
            payment_amount: meet.price,
            canJoin: false,
            reason: "payment_required",
          });
        }

        // Import DirectMeetFees model
        const DirectMeetFees = (
          await import("../../Models/Data-Maintenance/DirectMeetFees.js")
        ).default;

        const feeRecord = new DirectMeetFees({
          studentID: user_id,
          name: user?.name || "Unknown",
          gender: payment_details.gender || "Other",
          amount: meet.price,
          paymentType: payment_details.paymentType || "Online",
          course: meet.course_name,
          meet_id: meet._id,
          meet_title: meet.title,
        });

        await feeRecord.save();

        participant.payment_status = "completed";
        participant.payment_date = new Date();
        participant.payment_id = feeRecord._id;
      }

      // Check attendance window if already joined
      if (participant.joined_at) {
        const daysSinceFirstJoin = Math.floor(
          (new Date() - participant.joined_at) / (1000 * 60 * 60 * 24),
        );
        const attendanceLimit = meet.attendance_days_limit || 7;
        if (daysSinceFirstJoin > attendanceLimit) {
          return res.status(403).json({
            success: false,
            message: `Attendance period expired. Maximum ${attendanceLimit} days from first join allowed.`,
            days_since_join: daysSinceFirstJoin,
            attendance_days_limit: attendanceLimit,
            canJoin: false,
            reason: "attendance_expired",
          });
        }
      }

      // Update existing participant
      if (participant.attendance_status === "not_joined") {
        console.log("✅ Updating participant from not_joined to joined");
        participant.attendance_status = "joined";
        if (!participant.joined_at) {
          participant.joined_at = new Date();
        }
        participant.can_access_materials = true;

        // Fix payment_status if it's invalid (for free meets)
        if (
          !meet.is_paid_meet &&
          participant.payment_status === "not_required"
        ) {
          participant.payment_status = "completed";
        }
      } else if (participant.attendance_status === "joined") {
        // Already joined
        return res.json({
          success: true,
          message: "You have already joined this meet",
          participant,
          meet_link: meet.meet_type === "online" ? meet.meet_link : null,
          location: meet.meet_type === "offline" ? meet.location : null,
          already_joined: true,
          can_access_materials: participant.can_access_materials,
        });
      }
    } else {
      // Check payment for new participant if paid meet
      if (meet.is_paid_meet) {
        if (!payment_details) {
          return res.status(403).json({
            success: false,
            message: "Payment required to join this meet",
            payment_required: true,
            payment_amount: meet.price,
            canJoin: false,
            reason: "payment_required",
          });
        }

        // Import DirectMeetFees model
        const DirectMeetFees = (
          await import("../../Models/Data-Maintenance/DirectMeetFees.js")
        ).default;

        const feeRecord = new DirectMeetFees({
          studentID: user_id,
          name: user?.name || "Unknown",
          gender: payment_details.gender || "Other",
          amount: meet.price,
          paymentType: payment_details.paymentType || "Online",
          course: meet.course_name,
          meet_id: meet._id,
          meet_title: meet.title,
        });

        await feeRecord.save();

        // Create new participant with payment completed
        participant = new MeetParticipant({
          meet_id: meet_id,
          user_id: user_id,
          attendance_status: "joined",
          payment_status: "completed",
          payment_id: feeRecord._id,
          payment_date: new Date(),
          can_access_materials: true,
          joined_at: new Date(),
        });
      } else {
        // Create new participant for free meet
        participant = new MeetParticipant({
          meet_id: meet_id,
          user_id: user_id,
          attendance_status: "joined",
          payment_status: "completed", // Free meet - no payment required, so mark as completed
          can_access_materials: true,
          joined_at: new Date(),
        });
      }
    }

    await participant.save();

    // Update meet status if needed (use updateOne to avoid validation)
    if (meet.status === "scheduled") {
      await CourseMeet.updateOne(
        { _id: meet_id },
        { $set: { status: "ongoing" } },
      );
    }

    // Create notification for successful join
    const attendanceLimit = meet.attendance_days_limit || 7;
    const notification = new MeetNotification({
      meet_id: meet._id,
      user_id: user_id,
      notification_type: "user_joined",
      title: "Successfully Joined Meet",
      message: `You have successfully joined "${meet.title}". Materials will be accessible for ${attendanceLimit} days from now.`,
      priority: "medium",
      action_url: `/user/meets/${meet._id}`,
    });
    await notification.save();

    res.json({
      success: true,
      message: "Successfully joined the meet",
      participant,
      meet_link: meet.meet_type === "online" ? meet.meet_link : null,
      location: meet.meet_type === "offline" ? meet.location : null,
      can_access_materials: true,
      canJoin: true,
    });
  } catch (error) {
    console.error("Error joining meet:", error);
    res.status(500).json({
      success: false,
      message: "Error joining meet",
      error: error.message,
      canJoin: false,
      reason: "server_error",
    });
  }
};

// Mark meet as completed for user
export const completeMeet = async (req, res) => {
  try {
    const { meet_id } = req.params;
    const { user_id } = req.body;

    const participant = await MeetParticipant.findOne({
      meet_id: meet_id,
      user_id: user_id,
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: "You haven't joined this meet yet",
      });
    }

    if (participant.attendance_status === "completed") {
      return res.json({
        success: true,
        message: "Meet already marked as completed",
        participant,
      });
    }

    if (participant.attendance_status !== "joined") {
      return res.status(400).json({
        success: false,
        message: "You must join the meet before marking it as completed",
      });
    }

    // Calculate duration
    if (participant.joined_at) {
      const duration = Math.floor((new Date() - participant.joined_at) / 60000);
      participant.total_duration_minutes = duration;
    }

    participant.attendance_status = "completed";
    participant.completed_at = new Date();
    await participant.save();

    // Create notification
    const meet = await CourseMeet.findById(meet_id);
    await MeetNotification.create({
      meet_id: meet_id,
      user_id: user_id,
      notification_type: "meet_completed",
      title: "Meet Completed",
      message: `You have completed "${meet.title}"`,
      priority: "low",
      action_url: `/user/meets/${meet_id}`,
    });

    res.json({
      success: true,
      message: "Meet marked as completed",
      participant,
    });
  } catch (error) {
    console.error("Error completing meet:", error);
    res.status(500).json({
      success: false,
      message: "Error completing meet",
      error: error.message,
    });
  }
};

// Get user's meet history
export const getUserMeetHistory = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const participants = await MeetParticipant.find({ user_id })
      .populate({
        path: "meet_id",
        populate: {
          path: "course_id",
          select: "coursename category",
        },
      })
      .sort({ joined_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MeetParticipant.countDocuments({ user_id });

    res.json({
      success: true,
      history: participants,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_records: total,
        per_page: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching meet history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching meet history",
      error: error.message,
    });
  }
};

// Validate if user can join a meet
export const validateJoinAccess = async (req, res) => {
  try {
    const { meet_id, user_id } = req.params;

    const meet = await CourseMeet.findById(meet_id).populate(
      "course_id",
      "coursename",
    );
    if (!meet) {
      return res.json({
        canJoin: false,
        reason: "meet_not_found",
        message: "Meet not found",
      });
    }

    // Check meet status
    if (meet.status === "completed") {
      return res.json({
        canJoin: false,
        reason: "meet_completed",
        message: "This meet has already been completed",
      });
    }

    if (meet.status === "cancelled") {
      return res.json({
        canJoin: false,
        reason: "meet_cancelled",
        message: "This meet has been cancelled",
      });
    }

    // Check join window
    const now = new Date();
    const meetStart = new Date(meet.scheduled_date);
    const meetEnd = new Date(meetStart.getTime() + meet.duration * 60000);
    const joinWindowStart = new Date(meetStart.getTime() - 15 * 60000);

    if (now < joinWindowStart) {
      const minutesUntilOpen = Math.ceil((joinWindowStart - now) / 60000);
      return res.json({
        canJoin: false,
        reason: "too_early",
        message: `Join window opens ${minutesUntilOpen} minutes before the meet starts`,
        opens_at: joinWindowStart,
      });
    }

    if (now > meetEnd) {
      return res.json({
        canJoin: false,
        reason: "meet_ended",
        message: "This meet has ended",
      });
    }

    // Check course enrollment
    const user = await User.findById(user_id).select("enrolledCourses");
    if (!user) {
      return res.json({
        canJoin: false,
        reason: "user_not_found",
        message: "User not found",
      });
    }

    const hasAccess =
      user.enrolledCourses?.some(
        (ec) => ec.course.toString() === meet.course_id._id.toString(),
      ) || false;
    if (!hasAccess) {
      return res.json({
        canJoin: false,
        reason: "course_not_purchased",
        message: "You need to purchase this course first",
      });
    }

    // Check max participants
    if (meet.max_participants > 0) {
      const participantCount = await MeetParticipant.countDocuments({
        meet_id: meet_id,
        attendance_status: { $in: ["joined", "completed"] },
      });

      if (participantCount >= meet.max_participants) {
        return res.json({
          canJoin: false,
          reason: "capacity_full",
          message: "This meet has reached maximum capacity",
        });
      }
    }

    // Check if already joined
    const participant = await MeetParticipant.findOne({
      meet_id: meet_id,
      user_id: user_id,
    });

    if (participant && participant.attendance_status === "joined") {
      return res.json({
        canJoin: true,
        already_joined: true,
        message: "You have already joined this meet",
        meet_link: meet.meet_type === "online" ? meet.meet_link : null,
        location: meet.meet_type === "offline" ? meet.location : null,
      });
    }

    res.json({
      canJoin: true,
      message: "You can join this meet",
      meet_type: meet.meet_type,
    });
  } catch (error) {
    console.error("Error validating join access:", error);
    res.status(500).json({
      canJoin: false,
      reason: "server_error",
      message: "Error validating access",
      error: error.message,
    });
  }
};
