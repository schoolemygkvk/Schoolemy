import axios from "./api";

// Course-linked meets (CourseMeet model): attendance, materials, assignments.
// Legacy /api/direct-meets is retired (410); use this module only.

// ============================================================================
// COURSE-BASED MEET API
// ============================================================================

const BASE_URL = "/api/course-meets";

// ============================================================================
// MEET MANAGEMENT
// ============================================================================

// Admin: Create meet inside a course
export const createCourseMeet = async (meetData) => {
  const response = await axios.post(`${BASE_URL}/create-meet`, meetData);
  return response.data;
};

// Get all meets (Admin view)
export const getAllMeets = async (params = {}) => {
  const response = await axios.get(`${BASE_URL}/meets`, { params });
  return response.data;
};

// Get meets by course
export const getMeetsByCourse = async (courseId, params = {}) => {
  const response = await axios.get(`${BASE_URL}/meets/course/${courseId}`, { params });
  return response.data;
};

// Get meet by ID
export const getMeetById = async (meetId) => {
  const response = await axios.get(`${BASE_URL}/meets/${meetId}`);
  return response.data;
};

// Admin: Update meet
export const updateCourseMeet = async (meetId, updateData) => {
  const response = await axios.put(`${BASE_URL}/meets/${meetId}`, updateData);
  return response.data;
};

// Admin: Delete meet
export const deleteCourseMeet = async (meetId) => {
  const response = await axios.delete(`${BASE_URL}/meets/${meetId}`);
  return response.data;
};

// ============================================================================
// PARTICIPANT MANAGEMENT
// ============================================================================

// Admin: Get users who purchased a course
export const getUsersForCourse = async (courseId) => {
  const response = await axios.get(`${BASE_URL}/course/${courseId}/users`);
  return response.data;
};

// Admin: Assign users to meet
export const assignUsersToMeet = async (meetId, userIds) => {
  const response = await axios.post(`${BASE_URL}/assign-users`, {
    meet_id: meetId,
    user_ids: userIds,
  });
  return response.data;
};

// Get attendance list for a meet
export const getMeetAttendance = async (meetId, params = {}) => {
  const response = await axios.get(`${BASE_URL}/attendance/${meetId}`, { params });
  return response.data;
};

// Admin: Mark daily attendance by date
export const markDailyAttendance = async (meetId, userId, attendanceDate, status = 'present') => {
  const response = await axios.post(`${BASE_URL}/attendance/daily`, {
    meet_id: meetId,
    user_id: userId,
    attendance_date: attendanceDate,
    status: status
  });
  return response.data;
};

// User: Mark join
export const markUserJoin = async (meetId, userId) => {
  const response = await axios.post(`${BASE_URL}/join`, {
    meet_id: meetId,
    user_id: userId,
  });
  return response.data;
};

// Mark meet completed
export const markMeetCompleted = async (meetId, userId) => {
  const response = await axios.post(`${BASE_URL}/complete`, {
    meet_id: meetId,
    user_id: userId,
  });
  return response.data;
};

// Admin: Update payment status
export const updatePaymentStatus = async (meetId, userId, paymentData) => {
  const response = await axios.post(`${BASE_URL}/payment/update`, {
    meet_id: meetId,
    user_id: userId,
    ...paymentData,
  });
  return response.data;
};

// ============================================================================
// MATERIAL MANAGEMENT
// ============================================================================

// Admin: Upload material
export const uploadMeetMaterial = async (materialData) => {
  const response = await axios.post(`${BASE_URL}/materials/upload`, materialData);
  return response.data;
};

// Admin: Get materials for a meet
export const getMeetMaterials = async (meetId) => {
  const response = await axios.get(`${BASE_URL}/materials/meet/${meetId}`);
  return response.data;
};

// User: Get materials (with access check)
export const getMeetMaterialsForUser = async (meetId, userId) => {
  const response = await axios.get(`${BASE_URL}/materials/meet/${meetId}/user/${userId}`);
  return response.data;
};

// Admin: Update material
export const updateMeetMaterial = async (materialId, updateData) => {
  const response = await axios.put(`${BASE_URL}/materials/${materialId}`, updateData);
  return response.data;
};

// Admin: Delete material
export const deleteMeetMaterial = async (materialId) => {
  const response = await axios.delete(`${BASE_URL}/materials/${materialId}`);
  return response.data;
};

// ============================================================================
// NOTIFICATIONS
// ============================================================================

// User: Get notifications
export const getUserNotifications = async (userId, params = {}) => {
  try {
    const response = await axios.get(`${BASE_URL}/notifications/user/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error('[courseMeetApi] getUserNotifications failed:', { userId, error: error.message, details: error.response?.data });
    throw error;
  }
};

// User: Mark notification as read
export const markNotificationRead = async (notificationId) => {
  try {
    const response = await axios.patch(`${BASE_URL}/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('[courseMeetApi] markNotificationRead failed:', { notificationId, error: error.message, details: error.response?.data });
    throw error;
  }
};

// User: Mark all notifications as read
export const markAllNotificationsRead = async (userId) => {
  try {
    const response = await axios.patch(`${BASE_URL}/notifications/user/${userId}/read-all`);
    return response.data;
  } catch (error) {
    console.error('[courseMeetApi] markAllNotificationsRead failed:', { userId, error: error.message, details: error.response?.data });
    throw error;
  }
};

export default {
  createCourseMeet,
  getAllMeets,
  getMeetsByCourse,
  getMeetById,
  updateCourseMeet,
  deleteCourseMeet,
  getUsersForCourse,
  assignUsersToMeet,
  getMeetAttendance,
  markDailyAttendance,
  markUserJoin,
  markMeetCompleted,
  updatePaymentStatus,
  uploadMeetMaterial,
  getMeetMaterials,
  getMeetMaterialsForUser,
  updateMeetMaterial,
  deleteMeetMaterial,
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
