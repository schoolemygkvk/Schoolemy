import express from 'express';
import {
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
} from '../../Controllers/DirectMeet/CourseMeetController.js';

import {
  uploadMeetMaterial,
  getMeetMaterials,
  getMeetMaterialsForUser,
  updateMeetMaterial,
  deleteMeetMaterial,
} from '../../Controllers/DirectMeet/MeetMaterialController.js';

import {
  generateMeetMaterialUploadUrl,
  saveMeetMaterial,
  getMeetMaterials as getS3MeetMaterials,
  getEligibleUsersForMaterials,
} from '../../Controllers/DirectMeet/MeetMaterialS3Controller.js';

import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../Controllers/DirectMeet/MeetNotificationController.js';

import {
  fixMaterialAccessFlags,
} from '../../Controllers/DirectMeet/MeetParticipantUtils.js';

const router = express.Router();

// ============================================================================
// MEET MANAGEMENT ROUTES
// ============================================================================

// Admin: Create meet inside a course
router.post('/create-meet', createCourseMeet);

// Admin: Get all meets
router.get('/meets', getAllMeets);

// Admin/User: Get meets by course
router.get('/meets/course/:course_id', getMeetsByCourse);

// Admin/User: Get meet by ID
router.get('/meets/:id', getMeetById);

// Admin: Update meet
router.put('/meets/:id', updateCourseMeet);

// Admin: Delete meet (soft delete)
router.delete('/meets/:id', deleteCourseMeet);

// ============================================================================
// PARTICIPANT MANAGEMENT ROUTES
// ============================================================================

// Admin: Get users who purchased a course (for assignment)
router.get('/course/:course_id/users', getUsersForCourse);

// Admin: Assign users to meet
router.post('/assign-users', assignUsersToMeet);

// Admin: Get attendance list for a meet
router.get('/attendance/:meet_id', getMeetAttendance);

// User: Mark join
router.post('/join', markUserJoin);

// Admin/User: Mark daily attendance
router.post('/attendance/daily', markDailyAttendance);

// User/Admin: Mark meet completed
router.post('/complete', markMeetCompleted);

// Admin: Update payment status
router.post('/payment/update', updatePaymentStatus);

// ============================================================================
// MATERIAL MANAGEMENT ROUTES
// ============================================================================

// Admin: Upload material for a meet
router.post('/materials/upload', uploadMeetMaterial);

// Admin: Get materials for a meet
router.get('/materials/meet/:meet_id', getMeetMaterials);

// User: Get materials (with access check)
router.get('/materials/meet/:meet_id/user/:user_id', getMeetMaterialsForUser);

// Admin: Update material
router.put('/materials/:id', updateMeetMaterial);

// Admin: Delete material
router.delete('/materials/:id', deleteMeetMaterial);

// ============================================================================
// S3 MATERIAL UPLOAD ROUTES (NEW)
// ============================================================================

// Admin: Generate S3 upload URL for meet material
router.post('/materials/s3/upload-url', generateMeetMaterialUploadUrl);

// Admin: Save material metadata after S3 upload
router.post('/materials/s3/save', saveMeetMaterial);

// User: Get materials with S3 signed download URLs
router.get('/materials/s3/:meet_id', getS3MeetMaterials);

// Admin: Get eligible users for material distribution
router.get('/materials/s3/:meet_id/eligible-users', getEligibleUsersForMaterials);

// ============================================================================
// NOTIFICATION ROUTES
// ============================================================================

// User: Get notifications
router.get('/notifications/user/:user_id', getUserNotifications);

// User: Mark notification as read
router.patch('/notifications/:id/read', markNotificationRead);

// User: Mark all notifications as read
router.patch('/notifications/user/:user_id/read-all', markAllNotificationsRead);

// ============================================================================
// UTILITY ROUTES
// ============================================================================

// Admin: Fix material access flags for existing participants (one-time migration)
router.post('/utils/fix-material-access/:meet_id?', fixMaterialAccessFlags);

export default router;
