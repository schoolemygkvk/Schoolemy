import MeetParticipant from '../../Models/DirectMeet/MeetParticipantModel.js';
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";


export const fixMaterialAccessFlags = async (req, res) => {
  try {
    const { meet_id } = req.params;

    // Get all participants for this meet
    const participants = await MeetParticipant.find(
      meet_id ? { meet_id } : {}
    );

    let updatedCount = 0;
    let alreadySetCount = 0;
    let noAttendanceCount = 0;

    for (const participant of participants) {
      const hasAttendance = participant.attendance_dates.some(
        att => att.status === 'present' || att.status === 'late'
      );

      if (hasAttendance) {
        if (!participant.can_access_materials) {
          participant.can_access_materials = true;
          await participant.save();
          updatedCount++;
        } else {
          alreadySetCount++;
        }
      } else {
        noAttendanceCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Material access flags updated',
      stats: {
        total_participants: participants.length,
        updated: updatedCount,
        already_set: alreadySetCount,
        no_attendance: noAttendanceCount
      }
    });

  } catch (error) {
    console.error('Error fixing material access flags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fix material access flags',
      error: error.message
    });
  }
};
