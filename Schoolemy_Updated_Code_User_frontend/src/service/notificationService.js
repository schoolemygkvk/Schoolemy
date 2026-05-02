import api from './api';

class NotificationService {
  /**
   * Send EMI overdue notification to user
   * @param {string} userId - User ID
   * @param {object} emiDetails - EMI details including course name, overdue amount, etc.
   * @returns {Promise} API response
   */
  static async sendEMIOverdueNotification(userId, emiDetails) {
    try {
      const response = await api.post('/api/v1/notifications/emi-overdue', {
        userId,
        courseId: emiDetails.courseId,
        courseName: emiDetails.courseName,
        overdueAmount: emiDetails.overdueAmount,
        overdueCount: emiDetails.overdueCount,
        dueDate: emiDetails.dueDate,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending EMI overdue notification:', error);
      throw error;
    }
  }

  /**
   * Send EMI due soon reminder notification
   * @param {string} userId - User ID
   * @param {object} emiDetails - EMI details
   * @returns {Promise} API response
   */
  static async sendEMIDueSoonNotification(userId, emiDetails) {
    try {
      const response = await api.post('/api/v1/notifications/emi-due-soon', {
        userId,
        courseId: emiDetails.courseId,
        courseName: emiDetails.courseName,
        dueAmount: emiDetails.dueAmount,
        dueDate: emiDetails.dueDate,
      });
      return response.data;
    } catch (error) {
      console.error('Error sending EMI due soon notification:', error);
      throw error;
    }
  }

  /**
   * Get user notifications
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise} API response with notifications
   */
  static async getNotifications(page = 1, limit = 10) {
    try {
      const response = await api.get('/api/v1/user-notifications', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise} API response
   */
  static async markAsRead(notificationId) {
    try {
      const response = await api.put(`/api/v1/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   * @returns {Promise} API response with count
   */
  static async getUnreadCount() {
    try {
      const response = await api.get('/api/v1/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  /**
   * Show browser notification for overdue EMI
   * @param {object} emiDetails - EMI details
   */
  static showBrowserNotification(emiDetails) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('EMI Payment Overdue!', {
        body: `Your payment for ${emiDetails.courseName} is overdue. Pay ₹${emiDetails.overdueAmount} to restore access.`,
        icon: '/notification-icon.png',
        badge: '/notification-badge.png',
        tag: `emi-overdue-${emiDetails.courseId}`,
        requireInteraction: true,
      });
    }
  }

  /**
   * Request notification permission
   * @returns {Promise<string>} Permission status
   */
  static async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return 'denied';
  }

  /**
   * Check if user has overdue EMIs and show notification
   * @param {Array} emiPlans - List of EMI plans
   */
  static checkAndNotifyOverdue(emiPlans) {
    const overduePlans = emiPlans.filter(plan => plan.overdueEmis > 0);
    
    if (overduePlans.length > 0 && 'Notification' in window) {
      if (Notification.permission === 'default') {
        this.requestNotificationPermission();
      } else if (Notification.permission === 'granted') {
        overduePlans.forEach(plan => {
          this.showBrowserNotification({
            courseId: plan.courseId,
            courseName: plan.courseName,
            overdueAmount: plan.overdueEmis * plan.monthlyAmount,
          });
        });
      }
    }
  }
}

export default NotificationService;
