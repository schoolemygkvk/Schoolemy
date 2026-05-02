import CourseMeet from '../../Models/DirectMeet/CourseMeetModel.js';
import MeetParticipant from '../../Models/DirectMeet/MeetParticipantModel.js';
import MeetMaterial from '../../Models/DirectMeet/MeetMaterialModel.js';
import MeetNotification from '../../Models/DirectMeet/MeetNotificationModel.js';
import Course from '../../Models/Courses/coursemodel.js';
import User from '../../Models/User/User-Model.js';
import Admin from '../../Models/Admin/Admin-login-Model.js';
import mongoose from 'mongoose';
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Generate unique meet ID with collision detection
const generateMeetId = async (courseId) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  // Get count of ALL meets this month (not just for this course)
  const startOfMonth = new Date(year, now.getMonth(), 1);
  const endOfMonth = new Date(year, now.getMonth() + 1, 0);
  
  const monthlyCount = await CourseMeet.countDocuments({
    createdAt: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  });
  
  // Generate base meet_id
  let sequence = monthlyCount + 1;
  let meet_id = `CM${year}${month}${String(sequence).padStart(3, '0')}`;
  
  // Check if meet_id already exists and increment if needed
  let existingMeet = await CourseMeet.findOne({ meet_id });
  let retryCount = 0;
  const maxRetries = 100;
  
  while (existingMeet && retryCount < maxRetries) {
    sequence++;
    meet_id = `CM${year}${month}${String(sequence).padStart(3, '0')}`;
    existingMeet = await CourseMeet.findOne({ meet_id });
    retryCount++;
  }
  
  // Fallback to timestamp-based ID if collision persists
  if (retryCount >= maxRetries) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    meet_id = `CM${year}${month}${timestamp}${random}`;
  }
  
  return meet_id;
};

