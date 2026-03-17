import CourseMeet from "../Models/DirectMeet/CourseMeetModel.js";
import MeetParticipant from "../Models/DirectMeet/MeetParticipantModel.js";
import MeetNotification from "../Models/DirectMeet/MeetNotificationModel.js";

/**
 * Auto-complete meets that have ended + 30 minutes grace period
 * Marks participants who joined but didn't manually complete as completed
 * Sends notifications to participants
 */
export const autoCompleteMeets = async () => {
  try {
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000);

    // Find ongoing meets that ended more than 30 minutes ago
    const meetsToComplete = await CourseMeet.find({
      status: 'ongoing',
      scheduled_date: { $lte: thirtyMinutesAgo }
    });

    console.log(`[Meet Auto-Complete] Found ${meetsToComplete.length} meets to auto-complete`);

    for (const meet of meetsToComplete) {
      const meetEnd = new Date(meet.scheduled_date.getTime() + meet.duration * 60000);
      const graceEnd = new Date(meetEnd.getTime() + 30 * 60000);

      if (now >= graceEnd) {
        // Update meet status
        meet.status = 'completed';
        await meet.save();

        // Auto-complete participants who are still in 'joined' status
        const joinedParticipants = await MeetParticipant.find({
          meet_id: meet._id,
          attendance_status: 'joined'
        });

        for (const participant of joinedParticipants) {
          participant.attendance_status = 'completed';
          participant.completed_at = new Date();
          
          // Calculate duration
          if (participant.joined_at) {
            const duration = Math.floor((meetEnd - participant.joined_at) / 60000);
            participant.total_duration_minutes = Math.max(0, duration);
          }
          
          await participant.save();

          // Send completion notification
          await MeetNotification.create({
            meet_id: meet._id,
            user_id: participant.user_id,
            notification_type: 'meet_completed',
            title: 'Meet Auto-Completed',
            message: `The meet "${meet.title}" has been automatically marked as completed`,
            priority: 'low',
            action_url: `/user/meets/${meet._id}`
          });
        }

        // Mark absent participants who never joined
        const notJoinedParticipants = await MeetParticipant.find({
          meet_id: meet._id,
          attendance_status: 'not_joined'
        });

        for (const participant of notJoinedParticipants) {
          participant.attendance_status = 'absent';
          await participant.save();
        }

        console.log(`[Meet Auto-Complete] Completed meet: ${meet.meet_id} - ${meet.title}`);
        console.log(`  - Auto-completed: ${joinedParticipants.length} participants`);
        console.log(`  - Marked absent: ${notJoinedParticipants.length} participants`);
      }
    }

    return {
      success: true,
      completed_count: meetsToComplete.length,
      timestamp: now
    };

  } catch (error) {
    console.error('[Meet Auto-Complete] Error:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Send reminders for upcoming meets
 * Sends notifications 1 hour and 15 minutes before meet starts
 */
export const sendMeetReminders = async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60000);
    const fifteenMinLater = new Date(now.getTime() + 15 * 60000);

    // Find meets starting in the next hour
    const upcomingMeets = await CourseMeet.find({
      status: 'scheduled',
      scheduled_date: {
        $gte: now,
        $lte: oneHourLater
      }
    }).populate('course_id', 'coursename');

    console.log(`[Meet Reminders] Found ${upcomingMeets.length} upcoming meets`);

    for (const meet of upcomingMeets) {
      const timeDiff = meet.scheduled_date - now;
      const minutesUntilStart = Math.floor(timeDiff / 60000);

      // Send 1-hour reminder
      if (minutesUntilStart >= 55 && minutesUntilStart <= 65) {
        await sendReminderToEnrolled(meet, '1 hour', 'high');
      }
      
      // Send 15-minute reminder
      if (minutesUntilStart >= 10 && minutesUntilStart <= 20) {
        await sendReminderToEnrolled(meet, '15 minutes', 'urgent');
      }
    }

    return {
      success: true,
      checked_meets: upcomingMeets.length,
      timestamp: now
    };

  } catch (error) {
    console.error('[Meet Reminders] Error:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date()
    };
  }
};

/**
 * Helper function to send reminder to all enrolled users
 */
const sendReminderToEnrolled = async (meet, timeUntil, priority) => {
  try {
    const User = (await import("../Models/User/usermodel.js")).default;
    
    // Find users enrolled in this course
    const enrolledUsers = await User.find({
      course: meet.course_id._id
    }).select('_id');

    for (const user of enrolledUsers) {
      // Check if notification already sent
      const existingNotif = await MeetNotification.findOne({
        meet_id: meet._id,
        user_id: user._id,
        notification_type: 'meet_reminder',
        createdAt: { $gte: new Date(Date.now() - 30 * 60000) } // Within last 30 min
      });

      if (!existingNotif) {
        await MeetNotification.create({
          meet_id: meet._id,
          user_id: user._id,
          notification_type: 'meet_reminder',
          title: `Meet starting in ${timeUntil}`,
          message: `"${meet.title}" is starting in ${timeUntil}. Be ready to join!`,
          priority: priority,
          action_url: `/user/meets/${meet._id}`
        });
      }
    }

    console.log(`[Meet Reminders] Sent ${timeUntil} reminder for: ${meet.title}`);
    
  } catch (error) {
    console.error('[Send Reminder] Error:', error);
  }
};

export default {
  autoCompleteMeets,
  sendMeetReminders
};
