import {
  isLessonCompleted,
  hasAttemptedExam,
  getExamResult,
  getLessonUnlockDate,
  isLessonUnlockedBySchedule,
  isLessonLocked,
  isExamAvailable,
  getNextLesson,
  getPreviousLesson,
} from '../../pages/Course/utils/progressUtils';

describe('progressUtils', () => {
  const mockUserProgress = {
    completedLessons: ['0-0', '0-1', '1-0'],
    attemptedExams: {
      0: { attempted: true, result: { score: 85, passed: true } },
      1: { attempted: false },
    },
  };

  const mockChapters = [
    {
      id: 'ch1',
      lessons: [{ id: 'l1' }, { id: 'l2' }],
      exam: true,
    },
    {
      id: 'ch2',
      lessons: [{ id: 'l3' }, { id: 'l4' }],
      exam: true,
    },
    {
      id: 'ch3',
      lessons: [{ id: 'l5' }],
    },
  ];

  describe('isLessonCompleted', () => {
    test('returns true if lesson is in completed lessons array', () => {
      expect(isLessonCompleted(0, 0, mockUserProgress)).toBe(true);
      expect(isLessonCompleted(0, 1, mockUserProgress)).toBe(true);
      expect(isLessonCompleted(1, 0, mockUserProgress)).toBe(true);
    });

    test('returns false if lesson is not in completed lessons array', () => {
      expect(isLessonCompleted(0, 2, mockUserProgress)).toBe(false);
      expect(isLessonCompleted(1, 1, mockUserProgress)).toBe(false);
      expect(isLessonCompleted(2, 0, mockUserProgress)).toBe(false);
    });

    test('handles empty completed lessons array', () => {
      const emptyProgress = { completedLessons: [] };
      expect(isLessonCompleted(0, 0, emptyProgress)).toBe(false);
    });
  });

  describe('hasAttemptedExam', () => {
    test('returns true if exam was attempted', () => {
      expect(hasAttemptedExam(0, mockUserProgress)).toBe(true);
    });

    test('returns false if exam was not attempted', () => {
      expect(hasAttemptedExam(1, mockUserProgress)).toBe(false);
      expect(hasAttemptedExam(2, mockUserProgress)).toBe(false);
    });

    test('returns false for non-existent chapter', () => {
      expect(hasAttemptedExam(99, mockUserProgress)).toBe(false);
    });

    test('handles empty or undefined attemptedExams property', () => {
      const progress = { attemptedExams: {} };
      expect(hasAttemptedExam(0, progress)).toBe(false);
      expect(hasAttemptedExam(1, progress)).toBe(false);
    });
  });

  describe('getExamResult', () => {
    test('returns exam result for attempted exam', () => {
      const result = getExamResult(0, mockUserProgress);
      expect(result).toEqual({ score: 85, passed: true });
    });

    test('returns undefined for non-attempted exam', () => {
      expect(getExamResult(1, mockUserProgress)).toBeUndefined();
    });

    test('returns undefined for non-existent chapter', () => {
      expect(getExamResult(99, mockUserProgress)).toBeUndefined();
    });
  });

  describe('getLessonUnlockDate', () => {
    test('returns null for lesson 0 (first lesson)', () => {
      const purchaseDate = new Date('2026-04-01');
      expect(getLessonUnlockDate(0, purchaseDate)).toBeNull();
    });

    test('returns null when no purchase date', () => {
      expect(getLessonUnlockDate(5, null)).toBeNull();
    });

    test('calculates correct unlock date for subsequent lessons (MWF drip)', () => {
      const purchaseDate = new Date(2026, 3, 1); // Wed Apr 1, 2026 —3rd MWF is Apr 6
      const result = getLessonUnlockDate(3, purchaseDate);
      expect(result.getDate()).toBe(6);
      expect([1, 3, 5]).toContain(result.getDay());
    });
  });

  describe('isLessonUnlockedBySchedule', () => {
    const purchaseDate = new Date(2020, 0, 1); // Wed — many MWF slots have passed since

    test('returns true for first lesson', () => {
      expect(isLessonUnlockedBySchedule(0, 0, mockChapters, purchaseDate)).toBe(true);
    });

    test('returns true for lessons that are scheduled (past purchase + MWF slots)', () => {
      expect(isLessonUnlockedBySchedule(0, 1, mockChapters, purchaseDate)).toBe(true);
      expect(isLessonUnlockedBySchedule(1, 0, mockChapters, purchaseDate)).toBe(true);
    });

    test('returns false for lessons scheduled in future', () => {
      const futurePurchaseDate = new Date(2099, 5, 1);
      expect(isLessonUnlockedBySchedule(0, 1, mockChapters, futurePurchaseDate)).toBe(false);
    });

    test('handles zero purchase date correctly', () => {
      const oldPurchaseDate = new Date('2020-01-01');
      expect(isLessonUnlockedBySchedule(2, 1, mockChapters, oldPurchaseDate)).toBe(true);
    });
  });

  describe('isLessonLocked', () => {
    const purchaseDate = new Date(2020, 0, 1);

    test('returns false for first lesson (always unlocked)', () => {
      expect(isLessonLocked(0, 0, mockChapters, mockUserProgress, purchaseDate)).toBe(false);
    });

    test('returns false if all prerequisites are met', () => {
      // Lesson 0-1 is completed, so 0-2 should not be locked (if scheduled)
      expect(isLessonLocked(0, 1, mockChapters, mockUserProgress, purchaseDate)).toBe(false);
    });

    test('returns true if previous lesson not completed', () => {
      // Lesson 1-1 depends on 1-0 being completed
      // In mockUserProgress, 1-0 IS completed, so 1-1 is NOT locked
      const progressWithout1_0 = {
        completedLessons: ['0-0', '0-1'], // 1-0 NOT completed
        attemptedExams: { 0: { attempted: true } },
      };
      expect(isLessonLocked(1, 1, mockChapters, progressWithout1_0, purchaseDate)).toBe(true);
    });

    test('returns true if schedule not yet unlocked', () => {
      const futurePurchaseDate = new Date();
      futurePurchaseDate.setDate(futurePurchaseDate.getDate() + 10);
      expect(isLessonLocked(0, 1, mockChapters, mockUserProgress, futurePurchaseDate)).toBe(true);
    });

    test('returns true if previous chapter exam not attempted', () => {
      // Chapter 1 first lesson depends on chapter 0 exam
      expect(isLessonLocked(1, 0, mockChapters, mockUserProgress, purchaseDate)).toBe(false); // Exam was attempted
    });

    test('handles chapter with no exam', () => {
      const chaptersWithoutExam = [
        { lessons: [{ id: 'l1' }] }, // No exam
        { lessons: [{ id: 'l2' }] },
      ];
      const progressNoExamAttempt = { completedLessons: ['0-0'], attemptedExams: {} };
      expect(isLessonLocked(1, 0, chaptersWithoutExam, progressNoExamAttempt, purchaseDate)).toBe(false);
    });
  });

  describe('isExamAvailable', () => {
    test('returns false if chapter has no exam', () => {
      expect(isExamAvailable(2, mockChapters, mockUserProgress)).toBe(false);
    });

    test('returns true if all lessons are completed', () => {
      const progressAllCompleted = {
        completedLessons: ['0-0', '0-1', '1-0', '1-1'],
        attemptedExams: {},
      };
      expect(isExamAvailable(0, mockChapters, progressAllCompleted)).toBe(true);
    });

    test('returns false if not all lessons are completed', () => {
      expect(isExamAvailable(1, mockChapters, mockUserProgress)).toBe(false);
    });

    test('returns true for chapter with no lessons', () => {
      const chaptersNoLessons = [{ exam: true, lessons: [] }];
      expect(isExamAvailable(0, chaptersNoLessons, mockUserProgress)).toBe(true);
    });
  });

  describe('getNextLesson', () => {
    test('returns next lesson in same chapter', () => {
      const selected = { chapterIndex: 0, lessonIndex: 0, type: 'lesson' };
      const result = getNextLesson(selected, mockChapters, mockUserProgress);
      expect(result).toEqual({ chapterIndex: 0, lessonIndex: 1, type: 'lesson' });
    });

    test('returns exam when all lessons completed', () => {
      const selected = { chapterIndex: 0, lessonIndex: 1, type: 'lesson' };
      const progressComplete = {
        completedLessons: ['0-0', '0-1'],
        attemptedExams: {},
      };
      const result = getNextLesson(selected, mockChapters, progressComplete);
      expect(result).toEqual({ chapterIndex: 0, type: 'exam' });
    });

    test('returns next chapter first lesson after exam', () => {
      const selected = { chapterIndex: 0, type: 'exam' };
      const result = getNextLesson(selected, mockChapters, mockUserProgress);
      expect(result).toEqual({ chapterIndex: 1, lessonIndex: 0, type: 'lesson' });
    });

    test('returns null when at end of course', () => {
      const selected = { chapterIndex: 2, lessonIndex: 0, type: 'lesson' };
      const result = getNextLesson(selected, mockChapters, mockUserProgress);
      expect(result).toBeNull();
    });

    test('handles invalid selected lesson', () => {
      const result = getNextLesson(null, mockChapters, mockUserProgress);
      expect(result).toBeNull();
    });

    test('returns null for empty chapters', () => {
      const selected = { chapterIndex: 0, lessonIndex: 0, type: 'lesson' };
      expect(getNextLesson(selected, [], mockUserProgress)).toBeNull();
    });
  });

  describe('getPreviousLesson', () => {
    test('returns previous lesson in same chapter', () => {
      const selected = { chapterIndex: 0, lessonIndex: 1, type: 'lesson' };
      const result = getPreviousLesson(selected, mockChapters);
      expect(result).toEqual({ chapterIndex: 0, lessonIndex: 0, type: 'lesson' });
    });

    test('returns exam when on first lesson of chapter with exam in previous chapter', () => {
      const selected = { chapterIndex: 1, lessonIndex: 0, type: 'lesson' };
      const result = getPreviousLesson(selected, mockChapters);
      expect(result).toEqual({ chapterIndex: 0, type: 'exam' });
    });

    test('returns last lesson of previous chapter', () => {
      const selected = { chapterIndex: 1, lessonIndex: 0, type: 'lesson' };
      const chaptersNoExam = [
        { lessons: [{ id: 'l1' }] },
        { lessons: [{ id: 'l2' }] },
      ];
      const result = getPreviousLesson(selected, chaptersNoExam);
      expect(result).toEqual({ chapterIndex: 0, lessonIndex: 0, type: 'lesson' });
    });

    test('returns last lesson of chapter from exam', () => {
      const selected = { chapterIndex: 0, type: 'exam' };
      const result = getPreviousLesson(selected, mockChapters);
      expect(result).toEqual({ chapterIndex: 0, lessonIndex: 1, type: 'lesson' });
    });

    test('returns null when at beginning of course', () => {
      const selected = { chapterIndex: 0, lessonIndex: 0, type: 'lesson' };
      const result = getPreviousLesson(selected, mockChapters);
      expect(result).toBeNull();
    });

    test('handles invalid selected lesson', () => {
      const result = getPreviousLesson(null, mockChapters);
      expect(result).toBeNull();
    });

    test('returns null for empty chapters', () => {
      const selected = { chapterIndex: 0, lessonIndex: 0, type: 'lesson' };
      expect(getPreviousLesson(selected, [])).toBeNull();
    });
  });
});