// Send notification to users
const sendNotificationToUsers = async (meetId, userIds, notificationType, title, message) => {
  try {
    const notifications = userIds.map(userId => ({
      meet_id: meetId,
      user_id: userId,
      notification_type: notificationType,
      title,
      message,
    }));

    await MeetNotification.insertMany(notifications);
    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Error sending notifications:', error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// MEET MANAGEMENT CONTROLLERS
// ============================================================================

// Create Meet inside a Course
export const createCourseMeet = async (req, res) => {
  try {
    const { 
      course_id, 
      title, 
      description, 
      meet_date, 
      meet_time, 
      duration_minutes, 
      price,
      meet_type,
      meet_link,
      location,
      material_access_type
    } = req.body;

    // Validate required fields
    if (!course_id || !title || !description || !meet_date || !meet_time || !duration_minutes) {
      return sendError(res, 400, "course_id, title, description, meet_date, meet_time, and duration_minutes are required");
    }

    // Validate meet_type specific requirements
    if (meet_type === 'online' && !meet_link) {
      return sendError(res, 400, "meet_link is required for online meets");
    }

    if (meet_type === 'offline' && !location) {
      return sendError(res, 400, "location is required for offline meets");
    }

    // Verify course exists
    const course = await Course.findById(course_id);
    if (!course) {
      return sendError(res, 404, "Course not found");
    }

    // Generate unique meet_id
    const meet_id = await generateMeetId(course_id);

    // Determine if it's a paid meet
    const is_paid_meet = price && price > 0;

    // Create meet
    const courseMeet = new CourseMeet({
      meet_id,
      course_id,
      course_name: course.coursename,
      category: course.category,
      title,
      description,
      meet_date,
      meet_time,
      duration_minutes,
      price: price || 0,
      is_paid_meet,
      meet_type: meet_type || 'online',
      meet_link: meet_type === 'online' ? meet_link : null,
      location: meet_type === 'offline' ? location : null,
      material_access_type: material_access_type || 'attended_only',
      created_by: req.user?._id || req.body.created_by,
    });

    await courseMeet.save();

    // ============================================================================
    // AUTO-ASSIGN ENROLLED USERS & SEND NOTIFICATIONS
    // ============================================================================
    try {
      // Get all users enrolled in this course
      const enrolledUsers = await User.find({
        'enrolledCourses.course': course_id
      }).select('_id name email');

      if (enrolledUsers.length > 0) {
        const userIds = enrolledUsers.map(user => user._id);

        // Create participant records for all enrolled users
        const participants = userIds.map(userId => ({
          meet_id: courseMeet._id,
          user_id: userId,
          course_id: course_id,
          assigned_by: req.user?._id || req.body.created_by,
          is_payment_required: is_paid_meet,
          payment_status: is_paid_meet ? 'pending' : 'not_required',
          payment_amount: price || 0,
          attendance_status: 'not_joined',
          material_access: material_access_type === 'all_enrolled'
        }));

        // Insert participants (ignore duplicates)
        await MeetParticipant.insertMany(participants, { ordered: false })
          .catch(error => {
            if (error.code !== 11000) {
              console.error('Error inserting participants:', error);
            }
          });

        // Send notifications to all assigned users
        const notifications = userIds.map(userId => ({
          meet_id: courseMeet._id,
          user_id: userId,
          notification_type: 'meet_assigned',
          title: `New Meeting: ${title}`,
          message: `You have been assigned to "${title}" scheduled on ${new Date(meet_date).toLocaleDateString()} at ${meet_time}. ${meet_type === 'online' ? 'Join link will be available before the meeting.' : `Location: ${location}`}`,
          priority: 'medium',
          action_url: `/user/meets/${courseMeet._id}`
        }));
        
        try {
          await MeetNotification.insertMany(notifications);
        } catch (notificationError) {
          console.error('Error creating notifications:', notificationError);
          console.error('Error name:', notificationError.name);
          console.error('Error message:', notificationError.message);
          if (notificationError.errors) {
            console.error('Validation errors:', notificationError.errors);
          }
        }

        res.status(201).json({ 
          success: true, 
          message: 'Course Meet created successfully and users assigned', 
          meet: courseMeet,
          assigned_users: userIds.length,
          notifications_sent: userIds.length
        });
      } else {
        // No users enrolled yet
        res.status(201).json({ 
          success: true, 
          message: 'Course Meet created successfully (no enrolled users yet)', 
          meet: courseMeet,
          assigned_users: 0,
          notifications_sent: 0
        });
      }
    } catch (assignError) {
      console.error('Meet created but auto-assignment failed:', assignError);
      // Meet is still created successfully, just assignment failed
      res.status(201).json({ 
        success: true, 
        message: 'Course Meet created successfully but auto-assignment failed', 
        meet: courseMeet,
        assignment_error: assignError.message
      });
    }

  } catch (error) {
    console.error('Error creating course meet:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000 && error.keyPattern && error.keyPattern.meet_id) {
      return res.status(409).json({ 
        success: false, 
        message: 'Duplicate meet ID detected. Please try creating the meet again.', 
        error: 'DUPLICATE_MEET_ID',
        details: 'The system detected a duplicate meet ID. This is rare but can happen under high load. Please retry.'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Error creating course meet', 
      error: error.message 
    });
  }
};

// Get All Meets for a Course
export const getMeetsByCourse = async (req, res) => {
  try {
    const { course_id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { course_id, is_active: true };
    if (status) filter.status = status;

    const meets = await CourseMeet.find(filter)
      .sort({ meet_date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('created_by', 'name email');

    const totalRecords = await CourseMeet.countDocuments(filter);

    res.status(200).json({ 
      success: true, 
      meets,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching course meets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching course meets', 
      error: error.message 
    });
  }
};

// Get All Meets (Admin view)
export const getAllMeets = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      status, 
      search 
    } = req.query;

    const filter = { is_active: true };
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { course_name: { $regex: search, $options: 'i' } },
        { meet_id: { $regex: search, $options: 'i' } }
      ];
    }

    const meets = await CourseMeet.find(filter)
      .sort({ meet_date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('course_id', 'coursename category')
      .populate('created_by', 'name email');

    const totalRecords = await CourseMeet.countDocuments(filter);

    res.status(200).json({ 
      success: true, 
      meets,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching meets:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching meets', 
      error: error.message 
    });
  }
};

// Get Meet by ID
export const getMeetById = async (req, res) => {
  try {
    const meet = await CourseMeet.findById(req.params.id)
      .populate('course_id', 'coursename category price')
      .populate('created_by', 'name email');

    if (!meet) {
      return sendError(res, 404, "Meet not found");
    }

    // Get participant count
    const participantCount = await MeetParticipant.countDocuments({ meet_id: meet._id });
    const attendedCount = await MeetParticipant.countDocuments({ 
      meet_id: meet._id, 
      attendance_status: { $in: ['joined', 'completed'] } 
    });

    res.status(200).json({ 
      success: true, 
      meet: {
        ...meet.toObject(),
        participant_count: participantCount,
        attended_count: attendedCount,
      }
    });
  } catch (error) {
    console.error('Error fetching meet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching meet', 
      error: error.message 
    });
  }
};

// Update Meet
export const updateCourseMeet = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // skip_notifications: when true, do not send user notifications (for content/other edits only)
    const skipNotifications = !!updateData.skip_notifications;
    delete updateData.skip_notifications;

    // Don't allow changing course_id
    delete updateData.course_id;
    delete updateData.meet_id;

    // Ensure price/amount is a number and update is_paid_meet
    if (updateData.price !== undefined) {
      updateData.price = Number(updateData.price) || 0;
      updateData.is_paid_meet = updateData.price > 0;
    }

    const updatedMeet = await CourseMeet.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('course_id', 'coursename category');

    if (!updatedMeet) {
      return sendError(res, 404, "Meet not found");
    }

    // Sync MeetParticipant payment_amount and is_payment_required when price changes (user side will reflect updates)
    if (updateData.price !== undefined) {
      const newPrice = Number(updatedMeet.price) || 0;
      const isPaidMeet = newPrice > 0;
      // Update payment amount and is_payment_required for all participants
      await MeetParticipant.updateMany(
        { meet_id: id },
        { $set: { payment_amount: newPrice, is_payment_required: isPaidMeet } }
      );
      // Meet became free: set pending/failed -> not_required (keep completed as-is)
      if (!isPaidMeet) {
        await MeetParticipant.updateMany(
          { meet_id: id, payment_status: { $in: ['pending', 'failed'] } },
          { $set: { payment_status: 'not_required' } }
        );
      } else {
        // Meet became paid: set not_required -> pending (keep completed as-is)
        await MeetParticipant.updateMany(
          { meet_id: id, payment_status: 'not_required' },
          { $set: { payment_status: 'pending' } }
        );
      }
    }

    // Notify participants about update (skip when skip_notifications=true)
    if (!skipNotifications) {
      const participants = await MeetParticipant.find({ meet_id: id }).select('user_id');
      const userIds = participants.map(p => p.user_id);

      if (userIds.length > 0) {
        await sendNotificationToUsers(
          id,
          userIds,
          'meet_updated',
          'Meet Updated',
          `The meet "${updatedMeet.title}" has been updated. Please check the details.`
        );
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Meet updated successfully', 
      meet: updatedMeet 
    });
  } catch (error) {
    console.error('Error updating meet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating meet', 
      error: error.message 
    });
  }
};

