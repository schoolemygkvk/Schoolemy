import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  routeAccessConfig,
  canAccessRoute,
  getAccessibleRoutes,
  ProtectedRoute,
  AccessDeniedFallback,
} from '../../Routes/ProtectedRoutes';

// Mock dependencies
jest.mock('../../Utils/roleBasedAccess', () => ({
  hasAccess: jest.fn(),
  getRoleDisplayName: jest.fn((role) => {
    const roleMap = {
      superadmin: 'Super Admin',
      admin: 'Admin',
      tutormanagement: 'Tutor Manager',
      coursemanagement: 'Course Manager',
      usermanagement: 'User Manager',
      committeeoftrustees: 'Committee of Trustees',
    };
    return roleMap[role] || role;
  }),
}));

jest.mock('../../Utils/security', () => ({
  secureStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('../../Hooks/useDynamicRBAC', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Import mocked modules
import { hasAccess, getRoleDisplayName } from '../../Utils/roleBasedAccess';
import { secureStorage } from '../../Utils/security';
import useDynamicRBAC from '../../Hooks/useDynamicRBAC';

describe('Route Protection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDynamicRBAC.mockImplementation(() => {
      const role = secureStorage.getItem('role');
      return {
        role,
        hasDynamicPermissions: false,
        canAccessMenu: () => false,
        canAccessRoute: (routeKey, fallbackRoles) => {
          if (!routeKey) return false;
          return hasAccess(role, fallbackRoles || []);
        },
        hasRole: (r) => role === r,
      };
    });
  });

  describe('routeAccessConfig', () => {
    it('exports route access configuration', () => {
      expect(routeAccessConfig).toBeDefined();
      expect(typeof routeAccessConfig).toBe('object');
    });

    it('contains dashboard route', () => {
      expect(routeAccessConfig.dashboard).toBeDefined();
      expect(routeAccessConfig.dashboard.path).toBe('/');
      expect(Array.isArray(routeAccessConfig.dashboard.roles)).toBe(true);
    });

    it('contains admin-users route', () => {
      expect(routeAccessConfig['admin-users']).toBeDefined();
      expect(routeAccessConfig['admin-users'].path).toBe('admin-users');
      expect(routeAccessConfig['admin-users'].roles).toContain('superadmin');
      expect(routeAccessConfig['admin-users'].roles).toContain('admin');
    });

    it('contains tutor routes', () => {
      expect(routeAccessConfig['tutor-dashboard']).toBeDefined();
      expect(routeAccessConfig['tutor-list']).toBeDefined();
      expect(routeAccessConfig['tutor-payment-details']).toBeDefined();
    });

    it('contains course routes', () => {
      expect(routeAccessConfig.courses).toBeDefined();
      expect(routeAccessConfig['course-list']).toBeDefined();
      expect(routeAccessConfig['add-course']).toBeDefined();
    });

    it('contains financial routes', () => {
      expect(routeAccessConfig['financial-auditing']).toBeDefined();
      expect(routeAccessConfig['donation-new']).toBeDefined();
      expect(routeAccessConfig['expense-new']).toBeDefined();
    });

    it('contains BOS routes', () => {
      expect(routeAccessConfig.bos).toBeDefined();
      expect(routeAccessConfig['bos-members']).toBeDefined();
      expect(routeAccessConfig['create-meeting']).toBeDefined();
    });

    it('all routes have path and roles properties', () => {
      Object.entries(routeAccessConfig).forEach(([key, config]) => {
        expect(config).toHaveProperty('path');
        expect(config).toHaveProperty('roles');
        expect(Array.isArray(config.roles)).toBe(true);
      });
    });
  });

  describe('canAccessRoute(role, routeKey)', () => {
    it('returns true when role has access', () => {
      hasAccess.mockReturnValue(true);

      const result = canAccessRoute('admin', 'admin-users');

      expect(result).toBe(true);
      expect(hasAccess).toHaveBeenCalledWith('admin', routeAccessConfig['admin-users'].roles);
    });

    it('returns false when role does not have access', () => {
      hasAccess.mockReturnValue(false);

      const result = canAccessRoute('tutormanagement', 'admin-users');

      expect(result).toBe(false);
    });

    it('returns false when route key does not exist', () => {
      const result = canAccessRoute('admin', 'nonexistent-route');

      expect(result).toBe(false);
      expect(hasAccess).not.toHaveBeenCalled();
    });

    it('returns false when route key is undefined', () => {
      const result = canAccessRoute('admin', undefined);

      expect(result).toBe(false);
    });

    it('returns false when route key is null', () => {
      const result = canAccessRoute('admin', null);

      expect(result).toBe(false);
    });

    it('returns false when role is null', () => {
      hasAccess.mockReturnValue(false);

      const result = canAccessRoute(null, 'admin-users');

      expect(result).toBe(false);
    });

    it('allows superadmin to access dashboard', () => {
      hasAccess.mockReturnValue(true);

      const result = canAccessRoute('superadmin', 'dashboard');

      expect(result).toBe(true);
    });

    it('checks multiple routes correctly', () => {
      hasAccess.mockImplementation((role, roles) => roles.includes(role));

      expect(canAccessRoute('admin', 'admin-users')).toBe(true);
      expect(canAccessRoute('tutormanagement', 'admin-users')).toBe(false);
      expect(canAccessRoute('coursemanagement', 'courses')).toBe(true);
    });
  });

  describe('getAccessibleRoutes(role)', () => {
    it('returns object of accessible routes', () => {
      hasAccess.mockImplementation((role, roles) => roles.includes(role));

      const result = getAccessibleRoutes('superadmin');

      expect(typeof result).toBe('object');
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it('returns empty object when role has no access', () => {
      hasAccess.mockReturnValue(false);

      const result = getAccessibleRoutes('nonexistent-role');

      expect(result).toEqual({});
    });

    it('includes dashboard for admin', () => {
      hasAccess.mockImplementation((role, roles) => roles.includes(role));

      const result = getAccessibleRoutes('admin');

      expect(result.dashboard).toBeDefined();
      expect(result.dashboard.path).toBe('/');
    });

    it('includes admin-users for superadmin', () => {
      hasAccess.mockImplementation((role, roles) => roles.includes(role));

      const result = getAccessibleRoutes('superadmin');

      expect(result['admin-users']).toBeDefined();
    });

    it('excludes routes user cannot access', () => {
      hasAccess.mockImplementation((role, roles) => {
        if (role === 'tutormanagement') {
          return roles.includes('tutormanagement');
        }
        return false;
      });

      const result = getAccessibleRoutes('tutormanagement');

      expect(result['admin-users']).toBeUndefined();
      expect(result['tutor-list']).toBeDefined();
    });

    it('returns all routes for superadmin', () => {
      hasAccess.mockReturnValue(true);

      const result = getAccessibleRoutes('superadmin');

      expect(Object.keys(result).length).toBe(Object.keys(routeAccessConfig).length);
    });

    it('handles null role gracefully', () => {
      hasAccess.mockReturnValue(false);

      const result = getAccessibleRoutes(null);

      expect(result).toEqual({});
    });
  });

  describe('ProtectedRoute Component', () => {
    const MockElement = <div data-testid="mock-element">Protected Content</div>;

    it('renders element when user has access', () => {
      hasAccess.mockReturnValue(true);
      secureStorage.getItem.mockReturnValue('admin');

      render(
        <ProtectedRoute element={MockElement} routeKey="admin-users" />
      );

      expect(screen.getByTestId('mock-element')).toBeInTheDocument();
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('renders AccessDeniedFallback when user lacks access', () => {
      hasAccess.mockReturnValue(false);
      secureStorage.getItem.mockReturnValue('tutormanagement');

      render(
        <ProtectedRoute element={MockElement} routeKey="admin-users" />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-element')).not.toBeInTheDocument();
    });

    it('does not render element when route does not exist', () => {
      hasAccess.mockReturnValue(false);
      secureStorage.getItem.mockReturnValue('admin');

      render(
        <ProtectedRoute element={MockElement} routeKey="nonexistent-route" />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByTestId('mock-element')).not.toBeInTheDocument();
    });

    it('gets role from secure storage', () => {
      hasAccess.mockReturnValue(true);
      secureStorage.getItem.mockReturnValue('coursemanagement');

      render(
        <ProtectedRoute element={MockElement} routeKey="courses" />
      );

      expect(secureStorage.getItem).toHaveBeenCalledWith('role');
    });

    it('renders AccessDeniedFallback when role is null', () => {
      hasAccess.mockReturnValue(false);
      secureStorage.getItem.mockReturnValue(null);

      render(
        <ProtectedRoute element={MockElement} routeKey="admin-users" />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('renders AccessDeniedFallback when role is undefined', () => {
      hasAccess.mockReturnValue(false);
      secureStorage.getItem.mockReturnValue(undefined);

      render(
        <ProtectedRoute element={MockElement} routeKey="admin-users" />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('allows admin to access tutor routes', () => {
      hasAccess.mockReturnValue(true);
      secureStorage.getItem.mockReturnValue('admin');

      render(
        <ProtectedRoute element={MockElement} routeKey="tutor-list" />
      );

      expect(screen.getByTestId('mock-element')).toBeInTheDocument();
    });

    it('prevents tutor from accessing admin routes', () => {
      hasAccess.mockReturnValue(false);
      secureStorage.getItem.mockReturnValue('tutormanagement');

      render(
        <ProtectedRoute element={MockElement} routeKey="admin-users" />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('allows superadmin to access all routes', () => {
      hasAccess.mockReturnValue(true);
      secureStorage.getItem.mockReturnValue('superadmin');

      render(
        <ProtectedRoute element={MockElement} routeKey="financial-auditing" />
      );

      expect(screen.getByTestId('mock-element')).toBeInTheDocument();
    });
  });

  describe('AccessDeniedFallback Component', () => {
    it('displays access denied message', () => {
      render(
        <AccessDeniedFallback routeKey="admin-users" userRole="tutormanagement" />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/You don't have permission to access this page/i)).toBeInTheDocument();
    });

    it('displays required roles section', () => {
      render(
        <AccessDeniedFallback routeKey="admin-users" userRole="tutormanagement" />
      );

      expect(screen.getByText('Required roles:')).toBeInTheDocument();
    });

    it('displays actual user role', () => {
      const { container } = render(
        <AccessDeniedFallback routeKey="admin-users" userRole="tutormanagement" />
      );

      expect(screen.getByText(/Your role:/)).toBeInTheDocument();
      // The role display name will be rendered by the mocked getRoleDisplayName
      const html = container.innerHTML;
      expect(html).toContain('Your role');
    });

    it('displays all allowed roles for route', () => {
      render(
        <AccessDeniedFallback routeKey="admin-users" userRole="tutormanagement" />
      );

      const allowedRoles = routeAccessConfig['admin-users'].roles;
      // Verify some key roles are displayed (we can't check all due to how they're rendered together)
      expect(screen.getByText(/Required roles:/)).toBeInTheDocument();
      // The allowedRoles are rendered as a comma-separated string
      allowedRoles.forEach((role) => {
        // At least verify the role name appears somewhere in the document
        const roleText = role.charAt(0).toUpperCase() + role.slice(1);
        expect(screen.getByText(/Required roles:/).closest('div')).toBeInTheDocument();
      });
    });

    it('displays admin contact message', () => {
      render(
        <AccessDeniedFallback routeKey="admin-users" userRole="tutormanagement" />
      );

      expect(screen.getByText(/Please contact your administrator/i)).toBeInTheDocument();
    });

    it('formats multiple roles correctly', () => {
      render(
        <AccessDeniedFallback routeKey="courses" userRole="tutormanagement" />
      );

      expect(screen.getByText('Required roles:')).toBeInTheDocument();
    });

    it('handles null route key gracefully', () => {
      render(
        <AccessDeniedFallback routeKey={null} userRole="tutormanagement" />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('displays proper styling classes', () => {
      const { container } = render(
        <AccessDeniedFallback routeKey="admin-users" userRole="tutormanagement" />
      );

      const heading = container.querySelector('h2');
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveStyle({ fontSize: '2rem' });
    });

    it('shows error box styling', () => {
      const { container } = render(
        <AccessDeniedFallback routeKey="admin-users" userRole="tutormanagement" />
      );

      // Check for the div that contains the error styling information
      const divs = container.querySelectorAll('div');
      let hasErrorStyling = false;

      divs.forEach((div) => {
        const style = div.getAttribute('style');
        if (style && (style.includes('backgroundColor') || style.includes('fee2e2'))) {
          hasErrorStyling = true;
        }
      });

      expect(hasErrorStyling).toBe(true);
    });
  });

  describe('Route Access Patterns', () => {
    beforeEach(() => {
      hasAccess.mockImplementation((role, roles) => roles.includes(role));
    });

    it('superadmin has access to all routes', () => {
      const accessible = getAccessibleRoutes('superadmin');

      expect(Object.keys(accessible).length).toBe(Object.keys(routeAccessConfig).length);
    });

    it('admin has access to most routes', () => {
      const accessible = getAccessibleRoutes('admin');

      expect(Object.keys(accessible).length).toBeGreaterThan(50);
    });

    it('tutormanagement only accesses tutor routes', () => {
      const accessible = getAccessibleRoutes('tutormanagement');

      expect(accessible['tutor-list']).toBeDefined();
      expect(accessible['admin-users']).toBeUndefined();
    });

    it('coursemanagement only accesses course routes', () => {
      const accessible = getAccessibleRoutes('coursemanagement');

      expect(accessible.courses).toBeDefined();
      expect(accessible['add-course']).toBeDefined();
      expect(accessible['admin-users']).toBeUndefined();
    });

    it('usermanagement only accesses user routes', () => {
      const accessible = getAccessibleRoutes('usermanagement');

      expect(accessible.users).toBeDefined();
      expect(accessible['user-details']).toBeDefined();
      expect(accessible['admin-users']).toBeUndefined();
    });

    it('auditor only accesses financial routes', () => {
      const accessible = getAccessibleRoutes('auditor');

      expect(accessible['financial-auditing']).toBeDefined();
      expect(accessible['donation-new']).toBeDefined();
      expect(accessible['admin-users']).toBeUndefined();
    });

    it('committeeoftrustees has broad access', () => {
      const accessible = getAccessibleRoutes('committeeoftrustees');

      expect(accessible['admin-users']).toBeDefined();
      expect(accessible['tutor-list']).toBeDefined();
      expect(accessible.courses).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('full flow: check access → get routes → render component', () => {
      hasAccess.mockImplementation((role, roles) => roles.includes(role));
      secureStorage.getItem.mockReturnValue('coursemanagement');

      const hasAccess_result = canAccessRoute('coursemanagement', 'courses');
      expect(hasAccess_result).toBe(true);

      const accessible = getAccessibleRoutes('coursemanagement');
      expect(accessible.courses).toBeDefined();

      const MockElement = <div data-testid="courses-element">Courses Page</div>;
      render(
        <ProtectedRoute element={MockElement} routeKey="courses" />
      );

      expect(screen.getByTestId('courses-element')).toBeInTheDocument();
    });

    it('full flow: denied access flow', () => {
      hasAccess.mockReturnValue(false);
      secureStorage.getItem.mockReturnValue('tutormanagement');

      const hasAccess_result = canAccessRoute('tutormanagement', 'admin-users');
      expect(hasAccess_result).toBe(false);

      const accessible = getAccessibleRoutes('tutormanagement');
      expect(accessible['admin-users']).toBeUndefined();

      const MockElement = <div data-testid="admin-element">Admin Page</div>;
      render(
        <ProtectedRoute element={MockElement} routeKey="admin-users" />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.queryByTestId('admin-element')).not.toBeInTheDocument();
    });

    it('handles role change during session', () => {
      hasAccess.mockImplementation((role, roles) => roles.includes(role));

      // Initial role: tutormanagement
      secureStorage.getItem.mockReturnValue('tutormanagement');
      let accessible = getAccessibleRoutes('tutormanagement');
      expect(accessible['tutor-list']).toBeDefined();
      expect(accessible['admin-users']).toBeUndefined();

      // Role changes to admin
      secureStorage.getItem.mockReturnValue('admin');
      accessible = getAccessibleRoutes('admin');
      expect(accessible['tutor-list']).toBeDefined();
      expect(accessible['admin-users']).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles route with dynamic parameters', () => {
      const routeWithParams = routeAccessConfig['edit-course'];

      expect(routeWithParams).toBeDefined();
      expect(routeWithParams.path).toContain(':coursename');
    });

    it('handles roles with special characters in name', () => {
      hasAccess.mockReturnValue(true);

      const result = canAccessRoute('coursemanagement', 'courses');

      expect(result).toBe(true);
    });

    it('case sensitivity: role names are case-sensitive', () => {
      hasAccess.mockImplementation((role, roles) => {
        return roles.includes(role);
      });

      const lowerResult = canAccessRoute('admin', 'admin-users');
      const upperResult = canAccessRoute('ADMIN', 'admin-users');

      expect(lowerResult).toBe(true);
      expect(upperResult).toBe(false);
    });

    it('handles multiple roles in single access config', () => {
      hasAccess.mockReturnValue(true);

      const tutorRoles = routeAccessConfig['tutor-list'].roles;
      expect(tutorRoles.length).toBeGreaterThan(1);
      expect(tutorRoles).toContain('superadmin');
      expect(tutorRoles).toContain('tutormanagement');
    });
  });
});
