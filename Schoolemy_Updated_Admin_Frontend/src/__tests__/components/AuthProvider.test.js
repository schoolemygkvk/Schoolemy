import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from '../../Components/Auth/AuthProvider';
import * as security from '../../Utils/security';

jest.mock('../../Utils/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

// Mock security utilities
jest.mock('../../Utils/security', () => ({
  secureStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

describe('AuthProvider', () => {
  let mockSecureStorage;
  let sessionStore;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStorage = security.secureStorage;
    sessionStore = {};

    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    Object.defineProperty(window, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: jest.fn((k) => (Object.prototype.hasOwnProperty.call(sessionStore, k) ? sessionStore[k] : null)),
        setItem: jest.fn((k, v) => {
          sessionStore[k] = String(v);
        }),
        removeItem: jest.fn((k) => {
          delete sessionStore[k];
        }),
        clear: jest.fn(() => {
          sessionStore = {};
        }),
      },
      writable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('useAuth Hook', () => {
    it('returns auth context when used within AuthProvider', () => {
      const TestComponent = () => {
        const auth = useAuth();
        return (
          <div>
            <div data-testid="authenticated">
              {auth.isAuthenticated ? 'authenticated' : 'not-authenticated'}
            </div>
            <div data-testid="loading">
              {auth.isLoading ? 'loading' : 'loaded'}
            </div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('authenticated')).toBeInTheDocument();
    });

    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      const TestComponent = () => {
        useAuth();
        return null;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );

      consoleError.mockRestore();
    });
  });

  describe('AuthProvider - Initialization', () => {
    it('initializes with loading state', async () => {
      const TestComponent = () => {
        const { isLoading } = useAuth();
        return <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });
    });

    it('starts with unauthenticated state', () => {
      const TestComponent = () => {
        const { isAuthenticated } = useAuth();
        return (
          <div data-testid="auth-status">
            {isAuthenticated ? 'authenticated' : 'not-authenticated'}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-status')).toHaveTextContent(
        'not-authenticated'
      );
    });

    it('starts with null user', () => {
      const TestComponent = () => {
        const { user } = useAuth();
        return <div data-testid="user">{user ? 'has-user' : 'no-user'}</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    it('provides context methods', () => {
      const TestComponent = () => {
        const auth = useAuth();
        return (
          <div>
            <div data-testid="has-login">
              {typeof auth.login === 'function' ? 'yes' : 'no'}
            </div>
            <div data-testid="has-logout">
              {typeof auth.logout === 'function' ? 'yes' : 'no'}
            </div>
            <div data-testid="has-check">
              {typeof auth.checkAuthStatus === 'function' ? 'yes' : 'no'}
            </div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('has-login')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-logout')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-check')).toHaveTextContent('yes');
    });
  });

  describe('checkAuthStatus()', () => {
    it('authenticates user with valid token and required data', async () => {
      mockSecureStorage.getItem.mockImplementation((key) => {
        const data = {
          _id: 'user-123',
          role: 'admin',
          name: 'John Doe',
          isApproved: 'true',
        };
        return data[key] ?? null;
      });

      const TestComponent = () => {
        const { isAuthenticated, user } = useAuth();
        return (
          <div>
            <div data-testid="authenticated">
              {isAuthenticated ? 'yes' : 'no'}
            </div>
            <div data-testid="user-name">{user?.name || 'none'}</div>
            <div data-testid="user-role">{user?.role || 'none'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
        expect(screen.getByTestId('user-role')).toHaveTextContent('admin');
      });
    });

    it('does not authenticate when name is missing', async () => {
      mockSecureStorage.getItem.mockImplementation((key) => {
        const data = {
          _id: 'user-123',
          role: 'admin',
          name: null,
        };
        return data[key] ?? null;
      });

      const TestComponent = () => {
        const { isAuthenticated } = useAuth();
        return (
          <div data-testid="authenticated">
            {isAuthenticated ? 'yes' : 'no'}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });
    });

    it('does not authenticate with missing required fields', async () => {
      mockSecureStorage.getItem.mockImplementation((key) => {
        const data = {
          _id: null,
          role: 'admin',
          name: 'John Doe',
        };
        return data[key] ?? null;
      });

      const TestComponent = () => {
        const { isAuthenticated } = useAuth();
        return (
          <div data-testid="authenticated">
            {isAuthenticated ? 'yes' : 'no'}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });
    });

    it('does not clear storage when session is incomplete', async () => {
      mockSecureStorage.getItem.mockImplementation((key) => {
        if (key === '_id') return null;
        if (key === 'role') return 'admin';
        if (key === 'name') return 'John';
        return null;
      });

      const TestComponent = () => {
        const { isAuthenticated } = useAuth();
        return (
          <div data-testid="authenticated">
            {isAuthenticated ? 'yes' : 'no'}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });
      expect(mockSecureStorage.clear).not.toHaveBeenCalled();
    });

    it('handles errors during auth check gracefully', async () => {
      mockSecureStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const TestComponent = () => {
        const { isAuthenticated, isLoading } = useAuth();
        return (
          <div>
            <div data-testid="authenticated">
              {isAuthenticated ? 'yes' : 'no'}
            </div>
            <div data-testid="loading">
              {isLoading ? 'yes' : 'no'}
            </div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
        expect(screen.getByTestId('loading')).toHaveTextContent('no');
        expect(mockSecureStorage.clear).toHaveBeenCalled();
      });
    });

    it('sets loading to false after check completes', async () => {
      const TestComponent = () => {
        const { isLoading } = useAuth();
        return (
          <div data-testid="loading">
            {isLoading ? 'loading' : 'done'}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('done');
      });
    });
  });

  describe('login()', () => {
    it('authenticates user with valid data', async () => {
      const TestComponent = () => {
        const { login, isAuthenticated, user } = useAuth();

        return (
          <div>
            <button
              onClick={() =>
                login({
                  id: 'user-123',
                  token: 'valid-token',
                  role: 'admin',
                  name: 'Jane Doe',
                  isApproved: true,
                })
              }
              data-testid="login-btn"
            >
              Login
            </button>
            <div data-testid="authenticated">
              {isAuthenticated ? 'yes' : 'no'}
            </div>
            <div data-testid="user-name">{user?.name || 'none'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      act(() => {
        loginBtn.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
        expect(screen.getByTestId('user-name')).toHaveTextContent('Jane Doe');
      });
    });

    it('stores user data in secure storage', async () => {
      const TestComponent = () => {
        const { login } = useAuth();

        return (
          <button
            onClick={() =>
              login({
                id: 'user-123',
                token: 'valid-token',
                role: 'admin',
                name: 'Jane Doe',
              })
            }
            data-testid="login-btn"
          >
            Login
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      act(() => {
        loginBtn.click();
      });

      await waitFor(() => {
        expect(mockSecureStorage.removeItem).toHaveBeenCalledWith('token');
        expect(mockSecureStorage.setItem).toHaveBeenCalledWith('_id', 'user-123');
        expect(mockSecureStorage.setItem).toHaveBeenCalledWith('role', 'admin');
        expect(mockSecureStorage.setItem).toHaveBeenCalledWith('name', 'Jane Doe');
      });
    });

    it('persists menu and route access to sessionStorage on login', async () => {
      const TestComponent = () => {
        const { login } = useAuth();

        const handleLogin = () => {
          login({
            id: 'user-123',
            role: 'admin',
            name: 'Jane Doe',
            menuAccess: { m: 1 },
            routeAccess: { r: 2 },
          });
        };

        return (
          <button onClick={handleLogin} data-testid="login-btn">
            Login
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      act(() => {
        loginBtn.click();
      });

      await waitFor(() => {
        expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
          'menuAccess',
          JSON.stringify({ m: 1 })
        );
        expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
          'routeAccess',
          JSON.stringify({ r: 2 })
        );
      });
    });

    it('clears storage on login error', async () => {
      mockSecureStorage.setItem.mockImplementation(() => {
        throw new Error('Storage failure');
      });

      const TestComponent = () => {
        const { login } = useAuth();

        const handleLogin = () => {
          try {
            login({
              id: 'user-123',
              role: 'admin',
              name: 'Jane Doe',
            });
          } catch (err) {
            // ignore
          }
        };

        return (
          <button onClick={handleLogin} data-testid="login-btn">
            Login
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      act(() => {
        loginBtn.click();
      });

      await waitFor(() => {
        expect(mockSecureStorage.clear).toHaveBeenCalled();
      });
    });

    it('stores isApproved when provided', async () => {
      const TestComponent = () => {
        const { login } = useAuth();

        return (
          <button
            onClick={() =>
              login({
                id: 'user-123',
                token: 'valid-token',
                role: 'admin',
                name: 'Jane Doe',
                isApproved: false,
              })
            }
            data-testid="login-btn"
          >
            Login
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      act(() => {
        loginBtn.click();
      });

      await waitFor(() => {
        expect(mockSecureStorage.setItem).toHaveBeenCalledWith('isApproved', 'false');
      });
    });
  });

  describe('logout()', () => {
    it('clears authentication state', async () => {
      const TestComponent = () => {
        const { login, logout, isAuthenticated } = useAuth();

        return (
          <div>
            <button
              onClick={() =>
                login({
                  id: 'user-123',
                  token: 'valid-token',
                  role: 'admin',
                  name: 'Jane Doe',
                })
              }
              data-testid="login-btn"
            >
              Login
            </button>
            <button onClick={logout} data-testid="logout-btn">
              Logout
            </button>
            <div data-testid="authenticated">
              {isAuthenticated ? 'yes' : 'no'}
            </div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      act(() => {
        loginBtn.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('yes');
      });

      const logoutBtn = screen.getByTestId('logout-btn');
      act(() => {
        logoutBtn.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('no');
      });
    });

    it('clears secure storage', async () => {
      const TestComponent = () => {
        const { logout } = useAuth();

        return (
          <button onClick={logout} data-testid="logout-btn">
            Logout
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const logoutBtn = screen.getByTestId('logout-btn');
      act(() => {
        logoutBtn.click();
      });

      expect(mockSecureStorage.clear).toHaveBeenCalled();
    });

    it('clears session storage', async () => {
      const TestComponent = () => {
        const { logout } = useAuth();

        return (
          <button onClick={logout} data-testid="logout-btn">
            Logout
          </button>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const logoutBtn = screen.getByTestId('logout-btn');
      act(() => {
        logoutBtn.click();
      });

      expect(window.sessionStorage.clear).toHaveBeenCalled();
    });

    it('clears user data', async () => {
      const TestComponent = () => {
        const { login, logout, user } = useAuth();

        return (
          <div>
            <button
              onClick={() =>
                login({
                  id: 'user-123',
                  token: 'valid-token',
                  role: 'admin',
                  name: 'Jane Doe',
                })
              }
              data-testid="login-btn"
            >
              Login
            </button>
            <button onClick={logout} data-testid="logout-btn">
              Logout
            </button>
            <div data-testid="user">{user ? 'has-user' : 'no-user'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      const loginBtn = screen.getByTestId('login-btn');
      act(() => {
        loginBtn.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('has-user');
      });

      const logoutBtn = screen.getByTestId('logout-btn');
      act(() => {
        logoutBtn.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
    });
  });

  describe('AuthContext Provider', () => {
    it('wraps children with context', () => {
      const TestComponent = () => {
        return <div data-testid="child">Child content</div>;
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('provides all required context values', () => {
      const TestComponent = () => {
        const auth = useAuth();

        return (
          <div>
            {auth.isAuthenticated !== undefined && (
              <div data-testid="has-is-authenticated">yes</div>
            )}
            {auth.isLoading !== undefined && (
              <div data-testid="has-is-loading">yes</div>
            )}
            {auth.user !== undefined && <div data-testid="has-user">yes</div>}
            {typeof auth.login === 'function' && (
              <div data-testid="has-login">yes</div>
            )}
            {typeof auth.logout === 'function' && (
              <div data-testid="has-logout">yes</div>
            )}
            {typeof auth.checkAuthStatus === 'function' && (
              <div data-testid="has-check">yes</div>
            )}
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('has-is-authenticated')).toBeInTheDocument();
      expect(screen.getByTestId('has-is-loading')).toBeInTheDocument();
      expect(screen.getByTestId('has-user')).toBeInTheDocument();
      expect(screen.getByTestId('has-login')).toBeInTheDocument();
      expect(screen.getByTestId('has-logout')).toBeInTheDocument();
      expect(screen.getByTestId('has-check')).toBeInTheDocument();
    });
  });
});