// Delete Meet (soft delete)
export const deleteCourseMeet = async (req, res) => {
  try {
    const { id } = req.params;

    const meet = await CourseMeet.findByIdAndUpdate(
      id,
      { is_active: false, status: 'cancelled' },
      { new: true }
    );

    if (!meet) {
      return sendError(res, 404, "Meet not found");
    }

    // Notify participants about cancellation
    const participants = await MeetParticipant.find({ meet_id: id }).select('user_id');
    const userIds = participants.map(p => p.user_id);
    
    if (userIds.length > 0) {
      await sendNotificationToUsers(
        id,
        userIds,
        'meet_cancelled',
        'Meet Cancelled',
        `The meet "${meet.title}" has been cancelled.`
      );
    }

    res.status(200).json({ 
      success: true, 
      message: 'Meet cancelled successfully' 
    });
  } catch (error) {
    console.error('Error deleting meet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting meet', 
      error: error.message 
    });
  }
};

// ============================================================================
// PARTICIPANT MANAGEMENT CONTROLLERS
// ============================================================================

// Assign users to meet (only users who purchased the course)
export const assignUsersToMeet = async (req, res) => {
  try {
    const { meet_id, user_ids } = req.body;

    if (!meet_id || !user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return sendError(res, 400, "meet_id and user_ids array are required");
    }

    // Get meet details
    const meet = await CourseMeet.findById(meet_id);
    if (!meet) {
      return sendError(res, 404, "Meet not found");
    }

    // Verify users have purchased the course
    const users = await User.find({
      _id: { $in: user_ids },
      'enrolledCourses.course': meet.course_id
    }).select('_id name email');

    if (users.length === 0) {
      return sendError(res, 400, "No users found who have purchased this course");
    }

    const validUserIds = users.map(u => u._id);

    // Create participant records
    const participants = validUserIds.map(userId => ({
      meet_id,
      user_id: userId,
      course_id: meet.course_id,
      assigned_by: req.user?._id || req.body.assigned_by,
      is_payment_required: meet.is_paid_meet,
      payment_status: meet.is_paid_meet ? 'pending' : 'not_required',
      payment_amount: meet.price || 0,
    }));

    // Use insertMany with ordered: false to skip duplicates
    const result = await MeetParticipant.insertMany(participants, { ordered: false })
      .catch(error => {
        // Ignore duplicate key errors
        if (error.code !== 11000) throw error;
        return { insertedCount: 0 };
      });

    // Send notifications
    await sendNotificationToUsers(
      meet_id,
      validUserIds,
      'meet_scheduled',
      'New Meet Scheduled',
      `You have been assigned to the meet: "${meet.title}" on ${new Date(meet.meet_date).toLocaleDateString()}`
    );

    res.status(201).json({ 
      success: true, 
      message: 'Users assigned to meet successfully',
      assigned_count: validUserIds.length,
      total_requested: user_ids.length,
    });
  } catch (error) {
    console.error('Error assigning users to meet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error assigning users to meet', 
      error: error.message 
    });
  }
};

