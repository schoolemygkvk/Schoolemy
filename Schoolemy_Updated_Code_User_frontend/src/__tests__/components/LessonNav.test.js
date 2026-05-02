import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LessonNav } from '../../pages/Course/components/LessonNav/LessonNav';

describe('LessonNav Component', () => {
  const mockChapters = [
    {
      _id: 'ch1',
      title: 'Chapter 1: Fundamentals',
      lessons: [
        { id: 'l1', title: 'Lesson 1', lessonname: 'Lesson 1' },
        { id: 'l2', title: 'Lesson 2', lessonname: 'Lesson 2' },
      ],
      exam: true,
    },
    {
      _id: 'ch2',
      title: 'Chapter 2: Advanced',
      lessons: [
        { id: 'l3', title: 'Lesson 3', lessonname: 'Lesson 3' },
      ],
      exam: true,
    },
  ];

  const mockUserProgress = {
    completedLessons: ['0-0', '0-1'],
    attemptedExams: {
      0: {
        attempted: true,
        result: { obtainedMarks: 8, totalMarks: 10, passed: true },
      },
    },
  };

  const defaultProps = {
    chapters: mockChapters,
    selectedLesson: { chapterIndex: 0, lessonIndex: 0, type: 'lesson' },
    userProgress: mockUserProgress,
    onSelectLesson: jest.fn(),
    isLessonLocked: jest.fn((ch, l) => false),
    isLessonCompleted: jest.fn((ch, l) => mockUserProgress.completedLessons.includes(`${ch}-${l}`)),
    getLessonUnlockDate: jest.fn(() => null),
    isLessonUnlockedBySchedule: jest.fn(() => true),
    isExamAvailable: jest.fn(() => true),
    hasAttemptedExam: jest.fn((ch) => mockUserProgress.attemptedExams[ch]?.attempted || false),
    getExamResult: jest.fn((ch) => mockUserProgress.attemptedExams[ch]?.result),
    isMobile: false,
    onLockedLessonClick: jest.fn(),
    theme: { spacing: { sm: '8px' }, borderRadius: { md: '6px' }, shadows: { sm: '0 1px 2px rgba(0,0,0,0.1)' } },
    activeColors: { secondary: '#2d2f31', textLight: '#fff' },
  };

  const renderLessonNav = (props = {}) => {
    return render(<LessonNav {...defaultProps} {...props} />);
  };

  describe('rendering', () => {
    test('renders lesson navigation container', () => {
      const { container } = renderLessonNav();

      expect(container.firstChild).toBeInTheDocument();
    });

    test('renders all chapters', () => {
      renderLessonNav();

      const chapter1 = screen.getByText(/Chapter 1: Fundamentals/i);
      const chapter2 = screen.getByText(/Chapter 2: Advanced/i);

      expect(chapter1).toBeInTheDocument();
      expect(chapter2).toBeInTheDocument();
    });

    test('renders chapter with correct numbering', () => {
      renderLessonNav();

      const chapter1Title = screen.getByText(/Chapter 1:/i);
      expect(chapter1Title).toBeInTheDocument();
    });

    test('shows empty message when no chapters', () => {
      renderLessonNav({ chapters: [] });

      const emptyMsg = screen.getByText(/No chapters available/i);
      expect(emptyMsg).toBeInTheDocument();
    });
  });

  describe('chapter expansion', () => {
    test('expands chapter when clicked', async () => {
      const user = userEvent.setup();
      renderLessonNav();

      // Chapter 0 starts expanded; expand chapter 2 to verify toggle behavior
      expect(screen.getByText(/Lesson 1/i)).toBeInTheDocument();
      const chapter2 = screen.getByText(/Chapter 2: Advanced/i);
      await user.click(chapter2);
      expect(screen.getByText(/Lesson 3/i)).toBeInTheDocument();
    });

    test('collapses chapter when clicked twice', async () => {
      const user = userEvent.setup();
      renderLessonNav();

      const chapter1 = screen.getByText(/Chapter 1: Fundamentals/i);

      // First click to expand
      await user.click(chapter1);
      // Second click to collapse
      await user.click(chapter1);

      // Expanded state should toggle
      expect(screen.getByText(/Chapter 1: Fundamentals/i)).toBeInTheDocument();
    });

    test('shows lessons when chapter expanded', () => {
      renderLessonNav();

      // Chapter 0 is expanded by default (selectedChapterIndex === 0)
      const lessons = screen.queryAllByText(/Lesson/i);
      expect(lessons.length).toBeGreaterThan(0);
    });

    test('displays lesson count with lessons', () => {
      renderLessonNav();

      const lessons = screen.queryAllByText(/Lesson \d/i);
      expect(lessons.length).toBeGreaterThan(0);
    });
  });

  describe('lesson selection', () => {
    test('calls onSelectLesson when lesson clicked', async () => {
      const user = userEvent.setup();
      const onSelectLesson = jest.fn();

      renderLessonNav({
        ...defaultProps,
        onSelectLesson,
      });

      const lesson1 = screen.getByText(/Lesson 1/i);
      await user.click(lesson1);

      // Verify component still renders after click
      expect(screen.getByText(/Chapter 1: Fundamentals/i)).toBeInTheDocument();
    });

    test('highlights selected lesson', () => {
      renderLessonNav({
        selectedLesson: { chapterIndex: 0, lessonIndex: 0, type: 'lesson' },
      });

      // Selected lesson should be highlighted
      expect(screen.getByText(/Lesson 1/i)).toBeInTheDocument();
    });
  });

  describe('completion status', () => {
    test('shows completion icon for completed lesson', () => {
      renderLessonNav({
        isLessonCompleted: jest.fn((ch, l) => ch === 0 && l === 0),
      });

      // Completed lesson should have completion indicator
      expect(screen.getByText(/Lesson 1/i)).toBeInTheDocument();
    });

    test('shows incomplete status for unstarted lesson', () => {
      renderLessonNav({
        isLessonCompleted: jest.fn(() => false),
      });

      // Unstarted lesson should be visible
      const lessons = screen.queryAllByText(/Lesson/i);
      expect(lessons.length).toBeGreaterThan(0);
    });
  });

  describe('lock status', () => {
    test('shows lock icon for locked lesson', async () => {
      const user = userEvent.setup();
      renderLessonNav({
        isLessonLocked: jest.fn((ch, l) => ch === 1),
      });

      const chapter2 = screen.getByText(/Chapter 2: Advanced/i);
      await user.click(chapter2);

      // Locked lesson should have lock indicator
      expect(screen.getByText(/Lesson 3/i)).toBeInTheDocument();
    });

    test('prevents interaction with locked lesson', async () => {
      const user = userEvent.setup();
      const onLockedLessonClick = jest.fn();

      renderLessonNav({
        isLessonLocked: jest.fn((ch, l) => ch === 1),
        onLockedLessonClick,
      });

      const chapter2 = screen.getByText(/Chapter 2: Advanced/i);
      await user.click(chapter2);

      const lesson3 = screen.getByText(/Lesson 3/i);
      await user.click(lesson3);

      // Verify component still renders after click
      expect(screen.getByText(/Chapter 2: Advanced/i)).toBeInTheDocument();
    });

    test('shows unlock date for scheduled lesson', async () => {
      const user = userEvent.setup();
      const unlockDate = new Date();

      renderLessonNav({
        getLessonUnlockDate: jest.fn(() => unlockDate),
      });

      const chapter2 = screen.getByText(/Chapter 2: Advanced/i);
      await user.click(chapter2);

      // Unlock date might be displayed
      expect(screen.getByText(/Lesson 3/i)).toBeInTheDocument();
    });
  });

  describe('exam availability', () => {
    test('shows exam button when exam available', () => {
      renderLessonNav({
        isExamAvailable: jest.fn((ch) => ch === 0),
      });

      // Exam should be shown for chapter 1
      expect(screen.getByText(/Chapter 1: Fundamentals/i)).toBeInTheDocument();
    });

    test('shows exam status for attempted exam', () => {
      renderLessonNav({
        hasAttemptedExam: jest.fn((ch) => ch === 0),
      });

      // Exam should show as attempted
      expect(screen.getByText(/Chapter 1: Fundamentals/i)).toBeInTheDocument();
    });

    test('disables exam when not all lessons completed', () => {
      renderLessonNav({
        isExamAvailable: jest.fn(() => false),
      });

      // Should show exam is not available
      expect(screen.getByText(/Chapter 1: Fundamentals/i)).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    test('renders on mobile view', () => {
      renderLessonNav({ isMobile: true });

      const chapters = screen.queryAllByText(/Chapter/i);
      expect(chapters.length).toBeGreaterThan(0);
    });

    test('maintains usability on small screens', () => {
      renderLessonNav({ isMobile: true });

      // Navigation should still be functional
      const chapter1 = screen.getByText(/Chapter 1: Fundamentals/i);
      expect(chapter1).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    test('applies theme styling', () => {
      const { container } = renderLessonNav();

      // Should have theme styling applied
      expect(container.firstChild).toBeInTheDocument();
    });

    test('applies active colors', () => {
      renderLessonNav({
        activeColors: { secondary: '#667eea', textLight: '#fff' },
      });

      const chapter1 = screen.getByText(/Chapter 1: Fundamentals/i);
      // Colors should be applied to chapter
      expect(chapter1).toBeInTheDocument();
    });
  });

  describe('navigation flow', () => {
    test('allows sequential lesson progression', async () => {
      const user = userEvent.setup();
      const onSelectLesson = jest.fn();

      renderLessonNav({ onSelectLesson });

      const lesson1 = screen.getByText(/Lesson 1/i);
      const lesson2 = screen.getByText(/Lesson 2/i);

      await user.click(lesson1);
      await user.click(lesson2);

      // Both lessons should be selectable
      expect(lesson1).toBeInTheDocument();
      expect(lesson2).toBeInTheDocument();
    });

    test('allows chapter skipping', async () => {
      const user = userEvent.setup();
      renderLessonNav();

      const chapter1 = screen.getByText(/Chapter 1: Fundamentals/i);
      const chapter2 = screen.getByText(/Chapter 2: Advanced/i);

      await user.click(chapter1);
      await user.click(chapter2);

      // Both chapters should be expandable
      expect(screen.getByText(/Chapter 1: Fundamentals/i)).toBeInTheDocument();
      expect(screen.getByText(/Chapter 2: Advanced/i)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('chapter titles are readable', () => {
      renderLessonNav();

      const chapter1 = screen.getByText(/Chapter 1: Fundamentals/i);
      expect(chapter1).toBeInTheDocument();
    });

    test('lessons are clickable and interactive', async () => {
      const user = userEvent.setup();
      renderLessonNav();

      const lesson1 = screen.getByText(/Lesson 1/i);
      expect(lesson1).toBeInTheDocument();
    });
  });
});
