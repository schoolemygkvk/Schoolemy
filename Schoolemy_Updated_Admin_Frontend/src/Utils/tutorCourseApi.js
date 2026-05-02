import api from "./api";

const TUTOR_COURSE_BASE = "/tutor-courses";

// Get all pending tutor courses for review
export const getPendingTutorCourses = () =>
  api.get(`${TUTOR_COURSE_BASE}/pending`);

// Approve a tutor course
export const approveTutorCourse = (courseId, reviewComment = "") =>
  api.put(`${TUTOR_COURSE_BASE}/${courseId}/approve`, { reviewComment });

// Request changes for a tutor course
export const requestChanges = (courseId, reviewComment) => {
  if (!reviewComment || reviewComment.trim() === "") {
    return Promise.reject(new Error("reviewComment is required when requesting changes"));
  }
  return api.put(`${TUTOR_COURSE_BASE}/${courseId}/request-changes`, { reviewComment });
};

// Reject a tutor course
export const rejectTutorCourse = (courseId, reviewComment) => {
  if (!reviewComment || reviewComment.trim() === "") {
    return Promise.reject(new Error("reviewComment is required when rejecting a course"));
  }
  return api.put(`${TUTOR_COURSE_BASE}/${courseId}/reject`, { reviewComment });
};

const tutorCourseApi = {
  getPendingTutorCourses,
  approveTutorCourse,
  requestChanges,
  rejectTutorCourse,
};

export default tutorCourseApi;
