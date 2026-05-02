/**
 * ISSUE #47 FIX 3.47.10: Pure Formatting Utilities
 * No React dependencies — safe to import anywhere
 */

/**
 * Format seconds to "M:SS" format (basic, no padding)
 * @param {number} seconds
 * @returns {string}
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

/**
 * Format seconds to "MM:SS" format (padded with zeros for exam timer)
 * @param {number} seconds
 * @returns {string}
 */
export const formatTimerDisplay = (seconds) => {
  if (seconds <= 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Truncate title to first two words with ellipsis
 * @param {string} title
 * @returns {string}
 */
export const truncateTitle = (title) => {
  if (!title) return "Course Content";
  const words = title.trim().split(/\s+/);
  if (words.length <= 2) return title;
  return `${words[0]} ${words[1]}...`;
};

/**
 * Get timer color based on remaining percentage
 * @param {number} timeRemaining
 * @param {number} totalTime
 * @returns {string} hex color
 */
export const getTimerColor = (timeRemaining, totalTime) => {
  if (totalTime <= 0) return "#dc3545"; // Red if invalid
  const percentage = (timeRemaining / totalTime) * 100;
  if (percentage > 50) return "#28a745"; // Green
  if (percentage > 25) return "#ffc107"; // Yellow
  return "#dc3545"; // Red
};
