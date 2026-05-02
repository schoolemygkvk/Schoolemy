import { renderHook } from '@testing-library/react';
import { useCourseAccess } from '../../hooks/useCourseAccess';
import * as AuthContext from '../../Context/AuthContext';

// Mock the AuthContext
jest.mock('../../Context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock the permission manager
jest.mock('../../utils/permissionManager', () => ({
  hasInstructorRole: jest.fn((userData) => userData?.role === 'instructor'),
  hasAdminRole: jest.fn((userData) => userData?.role === 'admin'),
}));

// Mock the API
jest.mock('../../service/api', () => ({
  get: jest.fn(),
}));

describe('useCourseAccess', () => {
  const mockUserData = {
    id: 'user-1',
    name: 'Test User',
    email: 'user@example.com',
    role: 'student',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    AuthContext.useAuth.mockReturnValue({
      userData: mockUserData,
      isLoggedIn: true,
    });
  });

  describe('hasAccess', () => {
    test('returns false when user is not logged in', () => {
      AuthContext.useAuth.mockReturnValue({
        userData: null,
        isLoggedIn: false,
      });

      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasAccess('full')).toBe(false);
      expect(result.current.hasAccess('purchased')).toBe(false);
    });

    test('returns true for full access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasAccess('full')).toBe(true);
    });

    test('returns true for purchased access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasAccess('purchased')).toBe(true);
    });

    test('returns true for enrolled access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasAccess('enrolled')).toBe(true);
    });

    test('returns true for completed access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasAccess('completed')).toBe(true);
    });

    test('returns false for limited access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasAccess('limited')).toBe(false);
    });

    test('returns false for unknown access level', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasAccess('unknown')).toBe(false);
    });
  });

  describe('hasFullAccess', () => {
    test('returns true for full access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasFullAccess('full')).toBe(true);
    });

    test('returns true for completed access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasFullAccess('completed')).toBe(true);
    });

    test('returns false for purchased access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasFullAccess('purchased')).toBe(false);
    });

    test('returns false for limited access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasFullAccess('limited')).toBe(false);
    });
  });

  describe('isEnrolled', () => {
    test('returns true for enrolled status', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.isEnrolled('enrolled')).toBe(true);
    });

    test('returns true for full access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.isEnrolled('full')).toBe(true);
    });

    test('returns true for purchased status', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.isEnrolled('purchased')).toBe(true);
    });

    test('returns true for completed status', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.isEnrolled('completed')).toBe(true);
    });

    test('returns false for limited access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.isEnrolled('limited')).toBe(false);
    });
  });

  describe('hasPurchased', () => {
    test('returns true for purchased status', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasPurchased('purchased')).toBe(true);
    });

    test('returns true for full access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasPurchased('full')).toBe(true);
    });

    test('returns true for completed status', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasPurchased('completed')).toBe(true);
    });

    test('returns false for limited access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasPurchased('limited')).toBe(false);
    });

    test('returns false for enrolled status (without purchase)', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.hasPurchased('enrolled')).toBe(false);
    });
  });

  describe('getAccessDescription', () => {
    test('returns correct description for limited access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.getAccessDescription('limited')).toBe('Preview Only');
    });

    test('returns correct description for purchased access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.getAccessDescription('purchased')).toBe(
        'Access Restricted - Complete Payment'
      );
    });

    test('returns correct description for enrolled access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.getAccessDescription('enrolled')).toBe(
        'Enrolled - Full Access'
      );
    });

    test('returns correct description for full access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.getAccessDescription('full')).toBe('Full Access');
    });

    test('returns correct description for completed access', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.getAccessDescription('completed')).toBe('Completed');
    });

    test('returns default description for unknown access level', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.getAccessDescription('unknown')).toBe('No Access');
    });
  });

  describe('isLoggedIn', () => {
    test('returns true when user is logged in', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.isLoggedIn).toBe(true);
    });

    test('returns false when user is not logged in', () => {
      AuthContext.useAuth.mockReturnValue({
        userData: null,
        isLoggedIn: false,
      });

      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.isLoggedIn).toBe(false);
    });
  });

  describe('userRole', () => {
    test('returns user role from userData', () => {
      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.userRole).toBe('student');
    });

    test('returns undefined when userData is null', () => {
      AuthContext.useAuth.mockReturnValue({
        userData: null,
        isLoggedIn: false,
      });

      const { result } = renderHook(() => useCourseAccess());

      expect(result.current.userRole).toBeUndefined();
    });
  });
});
