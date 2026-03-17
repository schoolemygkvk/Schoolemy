import api from './api';

const BASE_URL = '/api/user-notifications';

// Get user notifications
export const getUserNotifications = async (userId, params = {}) => {
  try {
    const response = await api.get(`${BASE_URL}/user/${userId}/notifications`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get unread count
export const getUnreadCount = async (userId) => {
  try {
    const response = await api.get(`${BASE_URL}/user/${userId}/notifications/unread-count`);
    return response.data;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`${BASE_URL}/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error marking as read:', error);
    throw error;
  }
};

// Mark all as read
export const markAllAsRead = async (userId) => {
  try {
    const response = await api.patch(`${BASE_URL}/user/${userId}/notifications/read-all`);
    return response.data;
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`${BASE_URL}/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

export default {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
