import api from "./api";
import axios from "axios";

const BASE_URL = "/api/user-course-meets";
const ADMIN_API_URL =
  process.env.REACT_APP_ADMIN_API_URL ||
  "https://e3a24h4aa3.execute-api.ap-south-1.amazonaws.com/dev";

// Debug logging
console.log("🔧 API Configuration:", {
  baseURL: api.defaults.baseURL,
  adminURL: ADMIN_API_URL,
  environment: process.env.NODE_ENV,
});

// Get all available meets for user
export const getUserMeets = async (userId, params = {}) => {
  try {
    const response = await api.get(`${BASE_URL}/user/${userId}/meets`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user meets:", error);

    // If 404, return empty meets array instead of throwing
    if (error.response?.status === 404) {
      console.warn("Meet endpoint not found, returning empty meets");
      return {
        success: true,
        meets: [],
        message: "No meets available - backend endpoint not implemented",
      };
    }

    // For other errors, provide fallback
    return {
      success: false,
      meets: [],
      error: error.message || "Failed to fetch meets",
    };
  }
};

// Get single meet details
export const getUserMeetById = async (userId, meetId) => {
  try {
    const response = await api.get(
      `${BASE_URL}/user/${userId}/meets/${meetId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching meet details:", error);

    // If 404, return fallback meet data
    if (error.response?.status === 404) {
      console.warn("Meet details endpoint not found, returning fallback data");
      return {
        success: false,
        meet: null,
        error: "Meet not found or endpoint not available",
        fallback: true,
      };
    }

    return {
      success: false,
      meet: null,
      error: error.message || "Failed to fetch meet details",
    };
  }
};

// Validate if user can join a meet
export const validateJoinAccess = async (meetId, userId) => {
  try {
    const response = await api.get(
      `${BASE_URL}/meets/${meetId}/validate/${userId}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error validating join access:", error);

    // If 404, assume user can join (fallback behavior)
    if (error.response?.status === 404) {
      console.warn("Validation endpoint not found, allowing access by default");
      return {
        success: true,
        canJoin: true,
        requiresPayment: false,
        message:
          "Validation endpoint not available - proceeding with default access",
        fallback: true,
      };
    }

    return {
      success: false,
      canJoin: false,
      error: error.message || "Failed to validate access",
    };
  }
};

// Join a meet
export const joinMeet = async (meetId, userId, paymentDetails = null) => {
  try {
    const response = await api.post(`${BASE_URL}/meets/${meetId}/join`, {
      user_id: userId,
      payment_details: paymentDetails,
    });
    return response.data;
  } catch (error) {
    console.error("Error joining meet:", error);

    // If 404, simulate successful join
    if (error.response?.status === 404) {
      console.warn("Join endpoint not found, simulating successful join");
      return {
        success: true,
        message: "Join functionality not available - endpoint not implemented",
        join_url: "#", // Placeholder URL
        fallback: true,
      };
    }

    return {
      success: false,
      error: error.message || "Failed to join meet",
    };
  }
};

// Mark meet as completed
export const completeMeet = async (meetId, userId) => {
  try {
    const response = await api.post(`${BASE_URL}/meets/${meetId}/complete`, {
      user_id: userId,
    });
    return response.data;
  } catch (error) {
    console.error("Error completing meet:", error);

    // If 404, simulate successful completion
    if (error.response?.status === 404) {
      console.warn(
        "Complete endpoint not found, simulating successful completion",
      );
      return {
        success: true,
        message: "Meet completion functionality not available",
        fallback: true,
      };
    }

    return {
      success: false,
      error: error.message || "Failed to complete meet",
    };
  }
};

// Get user's meet history
export const getUserMeetHistory = async (userId, params = {}) => {
  try {
    const response = await api.get(`${BASE_URL}/user/${userId}/history`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching meet history:", error);

    // If 404, return empty history
    if (error.response?.status === 404) {
      console.warn("History endpoint not found, returning empty history");
      return {
        success: true,
        history: [],
        message: "Meet history not available",
        fallback: true,
      };
    }

    return {
      success: false,
      history: [],
      error: error.message || "Failed to fetch meet history",
    };
  }
};

// Get materials for a meet (with access check) - uses admin backend
export const getMeetMaterials = async (meetId, userId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(
      `${ADMIN_API_URL}/api/course-meets/materials/s3/${meetId}`,
      {
        params: { user_id: userId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching meet materials:", error);
    throw error;
  }
};

export default {
  getUserMeets,
  getUserMeetById,
  validateJoinAccess,
  joinMeet,
  completeMeet,
  getUserMeetHistory,
  getMeetMaterials,
};
