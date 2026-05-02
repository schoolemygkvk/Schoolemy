import api from "./api";

/**
 * Get user's wishlist from backend
 */
export const getWishlist = async () => {
  try {
    const response = await api.get("/api/v1/wishlist/");
    return response.data;
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    throw error;
  }
};

/**
 * Add course to wishlist
 */
export const addToWishlist = async (courseId) => {
  try {
    const response = await api.post("/api/v1/wishlist/", { courseId });
    return response.data;
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    throw error;
  }
};

/**
 * Remove course from wishlist
 */
export const removeFromWishlist = async (courseId) => {
  try {
    const id = encodeURIComponent(String(courseId));
    const response = await api.delete(`/api/v1/wishlist/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    throw error;
  }
};

/**
 * Check if course is in wishlist
 */
export const checkWishlistStatus = async (courseId) => {
  try {
    const id = encodeURIComponent(String(courseId));
    const response = await api.get(`/api/v1/wishlist/check/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error checking wishlist status:", error);
    throw error;
  }
};

/**
 * Sync localStorage wishlist with backend
 * Call this on user login to sync local changes
 */
export const syncWishlist = async (courseIds = []) => {
  try {
    const response = await api.post("/api/v1/wishlist/sync", { courseIds });
    return response.data;
  } catch (error) {
    console.error("Error syncing wishlist:", error);
    throw error;
  }
};
