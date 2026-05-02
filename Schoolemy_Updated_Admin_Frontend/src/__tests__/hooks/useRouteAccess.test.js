import { renderHook } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouteAccess, useAccessibleRoutes, useMultiRouteAccess } from '../../Hooks/useRouteAccess';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../../Routes/ProtectedRoutes', () => ({
  canAccessRoute: jest.fn(),
  getAccessibleRoutes: jest.fn(),
}));

jest.mock('../../Utils/security', () => ({
  secureStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

// Import mocked modules
import { useNavigate } from 'react-router-dom';
import { canAccessRoute, getAccessibleRoutes } from '../../Routes/ProtectedRoutes';
import { secureStorage } from '../../Utils/security';

describe('Route Access Hooks', () => {
  let mockNavigate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
  });

  describe('useRouteAccess Hook', () => {
    it('returns true when user has access to route', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      const { result } = renderHook(() => useRouteAccess('admin-users'));

      expect(result.current).toBe(true);
    });

    it('returns false when user does not have access', () => {
      secureStorage.getItem.mockReturnValue('tutormanagement');
      canAccessRoute.mockReturnValue(false);

      const { result } = renderHook(() => useRouteAccess('admin-users'));

      expect(result.current).toBe(false);
    });

    it('redirects to tutor dashboard when tutor denied and redirectOnDeny is true', () => {
      secureStorage.getItem.mockReturnValue('tutor');
      canAccessRoute.mockReturnValue(false);

      renderHook(() => useRouteAccess('admin-users', true));

      expect(mockNavigate).toHaveBeenCalledWith(
        '/schoolemy/tutor/dashboard',
        { replace: true }
      );
    });

    it('redirects to main dashboard for non-tutor roles when denied', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(false);

      renderHook(() => useRouteAccess('tutor-list', true));

      expect(mockNavigate).toHaveBeenCalledWith('/schoolemy', { replace: true });
    });

    it('does not redirect when redirectOnDeny is false', () => {
      secureStorage.getItem.mockReturnValue('tutormanagement');
      canAccessRoute.mockReturnValue(false);

      renderHook(() => useRouteAccess('admin-users', false));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not redirect when user has access', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      renderHook(() => useRouteAccess('admin-users'));

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('uses default redirectOnDeny value of true', () => {
      secureStorage.getItem.mockReturnValue('tutormanagement');
      canAccessRoute.mockReturnValue(false);

      renderHook(() => useRouteAccess('admin-users'));

      expect(mockNavigate).toHaveBeenCalled();
    });

    it('calls canAccessRoute with correct role and routeKey', () => {
      secureStorage.getItem.mockReturnValue('coursemanagement');
      canAccessRoute.mockReturnValue(true);

      renderHook(() => useRouteAccess('courses'));

      expect(canAccessRoute).toHaveBeenCalledWith('coursemanagement', 'courses');
    });

    it('handles null role from storage', () => {
      secureStorage.getItem.mockReturnValue(null);
      canAccessRoute.mockReturnValue(false);

      const { result } = renderHook(() => useRouteAccess('admin-users'));

      expect(result.current).toBe(false);
      expect(canAccessRoute).toHaveBeenCalledWith(null, 'admin-users');
    });

    it('handles undefined role from storage', () => {
      secureStorage.getItem.mockReturnValue(undefined);
      canAccessRoute.mockReturnValue(false);

      const { result } = renderHook(() => useRouteAccess('admin-users'));

      expect(result.current).toBe(false);
    });

    it('retrieves role from secure storage', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      renderHook(() => useRouteAccess('admin-users'));

      expect(secureStorage.getItem).toHaveBeenCalledWith('role');
    });

    it('handles various route keys correctly', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      const { result: result1 } = renderHook(() => useRouteAccess('dashboard'));
      const { result: result2 } = renderHook(() => useRouteAccess('tutor-list'));
      const { result: result3 } = renderHook(() => useRouteAccess('courses'));

      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);
      expect(result3.current).toBe(true);
      expect(canAccessRoute).toHaveBeenCalledTimes(3);
    });

    it('updates access status when role changes', () => {
      secureStorage.getItem.mockReturnValue('tutormanagement');
      canAccessRoute.mockReturnValue(false);

      const { result, rerender } = renderHook(() => useRouteAccess('admin-users'));
      expect(result.current).toBe(false);

      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);
      rerender();

      expect(result.current).toBe(true);
    });

    it('logs warning when access is denied', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      secureStorage.getItem.mockReturnValue('tutormanagement');
      canAccessRoute.mockReturnValue(false);

      renderHook(() => useRouteAccess('admin-users', true));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Access denied to route: admin-users')
      );

      consoleSpy.mockRestore();
    });

    it('does not log warning when access is granted', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      renderHook(() => useRouteAccess('admin-users'));

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('handles special route keys with hyphens and colons', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      renderHook(() => useRouteAccess('edit-course/:coursename'));

      expect(canAccessRoute).toHaveBeenCalledWith('admin', 'edit-course/:coursename');
    });
  });

  describe('useAccessibleRoutes Hook', () => {
    it('returns accessible routes for user role', () => {
      secureStorage.getItem.mockReturnValue('admin');
      const mockAccessibleRoutes = {
        'admin-users': { path: 'admin-users', roles: ['admin'] },
        courses: { path: 'courses', roles: ['admin', 'coursemanagement'] },
      };
      getAccessibleRoutes.mockReturnValue(mockAccessibleRoutes);

      const { result } = renderHook(() => useAccessibleRoutes());

      expect(result.current).toEqual(mockAccessibleRoutes);
    });

    it('calls getAccessibleRoutes with user role', () => {
      secureStorage.getItem.mockReturnValue('coursemanagement');
      getAccessibleRoutes.mockReturnValue({});

      renderHook(() => useAccessibleRoutes());

      expect(getAccessibleRoutes).toHaveBeenCalledWith('coursemanagement');
    });

    it('returns empty object when user has no access', () => {
      secureStorage.getItem.mockReturnValue('nonexistent-role');
      getAccessibleRoutes.mockReturnValue({});

      const { result } = renderHook(() => useAccessibleRoutes());

      expect(result.current).toEqual({});
    });

    it('handles null role from storage', () => {
      secureStorage.getItem.mockReturnValue(null);
      getAccessibleRoutes.mockReturnValue({});

      const { result } = renderHook(() => useAccessibleRoutes());

      expect(result.current).toEqual({});
      expect(getAccessibleRoutes).toHaveBeenCalledWith(null);
    });

    it('retrieves role from secure storage', () => {
      secureStorage.getItem.mockReturnValue('admin');
      getAccessibleRoutes.mockReturnValue({});

      renderHook(() => useAccessibleRoutes());

      expect(secureStorage.getItem).toHaveBeenCalledWith('role');
    });

    it('returns routes with configuration objects', () => {
      secureStorage.getItem.mockReturnValue('admin');
      const mockRoutes = {
        'admin-users': {
          path: 'admin-users',
          roles: ['superadmin', 'admin'],
        },
        'admin-analytics': {
          path: 'admin-analytics',
          roles: ['superadmin', 'admin'],
        },
      };
      getAccessibleRoutes.mockReturnValue(mockRoutes);

      const { result } = renderHook(() => useAccessibleRoutes());

      expect(result.current).toHaveProperty('admin-users');
      expect(result.current).toHaveProperty('admin-analytics');
      expect(result.current['admin-users'].path).toBe('admin-users');
    });

    it('handles large number of accessible routes', () => {
      secureStorage.getItem.mockReturnValue('superadmin');
      const largeRouteMap = {};
      for (let i = 0; i < 100; i++) {
        largeRouteMap[`route-${i}`] = {
          path: `route-${i}`,
          roles: ['superadmin'],
        };
      }
      getAccessibleRoutes.mockReturnValue(largeRouteMap);

      const { result } = renderHook(() => useAccessibleRoutes());

      expect(Object.keys(result.current).length).toBe(100);
    });

    it('updates when role changes', () => {
      const firstRoutes = { 'tutor-list': { path: 'tutor-list' } };
      const secondRoutes = {
        'admin-users': { path: 'admin-users' },
        'tutor-list': { path: 'tutor-list' },
      };

      secureStorage.getItem.mockReturnValue('tutormanagement');
      getAccessibleRoutes.mockReturnValue(firstRoutes);

      const { result, rerender } = renderHook(() => useAccessibleRoutes());
      expect(result.current).toEqual(firstRoutes);

      secureStorage.getItem.mockReturnValue('admin');
      getAccessibleRoutes.mockReturnValue(secondRoutes);
      rerender();

      expect(result.current).toEqual(secondRoutes);
    });
  });

  describe('useMultiRouteAccess Hook', () => {
    it('returns access status for multiple routes', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockImplementation((role, routeKey) => {
        return routeKey !== 'tutor-only-route';
      });

      const { result } = renderHook(() =>
        useMultiRouteAccess(['admin-users', 'courses', 'tutor-only-route'])
      );

      expect(result.current['admin-users']).toBe(true);
      expect(result.current['courses']).toBe(true);
      expect(result.current['tutor-only-route']).toBe(false);
    });

    it('calls canAccessRoute for each route key', () => {
      secureStorage.getItem.mockReturnValue('coursemanagement');
      canAccessRoute.mockReturnValue(true);

      renderHook(() => useMultiRouteAccess(['courses', 'add-course', 'edit-course']));

      expect(canAccessRoute).toHaveBeenCalledTimes(3);
      expect(canAccessRoute).toHaveBeenCalledWith('coursemanagement', 'courses');
      expect(canAccessRoute).toHaveBeenCalledWith('coursemanagement', 'add-course');
      expect(canAccessRoute).toHaveBeenCalledWith('coursemanagement', 'edit-course');
    });

    it('returns object with route keys as keys', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      const { result } = renderHook(() =>
        useMultiRouteAccess(['route1', 'route2', 'route3'])
      );

      expect(result.current).toHaveProperty('route1');
      expect(result.current).toHaveProperty('route2');
      expect(result.current).toHaveProperty('route3');
    });

    it('handles empty route keys array', () => {
      secureStorage.getItem.mockReturnValue('admin');

      const { result } = renderHook(() => useMultiRouteAccess([]));

      expect(result.current).toEqual({});
      expect(canAccessRoute).not.toHaveBeenCalled();
    });

    it('handles single route key in array', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      const { result } = renderHook(() => useMultiRouteAccess(['admin-users']));

      expect(result.current).toEqual({ 'admin-users': true });
    });

    it('handles mix of allowed and denied routes', () => {
      secureStorage.getItem.mockReturnValue('tutormanagement');
      canAccessRoute.mockImplementation((role, routeKey) => {
        const allowed = [
          'tutor-list',
          'tutor-payment-details',
          'tutor-dashboard',
        ];
        return allowed.includes(routeKey);
      });

      const { result } = renderHook(() =>
        useMultiRouteAccess([
          'tutor-list',
          'admin-users',
          'tutor-payment-details',
          'courses',
          'tutor-dashboard',
        ])
      );

      expect(result.current['tutor-list']).toBe(true);
      expect(result.current['admin-users']).toBe(false);
      expect(result.current['tutor-payment-details']).toBe(true);
      expect(result.current['courses']).toBe(false);
      expect(result.current['tutor-dashboard']).toBe(true);
    });

    it('uses role from secure storage', () => {
      secureStorage.getItem.mockReturnValue('auditor');
      canAccessRoute.mockReturnValue(true);

      renderHook(() => useMultiRouteAccess(['financial-auditing', 'donation-new']));

      expect(secureStorage.getItem).toHaveBeenCalledWith('role');
      expect(canAccessRoute).toHaveBeenCalledWith(
        'auditor',
        expect.anything()
      );
    });

    it('handles null role from storage', () => {
      secureStorage.getItem.mockReturnValue(null);
      canAccessRoute.mockReturnValue(false);

      const { result } = renderHook(() =>
        useMultiRouteAccess(['admin-users', 'courses'])
      );

      expect(result.current['admin-users']).toBe(false);
      expect(result.current['courses']).toBe(false);
    });

    it('handles routes with dynamic parameters', () => {
      secureStorage.getItem.mockReturnValue('coursemanagement');
      canAccessRoute.mockReturnValue(true);

      const { result } = renderHook(() =>
        useMultiRouteAccess([
          'edit-course/:coursename',
          'tutor-courses/:tutorname',
          'course-meet-details/:id',
        ])
      );

      expect(result.current['edit-course/:coursename']).toBe(true);
      expect(result.current['tutor-courses/:tutorname']).toBe(true);
      expect(result.current['course-meet-details/:id']).toBe(true);
    });

    it('returns consistent results for same routes', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      const { result: result1 } = renderHook(() =>
        useMultiRouteAccess(['admin-users', 'courses'])
      );
      const { result: result2 } = renderHook(() =>
        useMultiRouteAccess(['admin-users', 'courses'])
      );

      expect(result1.current).toEqual(result2.current);
    });

    it('handles very large number of routes', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      const routeKeys = Array.from(
        { length: 100 },
        (_, i) => `route-${i}`
      );

      const { result } = renderHook(() => useMultiRouteAccess(routeKeys));

      expect(Object.keys(result.current).length).toBe(100);
      expect(canAccessRoute).toHaveBeenCalledTimes(100);
    });

    it('updates result when routes array changes', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      const { result, rerender } = renderHook(
        ({ routes }) => useMultiRouteAccess(routes),
        { initialProps: { routes: ['route1', 'route2'] } }
      );

      expect(result.current).toHaveProperty('route1');
      expect(result.current).toHaveProperty('route2');
      expect(Object.keys(result.current).length).toBe(2);

      rerender({ routes: ['route1', 'route2', 'route3'] });

      expect(result.current).toHaveProperty('route3');
      expect(Object.keys(result.current).length).toBe(3);
    });
  });

  describe('Integration Tests', () => {
    it('useRouteAccess and useMultiRouteAccess return consistent results', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockReturnValue(true);

      const { result: result1 } = renderHook(() => useRouteAccess('admin-users'));
      const { result: result2 } = renderHook(() =>
        useMultiRouteAccess(['admin-users'])
      );

      expect(result1.current).toBe(true);
      expect(result2.current['admin-users']).toBe(true);
    });

    it('all hooks use same role from storage', () => {
      secureStorage.getItem.mockReturnValue('tutormanagement');
      canAccessRoute.mockReturnValue(true);
      getAccessibleRoutes.mockReturnValue({});

      renderHook(() => useRouteAccess('tutor-list'));
      renderHook(() => useAccessibleRoutes());
      renderHook(() => useMultiRouteAccess(['tutor-list']));

      expect(secureStorage.getItem).toHaveBeenCalledWith('role');
    });

    it('handles complete access workflow', () => {
      secureStorage.getItem.mockReturnValue('admin');
      canAccessRoute.mockImplementation((role, routeKey) => {
        const adminRoutes = ['admin-users', 'courses', 'tutor-list'];
        return adminRoutes.includes(routeKey);
      });
      getAccessibleRoutes.mockReturnValue({
        'admin-users': {},
        courses: {},
        'tutor-list': {},
      });

      const { result: canAccess } = renderHook(() =>
        useRouteAccess('admin-users')
      );
      const { result: allRoutes } = renderHook(() => useAccessibleRoutes());
      const { result: multiCheck } = renderHook(() =>
        useMultiRouteAccess(['admin-users', 'invalid-route'])
      );

      expect(canAccess.current).toBe(true);
      expect(Object.keys(allRoutes.current).length).toBe(3);
      expect(multiCheck.current['admin-users']).toBe(true);
      expect(multiCheck.current['invalid-route']).toBe(false);
    });
  });
});
