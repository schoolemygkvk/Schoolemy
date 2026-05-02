import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  hasAccess,
  roleHierarchy,
  hasMinimumRole,
  getRoleDisplayName,
  menuAccessRoles,
  canAccessMenu,
  useRoleAccess,
  withRoleAccess,
  allRoles,
} from '../../Utils/roleBasedAccess';

// Mock dependencies
jest.mock('../../Utils/security', () => ({
  secureStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

import { secureStorage } from '../../Utils/security';

describe('roleBasedAccess Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasAccess()', () => {
    it('returns true when user role is in allowed roles', () => {
      const result = hasAccess('admin', ['admin', 'superadmin']);
      expect(result).toBe(true);
    });

    it('returns false when superadmin is not in allowed roles', () => {
      const result = hasAccess('superadmin', ['auditor', 'marketing']);
      expect(result).toBe(false);
    });

    it('returns false when user role is not in allowed roles', () => {
      const result = hasAccess('auditor', ['admin', 'superadmin']);
      expect(result).toBe(false);
    });

    it('returns false when role is null', () => {
      const result = hasAccess(null, ['admin', 'superadmin']);
      expect(result).toBe(false);
    });

    it('returns false when role is undefined', () => {
      const result = hasAccess(undefined, ['admin', 'superadmin']);
      expect(result).toBe(false);
    });

    it('returns false when allowedRoles is null', () => {
      const result = hasAccess('admin', null);
      expect(result).toBe(false);
    });

    it('returns false when allowedRoles is undefined', () => {
      const result = hasAccess('admin', undefined);
      expect(result).toBe(false);
    });

    it('handles case-insensitive role comparison', () => {
      const result = hasAccess('ADMIN', ['admin', 'superadmin']);
      expect(result).toBe(true);
    });

    it('handles mixed case role comparison', () => {
      const result = hasAccess('AdMiN', ['admin', 'SUPERADMIN']);
      expect(result).toBe(true);
    });

    it('removes spaces from role names', () => {
      const result = hasAccess('super admin', ['superadmin']);
      expect(result).toBe(true);
    });

    it('removes spaces from allowed roles', () => {
      const result = hasAccess('superadmin', ['super admin', 'admin']);
      expect(result).toBe(true);
    });

    it('handles multiple spaces in role names', () => {
      const result = hasAccess('committee  of  trustees', ['committeeoftrustees']);
      expect(result).toBe(true);
    });

    it('returns false for empty string role', () => {
      const result = hasAccess('', ['admin', 'superadmin']);
      expect(result).toBe(false);
    });

    it('returns true when role exactly matches one allowed role', () => {
      const result = hasAccess('tutormanagement', ['tutormanagement']);
      expect(result).toBe(true);
    });

    it('returns false when role doesn\'t match any allowed role', () => {
      const result = hasAccess('tutor', ['tutormanagement', 'coursemanagement']);
      expect(result).toBe(false);
    });

    it('returns true with array containing multiple roles including user role', () => {
      const roles = ['auditor', 'marketing', 'documentverification', 'usermanagement', 'admin'];
      const result = hasAccess('marketing', roles);
      expect(result).toBe(true);
    });
  });

  describe('roleHierarchy', () => {
    it('contains superadmin role with high level', () => {
      expect(roleHierarchy.superadmin).toBe(100);
    });

    it('contains admin role with appropriate level', () => {
      expect(roleHierarchy.admin).toBe(90);
    });

    it('contains all expected roles', () => {
      expect(roleHierarchy).toHaveProperty('superadmin');
      expect(roleHierarchy).toHaveProperty('admin');
      expect(roleHierarchy).toHaveProperty('committeeoftrustees');
      expect(roleHierarchy).toHaveProperty('coursemanagement');
      expect(roleHierarchy).toHaveProperty('tutormanagement');
      expect(roleHierarchy).toHaveProperty('usermanagement');
      expect(roleHierarchy).toHaveProperty('documentverification');
      expect(roleHierarchy).toHaveProperty('auditor');
    });

    it('has numeric values for all roles', () => {
      Object.values(roleHierarchy).forEach((level) => {
        expect(typeof level).toBe('number');
      });
    });

    it('auditor has lowest level in hierarchy', () => {
      expect(roleHierarchy.auditor).toBe(1);
    });

    it('documentverification has appropriate level', () => {
      expect(roleHierarchy.documentverification).toBe(3);
    });
  });

  describe('hasMinimumRole()', () => {
    it('returns true when user role meets minimum requirement', () => {
      const result = hasMinimumRole('admin', 'tutormanagement');
      expect(result).toBe(true);
    });

    it('returns true when user role equals minimum requirement', () => {
      const result = hasMinimumRole('auditor', 'auditor');
      expect(result).toBe(true);
    });

    it('returns false when user role is below minimum', () => {
      const result = hasMinimumRole('auditor', 'admin');
      expect(result).toBe(false);
    });

    it('returns true for superadmin with any minimum', () => {
      const result = hasMinimumRole('superadmin', 'auditor');
      expect(result).toBe(true);
    });

    it('handles case-insensitive role comparison', () => {
      const result = hasMinimumRole('ADMIN', 'tutormanagement');
      expect(result).toBe(true);
    });

    it('returns false for unknown role compared to known minimum', () => {
      const result = hasMinimumRole('unknownrole', 'admin');
      expect(result).toBe(false);
    });

    it('returns true for known role compared to unknown minimum (both get 0)', () => {
      const result = hasMinimumRole('admin', 'unknownrole');
      expect(result).toBe(true);
    });

    it('returns true when both roles are unknown (both 0)', () => {
      const result = hasMinimumRole('unknownrole1', 'unknownrole2');
      expect(result).toBe(true);
    });

    it('handles null role as 0 level', () => {
      const result = hasMinimumRole(null, 'auditor');
      expect(result).toBe(false);
    });

    it('handles undefined role as 0 level', () => {
      const result = hasMinimumRole(undefined, 'auditor');
      expect(result).toBe(false);
    });

    it('removes spaces from role names for comparison', () => {
      const result = hasMinimumRole('committee of trustees', 'tutor management');
      expect(result).toBe(true);
    });

    it('compares marketing to auditor roles correctly', () => {
      const result = hasMinimumRole('marketing', 'auditor');
      expect(result).toBe(true);
    });

    it('returns false when marketing is below documentverification', () => {
      const result = hasMinimumRole('marketing', 'documentverification');
      expect(result).toBe(false);
    });
  });

  describe('getRoleDisplayName()', () => {
    it('returns display name for superadmin', () => {
      const result = getRoleDisplayName('superadmin');
      expect(result).toBe('Super Admin');
    });

    it('returns display name for admin', () => {
      const result = getRoleDisplayName('admin');
      expect(result).toBe('Admin');
    });

    it('returns display name for committeeoftrustees', () => {
      const result = getRoleDisplayName('committeeoftrustees');
      expect(result).toBe('Committee of Trustees');
    });

    it('returns display name for coursemanagement', () => {
      const result = getRoleDisplayName('coursemanagement');
      expect(result).toBe('Course Management & PCM Dashboard');
    });

    it('returns display name for tutormanagement', () => {
      const result = getRoleDisplayName('tutormanagement');
      expect(result).toBe('Tutor Dashboard & Termination');
    });

    it('returns display name for usermanagement', () => {
      const result = getRoleDisplayName('usermanagement');
      expect(result).toBe('User Management & Data Maintenance');
    });

    it('returns display name for documentverification', () => {
      const result = getRoleDisplayName('documentverification');
      expect(result).toBe('Document Verification Centre');
    });

    it('returns display name for marketing', () => {
      const result = getRoleDisplayName('marketing');
      expect(result).toBe('Marketing');
    });

    it('returns display name for auditor', () => {
      const result = getRoleDisplayName('auditor');
      expect(result).toBe('Auditor');
    });

    it('returns original role when not found in mapping', () => {
      const result = getRoleDisplayName('unknownrole');
      expect(result).toBe('unknownrole');
    });

    it('handles case-insensitive role lookup', () => {
      const result = getRoleDisplayName('SUPERADMIN');
      expect(result).toBe('Super Admin');
    });

    it('handles mixed case role lookup', () => {
      const result = getRoleDisplayName('CoUrSeManAgEmEnT');
      expect(result).toBe('Course Management & PCM Dashboard');
    });

    it('removes spaces before lookup', () => {
      const result = getRoleDisplayName('super admin');
      expect(result).toBe('Super Admin');
    });

    it('returns friendly label when role is missing', () => {
      const result = getRoleDisplayName(null);
      expect(result).toBe("Not signed in");
    });

    it('returns friendly label for empty string role', () => {
      expect(getRoleDisplayName("")).toBe("Not signed in");
    });
  });

  describe('menuAccessRoles', () => {
    it('contains dashboard menu with all roles', () => {
      expect(menuAccessRoles.dashboard).toContain('superadmin');
      expect(menuAccessRoles.dashboard).toContain('admin');
      expect(menuAccessRoles.dashboard).toContain('auditor');
    });

    it('contains adminUsers menu with restricted roles', () => {
      expect(menuAccessRoles.adminUsers).toContain('superadmin');
      expect(menuAccessRoles.adminUsers).toContain('admin');
      expect(menuAccessRoles.adminUsers).not.toContain('auditor');
    });

    it('contains courses menu with course management role', () => {
      expect(menuAccessRoles.courses).toContain('coursemanagement');
      expect(menuAccessRoles.courses).toContain('superadmin');
    });

    it('contains users menu with user management role', () => {
      expect(menuAccessRoles.users).toContain('usermanagement');
      expect(menuAccessRoles.users).toContain('superadmin');
    });

    it('contains bos menu with bos roles', () => {
      expect(menuAccessRoles.bos).toContain('boscontroller');
      expect(menuAccessRoles.bos).toContain('bosmembers');
    });

    it('contains documentVerification menu', () => {
      expect(menuAccessRoles.documentVerification).toContain('documentverification');
    });

    it('contains marketing menu', () => {
      expect(menuAccessRoles.marketing).toContain('marketing');
    });

    it('contains financialAuditing menu with auditor role', () => {
      expect(menuAccessRoles.financialAuditing).toContain('auditor');
    });

    it('all menu values are arrays', () => {
      Object.values(menuAccessRoles).forEach((roles) => {
        expect(Array.isArray(roles)).toBe(true);
      });
    });
  });

  describe('canAccessMenu()', () => {
    it('returns true when user can access dashboard', () => {
      const result = canAccessMenu('admin', 'dashboard');
      expect(result).toBe(true);
    });

    it('returns true when auditor can access dashboard', () => {
      const result = canAccessMenu('auditor', 'dashboard');
      expect(result).toBe(true);
    });

    it('returns false when auditor cannot access adminUsers', () => {
      const result = canAccessMenu('auditor', 'adminUsers');
      expect(result).toBe(false);
    });

    it('returns true when coursemanagement can access courses', () => {
      const result = canAccessMenu('coursemanagement', 'courses');
      expect(result).toBe(true);
    });

    it('returns false when auditor cannot access courses', () => {
      const result = canAccessMenu('auditor', 'courses');
      expect(result).toBe(false);
    });

    it('returns true when usermanagement can access users', () => {
      const result = canAccessMenu('usermanagement', 'users');
      expect(result).toBe(true);
    });

    it('returns true when documentverification can access documentVerification', () => {
      const result = canAccessMenu('documentverification', 'documentVerification');
      expect(result).toBe(true);
    });

    it('returns true when marketing can access marketing menu', () => {
      const result = canAccessMenu('marketing', 'marketing');
      expect(result).toBe(true);
    });

    it('returns false for unknown menu key', () => {
      const result = canAccessMenu('admin', 'unknownmenu');
      expect(result).toBe(false);
    });

    it('returns false for null role', () => {
      const result = canAccessMenu(null, 'dashboard');
      expect(result).toBe(false);
    });

    it('handles case-insensitive roles', () => {
      const result = canAccessMenu('ADMIN', 'adminUsers');
      expect(result).toBe(true);
    });

    it('returns true when boscontroller can access bos menu', () => {
      const result = canAccessMenu('boscontroller', 'bos');
      expect(result).toBe(true);
    });

    it('returns true when bosmembers can access bos menu', () => {
      const result = canAccessMenu('bosmembers', 'bos');
      expect(result).toBe(true);
    });
  });

  describe('useRoleAccess()', () => {
    it('returns true when user has access', () => {
      const result = useRoleAccess('admin', ['admin', 'superadmin']);
      expect(result).toBe(true);
    });

    it('returns false when user does not have access', () => {
      const result = useRoleAccess('auditor', ['admin', 'superadmin']);
      expect(result).toBe(false);
    });

    it('handles case-insensitive role comparison', () => {
      const result = useRoleAccess('ADMIN', ['admin']);
      expect(result).toBe(true);
    });

    it('returns false for null role', () => {
      const result = useRoleAccess(null, ['admin']);
      expect(result).toBe(false);
    });

    it('returns false for undefined allowedRoles', () => {
      const result = useRoleAccess('admin', undefined);
      expect(result).toBe(false);
    });

    it('returns true when role matches any allowed role', () => {
      const result = useRoleAccess('marketing', ['auditor', 'marketing', 'documentverification']);
      expect(result).toBe(true);
    });
  });

  describe('withRoleAccess() HOC', () => {
    const TestComponent = () => <div data-testid="test-component">Test Content</div>;
    const AccessDeniedMessage = 'Access Denied';

    beforeEach(() => {
      secureStorage.getItem.mockReturnValue('admin');
    });

    it('renders wrapped component when user has access', () => {
      secureStorage.getItem.mockReturnValue('admin');
      const WrappedComponent = withRoleAccess(TestComponent, ['admin', 'superadmin']);

      render(<WrappedComponent />);

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('shows access denied message when user lacks access', () => {
      secureStorage.getItem.mockReturnValue('auditor');
      const WrappedComponent = withRoleAccess(TestComponent, ['admin', 'superadmin']);

      render(<WrappedComponent />);

      expect(screen.getByText(AccessDeniedMessage)).toBeInTheDocument();
    });

    it('displays required roles in access denied message', () => {
      secureStorage.getItem.mockReturnValue('auditor');
      const WrappedComponent = withRoleAccess(TestComponent, ['admin']);

      render(<WrappedComponent />);

      expect(screen.getByText(/Admin/)).toBeInTheDocument();
    });

    it('displays user role in access denied message', () => {
      secureStorage.getItem.mockReturnValue('auditor');
      const WrappedComponent = withRoleAccess(TestComponent, ['admin']);

      render(<WrappedComponent />);

      expect(screen.getByText(/Auditor/)).toBeInTheDocument();
    });

    it('handles null role from storage', () => {
      secureStorage.getItem.mockReturnValue(null);
      const WrappedComponent = withRoleAccess(TestComponent, ['admin']);

      render(<WrappedComponent />);

      expect(screen.getByText(AccessDeniedMessage)).toBeInTheDocument();
    });

    it('passes all props to wrapped component', () => {
      secureStorage.getItem.mockReturnValue('admin');
      const ComponentWithProps = (props) => (
        <div data-testid="test-component" data-test-prop={props.testProp}>
          Content
        </div>
      );
      const WrappedComponent = withRoleAccess(ComponentWithProps, ['admin']);

      render(<WrappedComponent testProp="testValue" />);

      expect(screen.getByTestId('test-component')).toHaveAttribute('data-test-prop', 'testValue');
    });

    it('shows access denied styling', () => {
      secureStorage.getItem.mockReturnValue('auditor');
      const WrappedComponent = withRoleAccess(TestComponent, ['admin']);

      const { container } = render(<WrappedComponent />);
      const accessDeniedDiv = container.querySelector('div');

      expect(accessDeniedDiv).toHaveStyle({ padding: '2rem' });
      expect(accessDeniedDiv).toHaveStyle({ textAlign: 'center' });
      expect(accessDeniedDiv).toHaveStyle({ color: '#ef4444' });
    });

    it('renders access denied h2 with correct text', () => {
      secureStorage.getItem.mockReturnValue('auditor');
      const WrappedComponent = withRoleAccess(TestComponent, ['admin', 'superadmin']);

      render(<WrappedComponent />);

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(AccessDeniedMessage);
    });

    it('handles multiple allowed roles in message', () => {
      secureStorage.getItem.mockReturnValue('auditor');
      const WrappedComponent = withRoleAccess(TestComponent, ['admin', 'superadmin', 'coursemanagement']);

      render(<WrappedComponent />);

      expect(screen.getByText(/Required roles:/)).toBeInTheDocument();
    });

    it('renders component when user role matches one of many allowed roles', () => {
      secureStorage.getItem.mockReturnValue('coursemanagement');
      const WrappedComponent = withRoleAccess(TestComponent, ['admin', 'coursemanagement', 'usermanagement']);

      render(<WrappedComponent />);

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('handles case-insensitive role from storage', () => {
      secureStorage.getItem.mockReturnValue('ADMIN');
      const WrappedComponent = withRoleAccess(TestComponent, ['admin']);

      render(<WrappedComponent />);

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('normalizes roles with spaces from storage', () => {
      secureStorage.getItem.mockReturnValue('committee of trustees');
      const WrappedComponent = withRoleAccess(TestComponent, ['committeeoftrustees']);

      render(<WrappedComponent />);

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });

    it('shows permission description in access denied', () => {
      secureStorage.getItem.mockReturnValue('auditor');
      const WrappedComponent = withRoleAccess(TestComponent, ['admin']);

      const { container } = render(<WrappedComponent />);
      const descriptions = container.querySelectorAll('p');

      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  describe('allRoles', () => {
    it('is an array', () => {
      expect(Array.isArray(allRoles)).toBe(true);
    });

    it('contains superadmin', () => {
      expect(allRoles).toContain('superadmin');
    });

    it('contains admin', () => {
      expect(allRoles).toContain('admin');
    });

    it('contains all major roles', () => {
      expect(allRoles).toContain('committeeoftrustees');
      expect(allRoles).toContain('coursemanagement');
      expect(allRoles).toContain('tutormanagement');
      expect(allRoles).toContain('usermanagement');
      expect(allRoles).toContain('documentverification');
      expect(allRoles).toContain('auditor');
    });

    it('contains bos roles', () => {
      expect(allRoles).toContain('boscontroller');
      expect(allRoles).toContain('bosmembers');
    });

    it('contains marketing role', () => {
      expect(allRoles).toContain('marketing');
    });

    it('has minimum expected number of roles', () => {
      expect(allRoles.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Integration Tests', () => {
    it('hasAccess and useRoleAccess return same result', () => {
      const role = 'admin';
      const roles = ['admin', 'superadmin'];

      const accessResult = hasAccess(role, roles);
      const hookResult = useRoleAccess(role, roles);

      expect(accessResult).toBe(hookResult);
    });

    it('canAccessMenu uses hasAccess internally correctly', () => {
      const adminCanAccessAdminUsers = canAccessMenu('admin', 'adminUsers');
      const directAccess = hasAccess('admin', menuAccessRoles.adminUsers);

      expect(adminCanAccessAdminUsers).toBe(directAccess);
    });

    it('hasMinimumRole and hasAccess work together for hierarchical access', () => {
      // Admin should have more access than auditor
      const adminAccess = hasMinimumRole('admin', 'auditor');
      const auditorAccess = hasMinimumRole('auditor', 'admin');

      expect(adminAccess).toBe(true);
      expect(auditorAccess).toBe(false);
    });

    it('getRoleDisplayName works with all roles in roleHierarchy', () => {
      Object.keys(roleHierarchy).forEach((role) => {
        const displayName = getRoleDisplayName(role);
        expect(displayName).toBeTruthy();
        expect(typeof displayName).toBe('string');
      });
    });

    it('allRoles matches keys in roleHierarchy', () => {
      const hierarchyRoles = Object.keys(roleHierarchy);
      allRoles.forEach((role) => {
        expect(hierarchyRoles).toContain(role);
      });
    });

    it('menuAccessRoles only contains roles from allRoles', () => {
      Object.values(menuAccessRoles).forEach((roles) => {
        roles.forEach((role) => {
          expect(allRoles).toContain(role);
        });
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles empty string in allowedRoles array', () => {
      const result = hasAccess('admin', ['', 'admin', 'superadmin']);
      expect(result).toBe(true);
    });

    it('handles very long role names', () => {
      const longRole = 'a'.repeat(100);
      const result = hasAccess(longRole, [longRole]);
      expect(result).toBe(true);
    });

    it('handles special characters in role names', () => {
      const result = hasAccess('admin-super', ['admin-super']);
      expect(result).toBe(true);
    });

    it('handles numeric role levels correctly', () => {
      const adminLevel = roleHierarchy.admin;
      const auditorLevel = roleHierarchy.auditor;

      expect(adminLevel).toBeGreaterThan(auditorLevel);
    });

    it('withRoleAccess component maintains prop types', () => {
      const TestComponent = ({ count, text, active }) => (
        <div data-testid="props-test" data-count={count} data-text={text} data-active={active}>
          Test
        </div>
      );

      secureStorage.getItem.mockReturnValue('admin');
      const WrappedComponent = withRoleAccess(TestComponent, ['admin']);

      render(<WrappedComponent count={42} text="hello" active={true} />);

      const element = screen.getByTestId('props-test');
      expect(element).toHaveAttribute('data-count', '42');
      expect(element).toHaveAttribute('data-text', 'hello');
      expect(element).toHaveAttribute('data-active', 'true');
    });

    it('getRoleDisplayName handles whitespace-only role', () => {
      const result = getRoleDisplayName('   ');
      expect(result).toBeDefined();
    });

    it('hasAccess with empty allowedRoles array returns false', () => {
      const result = hasAccess('admin', []);
      expect(result).toBe(false);
    });

    it('canAccessMenu with non-existent menu returns false', () => {
      const result = canAccessMenu('admin', 'nonexistentmenu12345');
      expect(result).toBe(false);
    });
  });
});
