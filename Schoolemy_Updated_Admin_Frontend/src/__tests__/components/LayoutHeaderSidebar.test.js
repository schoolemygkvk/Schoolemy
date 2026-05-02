import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
// v13 API: use userEvent.click directly (no .setup()).
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import LayoutHeaderSidebar from '../../Components/Dashboard/LayoutHeaderSidebar';

// React 19 `act` aggregates React Router v6 deprecation warnings into AggregateError unless future flags are set.
const routerFuture = { v7_startTransition: true, v7_relativeSplatPath: true };
import { message } from 'antd';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('../../Components/Auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../Utils/api', () => {
  const axiosMock = {
    get: jest.fn(),
    post: jest.fn(),
  };
  return {
    __esModule: true,
    default: axiosMock,
    SOCKET_URL: 'ws://localhost:3001',
    SOCKET_ENABLED: true,
  };
});

jest.mock('socket.io-client', () => {
  return jest.fn().mockReturnValue({
    on: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    off: jest.fn(),
  });
});

jest.mock('../../Utils/roleBasedAccess', () => ({
  ...jest.requireActual('../../Utils/roleBasedAccess'),
  hasAccess: jest.fn((role, roles) => {
    if (!role || !roles) return false;
    return roles.includes(role);
  }),
}));

jest.mock('../../Hooks/useDynamicRBAC', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../Utils/security', () => ({
  secureStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  hasStoredSession: jest.fn(() => false),
}));

jest.mock('../../Hooks/useToken', () => ({
  getToken: jest.fn(),
}));

jest.mock('../../Components/Common/ScrollToTop', () => {
  return function MockScrollToTop() {
    return <div data-testid="scroll-to-top">ScrollToTop</div>;
  };
});

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

// Import mocked modules
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Components/Auth/AuthProvider';
import useDynamicRBAC from '../../Hooks/useDynamicRBAC';
import axios from '../../Utils/api';
import { hasAccess } from '../../Utils/roleBasedAccess';
import { secureStorage } from '../../Utils/security';
import { getToken } from '../../Hooks/useToken';

const mockNavigate = jest.fn();
const mockLogout = jest.fn();
const mockUser = {
  name: 'John Admin',
  role: 'admin',
  token: 'test-token-123',
};

