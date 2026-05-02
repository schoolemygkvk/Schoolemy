import axios from '../../Utils/api';
import * as courseMeetApi from '../../Utils/courseMeetApi';

jest.mock('../../Utils/api');

describe('courseMeetApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Meet Management', () => {
    describe('createCourseMeet', () => {
      it('creates a meet with provided data', async () => {
        const meetData = { title: 'JavaScript 101', courseId: 'course-1' };
        const mockResponse = { id: 'meet-1', ...meetData };

        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.createCourseMeet(meetData);

        expect(axios.post).toHaveBeenCalledWith('/api/course-meets/create-meet', meetData);
        expect(result).toEqual(mockResponse);
      });

      it('handles API errors when creating meet', async () => {
        const meetData = { title: 'Test' };
        const error = new Error('Network error');

        axios.post.mockRejectedValue(error);

        await expect(courseMeetApi.createCourseMeet(meetData)).rejects.toThrow('Network error');
      });
    });

    describe('getAllMeets', () => {
      it('fetches all meets without params', async () => {
        const mockMeets = [{ id: 'meet-1' }, { id: 'meet-2' }];
        axios.get.mockResolvedValue({ data: mockMeets });

        const result = await courseMeetApi.getAllMeets();

        expect(axios.get).toHaveBeenCalledWith('/api/course-meets/meets', { params: {} });
        expect(result).toEqual(mockMeets);
      });

      it('fetches meets with filter params', async () => {
        const params = { courseId: 'course-1', status: 'active' };
        const mockMeets = [{ id: 'meet-1' }];
        axios.get.mockResolvedValue({ data: mockMeets });

        const result = await courseMeetApi.getAllMeets(params);

        expect(axios.get).toHaveBeenCalledWith('/api/course-meets/meets', { params });
        expect(result).toEqual(mockMeets);
      });
    });

    describe('getMeetsByCourse', () => {
      it('fetches meets for a specific course', async () => {
        const courseId = 'course-1';
        const mockMeets = [{ id: 'meet-1', courseId }];
        axios.get.mockResolvedValue({ data: mockMeets });

        const result = await courseMeetApi.getMeetsByCourse(courseId);

        expect(axios.get).toHaveBeenCalledWith(
          `/api/course-meets/meets/course/${courseId}`,
          { params: {} }
        );
        expect(result).toEqual(mockMeets);
      });
    });

    describe('getMeetById', () => {
      it('fetches a specific meet by ID', async () => {
        const meetId = 'meet-1';
        const mockMeet = { id: meetId, title: 'JS 101' };
        axios.get.mockResolvedValue({ data: mockMeet });

        const result = await courseMeetApi.getMeetById(meetId);

        expect(axios.get).toHaveBeenCalledWith(`/api/course-meets/meets/${meetId}`);
        expect(result).toEqual(mockMeet);
      });
    });

    describe('updateCourseMeet', () => {
      it('updates a meet with new data', async () => {
        const meetId = 'meet-1';
        const updateData = { title: 'Updated Title' };
        const mockResponse = { id: meetId, ...updateData };
        axios.put.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.updateCourseMeet(meetId, updateData);

        expect(axios.put).toHaveBeenCalledWith(
          `/api/course-meets/meets/${meetId}`,
          updateData
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('deleteCourseMeet', () => {
      it('deletes a meet', async () => {
        const meetId = 'meet-1';
        const mockResponse = { success: true };
        axios.delete.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.deleteCourseMeet(meetId);

        expect(axios.delete).toHaveBeenCalledWith(`/api/course-meets/meets/${meetId}`);
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Participant Management', () => {
    describe('getUsersForCourse', () => {
      it('fetches users for a course', async () => {
        const courseId = 'course-1';
        const mockUsers = [{ id: 'user-1', name: 'John' }];
        axios.get.mockResolvedValue({ data: mockUsers });

        const result = await courseMeetApi.getUsersForCourse(courseId);

        expect(axios.get).toHaveBeenCalledWith(`/api/course-meets/course/${courseId}/users`);
        expect(result).toEqual(mockUsers);
      });
    });

    describe('assignUsersToMeet', () => {
      it('assigns multiple users to a meet', async () => {
        const meetId = 'meet-1';
        const userIds = ['user-1', 'user-2', 'user-3'];
        const mockResponse = { assigned: 3 };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.assignUsersToMeet(meetId, userIds);

        expect(axios.post).toHaveBeenCalledWith('/api/course-meets/assign-users', {
          meet_id: meetId,
          user_ids: userIds,
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getMeetAttendance', () => {
      it('fetches attendance for a meet', async () => {
        const meetId = 'meet-1';
        const mockAttendance = [{ userId: 'user-1', status: 'present' }];
        axios.get.mockResolvedValue({ data: mockAttendance });

        const result = await courseMeetApi.getMeetAttendance(meetId);

        expect(axios.get).toHaveBeenCalledWith(`/api/course-meets/attendance/${meetId}`, {
          params: {},
        });
        expect(result).toEqual(mockAttendance);
      });
    });

    describe('markDailyAttendance', () => {
      it('marks attendance with default status', async () => {
        const meetId = 'meet-1';
        const userId = 'user-1';
        const date = '2025-04-20';
        const mockResponse = { marked: true };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.markDailyAttendance(meetId, userId, date);

        expect(axios.post).toHaveBeenCalledWith('/api/course-meets/attendance/daily', {
          meet_id: meetId,
          user_id: userId,
          attendance_date: date,
          status: 'present',
        });
        expect(result).toEqual(mockResponse);
      });

      it('marks attendance with custom status', async () => {
        const meetId = 'meet-1';
        const userId = 'user-1';
        const date = '2025-04-20';
        const status = 'absent';
        const mockResponse = { marked: true };
        axios.post.mockResolvedValue({ data: mockResponse });

        await courseMeetApi.markDailyAttendance(meetId, userId, date, status);

        expect(axios.post).toHaveBeenCalledWith('/api/course-meets/attendance/daily', {
          meet_id: meetId,
          user_id: userId,
          attendance_date: date,
          status,
        });
      });
    });

    describe('markUserJoin', () => {
      it('marks user as joined', async () => {
        const meetId = 'meet-1';
        const userId = 'user-1';
        const mockResponse = { joinedAt: '2025-04-20T10:00:00Z' };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.markUserJoin(meetId, userId);

        expect(axios.post).toHaveBeenCalledWith('/api/course-meets/join', {
          meet_id: meetId,
          user_id: userId,
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('markMeetCompleted', () => {
      it('marks meet as completed for user', async () => {
        const meetId = 'meet-1';
        const userId = 'user-1';
        const mockResponse = { completedAt: '2025-04-20T11:00:00Z' };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.markMeetCompleted(meetId, userId);

        expect(axios.post).toHaveBeenCalledWith('/api/course-meets/complete', {
          meet_id: meetId,
          user_id: userId,
        });
        expect(result).toEqual(mockResponse);
      });
    });

    describe('updatePaymentStatus', () => {
      it('updates payment status', async () => {
        const meetId = 'meet-1';
        const userId = 'user-1';
        const paymentData = { status: 'paid', amount: 100 };
        const mockResponse = { updated: true };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.updatePaymentStatus(meetId, userId, paymentData);

        expect(axios.post).toHaveBeenCalledWith('/api/course-meets/payment/update', {
          meet_id: meetId,
          user_id: userId,
          ...paymentData,
        });
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Material Management', () => {
    describe('uploadMeetMaterial', () => {
      it('uploads material for a meet', async () => {
        const materialData = { meetId: 'meet-1', file: 'lecture.pdf' };
        const mockResponse = { id: 'mat-1', ...materialData };
        axios.post.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.uploadMeetMaterial(materialData);

        expect(axios.post).toHaveBeenCalledWith(
          '/api/course-meets/materials/upload',
          materialData
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('getMeetMaterials', () => {
      it('fetches materials for a meet', async () => {
        const meetId = 'meet-1';
        const mockMaterials = [{ id: 'mat-1', name: 'Lecture 1' }];
        axios.get.mockResolvedValue({ data: mockMaterials });

        const result = await courseMeetApi.getMeetMaterials(meetId);

        expect(axios.get).toHaveBeenCalledWith(`/api/course-meets/materials/meet/${meetId}`);
        expect(result).toEqual(mockMaterials);
      });
    });

    describe('getMeetMaterialsForUser', () => {
      it('fetches materials accessible to a user', async () => {
        const meetId = 'meet-1';
        const userId = 'user-1';
        const mockMaterials = [{ id: 'mat-1' }];
        axios.get.mockResolvedValue({ data: mockMaterials });

        const result = await courseMeetApi.getMeetMaterialsForUser(meetId, userId);

        expect(axios.get).toHaveBeenCalledWith(
          `/api/course-meets/materials/meet/${meetId}/user/${userId}`
        );
        expect(result).toEqual(mockMaterials);
      });
    });

    describe('updateMeetMaterial', () => {
      it('updates material', async () => {
        const materialId = 'mat-1';
        const updateData = { name: 'Updated' };
        const mockResponse = { id: materialId, ...updateData };
        axios.put.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.updateMeetMaterial(materialId, updateData);

        expect(axios.put).toHaveBeenCalledWith(
          `/api/course-meets/materials/${materialId}`,
          updateData
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('deleteMeetMaterial', () => {
      it('deletes material', async () => {
        const materialId = 'mat-1';
        const mockResponse = { success: true };
        axios.delete.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.deleteMeetMaterial(materialId);

        expect(axios.delete).toHaveBeenCalledWith(
          `/api/course-meets/materials/${materialId}`
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Notifications', () => {
    describe('getUserNotifications', () => {
      it('fetches notifications for user', async () => {
        const userId = 'user-1';
        const mockNotifications = [{ id: 'notif-1', message: 'Meet scheduled' }];
        axios.get.mockResolvedValue({ data: mockNotifications });

        const result = await courseMeetApi.getUserNotifications(userId);

        expect(axios.get).toHaveBeenCalledWith(
          `/api/course-meets/notifications/user/${userId}`,
          { params: {} }
        );
        expect(result).toEqual(mockNotifications);
      });
    });

    describe('markNotificationRead', () => {
      it('marks single notification as read', async () => {
        const notifId = 'notif-1';
        const mockResponse = { read: true };
        axios.patch.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.markNotificationRead(notifId);

        expect(axios.patch).toHaveBeenCalledWith(
          `/api/course-meets/notifications/${notifId}/read`
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe('markAllNotificationsRead', () => {
      it('marks all notifications as read for user', async () => {
        const userId = 'user-1';
        const mockResponse = { marked: 5 };
        axios.patch.mockResolvedValue({ data: mockResponse });

        const result = await courseMeetApi.markAllNotificationsRead(userId);

        expect(axios.patch).toHaveBeenCalledWith(
          `/api/course-meets/notifications/user/${userId}/read-all`
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('Module exports', () => {
    it('exports all API functions as default', () => {
      const defaultExport = require('../../Utils/courseMeetApi').default;

      expect(defaultExport.createCourseMeet).toBeDefined();
      expect(defaultExport.getAllMeets).toBeDefined();
      expect(defaultExport.getMeetsByCourse).toBeDefined();
      expect(defaultExport.assignUsersToMeet).toBeDefined();
    });
  });
});
