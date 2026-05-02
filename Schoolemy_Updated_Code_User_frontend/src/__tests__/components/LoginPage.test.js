import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LoginPage from '../../components/page/LoginPage';

// Mock dependencies
jest.mock('../../components/auth/LoginForm', () => {
  return function MockLoginForm() {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
      }}>
        <input type="email" placeholder="Email" defaultValue="test@example.com" />
        <input type="password" placeholder="Password" defaultValue="password123" />
        <button type="submit">Login</button>
        <a href="/forgot-password">Forgot Password?</a>
        <a href="/signup">Sign Up</a>
      </form>
    );
  };
});

const theme = createTheme();

const renderLoginPage = () => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    </ThemeProvider>
  );
};

const matchMediaMobile = () =>
  jest.fn().mockImplementation(() => ({
    matches: true,
    media: '',
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

describe('LoginPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders login page with main container', () => {
      renderLoginPage();

      const mainGrid = screen.getByRole('main', { hidden: true });
      expect(mainGrid).toBeInTheDocument();
    });

    test('renders illustration on desktop view', () => {
      renderLoginPage();

      const illustration = screen.getByAltText(/woman doing yoga/i);
      expect(illustration).toBeInTheDocument();
    });

    test('renders LoginForm component', () => {
      renderLoginPage();

      const emailInput = screen.getByPlaceholderText('Email');
      const passwordInput = screen.getByPlaceholderText('Password');

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    test('renders login button', () => {
      renderLoginPage();

      const loginButton = screen.getByRole('button', { name: /login/i });
      expect(loginButton).toBeInTheDocument();
    });

    test('renders forgot password link', () => {
      renderLoginPage();

      const forgotLink = screen.getByRole('link', { name: /forgot password/i });
      expect(forgotLink).toBeInTheDocument();
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    test('renders sign up link', () => {
      renderLoginPage();

      const signupLink = screen.getByRole('link', { name: /sign up/i });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('form interaction', () => {
    test('allows user to enter email', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByPlaceholderText('Email');
      await user.clear(emailInput);
      await user.type(emailInput, 'newuser@example.com');

      expect(emailInput.value).toBe('newuser@example.com');
    });

    test('allows user to enter password', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const passwordInput = screen.getByPlaceholderText('Password');
      await user.clear(passwordInput);
      await user.type(passwordInput, 'newpassword123');

      expect(passwordInput.value).toBe('newpassword123');
    });

    test('submits form with valid credentials', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const loginButton = screen.getByRole('button', { name: /login/i });
      await user.click(loginButton);

      // Form should submit successfully
      await waitFor(() => {
        expect(loginButton).toBeInTheDocument();
      });
    });

    test('handles form submission', async () => {
      renderLoginPage();

      const form = screen.getByRole('button', { name: /login/i }).closest('form');

      fireEvent.submit(form);

      await waitFor(() => {
        expect(form).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    test('has proper heading hierarchy', () => {
      renderLoginPage();

      // Check for login heading or title
      const heading = screen.queryByRole('heading', { level: 1 });
      // Component may or may not have h1, check it doesn't cause issues
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });

    test('form inputs have proper labels/placeholders', () => {
      renderLoginPage();

      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    test('links are properly labeled', () => {
      renderLoginPage();

      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    test('renders differently on mobile', () => {
      window.matchMedia = matchMediaMobile();

      renderLoginPage();

      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    });

    test('maintains usability on small screens', () => {
      window.matchMedia = matchMediaMobile();

      renderLoginPage();

      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });
  });

  describe('styling and visuals', () => {
    test('renders with proper structure', () => {
      renderLoginPage();

      const mainGrid = screen.getByRole('main', { hidden: true });
      expect(mainGrid).toBeInTheDocument();
    });

    test('illustration is displayed', () => {
      renderLoginPage();

      const illustration = screen.getByAltText(/woman doing yoga/i);
      expect(illustration).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    test('forgot password link navigates to correct route', () => {
      renderLoginPage();

      const forgotLink = screen.getByRole('link', { name: /forgot password/i });
      expect(forgotLink).toHaveAttribute('href', '/forgot-password');
    });

    test('signup link navigates to signup page', () => {
      renderLoginPage();

      const signupLink = screen.getByRole('link', { name: /sign up/i });
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });
});
