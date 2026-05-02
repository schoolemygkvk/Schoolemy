import MeetMaterial from '../../Models/DirectMeet/MeetMaterialModel.js';
import MeetParticipant from '../../Models/DirectMeet/MeetParticipantModel.js';
import CourseMeet from '../../Models/DirectMeet/CourseMeetModel.js';
import MeetNotification from '../../Models/DirectMeet/MeetNotificationModel.js';
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

// ============================================================================
// MATERIAL MANAGEMENT CONTROLLERS
// ============================================================================

// Upload material for a meet
export const uploadMeetMaterial = async (req, res) => {
  try {
    const { 
      meet_id, 
      title, 
      description, 
      file_name, 
      file_url, 
      file_type, 
      file_size,
      access_type 
    } = req.body;

    if (!meet_id || !title || !file_name || !file_url || !file_type) {
      return sendError(res, 400, "meet_id, title, file_name, file_url, and file_type are required");
    }

    // Verify meet exists
    const meet = await CourseMeet.findById(meet_id);
    if (!meet) {
      return sendError(res, 404, "Meet not found");
    }

    // Check if material access is attendance-based
    const materialAccessType = access_type || meet.material_access_type || 'attended_only';
    
    if (materialAccessType === 'attended_only') {
      // Verify at least one student has attended
      const attendedCount = await MeetParticipant.countDocuments({
        meet_id,
        attendance_status: { $in: ['joined', 'completed'] }
      });

      if (attendedCount === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'Cannot upload material. No students have attended the meet yet. Materials can only be uploaded after students attend.',
          attendance_required: true,
          attended_count: 0
        });
      }
    }

    const material = new MeetMaterial({
      meet_id,
      title,
      description,
      file_name,
      file_url,
      file_type,
      file_size,
      access_type: materialAccessType,
      uploaded_by: req.user?._id || req.body.uploaded_by,
    });

    await material.save();

    // Notify participants who have attended and can access materials
    const participants = await MeetParticipant.find({ 
      meet_id, 
      can_access_materials: true,
      attendance_status: { $in: ['joined', 'completed'] }
    }).select('user_id');
    
    if (participants.length > 0) {
      const userIds = participants.map(p => p.user_id);
      const notifications = userIds.map(userId => ({
        meet_id,
        user_id: userId,
        notification_type: 'material_uploaded',
        title: 'New Material Available',
        message: `New study material "${title}" has been uploaded for "${meet.title}". Access within ${meet.attendance_days_limit || 1} days of attendance.`,
        priority: 'high',
        action_url: `/user/meets/${meet_id}/materials`
      }));
      await MeetNotification.insertMany(notifications);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Material uploaded successfully', 
      material,
      notified_users: participants.length
    });
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error uploading material', 
      error: error.message 
    });
  }
};

// Get materials for a meet
export const getMeetMaterials = async (req, res) => {
  try {
    const { meet_id } = req.params;

    const materials = await MeetMaterial.find({ meet_id, is_active: true })
      .populate('uploaded_by', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      materials,
      count: materials.length 
    });
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching materials', 
      error: error.message 
    });
  }
};

// Get materials for a user (check access)
export const getMeetMaterialsForUser = async (req, res) => {
  try {
    const { meet_id, user_id } = req.params;

    // Check if user is participant
    const participant = await MeetParticipant.findOne({ meet_id, user_id });
    
    if (!participant) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not assigned to this meet' 
      });
    }

    // Verify payment completion for paid meets
    if (participant.is_payment_required && participant.payment_status !== 'completed') {
      return res.status(403).json({ 
        success: false, 
        message: 'Payment required to access materials',
        payment_required: true,
        payment_amount: participant.payment_amount
      });
    }

    // Check attendance status - must have joined
    if (participant.attendance_status === 'not_joined' || participant.attendance_status === 'absent') {
      return res.status(403).json({ 
        success: false, 
        message: 'Material access locked. You must attend the meet to access materials.',
        attendance_status: participant.attendance_status,
        must_attend: true
      });
    }

    const meet = await CourseMeet.findOne({ meet_id }).lean();

    // Check attendance window
    const attendanceLimit = meet?.attendance_days_limit ?? 1;
    if (participant.joined_at) {
      const daysSinceJoin = Math.floor((new Date() - participant.joined_at) / (1000 * 60 * 60 * 24));
      if (daysSinceJoin > attendanceLimit) {
        return res.status(403).json({ 
          success: false, 
          message: `Material access expired. Access is only available for ${attendanceLimit} days from first attendance.`,
          days_since_join: daysSinceJoin,
          attendance_days_limit: attendanceLimit,
          access_expired: true
        });
      }
    }

    // Check material access flag
    if (!participant.can_access_materials) {
      return res.status(403).json({ 
        success: false, 
        message: 'Material access not granted. Please contact administrator.',
        attendance_status: participant.attendance_status 
      });
    }

    // Get materials
    const materials = await MeetMaterial.find({ meet_id, is_active: true })
      .select('-uploaded_by')
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      materials,
      count: materials.length,
      can_access: true,
      days_remaining: participant.joined_at ? Math.max(0, 5 - Math.floor((new Date() - participant.joined_at) / (1000 * 60 * 60 * 24))) : 5
    });
  } catch (error) {
    console.error('Error fetching materials for user:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching materials', 
      error: error.message 
    });
  }
};

// Update material
export const updateMeetMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const material = await MeetMaterial.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!material) {
      return sendError(res, 404, "Material not found");
    }

    res.status(200).json({ 
      success: true, 
      message: 'Material updated successfully', 
      material 
    });
  } catch (error) {
    console.error('Error updating material:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating material', 
      error: error.message 
    });
  }
};

// Delete material
export const deleteMeetMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await MeetMaterial.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );

    if (!material) {
      return sendError(res, 404, "Material not found");
    }

    res.status(200).json({ 
      success: true, 
      message: 'Material deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting material', 
      error: error.message 
    });
  }
};

export default {
  uploadMeetMaterial,
  getMeetMaterials,
  getMeetMaterialsForUser,
  updateMeetMaterial,
  deleteMeetMaterial,
};
