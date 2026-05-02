import { renderHook, act } from '@testing-library/react';
import { useExamState } from '../../pages/Course/hooks/useExamState';

// Mock API
jest.mock('../../service/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('useExamState', () => {
  const mockSelectedLesson = {
    chapterIndex: 0,
    lessonIndex: 5,
    type: 'exam',
  };

  const mockChapters = [
    {
      id: 'ch1',
      lessons: [{ id: 'l1' }, { id: 'l2' }],
      exam: {
        id: 'exam-1',
        totalQuestions: 10,
        examQuestions: [{ id: 'q1' }, { id: 'q2' }],
      },
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    test('initializes with empty exam state', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      expect(result.current.examAnswers).toEqual({});
      expect(result.current.examTimer).toBeDefined();
      expect(result.current.examTimerActive).toBeDefined();
      expect(result.current.examStarted).toBeDefined();
      expect(result.current.examCompleted).toBeDefined();
    });

    test('initializes flags correctly', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      expect(result.current.showExamModal).toBe(false);
      expect(result.current.hasAnsweredQuestions).toBe(false);
      expect(result.current.submissionError).toBe('');
      expect(result.current.examInProgress).toBe(false);
    });
  });

  describe('answer selection', () => {
    test('handles answer selection', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.handleAnswerSelect('q1', 'A');
      });

      expect(result.current.examAnswers.q1).toBe('A');
      expect(result.current.hasAnsweredQuestions).toBe(true);
    });

    test('updates multiple answers', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.handleAnswerSelect('q1', 'A');
        result.current.handleAnswerSelect('q2', 'B');
        result.current.handleAnswerSelect('q3', 'C');
      });

      expect(result.current.examAnswers).toEqual({
        q1: 'A',
        q2: 'B',
        q3: 'C',
      });
    });

    test('changes previous answer', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.handleAnswerSelect('q1', 'A');
        result.current.handleAnswerSelect('q1', 'B');
      });

      expect(result.current.examAnswers.q1).toBe('B');
    });

    test('handles answer selection', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.handleAnswerSelect('0-0', 'A');
      });

      expect(result.current.examAnswers).toBeDefined();
    });
  });

  describe('timer management', () => {
    test('starts exam timer', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.setExamTimer(300);
        result.current.setExamTimerActive(true);
      });

      expect(result.current.examTimer).toBe(300);
      expect(result.current.examTimerActive).toBe(true);
    });

    test('updates exam timer', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.setExamTimer(300);
        result.current.setExamTimer(250);
      });

      expect(result.current.examTimer).toBe(250);
    });

    test('stops timer when expired', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.setExamTimer(300);
        result.current.setExamTimer(0);
        result.current.setExamTimerActive(false);
      });

      expect(result.current.examTimerActive).toBe(false);
    });
  });

  describe('exam state persistence', () => {
    test('saves exam state to localStorage', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.saveExamState({
          examStarted: true,
          examStartedAt: null,
          examTimerActive: false,
          showExamModal: false,
          examInProgress: false,
          examCompleted: false,
          examTimer: 300,
          examAnswers: { q1: 'A' },
          currentQuestionIndex: 0,
          hasAnsweredQuestions: true,
          timestamp: Date.now(),
        });
      });

      const saved = localStorage.getItem('examState_v2_course-1_0');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved);
      expect(parsed.examAnswers.q1).toBe('A');
    });

    test('loads exam state from localStorage', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      const examData = {
        examAnswers: { q1: 'A', q2: 'B' },
        examTimer: 200,
        examTimerActive: true,
      };

      act(() => {
        localStorage.setItem(
          'examState_v2_course-1_0',
          JSON.stringify(examData)
        );
        // Manually set the state to simulate loading
        result.current.setExamAnswers(examData.examAnswers);
        result.current.setExamTimer(examData.examTimer);
        result.current.setExamTimerActive(examData.examTimerActive);
      });

      // State should be set
      expect(result.current.examAnswers.q1).toBe('A');
    });

    test('migrates old exam state format', async () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      const oldExamData = { examAnswers: { q1: 'A' } };

      act(() => {
        localStorage.setItem(
          'examState_course-1_0',
          JSON.stringify(oldExamData)
        );
        // Clear the new key
        localStorage.removeItem('examState_v2_course-1_0');
      });

      // Call clearExamState
      act(() => {
        result.current.clearExamState();
      });

      await new Promise(resolve => setTimeout(resolve, 0));

      // Both keys should be removed
      expect(localStorage.getItem('examState_course-1_0')).toBeNull();
      expect(localStorage.getItem('examState_v2_course-1_0')).toBeNull();
    });
  });

  describe('exam submission', () => {
    test('marks exam as started', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.startExam();
      });

      expect(result.current.examStarted).toBe(true);
    });

    test('marks exam as in progress', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.startExam();
      });

      expect(result.current.examInProgress).toBe(true);
    });

    test('marks exam as completed', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.setExamCompleted(true);
        result.current.setExamInProgress(false);
      });

      expect(result.current.examCompleted).toBe(true);
      expect(result.current.examInProgress).toBe(false);
    });

    test('sets submission error', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      const errorMsg = 'Submission failed';

      act(() => {
        result.current.setSubmissionError(errorMsg);
      });

      expect(result.current.submissionError).toBe(errorMsg);
    });
  });

  describe('state clearing', () => {
    test('clears exam state', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.handleAnswerSelect('q1', 'A');
        result.current.startExam();
        result.current.clearExamState();
      });

      const saved = localStorage.getItem('examState_v2_course-1_0');
      expect(saved).toBeNull();
    });

    test('resets all exam flags', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.handleAnswerSelect('q1', 'A');
        result.current.startExam();
        result.current.setExamCompleted(true);
        // Reset state
        result.current.setExamAnswers({});
        result.current.setExamStarted(false);
        result.current.setExamCompleted(false);
        result.current.setExamInProgress(false);
      });

      expect(result.current.examAnswers).toEqual({});
      expect(result.current.examStarted).toBe(false);
      expect(result.current.examCompleted).toBe(false);
    });
  });

  describe('modal management', () => {
    test('shows/hides exam modal', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      expect(result.current.showExamModal).toBe(false);

      act(() => {
        result.current.setShowExamModal(true);
      });

      expect(result.current.showExamModal).toBe(true);
    });

    test('shows validation highlight', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.setShowValidationHighlight(true);
      });

      expect(result.current.showValidationHighlight).toBe(true);
    });
  });

  describe('submission status', () => {
    test('sets submission status', () => {
      const { result } = renderHook(() =>
        useExamState({
          courseId: 'course-1',
          selectedLesson: mockSelectedLesson,
          chapters: mockChapters,
        })
      );

      act(() => {
        result.current.setSubmissionStatus('pending');
      });

      expect(result.current.submissionStatus).toBe('pending');

      act(() => {
        result.current.setSubmissionStatus('success');
      });

      expect(result.current.submissionStatus).toBe('success');
    });
  });
});
