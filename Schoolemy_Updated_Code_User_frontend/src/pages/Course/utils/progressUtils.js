/**
 * ISSUE #47 FIX: Progress and lesson utility functions extracted from CourseContent.js
 * These functions take state as explicit parameters (not closures)
 * They contain pure logic for lesson locking, progress tracking, and navigation
 */

/**
 * Check if a specific lesson is marked as completed in user progress
 * @param {number} chapterIndex - Chapter index
 * @param {number} lessonIndex - Lesson index within chapter
 * @param {Object} userProgress - User progress object with completedLessons array
 * @returns {boolean} True if lesson is completed
 */
export const isLessonCompleted = (chapterIndex, lessonIndex, userProgress) =>
  userProgress.completedLessons.includes(`${chapterIndex}-${lessonIndex}`);

/**
 * Check if user has attempted an exam in a chapter
 * @param {number} chapterIndex - Chapter index
 * @param {Object} userProgress - User progress object with attemptedExams object
 * @returns {boolean} True if exam was attempted
 */
export const hasAttemptedExam = (chapterIndex, userProgress) =>
  userProgress.attemptedExams[chapterIndex]?.attempted || false;

/**
 * Get the exam result for a chapter
 * @param {number} chapterIndex - Chapter index
 * @param {Object} userProgress - User progress object
 * @returns {Object} Exam result object or undefined
 */
export const getExamResult = (chapterIndex, userProgress) =>
  userProgress.attemptedExams[chapterIndex]?.result;

import { getLessonUnlockDate } from "./dateUtils.js";

export { getLessonUnlockDate };

/**
 * Check if a lesson is unlocked based on the schedule
 * @param {number} chapterIndex - Chapter index
 * @param {number} lessonIndex - Lesson index within chapter
 * @param {Array} chapters - All course chapters
 * @param {Date} purchaseDate - Date when user purchased the course
 * @returns {boolean} True if lesson is unlocked by schedule
 */
export const isLessonUnlockedBySchedule = (
  chapterIndex,
  lessonIndex,
  chapters,
  purchaseDate
) => {
  // Calculate global lesson index across all chapters
  let globalIndex = 0;
  for (let i = 0; i < chapters.length; i++) {
    if (i < chapterIndex) {
      globalIndex += chapters[i].lessons?.length || 0;
    } else if (i === chapterIndex) {
      globalIndex += lessonIndex;
      break;
    }
  }

  if (globalIndex === 0) return true; // First lesson always unlocked

  const unlockDate = getLessonUnlockDate(globalIndex, purchaseDate);
  if (!unlockDate) return true;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const unlockDateStart = new Date(unlockDate);
  unlockDateStart.setHours(0, 0, 0, 0);

  return now >= unlockDateStart;
};

/**
 * Check if a lesson is locked (cannot be accessed yet)
 * A lesson is locked if:
 * - It's not the first lesson AND
 * - Either: (1) not unlocked by schedule, OR (2) previous lesson not completed, OR (3) previous chapter requirements not met
 *
 * @param {number} chapterIndex - Chapter index
 * @param {number} lessonIndex - Lesson index within chapter
 * @param {Array} chapters - All course chapters
 * @param {Object} userProgress - User progress object
 * @param {Date} purchaseDate - Purchase date for schedule unlock
 * @returns {boolean} True if lesson is locked
 */
export const isLessonLocked = (
  chapterIndex,
  lessonIndex,
  chapters,
  userProgress,
  purchaseDate
) => {
  // First lesson is always unlocked
  if (chapterIndex === 0 && lessonIndex === 0) return false;

  // Check if lesson is unlocked by schedule
  const unlockedBySchedule = isLessonUnlockedBySchedule(
    chapterIndex,
    lessonIndex,
    chapters,
    purchaseDate
  );
  if (!unlockedBySchedule) return true; // Locked by schedule

  // Check if previous lesson in same chapter is completed
  if (lessonIndex > 0)
    return !isLessonCompleted(chapterIndex, lessonIndex - 1, userProgress);

  // Check previous chapter requirements
  const prevChapter = chapters[chapterIndex - 1];
  if (!prevChapter) return true;

  // If previous chapter has exam, check if it's attempted
  if (prevChapter.exam) return !hasAttemptedExam(chapterIndex - 1, userProgress);

  // If previous chapter has lessons, check if last lesson is completed
  if (prevChapter.lessons?.length > 0)
    return !isLessonCompleted(
      chapterIndex - 1,
      prevChapter.lessons.length - 1,
      userProgress
    );

  return true;
};

