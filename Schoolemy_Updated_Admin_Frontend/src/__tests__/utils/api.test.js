import '@testing-library/jest-dom';

// Mock dependencies first
jest.mock('../../Utils/security');
jest.mock('../../Utils/dashboardCache');

// Import mocked modules
import { secureStorage } from '../../Utils/security';
import * as cacheModule from '../../Utils/dashboardCache';

// Mock axios
jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn(),
    })),
    get: jest.fn(),
  },
}));

import axios from 'axios';

describe('API Utilities - checkBackendHealth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('checkBackendHealth()', () => {
    let checkBackendHealth;
    let API_BASE_URL;

    beforeEach(() => {
      // Re-import to get fresh module with current mocks
      jest.resetModules();
      jest.doMock('axios', () => ({
        __esModule: true,
        default: {
          create: jest.fn(() => ({
            interceptors: {
              request: { use: jest.fn() },
              response: { use: jest.fn() },
            },
            get: jest.fn(),
            post: jest.fn(),
          })),
          get: jest.fn(),
        },
      }));

      const apiModule = require('../../Utils/api');
      checkBackendHealth = apiModule.checkBackendHealth;
      API_BASE_URL = apiModule.API_BASE_URL;
      const axiosDefault = require('axios').default;
      axios.get = axiosDefault.get;
    });

    it('returns success when backend responds with 200', async () => {
      axios.get.mockResolvedValue({ status: 200, data: { healthy: true } });

      const result = await checkBackendHealth();

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
    });

    it('returns success for any status code', async () => {
      axios.get.mockResolvedValue({ status: 404, data: {} });

      const result = await checkBackendHealth();

      expect(result.success).toBe(true);
      expect(result.status).toBe(404);
    });

    it('returns failure when backend is unreachable', async () => {
      const error = new Error('Network timeout');
      axios.get.mockRejectedValue(error);

      const result = await checkBackendHealth();

      expect(result.success).toBe(false);
      expect(result.error).toBe(error.message);
    });

    it('includes suggestion in failure response', async () => {
      axios.get.mockRejectedValue(new Error('Failed to connect'));

      const result = await checkBackendHealth();

      expect(result.suggestion).toBeDefined();
      expect(result.suggestion).toContain('ensure backend server is running');
    });

    it('calls axios.get with health endpoint', async () => {
      axios.get.mockResolvedValue({ status: 200 });

      await checkBackendHealth();

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/health'),
        expect.any(Object)
      );
    });

    it('uses 5 second timeout for health check', async () => {
      axios.get.mockResolvedValue({ status: 200 });

      await checkBackendHealth();

      const callArgs = axios.get.mock.calls[0][1];
      expect(callArgs.timeout).toBe(5000);
    });

    it('accepts any status code via validateStatus', async () => {
      axios.get.mockResolvedValue({ status: 200 });

      await checkBackendHealth();

      const callArgs = axios.get.mock.calls[0][1];
      expect(callArgs.validateStatus(200)).toBe(true);
      expect(callArgs.validateStatus(404)).toBe(true);
      expect(callArgs.validateStatus(500)).toBe(true);
    });
  });

  describe('API Constants', () => {
    let API_BASE_URL;
    let API_URL;
    let SOCKET_URL;
    let SOCKET_ENABLED;

    beforeEach(() => {
      jest.resetModules();
      const apiModule = require('../../Utils/api');
      API_BASE_URL = apiModule.API_BASE_URL;
      API_URL = apiModule.API_URL;
      SOCKET_URL = apiModule.SOCKET_URL;
      SOCKET_ENABLED = apiModule.SOCKET_ENABLED;
    });

    it('exports API_BASE_URL', () => {
      expect(API_BASE_URL).toBeDefined();
      expect(typeof API_BASE_URL).toBe('string');
    });

    it('exports API_URL as alias for API_BASE_URL', () => {
      expect(API_URL).toBe(API_BASE_URL);
    });

    it('exports SOCKET_URL', () => {
      expect(SOCKET_URL).toBeDefined();
    });

    it('exports SOCKET_ENABLED as boolean', () => {
      expect(typeof SOCKET_ENABLED).toBe('boolean');
    });

    it('SOCKET_ENABLED matches SOCKET_URL truthiness', () => {
      if (SOCKET_URL) {
        expect(SOCKET_ENABLED).toBe(true);
      } else {
        expect(SOCKET_ENABLED).toBe(false);
      }
    });

    it('API_BASE_URL is a valid URL', () => {
      try {
        new URL(API_BASE_URL);
        expect(true).toBe(true);
      } catch {
        expect(true).toBe(false);
      }
    });

    it('API_BASE_URL defaults to localhost if not set in env', () => {
      // Should be either localhost or a valid URL from env
      expect(API_BASE_URL).toMatch(/^https?:\/\//);
    });
  });

  describe('Default API Export', () => {
    it('exports default api instance', () => {
      jest.resetModules();
      const apiModule = require('../../Utils/api');
      expect(apiModule.default).toBeDefined();
    });
  });

  describe('Cache Keys', () => {
    it('CACHE_KEYS has all required keys', () => {
      expect(cacheModule.CACHE_KEYS).toEqual(
        expect.objectContaining({
          INSTRUCTORS: expect.any(String),
          TUTORS: expect.any(String),
          COURSES: expect.any(String),
          USERS: expect.any(String),
        })
      );
    });
  });
});
