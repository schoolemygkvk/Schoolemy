import api, { publicApi } from "./api";
import { handleApiError } from "./apiErrorHandler";

// SECURITY FIX 3.5.2: Add error handling to all API calls

// Individual API functions (can be imported directly)
// SECURITY FIX 3.19.1: Use publicApi for public endpoints (no authentication required)
// Public endpoints should work regardless of token validity
export const getAllCourses = async () => {
  try {
    const response = await api.get("/api/v1/courses/user-view");
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, "Failed to load courses. Please try again.");
  }
};

export const getCoursesByCategory = async (categoryName) => {
  try {
    const encoded = encodeURIComponent(String(categoryName));
    const response = await api.get(`/api/v1/courses/category/${encoded}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, `Failed to load courses for ${categoryName}. Please try again.`);
  }
};

export const getCourseById = async (courseId) => {
  try {
    const response = await api.get(`/api/v1/courses/${courseId}`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, "Failed to load course details. Please try again.");
  }
};

export const getCourseContent = async (courseId) => {
  try {
    const response = await api.get(`/api/v1/courses/${courseId}/content`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return handleApiError(error, "Failed to load course content. Please try again.");
  }
};

// Tutor Course API functions
// SECURITY FIX 3.19.1: Use publicApi for public endpoints (no authentication required)
// Public endpoints should work regardless of token validity
/** Unwrap axios body: backend sends { success, data: array|doc }; return the array or document. */
const unwrapTutorListPayload = (body) => {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.data)) return body.data;
  if (body && Array.isArray(body.courses)) return body.courses;
  return [];
};

/**
 * Reduce API/proxy envelopes to the actual TutorCourse document.
 * Handles single or double-wrapped { success, data } responses so the UI always
 * receives fields like coursename, price, _id at the top level.
 */
const unwrapTutorCoursePayload = (body) => {
  if (body == null) return null;
  let v = body;
  for (let i = 0; i < 5; i++) {
    if (!v || typeof v !== "object" || Array.isArray(v)) return v;
    const inner = v.data;
    if (inner == null || typeof inner !== "object" || Array.isArray(inner)) {
      return v;
    }
    const looksLikeCourse =
      inner._id != null ||
      inner.coursename != null ||
      inner.title != null ||
      inner.CourseMotherId != null ||
      inner.tutor != null;
    if (looksLikeCourse) return inner;
    if (v.success === true || typeof v.message === "string") {
      v = inner;
      continue;
    }
    return inner;
  }
  return v;
};

/**
 * Unwrap GET /tutor-courses/:id/content body to the inner content object
 * { courseId, courseName, chapters, contentDuration }.
 * Axios already returns one envelope; courseApi previously wrapped again, which hid .chapters.
 */
const unwrapTutorContentPayload = (body) => {
  if (body == null) return null;
  if (typeof body === "object" && Array.isArray(body.chapters)) {
    return body;
  }
  if (
    body.data &&
    typeof body.data === "object" &&
    Array.isArray(body.data.chapters)
  ) {
    return body.data;
  }
  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    return body.data;
  }
  return body;
};

export const getApprovedTutorCourses = async () => {
  try {
    const response = await api.get("/api/v1/tutor-courses/approved");
    return {
      success: true,
      data: unwrapTutorListPayload(response.data),
    };
  } catch (error) {
    return handleApiError(error, "Failed to load tutor courses. Please try again.");
  }
};

export const getApprovedTutorCoursesByCategory = async (categoryName) => {
  try {
    const encoded = encodeURIComponent(String(categoryName));
    const response = await api.get(`/api/v1/tutor-courses/approved/category/${encoded}`);
    return {
      success: true,
      data: unwrapTutorListPayload(response.data),
    };
  } catch (error) {
    return handleApiError(error, `Failed to load tutor courses for ${categoryName}. Please try again.`);
  }
};

export const getTutorCourseById = async (courseId) => {
  try {
    const response = await api.get(`/api/v1/tutor-courses/${courseId}`);
    return {
      success: true,
      data: unwrapTutorCoursePayload(response.data),
    };
  } catch (error) {
    return handleApiError(error, "Failed to load tutor course details. Please try again.");
  }
};

export const getTutorCourseContent = async (courseId) => {
  try {
    const response = await api.get(`/api/v1/tutor-courses/${courseId}/content`);
    const payload = unwrapTutorContentPayload(response.data);
    return {
      success: true,
      data: payload,
    };
  } catch (error) {
    return handleApiError(error, "Failed to load course content. Please try again.");
  }
};

// Course API Service object (for those who prefer object-style imports)
export const courseService = {
  getAllCourses,
  getCoursesByCategory,
  getCourseById,
  getCourseContent,
  getApprovedTutorCourses,
  getApprovedTutorCoursesByCategory,
  getTutorCourseById,
  getTutorCourseContent,
};

export default courseService;
