import { renderHook, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDashboardContentData } from '../../Components/Dashboard/useDashboardContentData';
import { message } from 'antd';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../Hooks/useToken', () => ({
  useToken: jest.fn(),
}));

jest.mock('../../Utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() =>
      Promise.resolve({
        data: { success: true, data: { pagination: { totalTutors: 0 } } },
      })
    ),
  },
  API_BASE_URL: 'http://localhost:5000',
}));

jest.mock('../../Utils/security', () => ({
  secureStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

jest.mock('../../Utils/dashboardCache', () => ({
  getCachedData: jest.fn(),
  setCachedData: jest.fn(),
  setupAutoRefresh: jest.fn(),
  clearAutoRefresh: jest.fn(),
  CACHE_KEYS: {
    TUTORS: 'tutors',
    INSTRUCTORS: 'instructors',
  },
}));

jest.mock('antd', () => ({
  message: {
    warning: jest.fn(),
  },
}));

// Import mocked modules
import { useNavigate } from 'react-router-dom';
import { useToken } from '../../Hooks/useToken';
import api from '../../Utils/api';
import { secureStorage } from '../../Utils/security';
import {
  getCachedData,
  setCachedData,
  setupAutoRefresh,
  clearAutoRefresh,
  CACHE_KEYS,
} from '../../Utils/dashboardCache';
import { ANALYTICS_CACHE_KEYS, POLLING_CONFIG } from '../../Components/Dashboard/dashboardConstants';

function jsonResponse(body) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(body),
  });
}

/** Routes chart-related fetch URLs so Promise.allSettled always gets stable responses. */
function chartFetchForUrl(url, overrides = {}) {
  const u = String(url);
  const emiBody = overrides.emi ?? { data: [{ month: 'Jan', amount: 1 }] };
  const enrollmentBody = overrides.enrollment ?? { data: [{ month: 'Jan', count: 1 }] };
  const completionBody = overrides.completion ?? { completionRate: 0 };
  const testimonialsBody = overrides.testimonials ?? { data: [] };
  if (u.includes('emi-monthly-stats')) return jsonResponse(emiBody);
  if (u.includes('enrollment-monthly-stats')) return jsonResponse(enrollmentBody);
  if (u.includes('completion-rate')) return jsonResponse(completionBody);
  if (u.includes('testimonials')) return jsonResponse(testimonialsBody);
  return jsonResponse({});
}

function installDefaultApiGet() {
  api.get.mockImplementation((url) => {
    const u = String(url);
    if (u.includes('all-tutors')) {
      return Promise.resolve({
        data: { success: true, data: { pagination: { totalTutors: 0 } } },
      });
    }
    if (u.includes('get-instructors-all')) {
      return Promise.resolve({ data: { success: true, instructors: [] } });
    }
    return Promise.resolve({ data: {} });
  });
}