// Get users who purchased a course (for assignment)
export const getUsersForCourse = async (req, res) => {
  try {
    const { course_id } = req.params;

    const users = await User.find({
      'enrolledCourses.course': course_id
    }).select('_id name email phone enrolledCourses');

    // Extract enrollment details
    const usersWithEnrollment = users.map(user => {
      const enrollment = user.enrolledCourses.find(
        ec => ec.course.toString() === course_id
      );
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        enrolled_at: enrollment?.enrollmentDate,
      };
    });

    res.status(200).json({ 
      success: true, 
      users: usersWithEnrollment,
      count: usersWithEnrollment.length 
    });
  } catch (error) {
    console.error('Error fetching users for course:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users', 
      error: error.message 
    });
  }
};

// Get attendance list for a meet
export const getMeetAttendance = async (req, res) => {
  try {
    const { meet_id } = req.params;
    const { status, page = 1, limit = 50 } = req.query;

    // Convert meet_id to ObjectId if it's a valid MongoDB ObjectId string
    const meetObjectId = mongoose.Types.ObjectId.isValid(meet_id) 
      ? new mongoose.Types.ObjectId(meet_id) 
      : meet_id;

    const filter = { meet_id: meetObjectId };
    if (status) filter.attendance_status = status;

    const participants = await MeetParticipant.find(filter)
      .populate({
        path: 'user_id',
        select: 'username email mobile studentRegisterNumber'
      })
      .populate({
        path: 'meet_id',
        select: 'title meet_date attendance_days_limit'
      })
      .sort({ attendance_status: 1, joined_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const totalRecords = await MeetParticipant.countDocuments(filter);

    // Get status counts
    const statusCounts = await MeetParticipant.aggregate([
      { $match: { meet_id: meetObjectId } },
      { $group: { _id: '$attendance_status', count: { $sum: 1 } } }
    ]);

    const stats = {
      total: totalRecords,
      not_joined: 0,
      joined: 0,
      completed: 0,
      absent: 0,
    };

    statusCounts.forEach(item => {
      stats[item._id] = item.count;
    });

    res.status(200).json({ 
      success: true, 
      participants,
      stats,
      totalRecords,
      currentPage: Number(page),
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching attendance', 
      error: error.message 
    });
  }
};

// Mark user join
export const markUserJoin = async (req, res) => {
  try {
    const { meet_id, user_id, payment_details } = req.body;

    const participant = await MeetParticipant.findOne({ meet_id, user_id });
    
    if (!participant) {
      return sendError(res, 404, "Participant not found");
    }

    const meet = await CourseMeet.findById(meet_id);
    if (!meet) {
      return sendError(res, 404, "Meet not found");
    }

    // Check payment if required
    if (participant.is_payment_required && participant.payment_status !== 'completed') {
      if (!payment_details) {
        return res.status(403).json({ 
          success: false, 
          message: 'Payment required to join this meet',
          payment_required: true,
          payment_amount: participant.payment_amount
        });
      }

      // Create payment record in DirectMeetFees
      const DirectMeetFees = (await import('../../Models/Data-Maintenance/DirectMeetFees.js')).default;
      const User = (await import('../../Models/User/User-Model.js')).default;
      const user = await User.findById(user_id).select('name phone');
      
      const feeRecord = new DirectMeetFees({
        studentID: user_id,
        name: user?.name || 'Unknown',
        gender: payment_details.gender || 'Other',
        amount: participant.payment_amount,
        paymentType: payment_details.paymentType || 'Online',
        course: meet.course_name,
        meet_id: meet._id,
        meet_title: meet.title
      });
      
      await feeRecord.save();

      // Update participant payment status
      participant.payment_status = 'completed';
      participant.payment_date = new Date();
      participant.payment_id = feeRecord._id;
    }

    // Check if already joined within attendance limit
    if (participant && participant.joined_at) {
      const daysSinceFirstJoin = Math.floor((new Date() - participant.joined_at) / (1000 * 60 * 60 * 24));
      const attendanceLimit = meet.attendance_days_limit || 1;
      if (daysSinceFirstJoin > attendanceLimit) {
        return res.status(403).json({
          success: false,
          message: `Attendance period expired. Maximum ${attendanceLimit} days from first join allowed.`,
          days_since_join: daysSinceFirstJoin,
          attendance_days_limit: attendanceLimit
        });
      }
    }

    participant.attendance_status = 'joined';
    if (!participant.joined_at) {
      participant.joined_at = new Date();
    }
    participant.can_access_materials = true;
    await participant.save();

    // Send notification to user
    const notification = new MeetNotification({
      meet_id: meet._id,
      user_id: user_id,
      notification_type: 'user_joined',
      title: 'Successfully Joined Meet',
      message: `You have successfully joined "${meet.title}". Materials are now accessible.`,
      priority: 'medium',
      action_url: `/user/meets/${meet._id}`
    });
    await notification.save();

    res.status(200).json({ 
      success: true, 
      message: 'Attendance marked successfully',
      participant,
      can_access_materials: true
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error marking attendance', 
      error: error.message 
    });
  }
};

// Mark daily attendance for a user
export const markDailyAttendance = async (req, res) => {
  try {
    const { meet_id, user_id, attendance_date, status } = req.body;

    if (!meet_id || !user_id || !attendance_date) {
      return sendError(res, 400, "meet_id, user_id, and attendance_date are required");
    }

    const participant = await MeetParticipant.findOne({ meet_id, user_id });
    
    if (!participant) {
      return sendError(res, 404, "Participant not found");
    }

    const dateToMark = new Date(attendance_date);
    dateToMark.setHours(0, 0, 0, 0);

    // Check if attendance already marked for this date
    const existingAttendance = participant.attendance_dates.find(
      att => new Date(att.date).setHours(0, 0, 0, 0) === dateToMark.getTime()
    );

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status || 'present';
      if (status === 'present') {
        if (!existingAttendance.check_in_time) {
          existingAttendance.check_in_time = new Date();
        }
      }
    } else {
      // Add new attendance record
      participant.attendance_dates.push({
        date: dateToMark,
        check_in_time: status === 'present' ? new Date() : null,
        status: status || 'present'
      });
    }

    // Recalculate total_attendance_days after any update
    participant.total_attendance_days = participant.attendance_dates.filter(
      att => att.status === 'present' || att.status === 'late'
    ).length;

    // Update overall attendance status
    if (participant.attendance_status === 'not_joined' && status === 'present') {
      participant.attendance_status = 'joined';
      participant.joined_at = new Date();
    }

    // Set can_access_materials if user has at least one present/late attendance
    const hasAttendance = participant.attendance_dates.some(
      att => att.status === 'present' || att.status === 'late'
    );
    if (hasAttendance) {
      participant.can_access_materials = true;
    }

    await participant.save();

    res.status(200).json({ 
      success: true, 
      message: 'Daily attendance marked successfully',
      participant,
      total_attendance_days: participant.total_attendance_days
    });
  } catch (error) {
    console.error('Error marking daily attendance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error marking attendance', 
      error: error.message 
    });
  }
};

