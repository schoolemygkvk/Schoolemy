import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { formatUrl } from "@aws-sdk/util-format-url";
import { Hash } from "@smithy/hash-node";
import { HttpRequest } from "@smithy/protocol-http";
import { parseUrl } from "@smithy/url-parser";
import s3 from "../../DB/adudios3.js";
import MeetMaterial from '../../Models/DirectMeet/MeetMaterialModel.js';
import MeetParticipant from '../../Models/DirectMeet/MeetParticipantModel.js';
import CourseMeet from '../../Models/DirectMeet/CourseMeetModel.js';
import MeetNotification from '../../Models/DirectMeet/MeetNotificationModel.js';
import User from '../../Models/User/User-Model.js';
import path from "path";
import { sendSuccess, sendError, sendPaginated, sendValidationError, sendNoContent } from "../../Utils/responseHandler.js";

const MEET_MATERIALS_BUCKET = "student-meet-materials";


export const generateMeetMaterialUploadUrl = async (req, res) => {
  try {
    const { meet_id, file_name, file_type, file_size } = req.body;
    const uploaded_by = req.user?._id || req.body.uploaded_by;

    if (!meet_id || !file_name || !file_type) {
      return sendError(res, 400, "meet_id, file_name, and file_type are required");
    }

    // Verify meet exists
    const meet = await CourseMeet.findById(meet_id).populate('course_id', 'coursename');
    if (!meet) {
      return sendError(res, 404, "Meet not found");
    }

    // Check material access type
    if (meet.material_access_type === 'attended_only') {
      // Count fully attended participants (must have joined and attended within attendance period)
      const attendanceLimit = meet.attendance_days_limit || 1;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - attendanceLimit);

      const fullyAttendedCount = await MeetParticipant.countDocuments({
        meet_id: meet_id,
        attendance_status: { $in: ['joined', 'completed'] },
        joined_at: { $gte: cutoffDate },
        can_access_materials: true
      });

      if (fullyAttendedCount === 0) {
        return res.status(403).json({
          success: false,
          message: `Cannot upload material. No users have full attendance within ${attendanceLimit} days for this course meet.`,
          attendance_required: true,
          attended_count: 0,
          attendance_days_limit: attendanceLimit
        });
      }
    }

    // Generate unique file key
    const timestamp = Date.now();
    const safeMeetId = meet_id.toString();
    const courseId = meet.course_id._id.toString();
    const ext = path.extname(file_name);
    const baseName = path.basename(file_name, ext);
    const key = `meet-materials/${courseId}/${safeMeetId}/${timestamp}_${baseName}${ext}`;

    // Create clean PutObject command - absolutely minimal
    const command = new PutObjectCommand({
      Bucket: MEET_MATERIALS_BUCKET,
      Key: key,
      ContentType: file_type,
    });

    // Generate presigned URL (valid for 1 hour) - simple approach
    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });

    res.status(200).json({
      success: true,
      uploadUrl,
      key,
    });

  } catch (error) {
    console.error("Error generating meet material upload URL:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate upload URL",
      error: error.message
    });
  }
};


export const saveMeetMaterial = async (req, res) => {
  try {
    const {
      meet_id,
      title,
      description,
      file_name,
      s3_url,
      s3_key,
      file_type,
      file_size,
      material_date,
      day_number,
      uploaded_by: requestUploadedBy
    } = req.body;
    const uploaded_by = req.user?._id || requestUploadedBy;

    if (!meet_id || !title || !file_name || !s3_url || !file_type || !material_date) {
      return sendError(res, 400, "meet_id, title, file_name, s3_url, file_type, and material_date are required");
    }

    if (!uploaded_by) {
      return sendError(res, 400, "uploaded_by is required. Please ensure you are logged in or pass uploaded_by in the request body.");
    }

    // Verify meet exists
    const meet = await CourseMeet.findById(meet_id).populate('course_id', 'coursename');
    if (!meet) {
      return sendError(res, 404, "Meet not found");
    }

    // Create material record
    const material = new MeetMaterial({
      meet_id,
      title,
      description,
      file_name,
      file_url: s3_url,
      file_type,
      file_size,
      access_type: meet.material_access_type || 'attended_only',
      material_date: new Date(material_date),
      day_number: day_number ? parseInt(day_number) : undefined,
      uploaded_by,
      metadata: {
        s3_bucket: MEET_MATERIALS_BUCKET,
        s3_key: s3_key,
        course_id: meet.course_id._id
      }
    });

    await material.save();

    // Get all participants with full attendance
    const attendanceLimit = meet.attendance_days_limit || 1;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - attendanceLimit);

    const eligibleParticipants = await MeetParticipant.find({
      meet_id: meet_id,
      attendance_status: { $in: ['joined', 'completed'] },
      joined_at: { $gte: cutoffDate },
      can_access_materials: true
    }).populate('user_id', 'name email');

    // Create notifications for all eligible users
    if (eligibleParticipants.length > 0) {
      const notifications = eligibleParticipants.map(participant => ({
        meet_id: meet_id,
        user_id: participant.user_id._id,
        notification_type: 'material_uploaded',
        title: 'New Study Material Available',
        message: `New material "${title}" uploaded for "${meet.title}" (${meet.course_id.coursename}). You have full attendance - access it now!`,
        priority: 'high',
        action_url: `/user/meets/${meet_id}/materials`,
        metadata: {
          material_id: material._id,
          s3_url: s3_url,
          file_name: file_name
        }
      }));

      await MeetNotification.insertMany(notifications);
    }

    res.status(201).json({
      success: true,
      message: 'Material saved and notifications sent successfully',
      material: {
        id: material._id,
        title: material.title,
        file_url: material.file_url,
        file_type: material.file_type,
        s3_key: s3_key
      },
      notified_users: eligibleParticipants.length,
      eligible_users: eligibleParticipants.map(p => ({
        user_id: p.user_id._id,
        name: p.user_id.name,
        email: p.user_id.email,
        joined_at: p.joined_at
      }))
    });

  } catch (error) {
    console.error("Error saving meet material:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save material",
      error: error.message
    });
  }
};


