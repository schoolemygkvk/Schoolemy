import api from './api.js';

// API endpoints for User Exam Answers
export const examAnswerApi = {
  // Get user's exam attempts
  getUserExamAttempts: (userId) => api.get(`/user/${userId}`),
  
  // Get user's exam statistics
  getUserExamStats: (userId) => api.get(`/user/${userId}/stats`),
  
  // Get course exam attempts
  getCourseExamAttempts: (courseId) => api.get(`/course/${courseId}`),
  
  // Get exam attempts for specific exam
  getExamAttempts: (examId) => api.get(`/exam/${examId}`),
  
  // Get chapter exam attempts
  getChapterExamAttempts: (courseId, chapterTitle) => 
    api.get(`/chapter/${courseId}/${encodeURIComponent(chapterTitle)}`),
  
  // Get specific exam attempt by ID
  getExamAttemptById: (attemptId) => api.get(`/attempt/${attemptId}`),
  
  // Get all exam attempts (admin) with pagination
  getAllExamAttempts: (page = 1, limit = 10) => 
    api.get(`/all?page=${page}&limit=${limit}`),
  
  // Delete exam attempt (admin)
  deleteExamAttempt: (attemptId) => api.delete(`/attempt/${attemptId}`),
  
};

export default examAnswerApi;