/**
 * Check if an exam is available (all lessons in chapter completed)
 * @param {number} chapterIndex - Chapter index
 * @param {Array} chapters - All course chapters
 * @param {Object} userProgress - User progress object
 * @returns {boolean} True if exam is available
 */
export const isExamAvailable = (chapterIndex, chapters, userProgress) => {
  const chapter = chapters[chapterIndex];
  if (!chapter?.exam) return false;
  return (
    chapter.lessons?.every((_, lessonIndex) =>
      isLessonCompleted(chapterIndex, lessonIndex, userProgress)
    ) ?? true
  );
};

/**
 * Get the next lesson or exam from current position
 * @param {Object} selectedLesson - Current lesson object with chapterIndex, lessonIndex, type
 * @param {Array} chapters - All course chapters
 * @param {Object} userProgress - User progress object
 * @returns {Object|null} Next lesson object {chapterIndex, lessonIndex?, type} or null
 */
export const getNextLesson = (selectedLesson, chapters, userProgress) => {
  const chapterIndex = selectedLesson?.chapterIndex;
  const lessonIndex = selectedLesson?.lessonIndex;
  const type = selectedLesson?.type;

  if (!chapters || chapters.length === 0) return null;

  const currentChapter = chapters[chapterIndex];

  if (type === "lesson") {
    // Check if there are more lessons in current chapter
    if (
      currentChapter.lessons &&
      lessonIndex + 1 < currentChapter.lessons.length
    ) {
      return { chapterIndex, lessonIndex: lessonIndex + 1, type: "lesson" };
    }
    // Check if current chapter has an exam
    else if (currentChapter.exam && isExamAvailable(chapterIndex, chapters, userProgress)) {
      return { chapterIndex, type: "exam" };
    }
    // Move to next chapter's first lesson
    else if (chapterIndex + 1 < chapters.length) {
      const nextChapter = chapters[chapterIndex + 1];
      if (nextChapter.lessons && nextChapter.lessons.length > 0) {
        return {
          chapterIndex: chapterIndex + 1,
          lessonIndex: 0,
          type: "lesson",
        };
      }
    }
  } else if (type === "exam") {
    // After exam, move to next chapter's first lesson
    if (chapterIndex + 1 < chapters.length) {
      const nextChapter = chapters[chapterIndex + 1];
      if (nextChapter.lessons && nextChapter.lessons.length > 0) {
        return {
          chapterIndex: chapterIndex + 1,
          lessonIndex: 0,
          type: "lesson",
        };
      }
    }
  }

  return null; // No next lesson available
};

/**
 * Get the previous lesson from current position
 * @param {Object} selectedLesson - Current lesson object with chapterIndex, lessonIndex, type
 * @param {Array} chapters - All course chapters
 * @returns {Object|null} Previous lesson object {chapterIndex, lessonIndex?, type} or null
 */
export const getPreviousLesson = (selectedLesson, chapters) => {
  const chapterIndex = selectedLesson?.chapterIndex;
  const lessonIndex = selectedLesson?.lessonIndex;
  const type = selectedLesson?.type;

  if (!chapters || chapters.length === 0) return null;

  if (type === "exam") {
    // If coming from exam, go to last lesson of this chapter
    const chapter = chapters[chapterIndex];
    if (chapter.lessons && chapter.lessons.length > 0) {
      return {
        chapterIndex,
        lessonIndex: chapter.lessons.length - 1,
        type: "lesson",
      };
    }
    // If no lessons, go to previous chapter
    if (chapterIndex > 0) {
      const prevChapter = chapters[chapterIndex - 1];
      if (prevChapter.lessons && prevChapter.lessons.length > 0) {
        return {
          chapterIndex: chapterIndex - 1,
          lessonIndex: prevChapter.lessons.length - 1,
          type: "lesson",
        };
      }
    }
  } else if (type === "lesson") {
    // If not the first lesson, go to previous lesson in chapter
    if (lessonIndex > 0) {
      return { chapterIndex, lessonIndex: lessonIndex - 1, type: "lesson" };
    }
    // If first lesson in chapter, check if previous chapter has exam
    if (chapterIndex > 0) {
      const prevChapter = chapters[chapterIndex - 1];
      if (prevChapter.exam) {
        return { chapterIndex: chapterIndex - 1, type: "exam" };
      }
      // Otherwise go to last lesson of previous chapter
      if (prevChapter.lessons && prevChapter.lessons.length > 0) {
        return {
          chapterIndex: chapterIndex - 1,
          lessonIndex: prevChapter.lessons.length - 1,
          type: "lesson",
        };
      }
    }
  }

  return null; // No previous lesson available
};