export const getMeetMaterials = async (req, res) => {
  try {
    const { meet_id } = req.params;
    const { user_id } = req.query;

    const meet = await CourseMeet.findById(meet_id);
    if (!meet) {
      return sendError(res, 404, "Meet not found");
    }

    // Check if user has access
    const participant = await MeetParticipant.findOne({
      meet_id: meet_id,
      user_id: user_id
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this meet"
      });
    }

    // Get user's attended dates (dates only, not time) for filtering
    const attendedDates = participant.attendance_dates
      ? participant.attendance_dates
          .filter(a => a.status === 'present' || a.status === 'late')
          .map(a => new Date(a.date).toISOString().split('T')[0])
      : [];

    // Get all materials for this meet
    const allMaterials = await MeetMaterial.find({
      meet_id: meet_id,
      is_active: true
    }).sort({ material_date: 1, createdAt: -1 });

    // Allow access to ALL materials for enrolled users (no date-based filtering)
    const materials = allMaterials;

    // Generate signed URLs for downloads (valid for 15 minutes)
    const materialsWithUrls = await Promise.all(
      materials.map(async (material) => {
        try {
          const command = new GetObjectCommand({
            Bucket: MEET_MATERIALS_BUCKET,
            Key: material.metadata?.s3_key || material.file_url.split('/').slice(-3).join('/')
          });

          const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

          return {
            id: material._id,
            title: material.title,
            description: material.description,
            file_name: material.file_name,
            file_type: material.file_type,
            file_size: material.file_size,
            material_date: material.material_date,
            day_number: material.day_number,
            download_url: downloadUrl,
            uploaded_at: material.createdAt,
            expires_in: 900 // seconds
          };
        } catch (error) {
          console.error(`Error generating download URL for ${material.file_name}:`, error);
          return {
            id: material._id,
            title: material.title,
            error: 'Failed to generate download URL'
          };
        }
      })
    );

    res.json({
      success: true,
      materials: materialsWithUrls,
      has_access: true,
      total_materials: allMaterials.length,
      accessible_materials: materialsWithUrls.length,
      attendance_info: {
        has_access: true,
        attendance_status: participant.attendance_status,
        user_attendance_days: participant.total_attendance_days || 0,
        attended_dates: attendedDates,
        message: `All materials are accessible. You have attended ${attendedDates.length} day(s).`
      }
    });

  } catch (error) {
    console.error("Error fetching meet materials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch materials",
      error: error.message
    });
  }
};


export const getEligibleUsersForMaterials = async (req, res) => {
  try {
    const { meet_id } = req.params;

    const meet = await CourseMeet.findById(meet_id).populate('course_id', 'coursename');
    if (!meet) {
      return sendError(res, 404, "Meet not found");
    }

    const attendanceLimit = meet.attendance_days_limit || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - attendanceLimit);

    // Get all participants with full attendance in this course meet
    const eligibleParticipants = await MeetParticipant.find({
      meet_id: meet_id,
      attendance_status: { $in: ['joined', 'completed'] },
      joined_at: { $gte: cutoffDate },
      can_access_materials: true
    }).populate('user_id', 'name email phone');

    const eligibleUsers = eligibleParticipants.map(p => ({
      user_id: p.user_id._id,
      name: p.user_id.name,
      email: p.user_id.email,
      phone: p.user_id.phone,
      attendance_status: p.attendance_status,
      joined_at: p.joined_at,
      days_since_join: Math.floor((new Date() - p.joined_at) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      success: true,
      meet: {
        id: meet._id,
        title: meet.title,
        course: meet.course_id.coursename,
        attendance_days_limit: attendanceLimit
      },
      eligible_count: eligibleUsers.length,
      eligible_users: eligibleUsers
    });

  } catch (error) {
    console.error("Error fetching eligible users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch eligible users",
      error: error.message
    });
  }
};

export default {
  generateMeetMaterialUploadUrl,
  saveMeetMaterial,
  getMeetMaterials,
  getEligibleUsersForMaterials
};
