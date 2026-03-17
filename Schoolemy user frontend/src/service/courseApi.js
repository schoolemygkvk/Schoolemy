import api from "./api";

// Individual API functions (can be imported directly)
export const getAllCourses = async () => {
  try {
    const response = await api.get("/courses/user-view");
    return response.data;
  } catch (error) {
    console.error("Error fetching all courses:", error);
    throw error;
  }
};

export const getCoursesByCategory = async (categoryName) => {
  try {
    const response = await api.get(`/courses/category/${categoryName}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching courses for category ${categoryName}:`, error);
    throw error;
  }
};

export const getCourseById = async (courseId) => {
  try {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course ${courseId}:`, error);
    throw error;
  }
};

export const getCourseContent = async (courseId) => {
  try {
    const response = await api.get(`/courses/${courseId}/content`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching course content ${courseId}:`, error);
    throw error;
  }
};

// Tutor Course API functions
export const getApprovedTutorCourses = async () => {
  try {
    const response = await api.get("/tutor-courses/approved");
    return response.data;
  } catch (error) {
    console.error("Error fetching approved tutor courses:", error);
    throw error;
  }
};

export const getApprovedTutorCoursesByCategory = async (categoryName) => {
  try {
    const response = await api.get(`/tutor-courses/approved/category/${categoryName}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tutor courses for category ${categoryName}:`, error);
    throw error;
  }
};

export const getTutorCourseById = async (courseId) => {
  try {
    const response = await api.get(`/tutor-courses/${courseId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tutor course ${courseId}:`, error);
    throw error;
  }
};

export const getTutorCourseContent = async (courseId) => {
  try {
    const response = await api.get(`/tutor-courses/${courseId}/content`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching tutor course content ${courseId}:`, error);
    throw error;
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
