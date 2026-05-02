/**
 * ISSUE #47 FIX 3.47.10: Date Utilities for Lesson Unlocking
 * No React dependencies — safe to import anywhere
 */

/** Monday, Wednesday, Friday (local time); Sunday = 0 */
const UNLOCK_WEEKDAYS = new Set([1, 3, 5]);

function isUnlockWeekday(date) {
  return UNLOCK_WEEKDAYS.has(date.getDay());
}

/**
 * Nth Mon/Wed/Fri on or after `start` (inclusive). globalLessonIndex 1 → first such day, etc.
 */
function getNthUnlockWeekdayOnOrAfter(start, n) {
  if (n <= 0) return null;
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);
  let seen = 0;
  while (seen < n) {
    if (isUnlockWeekday(d)) {
      seen += 1;
      if (seen === n) return new Date(d);
    }
    d.setDate(d.getDate() + 1);
  }
  return null;
}

/**
 * Calculate when a lesson should unlock based on purchase date and lesson index.
 * Lesson 0 unlocks immediately. Lesson N (N≥1) unlocks on the Nth Mon/Wed/Fri
 * on or after purchase (drip routine). Completing the prior lesson does not move
 * that date earlier.
 * @param {number} globalLessonIndex - Zero-indexed position in entire course
 * @param {string|Date} purchaseDate - When user purchased the course (ISO string or Date)
 * @returns {Date|null} - Unlock date at local midnight, or null if lesson 0 or invalid input
 */
export const getLessonUnlockDate = (globalLessonIndex, purchaseDate) => {
  if (globalLessonIndex === 0) return null;
  if (!purchaseDate) return null;

  const purchase = new Date(purchaseDate);
  purchase.setHours(0, 0, 0, 0);

  return getNthUnlockWeekdayOnOrAfter(purchase, globalLessonIndex);
};

/**
 * Format an unlock date for display to user
 * @param {Date} date - The unlock date
 * @returns {string} - Formatted date like "Monday, April 14, 2026"
 */
export const formatUnlockDate = (date) => {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Check if a date is today or in the past (lesson should be unlocked)
 * @param {Date} unlockDate - The date the lesson unlocks
 * @returns {boolean} - true if lesson is unlocked, false if still locked
 */
export const isUnlocked = (unlockDate) => {
  if (!unlockDate) return true; // Null means no lock (lesson 0)

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return unlockDate <= today;
};

/**
 * Calculate days remaining until unlock
 * @param {Date} unlockDate - The date the lesson unlocks
 * @returns {number} - Days remaining (0 if today or past, negative if in past)
 */
export const daysUntilUnlock = (unlockDate) => {
  if (!unlockDate) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeDiff = unlockDate.getTime() - today.getTime();
  return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
};
