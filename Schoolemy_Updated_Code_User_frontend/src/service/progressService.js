import api from "./api";

/**
 * Get progress for a specific lesson
 */
export const getLessonProgress = async (courseId, lessonId) => {
  try {
    const response = await api.get(`/api/v1/progress/${courseId}/${lessonId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching lesson progress:", error);
    throw error;
  }
};

/**
 * Get all progress for a course
 */
export const getCourseProgress = async (courseId) => {
  try {
    const response = await api.get(`/api/v1/progress/${courseId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching course progress:", error);
    throw error;
  }
};

/**
 * Update progress for a lesson
 * Call this with debouncing (every 5-10 seconds)
 */
export const updateLessonProgress = async (
  courseId,
  lessonId,
  { progress, currentTime = 0, duration = 0, status = "in-progress" }
) => {
  try {
    const response = await api.post(`/api/v1/progress/${courseId}/${lessonId}`, {
      progress,
      currentTime,
      duration,
      status,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating lesson progress:", error);
    throw error;
  }
};

/**
 * Bulk update progress for multiple lessons
 * Use this to sync all offline changes at once
 */
export const bulkUpdateProgress = async (updates) => {
  try {
    // FIX: Validate updates before sending
    const validatedUpdates = updates.filter(u => {
      if (!u.courseId || !u.lessonId) {
        console.warn("[Progress] Skipping update: missing courseId or lessonId", u);
        return false;
      }
      if (u.progress === undefined || u.progress < 0 || u.progress > 100) {
        console.warn("[Progress] Skipping update: invalid progress value", u);
        return false;
      }
      return true;
    });

    if (validatedUpdates.length === 0) {
      console.warn("[Progress] No valid updates to send");
      return { success: true, data: [] };
    }

    console.log(`[Progress] Sending ${validatedUpdates.length} progress updates`, validatedUpdates);
    const response = await api.post("/api/v1/progress/bulk-update", { updates: validatedUpdates });
    console.log("[Progress] Bulk update response:", response.data);
    return response.data;
  } catch (error) {
    console.error("[Progress] Error in bulk update:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Create a debounced progress update function
 * Reduces server load by batching updates
 */
export const createDebouncedProgressUpdater = () => {
  let timeoutId = null;
  let pendingUpdates = {};

  const flush = async () => {
    if (Object.keys(pendingUpdates).length === 0) return;

    try {
      const updates = Object.values(pendingUpdates);
      await bulkUpdateProgress(updates);
      pendingUpdates = {};
    } catch (error) {
      console.error("Error flushing progress updates:", error);
    }
  };

  const scheduleUpdate = (courseId, lessonId, data) => {
    const key = `${courseId}:${lessonId}`;
    pendingUpdates[key] = {
      courseId,
      lessonId,
      ...data,
    };

    // Clear existing timeout
    if (timeoutId) clearTimeout(timeoutId);

    // Schedule new flush (5-10 seconds)
    timeoutId = setTimeout(flush, 5000);
  };

  return {
    update: scheduleUpdate,
    flush,
  };
};