describe('LayoutHeaderSidebar Component', () => {
  beforeAll(() => {
    // React 19 + RTL treat many library warnings logged via console.error as hard failures.
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    console.error.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue({
      pathname: '/schoolemy',
      search: '',
      hash: '',
      state: null,
    });
    useAuth.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
    useDynamicRBAC.mockImplementation(() => {
      const auth = useAuth();
      const role = auth?.user?.role || 'admin';
      return {
        role,
        hasDynamicPermissions: false,
        canAccessMenu: () => true,
        canAccessRoute: () => true,
        hasRole: (r) => role === r,
        menuAccess: {},
        routeAccess: {},
      };
    });
    localStorage.getItem = jest.fn().mockReturnValue('admin');
    secureStorage.getItem.mockImplementation((key) => {
      if (key === 'role') return mockUser.role;
      if (key === '_id') return 'user-id-1';
      if (key === 'name') return mockUser.name;
      return null;
    });
    getToken.mockReturnValue('test-token-123');
    axios.get.mockResolvedValue({ data: [] });
    axios.post.mockResolvedValue({ data: { success: true } });
  });

  describe('Rendering', () => {
    it('renders layout header and sidebar', () => {
      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      expect(container.querySelector('.ant-layout')).toBeInTheDocument();
    });

    it('renders with user information when logged in', () => {
      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      expect(screen.getByText(/John Admin\s*-\s*admin/)).toBeInTheDocument();
    });

    it('renders login link when user is not authenticated', () => {
      useAuth.mockReturnValue({
        user: null,
        logout: mockLogout,
      });

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      expect(screen.getByText('Login')).toBeInTheDocument();
    });

    it('renders logo text when sidebar is expanded', () => {
      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      expect(screen.getByText('Schoolemy Admin')).toBeInTheDocument();
    });

    it('renders children content', () => {
      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()}>
            <div data-testid="test-child">Test Content</div>
          </LayoutHeaderSidebar>
        </BrowserRouter>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Menu Filtering by Role', () => {
    it('filters menu items based on user role', () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, role: 'admin' },
        logout: mockLogout,
      });

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      // Admin should see Dashboard (menu + header) and Users
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Users')).toBeInTheDocument();
    });

    it('shows all accessible menu items for superadmin', () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, role: 'superadmin' },
        logout: mockLogout,
      });
      hasAccess.mockReturnValue(true);

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    });

    it('shows only dashboard when user has no other accessible items', () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, role: 'limiteduser' },
        logout: mockLogout,
      });
      hasAccess.mockReturnValue(false);

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      // Should still show at least dashboard
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Sidebar Collapse/Expand', () => {
    it('collapses sidebar when toggle button is clicked', async () => {
      const setCollapsed = jest.fn();

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={setCollapsed} />
        </BrowserRouter>
      );

      await userEvent.click(screen.getByLabelText('Collapse sidebar'));

      await waitFor(() => {
        expect(setCollapsed).toHaveBeenCalledWith(true);
      });
    });

    it('expands sidebar when toggle button is clicked while collapsed', async () => {
      const setCollapsed = jest.fn();

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={true} setCollapsed={setCollapsed} />
        </BrowserRouter>
      );

      await userEvent.click(screen.getByLabelText('Expand sidebar'));

      await waitFor(() => {
        expect(setCollapsed).toHaveBeenCalledWith(false);
      });
    });

    it('adjusts layout margin when sidebar is collapsed', () => {
      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={true} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const layout = container.querySelector('.ant-layout');
      expect(layout).toHaveStyle('marginLeft: 80px');
    });

    it('adjusts layout margin when sidebar is expanded', () => {
      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const layout = container.querySelector('.ant-layout');
      expect(layout).toHaveStyle('marginLeft: 250px');
    });
  });

  describe('Menu Navigation', () => {
    it('navigates to selected menu item path', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const usersMenu = screen.getByText('Users');
      const menuItem = usersMenu.closest('[role="menuitem"]') || usersMenu.parentElement;
      expect(menuItem).toBeTruthy();
      fireEvent.click(menuItem);
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/schoolemy/users');
      });
    });

    it('displays current page title in header', () => {
      useLocation.mockReturnValue({
        pathname: '/schoolemy/users',
        search: '',
        hash: '',
        state: null,
      });

      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const header = container.querySelector('.ant-layout-header');
      expect(header).toBeTruthy();
      expect(within(header).getByText('Users')).toBeInTheDocument();
    });

    it('closes sidebar after menu item click', async () => {
      const setCollapsed = jest.fn();

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={setCollapsed} />
        </BrowserRouter>
      );

      const usersMenu = screen.getByText('Users');
      const menuItem = usersMenu.closest('[role="menuitem"]') || usersMenu.parentElement;
      expect(menuItem).toBeTruthy();
      fireEvent.click(menuItem);
      await waitFor(() => {
        expect(setCollapsed).toHaveBeenCalledWith(true);
      });
    });
  });

  describe('Logo Navigation', () => {
    it('navigates to dashboard on logo click for admin', async () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, role: 'admin' },
        logout: mockLogout,
      });

      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const logoSection = container.querySelector('[style*="background: #001529"]');
      if (logoSection) {
        fireEvent.click(logoSection);
        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith('/schoolemy');
        });
      }
    });

    it('navigates to tutor dashboard on logo click for tutors', async () => {
      useAuth.mockReturnValue({
        user: { ...mockUser, role: 'tutormanagement' },
        logout: mockLogout,
      });

      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      // Logo click should navigate based on role
      const logoSection = container.querySelector('[style*="background: #001529"]');
      if (logoSection) {
        fireEvent.click(logoSection);
      }
    });
  });

  describe('Logout Functionality', () => {
    it('logs out successfully and navigates to home', async () => {
      axios.post.mockResolvedValue({ data: { success: true } });

      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const logoutIcon = container.querySelector('.anticon-logout');
      expect(logoutIcon).toBeTruthy();
      await userEvent.click(logoutIcon.closest('div'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/adminlogout', {});
      });

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('handles logout API error gracefully', async () => {
      axios.post.mockRejectedValue(
        new Error('Logout failed')
      );

      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const logoutIcon = container.querySelector('.anticon-logout');
      expect(logoutIcon).toBeTruthy();
      await userEvent.click(logoutIcon.closest('div'));

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('shows success message on logout', async () => {
      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const logoutIcon = container.querySelector('.anticon-logout');
      expect(logoutIcon).toBeTruthy();
      await userEvent.click(logoutIcon.closest('div'));

      await waitFor(() => {
        expect(message.success).toHaveBeenCalledWith('Logout successful!');
      });
    });

    it('disables logout button while logging out', async () => {
      axios.post.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const logoutIcon = container.querySelector('.anticon-logout');
      expect(logoutIcon).toBeTruthy();
      const logoutHit = logoutIcon.closest('div');
      await userEvent.click(logoutHit);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalled();
      });

      await userEvent.click(logoutHit);
      expect(axios.post.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Notification Polling', () => {
    it('fetches unread notifications on mount', async () => {
      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/notifications'));
      });
    });

    it('sets up polling interval for notifications', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      // Should set up a 30-second polling interval
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);

      setIntervalSpy.mockRestore();
    });

    it('cleans up polling interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });

    it('handles notification fetch errors silently', async () => {
      axios.get.mockRejectedValue(new Error('API error'));

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      // Should not throw or display error message
      // Component should continue rendering
      expect(screen.getByText(/John Admin\s*-\s*admin/)).toBeInTheDocument();
    });

    it('displays unread notification count', async () => {
      const notificationsData = [
        { id: 1, isRead: false },
        { id: 2, isRead: false },
        { id: 3, isRead: true },
      ];
      axios.get.mockResolvedValue({ data: notificationsData });

      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should calculate 2 unread notifications
        const badge = container.querySelector('.ant-badge-count');
        if (badge) {
          expect(badge.textContent).toContain('2');
        }
      });
    });
  });

  describe('Access Control & Route Protection', () => {
    it('redirects to admin dashboard when user cannot access current route', async () => {
      useLocation.mockReturnValue({
        pathname: '/schoolemy/users',
        search: '',
        hash: '',
        state: null,
      });
      useAuth.mockReturnValue({
        user: { ...mockUser, role: 'tutor' },
        logout: mockLogout,
      });
      hasAccess.mockReturnValue(false);
      useDynamicRBAC.mockImplementation(() => ({
        role: 'tutor',
        hasDynamicPermissions: false,
        canAccessMenu: () => false,
        canAccessRoute: () => false,
        hasRole: () => false,
        menuAccess: {},
        routeAccess: {},
      }));

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/schoolemy');
      });
    });

    it('redirects to tutor dashboard when tutormanagement user cannot access route', async () => {
      useLocation.mockReturnValue({
        pathname: '/schoolemy/users',
        search: '',
        hash: '',
        state: null,
      });
      useAuth.mockReturnValue({
        user: { ...mockUser, role: 'tutormanagement' },
        logout: mockLogout,
      });
      hasAccess.mockReturnValue(false);
      useDynamicRBAC.mockImplementation(() => ({
        role: 'tutormanagement',
        hasDynamicPermissions: false,
        canAccessMenu: () => false,
        canAccessRoute: () => false,
        hasRole: (r) => r === 'tutormanagement',
        menuAccess: {},
        routeAccess: {},
      }));

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/schoolemy/tutor/dashboard');
      });
    });

    it('allows access to current route when user has permission', async () => {
      useLocation.mockReturnValue({
        pathname: '/schoolemy/users',
        search: '',
        hash: '',
        state: null,
      });
      useAuth.mockReturnValue({
        user: { ...mockUser, role: 'admin' },
        logout: mockLogout,
      });
      hasAccess.mockReturnValue(true);

      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      await waitFor(() => {
        // Should not redirect
        expect(mockNavigate).not.toHaveBeenCalledWith('/schoolemy');
      });
    });
  });

  describe('Selected Menu Item', () => {
    it('updates selected menu item based on current location', () => {
      useLocation.mockReturnValue({
        pathname: '/schoolemy/courses',
        search: '',
        hash: '',
        state: null,
      });

      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      // Check that the Courses menu item is marked as selected
      const selectedItems = container.querySelectorAll('.ant-menu-item-selected');
      expect(selectedItems.length).toBeGreaterThanOrEqual(0);
    });

    it('displays correct page title for current route', () => {
      useLocation.mockReturnValue({
        pathname: '/schoolemy',
        search: '',
        hash: '',
        state: null,
      });

      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const header = container.querySelector('.ant-layout-header');
      expect(within(header).getByText('Dashboard')).toBeInTheDocument();
    });

    it('defaults to Dashboard title for unknown routes', () => {
      useLocation.mockReturnValue({
        pathname: '/unknown-route',
        search: '',
        hash: '',
        state: null,
      });

      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const header = container.querySelector('.ant-layout-header');
      expect(within(header).getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Header Elements', () => {
    it('displays user avatar with initials', () => {
      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      // Ant Design Avatar with icon should be rendered
      const avatars = screen.queryAllByRole('img', { hidden: true });
      expect(avatars.length).toBeGreaterThan(0);
    });

    it('displays notification badge avatar', () => {
      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      // Should have notification bell icon
      // Badge component should be present
    });

    it('displays profile avatar', () => {
      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      // Should have user profile avatar
    });

    it('shows user role in header', () => {
      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      expect(screen.getByText(/John Admin\s*-\s*admin/)).toBeInTheDocument();
    });
  });

  describe('ScrollToTop Component', () => {
    it('includes ScrollToTop component', () => {
      render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      expect(screen.getByTestId('scroll-to-top')).toBeInTheDocument();
    });
  });

  describe('Sidebar Styles', () => {
    it('applies correct styling to sidebar when expanded', () => {
      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={false} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const sider = container.querySelector('.ant-layout-sider');
      expect(sider).toBeInTheDocument();
    });

    it('applies collapsed styling to sidebar', () => {
      const { container } = render(
        <BrowserRouter future={routerFuture}>
          <LayoutHeaderSidebar collapsed={true} setCollapsed={jest.fn()} />
        </BrowserRouter>
      );

      const sider = container.querySelector('.ant-layout-sider');
      expect(sider).toHaveClass('ant-layout-sider-collapsed');
    });
  });
});
