/**
 * ISSUE #47 FIX: Pure utility functions extracted from CourseContent.js
 * These functions have no React dependencies and can be used anywhere
 */

/**
 * Format seconds into MM:SS display format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string (e.g., "3:45")
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

/**
 * Format timer display for exams (zero-padded)
 * @param {number} seconds - Remaining seconds
 * @returns {string} Formatted timer string (e.g., "03:45")
 */
export const formatTimerDisplay = (seconds) => {
  if (seconds <= 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

/**
 * Truncate a title to first two words with ellipsis
 * @param {string} title - Title to truncate
 * @returns {string} Truncated title (e.g., "Introduction to..." or "Course Content")
 */
export const truncateTitle = (title) => {
  if (!title) return "Course Content";
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) return title;
  return `${words[0]} ${words[1]}...`;
};
