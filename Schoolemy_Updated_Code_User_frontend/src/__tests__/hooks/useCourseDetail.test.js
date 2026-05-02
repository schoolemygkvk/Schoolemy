import { renderHook, waitFor } from '@testing-library/react';
import { useCourseDetail } from '../../hooks/useCourseDetail';

// Mock the API
jest.mock('../../service/api', () => ({
  get: jest.fn(),
}));

// Mock courseApi
jest.mock('../../service/courseApi', () => ({
  getTutorCourseById: jest.fn(),
}));

// Get references to mocked modules
const mockApi = jest.requireMock('../../service/api');
const mockCourseApi = jest.requireMock('../../service/courseApi');

describe('useCourseDetail', () => {
  const mockCourse = {
    id: 'course-1',
    title: 'React Basics',
    description: 'Learn React fundamentals',
    price: 500,
    access: 'purchased',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApi.get.mockClear();
    mockCourseApi.getTutorCourseById.mockClear();
  });

  describe('initial state', () => {
    test('initializes with loading state', () => {
      mockApi.get.mockResolvedValue({ data: mockCourse });

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      expect(result.current.loading).toBe(true);
      expect(result.current.course).toBeNull();
      expect(result.current.error).toBeNull();
    });

    test('initializes with limited access', () => {
      mockApi.get.mockResolvedValue({ data: mockCourse });

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      expect(result.current.access).toBe('limited');
    });
  });

  describe('fetching course data', () => {
    test('fetches course data successfully', async () => {
      mockApi.get.mockResolvedValue({ data: mockCourse });

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.course).toEqual(mockCourse);
      expect(result.current.error).toBeNull();
    });

    test('sets correct access level from response', async () => {
      mockApi.get.mockResolvedValue({
        data: { ...mockCourse, access: 'full' },
      });

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      await waitFor(() => {
        expect(result.current.access).toBe('full');
      });
    });

    test('handles API error gracefully', async () => {
      const errorMessage = 'Course not found';
      mockApi.get.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.course).toBeNull();
    });

    test('skips fetch when courseId is null', () => {
      const { result } = renderHook(() => useCourseDetail(null, true));

      expect(mockApi.get).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    test('calls correct API endpoint for regular course', async () => {
      mockApi.get.mockResolvedValue({ data: mockCourse });

      renderHook(() => useCourseDetail('course-1', true, false));

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledWith('/api/v1/courses/course-1');
      });
    });

    test('calls correct API endpoint for tutor course', async () => {
      mockCourseApi.getTutorCourseById.mockResolvedValue({
        success: true,
        data: mockCourse,
      });

      const { result } = renderHook(() => useCourseDetail('course-1', true, true));

      await waitFor(() => {
        expect(mockCourseApi.getTutorCourseById).toHaveBeenCalledWith('course-1');
      });
      await waitFor(() => {
        expect(result.current.course).toEqual(mockCourse);
      });
    });
  });

  describe('caching behavior', () => {
    test('caches course data for 5 minutes', async () => {
      mockApi.get.mockResolvedValue({ data: mockCourse });

      const { rerender } = renderHook(
        ({ courseId, isLoggedIn }) => useCourseDetail(courseId, isLoggedIn),
        {
          initialProps: { courseId: 'course-1', isLoggedIn: true },
        }
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(1);
      });

      // Rerender with same props - should use cache
      rerender({ courseId: 'course-1', isLoggedIn: true });

      await waitFor(() => {
        // Should still be called only once (cache hit)
        expect(mockApi.get).toHaveBeenCalledTimes(1);
      });
    });

    test('refetch bypasses cache', async () => {
      mockApi.get.mockResolvedValue({ data: mockCourse });

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(1);
      });

      // Call refetch within waitFor to wrap state updates
      await waitFor(async () => {
        await result.current.refetch();
        expect(mockApi.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('access level updates', () => {
    test('updates access from course data', async () => {
      mockApi.get.mockResolvedValue({
        data: { id: 'course-1', title: 'React Basics', data: { access: 'enrolled' } },
      });

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      await waitFor(() => {
        expect(result.current.access).toBe('enrolled');
      });
    });

    test('handles different response structures', async () => {
      // Test with accessStatus field - remove top-level access to test this field
      mockApi.get.mockResolvedValue({
        data: { id: 'course-1', title: 'React Basics', accessStatus: 'full' },
      });

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      await waitFor(() => {
        expect(result.current.access).toBe('full');
      });
    });

    test('sets limited access when no access data', async () => {
      mockApi.get.mockResolvedValue({ data: { id: 'course-1' } });

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      await waitFor(() => {
        expect(result.current.access).toBe('limited');
      });
    });
  });

  describe('login status changes', () => {
    test('refetches when login status changes', async () => {
      mockApi.get.mockResolvedValue({ data: mockCourse });

      const { rerender } = renderHook(
        ({ courseId, isLoggedIn }) => useCourseDetail(courseId, isLoggedIn),
        {
          initialProps: { courseId: 'course-1', isLoggedIn: false },
        }
      );

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(1);
      });

      // Change login status
      rerender({ courseId: 'course-1', isLoggedIn: true });

      await waitFor(() => {
        expect(mockApi.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('error handling', () => {
    test('returns error message from API', async () => {
      mockApi.get.mockRejectedValue({
        response: { data: { message: 'Unauthorized' } },
      });

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      await waitFor(() => {
        expect(result.current.error).toBe('Unauthorized');
      });
    });

    test('provides generic error message when none from API', async () => {
      mockApi.get.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });
    });

    test('clears error on successful refetch', async () => {
      mockApi.get.mockRejectedValueOnce(new Error('Failed'));
      mockApi.get.mockResolvedValue({ data: mockCourse });

      const { result } = renderHook(() => useCourseDetail('course-1', true));

      await waitFor(() => {
        expect(result.current.error).toBe('Failed');
      });

      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });
});