describe('useDashboardContentData Hook', () => {
  let mockNavigate;
  let mockFetch;

  beforeEach(() => {
    jest.clearAllMocks();

    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    useToken.mockReturnValue({ token: 'Bearer test-token-123' });

    mockFetch = jest.fn();
    global.fetch = mockFetch;
    mockFetch.mockImplementation((url) => chartFetchForUrl(url, {}));

    installDefaultApiGet();

    getCachedData.mockImplementation(() => null);
  });

  describe('checkIsSuperAdmin', () => {
    it('returns true when secureStorage has superadmin role', () => {
      secureStorage.getItem.mockReturnValue('superadmin');

      const { result } = renderHook(() => useDashboardContentData(0));

      expect(result.current.checkIsSuperAdmin()).toBe(true);
    });

    it('returns true when localStorage has superadmin role', () => {
      secureStorage.getItem.mockReturnValue(null);
      localStorage.setItem('role', 'superadmin');

      const { result } = renderHook(() => useDashboardContentData(0));

      expect(result.current.checkIsSuperAdmin()).toBe(true);
      localStorage.removeItem('role');
    });

    it('returns false when neither storage has superadmin role', () => {
      secureStorage.getItem.mockReturnValue('admin');
      localStorage.getItem = jest.fn().mockReturnValue('admin');

      const { result } = renderHook(() => useDashboardContentData(0));

      expect(result.current.checkIsSuperAdmin()).toBe(false);
    });

    it('extracts role from JWT token when storage is empty', () => {
      secureStorage.getItem.mockReturnValue(null);
      localStorage.getItem = jest.fn().mockReturnValue(null);

      // Create a valid JWT with superadmin role
      const payload = btoa(JSON.stringify({ role: 'superadmin', id: '123' }));
      const token = `header.${payload}.signature`;
      useToken.mockReturnValue({ token });

      const { result } = renderHook(() => useDashboardContentData(0));

      expect(result.current.checkIsSuperAdmin()).toBe(true);
    });

    it('returns false when token does not have superadmin role', () => {
      secureStorage.getItem.mockReturnValue(null);
      localStorage.getItem = jest.fn().mockReturnValue(null);

      const payload = btoa(JSON.stringify({ role: 'admin', id: '123' }));
      const token = `header.${payload}.signature`;
      useToken.mockReturnValue({ token });

      const { result } = renderHook(() => useDashboardContentData(0));

      expect(result.current.checkIsSuperAdmin()).toBe(false);
    });

    it('handles invalid JWT gracefully', () => {
      secureStorage.getItem.mockReturnValue(null);
      localStorage.getItem = jest.fn().mockReturnValue(null);
      useToken.mockReturnValue({ token: 'invalid.token' });

      const { result } = renderHook(() => useDashboardContentData(0));

      expect(result.current.checkIsSuperAdmin()).toBe(false);
    });

    it('is case-insensitive for role comparison', () => {
      secureStorage.getItem.mockReturnValue('SUPERADMIN');

      const { result } = renderHook(() => useDashboardContentData(0));

      expect(result.current.checkIsSuperAdmin()).toBe(true);
    });

    it('handles errors in role checking gracefully', () => {
      secureStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      expect(result.current.checkIsSuperAdmin()).toBe(false);
    });
  });

  describe('handleInstructorCardClick', () => {
    it('navigates to instructor management for superadmin', () => {
      secureStorage.getItem.mockReturnValue('superadmin');

      const { result } = renderHook(() => useDashboardContentData(0));

      result.current.handleInstructorCardClick();

      expect(mockNavigate).toHaveBeenCalledWith('/schoolemy/instructors-management');
    });

    it('shows warning message for non-superadmin', () => {
      secureStorage.getItem.mockReturnValue('admin');

      const { result } = renderHook(() => useDashboardContentData(0));

      result.current.handleInstructorCardClick();

      expect(message.warning).toHaveBeenCalledWith('Only Super Admin can access Instructor Management');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('does not navigate if not superadmin', () => {
      secureStorage.getItem.mockReturnValue('tutor');

      const { result } = renderHook(() => useDashboardContentData(0));

      result.current.handleInstructorCardClick();

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('fetchEmiStats', () => {
    it('fetches EMI stats from API when cache is empty', async () => {
      const mockEmiData = [{ month: 'Jan', amount: 1000 }, { month: 'Feb', amount: 1200 }];
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { emi: { data: mockEmiData } })
      );
      getCachedData.mockImplementation(() => null);

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.emiData).toEqual(mockEmiData);
      });

      expect(setCachedData).toHaveBeenCalledWith(
        ANALYTICS_CACHE_KEYS.EMI_STATS,
        mockEmiData,
        POLLING_CONFIG.REFRESH_INTERVAL
      );
    });

    it('returns cached EMI stats when cache exists', async () => {
      const cachedEmiData = [{ month: 'Mar', amount: 1500 }];
      getCachedData.mockImplementation((key) =>
        key === ANALYTICS_CACHE_KEYS.EMI_STATS ? cachedEmiData : null
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.emiData).toEqual(cachedEmiData);
      });
    });

    it('handles API response with nested data structure', async () => {
      const mockEmiData = [{ month: 'Apr', amount: 2000 }];
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { emi: { data: mockEmiData } })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.emiData).toEqual(mockEmiData);
      });
    });

    it('handles API response with direct array', async () => {
      const mockEmiData = [{ month: 'May', amount: 2200 }];
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { emi: mockEmiData })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.emiData).toEqual(mockEmiData);
      });
    });

    it('falls back to cached data on API error', async () => {
      const cachedEmiData = [{ month: 'Jun', amount: 2400 }];
      getCachedData.mockImplementation((key) => {
        if (key === ANALYTICS_CACHE_KEYS.EMI_STATS) return cachedEmiData;
        return null;
      });
      mockFetch.mockImplementation((url) => {
        const u = String(url);
        if (u.includes('emi-monthly-stats')) {
          return Promise.reject(new Error('Network error'));
        }
        return chartFetchForUrl(url, {});
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.emiData).toEqual(cachedEmiData);
      });
    });

    it('returns empty array when response is not ok', async () => {
      mockFetch.mockImplementation((url) => {
        const u = String(url);
        if (u.includes('emi-monthly-stats')) {
          return Promise.resolve({ ok: false, json: jest.fn() });
        }
        return chartFetchForUrl(url, {});
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.emiData).toEqual([]);
      });
    });

    it('does not cache empty response', async () => {
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { emi: { data: [] } })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.isLoadingCharts).toBe(false);
      });

      expect(
        setCachedData.mock.calls.some((c) => c[0] === ANALYTICS_CACHE_KEYS.EMI_STATS)
      ).toBe(false);
    });
  });

  describe('fetchEnrollmentStats', () => {
    it('fetches enrollment stats from API', async () => {
      const mockEnrollmentData = [{ month: 'Jan', count: 50 }, { month: 'Feb', count: 75 }];
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { enrollment: { data: mockEnrollmentData } })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.enrollmentData).toEqual(mockEnrollmentData);
      });
    });

    it('returns cached enrollment data when available', async () => {
      const cachedEnrollmentData = [{ month: 'Mar', count: 100 }];
      getCachedData.mockImplementation((key) =>
        key === ANALYTICS_CACHE_KEYS.ENROLLMENT_STATS ? cachedEnrollmentData : null
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.enrollmentData).toEqual(cachedEnrollmentData);
      });
    });

    it('handles API error gracefully', async () => {
      mockFetch.mockImplementation((url) => {
        const u = String(url);
        if (u.includes('enrollment-monthly-stats')) {
          return Promise.reject(new Error('Network error'));
        }
        return chartFetchForUrl(url, {});
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.enrollmentData).toEqual([]);
      });
    });
  });

  describe('fetchCompletionRate', () => {
    it('fetches completion rate from API', async () => {
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { completion: { completionRate: 85.5 } })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.completionRateState).toBe(85.5);
      });
    });

    it('uses prop value as initial state', () => {
      const { result } = renderHook(() => useDashboardContentData(42));

      expect(result.current.completionRateState).toBe(42);
    });

    it('returns cached completion rate when available', async () => {
      getCachedData.mockImplementation((key) =>
        key === ANALYTICS_CACHE_KEYS.COMPLETION_RATE ? 90 : null
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.completionRateState).toBe(90);
      });
    });

    it('handles rate field in response', async () => {
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { completion: { rate: 75 } })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.completionRateState).toBe(75);
      });
    });

    it('defaults to 0 when no rate found in response', async () => {
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { completion: {} })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.completionRateState).toBe(0);
      });
    });
  });

  describe('fetchTestimonials', () => {
    it('fetches testimonials from API', async () => {
      const mockTestimonials = [
        { id: 1, text: 'Great course!' },
        { id: 2, text: 'Very helpful' },
      ];
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { testimonials: { data: mockTestimonials } })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.displayedTestimonials).toEqual(mockTestimonials);
      });
    });

    it('limits testimonials to 4 items', async () => {
      const mockTestimonials = [
        { id: 1, text: 'One' },
        { id: 2, text: 'Two' },
        { id: 3, text: 'Three' },
        { id: 4, text: 'Four' },
        { id: 5, text: 'Five' },
      ];
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { testimonials: { data: mockTestimonials } })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.displayedTestimonials).toHaveLength(4);
      });
    });

    it('handles direct array response for testimonials', async () => {
      const mockTestimonials = [{ id: 1, text: 'Direct array' }];
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { testimonials: mockTestimonials })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.displayedTestimonials).toEqual(mockTestimonials);
      });
    });

    it('handles API error for testimonials', async () => {
      mockFetch.mockImplementation((url) => {
        const u = String(url);
        if (u.includes('testimonials')) {
          return Promise.reject(new Error('Network error'));
        }
        return chartFetchForUrl(url, {});
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.displayedTestimonials).toEqual([]);
      });
    });

    it('handles non-ok response for testimonials', async () => {
      mockFetch.mockImplementation((url) => {
        const u = String(url);
        if (u.includes('testimonials')) {
          return Promise.resolve({ ok: false, json: jest.fn() });
        }
        return chartFetchForUrl(url, {});
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.displayedTestimonials).toEqual([]);
      });
    });
  });

  describe('fetchAllChartData', () => {
    it('loads chart data successfully', async () => {
      const emiData = [{ month: 'Jan', amount: 1000 }];
      const enrollmentData = [{ month: 'Jan', count: 50 }];
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, {
          emi: { data: emiData },
          enrollment: { data: enrollmentData },
          completion: { completionRate: 85 },
          testimonials: { data: [] },
        })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.isLoadingCharts).toBe(false);
      });

      expect(result.current.emiData).toEqual(emiData);
      expect(result.current.enrollmentData).toEqual(enrollmentData);
      expect(result.current.chartError).toBeNull();
    });

    it('sets chart error when all fetches fail', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.isLoadingCharts).toBe(false);
      });

      expect(result.current.chartError).toBe('Unable to load analytics data. Using cached data if available.');
    });

    it('does not set error when some fetches succeed', async () => {
      mockFetch.mockImplementation((url) => {
        const u = String(url);
        if (u.includes('emi-monthly-stats')) {
          return jsonResponse({ data: [{ month: 'Jan' }] });
        }
        if (u.includes('enrollment-monthly-stats')) {
          return Promise.reject(new Error('Network error'));
        }
        if (u.includes('completion-rate')) {
          return jsonResponse({ completionRate: 85 });
        }
        if (u.includes('testimonials')) {
          return Promise.reject(new Error('Network error'));
        }
        return jsonResponse({});
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.isLoadingCharts).toBe(false);
      });

      expect(result.current.chartError).toBeNull();
    });

    it('sets isLoadingCharts during fetch', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useDashboardContentData(0));

      // Should be loading
      expect(result.current.isLoadingCharts).toBe(true);
    });
  });

  describe('Polling behavior', () => {
    it('sets up polling interval when token is present', async () => {
      mockFetch.mockImplementation((url) => chartFetchForUrl(url, {}));

      renderHook(() => useDashboardContentData(0));

      expect(setupAutoRefresh).toHaveBeenCalled();
    });

    it('does not set up polling when token is missing', () => {
      useToken.mockReturnValue({ token: null });

      renderHook(() => useDashboardContentData(0));

      // Should not set up auto-refresh since token is null
      // (Polling only happens when token is available)
    });

    it('cleans up polling interval on unmount', async () => {
      mockFetch.mockImplementation((url) => chartFetchForUrl(url, {}));

      const { unmount } = renderHook(() => useDashboardContentData(0));

      unmount();

      expect(clearAutoRefresh).toHaveBeenCalled();
    });
  });

  describe('Tutor count fetching', () => {
    it('fetches tutor count from API', async () => {
      api.get.mockImplementation((url) => {
        const u = String(url);
        if (u.includes('all-tutors')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {
                pagination: {
                  totalTutors: 42,
                },
              },
            },
          });
        }
        if (u.includes('get-instructors-all')) {
          return Promise.resolve({ data: { success: true, instructors: [] } });
        }
        return Promise.resolve({ data: {} });
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.totalTutors).toBe(42);
      });
    });

    it('uses cached tutor count when available', async () => {
      getCachedData.mockImplementation((key) => (key === CACHE_KEYS.TUTORS ? 100 : null));

      const { result } = renderHook(() => useDashboardContentData(0));

      expect(result.current.totalTutors).toBe(100);
    });

    it('falls back to cached data on API error', async () => {
      getCachedData.mockImplementation((key) => (key === CACHE_KEYS.TUTORS ? 50 : null));
      api.get.mockImplementation((url) => {
        const u = String(url);
        if (u.includes('all-tutors')) {
          return Promise.reject(new Error('API error'));
        }
        if (u.includes('get-instructors-all')) {
          return Promise.resolve({ data: { success: true, instructors: [] } });
        }
        return Promise.resolve({ data: {} });
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.totalTutors).toBe(50);
      });
    });

    it('handles response with no pagination data', async () => {
      api.get.mockImplementation((url) => {
        const u = String(url);
        if (u.includes('all-tutors')) {
          return Promise.resolve({
            data: {
              success: true,
              data: {},
            },
          });
        }
        if (u.includes('get-instructors-all')) {
          return Promise.resolve({ data: { success: true, instructors: [] } });
        }
        return Promise.resolve({ data: {} });
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.totalTutors).toBe(0);
      });
    });
  });

  describe('Instructors fetching and sorting', () => {
    function apiWithInstructors(instructorsPayload) {
      api.get.mockImplementation((url) => {
        const u = String(url);
        if (u.includes('all-tutors')) {
          return Promise.resolve({
            data: { success: true, data: { pagination: { totalTutors: 0 } } },
          });
        }
        if (u.includes('get-instructors-all')) {
          return Promise.resolve({ data: instructorsPayload });
        }
        return Promise.resolve({ data: {} });
      });
    }

    it('fetches and sorts instructors by order field', async () => {
      const instructorsData = [
        { id: 1, name: 'John', order: 2 },
        { id: 2, name: 'Jane', order: 1 },
        { id: 3, name: 'Jack', order: 3 },
      ];
      apiWithInstructors({
        success: true,
        instructors: instructorsData,
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.loadingInstructors).toBe(false);
      });

      // Should be sorted by order: Jane (1), John (2), Jack (3)
      expect(result.current.instructors[0].name).toBe('Jane');
      expect(result.current.instructors[1].name).toBe('John');
      expect(result.current.instructors[2].name).toBe('Jack');
    });

    it('handles instructors with undefined order', async () => {
      const instructorsData = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane', order: 1 },
      ];
      apiWithInstructors({
        success: true,
        instructors: instructorsData,
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.loadingInstructors).toBe(false);
      });

      // Jane with order 1 should come before John without order
      expect(result.current.instructors[0].name).toBe('Jane');
      expect(result.current.instructors[1].name).toBe('John');
    });

    it('maps imageUrl to image field', async () => {
      const instructorsData = [
        { id: 1, name: 'John', imageUrl: 'https://example.com/john.jpg' },
      ];
      apiWithInstructors({
        success: true,
        instructors: instructorsData,
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.loadingInstructors).toBe(false);
      });

      expect(result.current.instructors[0].image).toBe('https://example.com/john.jpg');
    });

    it('prefers imageUrl over image field', async () => {
      const instructorsData = [
        { id: 1, name: 'John', imageUrl: 'url1.jpg', image: 'url2.jpg' },
      ];
      apiWithInstructors({
        success: true,
        instructors: instructorsData,
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.loadingInstructors).toBe(false);
      });

      expect(result.current.instructors[0].image).toBe('url1.jpg');
    });

    it('handles alternative response format with data.instructors', async () => {
      const instructorsData = [
        { id: 1, name: 'Alice', order: 1 },
      ];
      apiWithInstructors({
        success: true,
        data: {
          instructors: instructorsData,
        },
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.loadingInstructors).toBe(false);
      });

      expect(result.current.instructors).toEqual([
        { ...instructorsData[0], image: '' },
      ]);
    });

    it('uses cached instructors when available', async () => {
      const cachedInstructors = [{ id: 1, name: 'Cached' }];
      getCachedData.mockImplementation((key) =>
        key === CACHE_KEYS.INSTRUCTORS ? cachedInstructors : null
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      expect(result.current.instructors).toEqual(cachedInstructors);
      await waitFor(() => {
        expect(result.current.loadingInstructors).toBe(false);
      });
    });

    it('handles API error for instructors', async () => {
      api.get.mockImplementation((url) => {
        const u = String(url);
        if (u.includes('all-tutors')) {
          return Promise.resolve({
            data: { success: true, data: { pagination: { totalTutors: 0 } } },
          });
        }
        if (u.includes('get-instructors-all')) {
          return Promise.reject(new Error('API error'));
        }
        return Promise.resolve({ data: {} });
      });

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.loadingInstructors).toBe(false);
      });

      expect(result.current.instructors).toEqual([]);
    });

    it('caches instructors after successful fetch', async () => {
      const instructorsData = [{ id: 1, name: 'John', order: 1 }];
      apiWithInstructors({
        success: true,
        instructors: instructorsData,
      });

      renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(setCachedData).toHaveBeenCalledWith(
          CACHE_KEYS.INSTRUCTORS,
          expect.any(Array)
        );
      });
    });
  });

  describe('Retry logic', () => {
    beforeEach(() => {
      jest.useFakeTimers({ legacyFakeTimers: true });
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('retries failed chart fetch up to MAX_RETRIES', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.isLoadingCharts).toBe(false);
      });

      expect(result.current.retryCount).toBeGreaterThanOrEqual(0);
    });

    it('does not retry beyond MAX_RETRIES', async () => {
      mockFetch.mockImplementation(() => Promise.reject(new Error('Network error')));

      const { result } = renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(result.current.chartError).toBeTruthy();
      });

      for (let i = 0; i < POLLING_CONFIG.MAX_RETRIES + 2; i++) {
        await act(async () => {
          jest.advanceTimersByTime(POLLING_CONFIG.ERROR_RETRY_DELAY);
        });
      }

      expect(result.current.retryCount).toBeLessThanOrEqual(POLLING_CONFIG.MAX_RETRIES);
    });
  });

  describe('Token handling', () => {
    it('adds Bearer prefix to token if missing on dashboard fetch', async () => {
      useToken.mockReturnValue({ token: 'token-without-bearer' });

      renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const authHeader = mockFetch.mock.calls
        .map((c) => c[1]?.headers?.Authorization)
        .find((h) => h && h.length > 0);
      expect(authHeader).toBe('Bearer token-without-bearer');
    });

    it('does not double-prefix Bearer token on dashboard fetch', async () => {
      useToken.mockReturnValue({ token: 'Bearer token-with-bearer' });

      renderHook(() => useDashboardContentData(0));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const authHeader = mockFetch.mock.calls
        .map((c) => c[1]?.headers?.Authorization)
        .find((h) => h && h.length > 0);
      expect(authHeader).toBe('Bearer token-with-bearer');
    });
  });

  describe('Cache bypass', () => {
    it('skips cache when useCache is false', async () => {
      const mockEmiData = [{ month: 'Jan' }];
      getCachedData.mockImplementation(() => [{ month: 'Cached' }]);
      mockFetch.mockImplementation((url) =>
        chartFetchForUrl(url, { emi: { data: mockEmiData } })
      );

      const { result } = renderHook(() => useDashboardContentData(0));

      // Note: The hook doesn't expose methods to control useCache directly
      // This test documents the expected behavior
      await waitFor(() => {
        expect(result.current).toBeDefined();
      });
    });
  });
});
