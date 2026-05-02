/**
 * ISSUE #47 FIX 3.47.10: Lesson Locking Logic (Custom Hook)
 * All schedule-based and prerequisite-based locking checks
 */

import { useCallback } from "react";
import { getLessonUnlockDate, isUnlocked } from "../utils/dateUtils";

/**
 * useLessonLocking
 * Provides all locking-related helpers as closures
 * @param {Object} params
 * @param {Array} params.chapters - Course chapter structure
 * @param {Object} params.userProgress - { completedLessons[], attemptedExams{} }
 * @param {string} params.purchaseDate - Course purchase date
 * @returns {Object} - All locking helper functions
 */
export const useLessonLocking = ({ chapters, userProgress, purchaseDate }) => {
  // Helper 1: Check if a specific lesson is marked as completed
  const isLessonCompleted = useCallback(
    (chapterIndex, lessonIndex) =>
      userProgress?.completedLessons?.includes(
        `${chapterIndex}-${lessonIndex}`
      ) || false,
    [userProgress?.completedLessons]
  );

  // Helper 2: Check if user has attempted an exam in a chapter
  const hasAttemptedExam = useCallback(
    (chapterIndex) =>
      userProgress?.attemptedExams?.[chapterIndex]?.attempted || false,
    [userProgress?.attemptedExams]
  );

  // Helper 3: Get exam result (score, percentage, etc.)
  const getExamResult = useCallback(
    (chapterIndex) => userProgress?.attemptedExams?.[chapterIndex]?.result,
    [userProgress?.attemptedExams]
  );

  // Helper 4: Check if a lesson is unlocked based on schedule (purchase date + days)
  const isLessonUnlockedBySchedule = useCallback(
    (chapterIndex, lessonIndex) => {
      if (!chapters || chapters.length === 0) return false;

      // Calculate global lesson index across all chapters
      let globalIndex = 0;
      for (let i = 0; i < chapters.length; i++) {
        if (i < chapterIndex) {
          globalIndex += chapters[i]?.lessons?.length || 0;
        } else if (i === chapterIndex) {
          globalIndex += lessonIndex;
          break;
        }
      }

      // First lesson (globalIndex 0) is always unlocked
      if (globalIndex === 0) return true;

      // Calculate unlock date (purchaseDate + globalIndex days)
      const unlockDate = getLessonUnlockDate(globalIndex, purchaseDate);
      if (!unlockDate) return true;

      // Check if today is >= unlockDate
      return isUnlocked(unlockDate);
    },
    [chapters, purchaseDate]
  );

  // Helper 5: Check all locking conditions (schedule + prerequisites)
  const isLessonLocked = useCallback(
    (chapterIndex, lessonIndex) => {
      // First lesson is always unlocked
      if (chapterIndex === 0 && lessonIndex === 0) return false;

      // Check if lesson is unlocked by schedule
      const unlockedBySchedule = isLessonUnlockedBySchedule(
        chapterIndex,
        lessonIndex
      );
      if (!unlockedBySchedule) return true; // Locked by schedule

      // Check if previous lesson in same chapter is completed
      if (lessonIndex > 0) {
        return !isLessonCompleted(chapterIndex, lessonIndex - 1);
      }

      // Check previous chapter requirements
      const prevChapter = chapters?.[chapterIndex - 1];
      if (!prevChapter) return false; // No previous chapter = unlocked

      // If previous chapter has exam, user must have attempted it
      if (prevChapter.exam) {
        return !hasAttemptedExam(chapterIndex - 1);
      }

      // If previous chapter has lessons, last lesson must be completed
      if (prevChapter.lessons?.length > 0) {
        return !isLessonCompleted(
          chapterIndex - 1,
          prevChapter.lessons.length - 1
        );
      }

      return false; // Not locked
    },
    [chapters, isLessonUnlockedBySchedule, isLessonCompleted, hasAttemptedExam]
  );

  // Helper 6: Check if exam is available (all lessons in chapter completed)
  const isExamAvailable = useCallback(
    (chapterIndex) => {
      const chapter = chapters?.[chapterIndex];
      if (!chapter?.exam) return false;

      return (
        chapter.lessons?.every((_, lessonIndex) =>
          isLessonCompleted(chapterIndex, lessonIndex)
        ) ?? true
      );
    },
    [chapters, isLessonCompleted]
  );

  // Helper 7: Get the next lesson in course sequence
  const getNextLesson = useCallback(
    (
      chapterIndex = undefined,
      lessonIndex = undefined,
      type = undefined
    ) => {
      if (!chapters || chapters.length === 0) return null;

      const currentChapter = chapters[chapterIndex];

      if (type === "lesson") {
        // Check if there are more lessons in current chapter
        if (
          currentChapter?.lessons &&
          lessonIndex + 1 < currentChapter.lessons.length
        ) {
          return { chapterIndex, lessonIndex: lessonIndex + 1, type: "lesson" };
        }
        // Check if current chapter has an exam
        else if (currentChapter?.exam && isExamAvailable(chapterIndex)) {
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
    },
    [chapters, isExamAvailable]
  );

  return {
    isLessonCompleted,
    hasAttemptedExam,
    getExamResult,
    isLessonUnlockedBySchedule,
    isLessonLocked,
    isExamAvailable,
    getNextLesson,
  };
};