// Mark meet as completed for user
export const markMeetCompleted = async (req, res) => {
  try {
    const { meet_id, user_id } = req.body;

    const participant = await MeetParticipant.findOne({ meet_id, user_id });
    
    if (!participant) {
      return sendError(res, 404, "Participant not found");
    }

    participant.attendance_status = 'completed';
    participant.completed_at = new Date();
    await participant.save();

    res.status(200).json({ 
      success: true, 
      message: 'Meet marked as completed',
      participant 
    });
  } catch (error) {
    console.error('Error marking completion:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error marking completion', 
      error: error.message 
    });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { meet_id, user_id, payment_id, payment_status } = req.body;

    const participant = await MeetParticipant.findOne({ meet_id, user_id });
    
    if (!participant) {
      return sendError(res, 404, "Participant not found");
    }

    participant.payment_status = payment_status;
    participant.payment_id = payment_id;
    if (payment_status === 'completed') {
      participant.payment_date = new Date();
    }
    await participant.save();

    res.status(200).json({ 
      success: true, 
      message: 'Payment status updated',
      participant 
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating payment', 
      error: error.message 
    });
  }
};

export default {
  createCourseMeet,
  getMeetsByCourse,
  getAllMeets,
  getMeetById,
  updateCourseMeet,
  deleteCourseMeet,
  assignUsersToMeet,
  getUsersForCourse,
  getMeetAttendance,
  markUserJoin,
  markDailyAttendance,
  markMeetCompleted,
  updatePaymentStatus,
};
