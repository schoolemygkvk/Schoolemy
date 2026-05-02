import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardWithData from '../../Components/Dashboard/DashboardWithData';

jest.mock('../../Hooks/useToken', () => ({
  useToken: jest.fn(),
}));

jest.mock('../../Utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
  API_BASE_URL: 'http://localhost:3000/api',
}));

jest.mock('../../Utils/dashboardCache', () => ({
  getCachedData: jest.fn(),
  setCachedData: jest.fn(),
  setupAutoRefresh: jest.fn(),
  clearAutoRefresh: jest.fn(),
  CACHE_KEYS: {
    USERS: 'users',
    COURSES: 'courses',
  },
}));

jest.mock('../../Components/Dashboard/DashboardContent', () => {
  return function MockDashboardContent(props) {
    return (
      <div data-testid="dashboard-content">
        <div data-testid="total-users">{props.totalUsers}</div>
        <div data-testid="total-courses">{props.totalCourses}</div>
        <div data-testid="active-subscriptions">{props.activeSubscriptions}</div>
        <div data-testid="completion-rate">{props.completionRate}</div>
      </div>
    );
  };
});

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  Spin: () => <div data-testid="loading-spinner">Loading...</div>,
}));

import { useToken } from '../../Hooks/useToken';
import axios from '../../Utils/api';
import {
  getCachedData,
  setCachedData,
  setupAutoRefresh,
  clearAutoRefresh,
  CACHE_KEYS,
} from '../../Utils/dashboardCache';

function installAxiosDashboardMock(state) {
  axios.get.mockImplementation((url) => {
    const u = String(url);
    if (u.includes('/getallusers')) {
      return Promise.resolve({
        data: { pagination: { total: state.totalUsers } },
      });
    }
    if (u.includes('/api/courses/getcoursesname')) {
      return Promise.resolve({ data: state.courses });
    }
    if (u.includes('/api/subscriptions/active-count')) {
      return Promise.resolve({
        data: {
          count: state.subscriptions,
          activeSubscriptions: state.subscriptions,
        },
      });
    }
    if (u.includes('/api/courses/completion-rate')) {
      return Promise.resolve({
        data: {
          completionRate: state.completionRate,
          rate: state.completionRate,
        },
      });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('DashboardWithData Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useToken.mockReturnValue({ token: 'Bearer test-token-123' });
    getCachedData.mockReturnValue(null);
    installAxiosDashboardMock({
      totalUsers: 0,
      courses: [],
      subscriptions: 0,
      completionRate: 0,
    });
  });

  it('renders loading then dashboard content after axios data resolves', async () => {
    installAxiosDashboardMock({
      totalUsers: 4,
      courses: [{ id: 1 }, { id: 2 }],
      subscriptions: 3,
      completionRate: 72,
    });

    render(<DashboardWithData />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });
    expect(screen.getByTestId('total-users')).toHaveTextContent('4');
    expect(screen.getByTestId('total-courses')).toHaveTextContent('2');
    expect(screen.getByTestId('active-subscriptions')).toHaveTextContent('3');
    expect(screen.getByTestId('completion-rate')).toHaveTextContent('72');
  });

  it('shows loading spinner while axios requests are pending', () => {
    axios.get.mockImplementation(() => new Promise(() => {}));

    render(<DashboardWithData />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('falls back to cached user count when users API fails', async () => {
    getCachedData.mockImplementation((key) => (key === CACHE_KEYS.USERS ? 9 : null));
    axios.get.mockImplementation((url) => {
      const u = String(url);
      if (u.includes('/getallusers')) {
        return Promise.reject(new Error('API error'));
      }
      if (u.includes('/api/courses/getcoursesname')) {
        return Promise.resolve({ data: [] });
      }
      if (u.includes('/api/subscriptions/active-count')) {
        return Promise.resolve({ data: { count: 0 } });
      }
      if (u.includes('/api/courses/completion-rate')) {
        return Promise.resolve({ data: { completionRate: 0 } });
      }
      return Promise.resolve({ data: {} });
    });

    render(<DashboardWithData />);

    await waitFor(() => {
      expect(screen.getByTestId('total-users')).toHaveTextContent('9');
    });
  });

  it('registers auto-refresh for users and courses', async () => {
    render(<DashboardWithData />);

    await waitFor(() => {
      expect(setupAutoRefresh).toHaveBeenCalledWith(CACHE_KEYS.USERS, expect.any(Function));
      expect(setupAutoRefresh).toHaveBeenCalledWith(CACHE_KEYS.COURSES, expect.any(Function));
    });
  });

  it('clears auto-refresh on unmount', async () => {
    const { unmount } = render(<DashboardWithData />);
    await waitFor(() => expect(screen.getByTestId('dashboard-content')).toBeInTheDocument());
    unmount();
    expect(clearAutoRefresh).toHaveBeenCalledWith(CACHE_KEYS.USERS);
    expect(clearAutoRefresh).toHaveBeenCalledWith(CACHE_KEYS.COURSES);
  });

  it('calls getallusers with pagination params', async () => {
    render(<DashboardWithData />);
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(axios.get).toHaveBeenCalledWith(
      '/getallusers',
      expect.objectContaining({ params: { page: 1, limit: 1 } })
    );
  });

  it('writes user count to cache after successful users fetch', async () => {
    installAxiosDashboardMock({ totalUsers: 11, courses: [], subscriptions: 0, completionRate: 0 });
    render(<DashboardWithData />);
    await waitFor(() => expect(setCachedData).toHaveBeenCalledWith(CACHE_KEYS.USERS, 11));
  });
});
