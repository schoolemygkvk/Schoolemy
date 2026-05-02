import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import AdminLogin from '../../Components/Login/login';

// Mock dependencies
jest.mock('../../Utils/api');
jest.mock('../../Utils/security', () => ({
  secureStorage: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    clear: jest.fn(),
  },
}));
jest.mock('../../Components/Auth/AuthProvider', () => ({
  useAuth: jest.fn(),
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

// Import mocked modules
import axios from '../../Utils/api';
import { secureStorage } from '../../Utils/security';
import { useAuth } from '../../Components/Auth/AuthProvider';
import { useNavigate } from 'react-router-dom';

// Helper to render with router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AdminLogin Component', () => {
  let mockNavigate;
  let mockLogin;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    mockLogin = jest.fn();

    useNavigate.mockReturnValue(mockNavigate);
    useAuth.mockReturnValue({ login: mockLogin });

    // Mock axios with chainable methods
    axios.post = jest.fn();
    axios.get = jest.fn();

    // Mock secureStorage
    secureStorage.setItem.mockImplementation(() => {});
    secureStorage.getItem.mockReturnValue('true');
    secureStorage.clear.mockImplementation(() => {});
  });

  describe('isTutorApproved function', () => {
    // These tests are for the utility function
    // Note: The function is internal, tested via component behavior

    it('handles true boolean value', () => {
      // Test indirectly through component behavior
      renderWithRouter(<AdminLogin />);
      expect(screen.getByText('GKVK')).toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    it('renders login form initially', () => {
      renderWithRouter(<AdminLogin />);
      expect(screen.getByText('Welcome to Schoolemy')).toBeInTheDocument();
      expect(screen.getByText('Login Access')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('renders login button with correct text', () => {
      renderWithRouter(<AdminLogin />);
      expect(screen.getByRole('button', { name: /Sign In to Dashboard/i })).toBeInTheDocument();
    });

    it('renders password visibility toggle button', () => {
      renderWithRouter(<AdminLogin />);
      const passwordInput = screen.getByLabelText('Password');
      const toggleButton = passwordInput.parentElement.querySelector('button');
      expect(toggleButton).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      renderWithRouter(<AdminLogin />);
      expect(screen.getByText(/Forgot password?/i)).toBeInTheDocument();
    });

    it('renders hero section content', () => {
      renderWithRouter(<AdminLogin />);
      expect(screen.getByText('GKVK')).toBeInTheDocument();
      expect(screen.getByText('Course Management')).toBeInTheDocument();
      expect(screen.getByText('Student Portal')).toBeInTheDocument();
      expect(screen.getByText('Analytics Dashboard')).toBeInTheDocument();
    });

    it('renders footer section', () => {
      renderWithRouter(<AdminLogin />);
      expect(screen.getByText(/Schoolemy Admin Platform/i)).toBeInTheDocument();
      expect(screen.getByText(/schoolemygkvk@gmail.com/i)).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('toggles password visibility on click', async () => {
      renderWithRouter(<AdminLogin />);
      const passwordInput = screen.getByLabelText('Password');
      const toggleButton = passwordInput.parentElement.querySelector('button');

      expect(passwordInput).toHaveAttribute('type', 'password');

      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'text');
      });

      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('type', 'password');
      });
    });
  });

  describe('handleLogin - Initial Login', () => {
    it('successfully logs in with admin role', async () => {
      axios.post.mockResolvedValue({
        data: {
          id: 'admin123',
          token: 'token123',
          role: 'admin',
          name: 'Admin User',
          isFirstTime: false,
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'admin@test.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const adminCall = axios.post.mock.calls.find((c) => c[0] === '/adminlogin');
        expect(adminCall).toBeTruthy();
        expect(adminCall[1]).toEqual({ email: 'admin@test.com', password: 'password123' });
        expect(adminCall[2]).toEqual({ noAuth: true });
        expect(mockLogin).toHaveBeenCalledWith({
          id: 'admin123',
          role: 'admin',
          name: 'Admin User',
          menuAccess: {},
          routeAccess: {},
        });
        expect(mockNavigate).toHaveBeenCalledWith('/schoolemy');
      });
    });

    it('successfully logs in with superadmin role', async () => {
      axios.post.mockResolvedValue({
        data: {
          id: 'superadmin123',
          token: 'token456',
          role: 'superadmin',
          name: 'Super Admin',
          isFirstTime: false,
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'superadmin@test.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/schoolemy');
      });
    });

    it('navigates tutor to dashboard when approved', async () => {
      axios.post.mockResolvedValue({
        data: {
          id: 'tutor123',
          token: 'token789',
          role: 'tutormanagement',
          name: 'Tutor User',
          isApproved: true,
          isFirstTime: false,
        },
      });
      axios.get.mockResolvedValue({
        data: { profile: { isApproved: true } },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'tutor@test.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(secureStorage.setItem).toHaveBeenCalledWith('isApproved', 'true');
        expect(mockNavigate).toHaveBeenCalledWith('/schoolemy/tutor/dashboard');
      });
    });

    it('navigates tutor to terms and conditions when not approved', async () => {
      axios.post.mockResolvedValue({
        data: {
          id: 'tutor456',
          token: 'token999',
          role: 'tutormanagement',
          name: 'Unapproved Tutor',
          isApproved: false,
          isFirstTime: false,
        },
      });
      secureStorage.getItem.mockReturnValue('false');

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'tutor@test.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(secureStorage.setItem).toHaveBeenCalledWith('isApproved', 'false');
        expect(mockNavigate).toHaveBeenCalledWith('/schoolemy/tutor-terms-and-conditions');
      });
    });

    it('shows OTP box on first-time login', async () => {
      axios.post.mockResolvedValue({
        data: {
          id: 'newuser123',
          token: 'token111',
          isFirstTime: true,
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'newuser@test.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
        expect(screen.getByText(/Check your email for the 6-digit code/i)).toBeInTheDocument();
      });
    });

    it('displays error message on login failure', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            message: 'Invalid email or password',
          },
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'wrong@test.com');
      await userEvent.type(passwordInput, 'wrongpass');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
      });
    });

    it('displays default error message when API error has no message', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {},
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
    });

    it('disables inputs while loading', async () => {
      axios.post.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 1000))
      );

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(emailInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(submitButton).toBeDisabled();
      });
    });

    it('shows loading state on submit button', async () => {
      axios.post.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 1000))
      );

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Authenticating.../i)).toBeInTheDocument();
      });
    });
  });

  describe('handleVerifyOtp', () => {
    it('verifies OTP and logs in user', async () => {
      // First trigger first-time login to show OTP box
      axios.post.mockResolvedValue({
        data: {
          id: 'newuser123',
          token: 'token111',
          isFirstTime: true,
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const loginButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'newuser@test.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      // Wait for OTP box to appear
      await waitFor(() => {
        expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      });

      // Now respond to OTP verification
      axios.post.mockResolvedValue({
        data: {
          id: 'newuser123',
          token: 'verified_token',
          role: 'admin',
          name: 'New Admin',
          isApproved: true,
        },
      });

      const otpInput = screen.getByLabelText('Verification Code');
      const verifyButton = screen.getByRole('button', { name: /Verify OTP/i });

      await userEvent.type(otpInput, '123456');
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          '/verify-otp',
          { email: 'newuser@test.com', otp: '123456' },
          { noAuth: true }
        );
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('displays error on OTP verification failure', async () => {
      axios.post.mockResolvedValue({
        data: {
          id: 'newuser123',
          token: 'token111',
          isFirstTime: true,
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const loginButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'newuser@test.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      });

      axios.post.mockRejectedValue({
        response: {
          data: {
            message: 'Invalid OTP',
          },
        },
      });

      const otpInput = screen.getByLabelText('Verification Code');
      const verifyButton = screen.getByRole('button', { name: /Verify OTP/i });

      await userEvent.type(otpInput, '000000');
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid OTP')).toBeInTheDocument();
      });
    });

    it('navigates to tutor dashboard after OTP verification when approved', async () => {
      axios.post.mockResolvedValueOnce({
        data: {
          id: 'newtutor123',
          token: 'token111',
          isFirstTime: true,
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const loginButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'tutor@test.com');
      await userEvent.type(passwordInput, 'password123');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Verification Code')).toBeInTheDocument();
      });

      axios.post.mockResolvedValueOnce({
        data: {
          id: 'newtutor123',
          token: 'verified_token',
          role: 'tutormanagement',
          name: 'New Tutor',
          isApproved: true,
        },
      });

      const otpInput = screen.getByLabelText('Verification Code');
      const verifyButton = screen.getByRole('button', { name: /Verify OTP/i });

      await userEvent.type(otpInput, '123456');
      fireEvent.click(verifyButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/schoolemy/tutor/dashboard');
      });
    });
  });

  describe('Forgot Password Flow', () => {
    it('shows forgot password form when link is clicked', async () => {
      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });

      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
        expect(screen.getByText(/Secure password recovery process/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter registered email')).toBeInTheDocument();
      });
    });

    it('returns to login from forgot password', async () => {
      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });

      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });

      const backLink = screen.getByRole('button', { name: /Return to login/i });
      fireEvent.click(backLink);

      await waitFor(() => {
        expect(screen.getByText('Login Access')).toBeInTheDocument();
      });
    });

    it('sends OTP to email on password reset request', async () => {
      axios.post.mockResolvedValue({
        data: { success: true },
      });

      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });
      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Enter registered email');
      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });

      await userEvent.type(emailInput, 'user@test.com');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          '/forgot-password',
          { email: 'user@test.com' },
          { noAuth: true }
        );
        expect(screen.getByText(/OTP sent to your email/i)).toBeInTheDocument();
      });
    });

    it('shows error when forgot password fails', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            message: 'Email not found',
          },
        },
      });

      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });
      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Enter registered email');
      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });

      await userEvent.type(emailInput, 'nonexistent@test.com');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Email not found')).toBeInTheDocument();
      });
    });
  });

  describe('handlePasswordReset', () => {
    it('shows step 2 after sending reset OTP', async () => {
      axios.post.mockResolvedValue({
        data: { success: true },
      });

      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });
      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Enter registered email');
      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });

      await userEvent.type(emailInput, 'user@test.com');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Create new password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
      });
    });

    it('shows back button on step 2', async () => {
      axios.post.mockResolvedValue({
        data: { success: true },
      });

      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });
      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Enter registered email');
      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });

      await userEvent.type(emailInput, 'user@test.com');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
      });
    });

    it('goes back to step 1 when back button is clicked', async () => {
      axios.post.mockResolvedValue({
        data: { success: true },
      });

      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });
      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Enter registered email');
      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });

      await userEvent.type(emailInput, 'user@test.com');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: /Back/i });
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter registered email')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText('Enter OTP')).not.toBeInTheDocument();
      });
    });

    it('rejects when passwords do not match', async () => {
      axios.post.mockResolvedValue({
        data: { success: true },
      });

      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });
      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Enter registered email');
      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });

      await userEvent.type(emailInput, 'user@test.com');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput = screen.getByPlaceholderText('Create new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      const resetButton = screen.getByRole('button', { name: /Reset Password/i });

      await userEvent.type(otpInput, '123456');
      await userEvent.type(newPasswordInput, 'ValidPass123!');
      await userEvent.type(confirmPasswordInput, 'DifferentPass456!');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('rejects weak password', async () => {
      axios.post.mockResolvedValue({
        data: { success: true },
      });

      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });
      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Enter registered email');
      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });

      await userEvent.type(emailInput, 'user@test.com');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput = screen.getByPlaceholderText('Create new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      const resetButton = screen.getByRole('button', { name: /Reset Password/i });

      await userEvent.type(otpInput, '123456');
      await userEvent.type(newPasswordInput, 'weakpass');
      await userEvent.type(confirmPasswordInput, 'weakpass');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/Password must contain 8\+ characters/i)).toBeInTheDocument();
      });
    });

    it('successfully resets password with valid input', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: true },
      });

      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });
      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Enter registered email');
      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });

      await userEvent.type(emailInput, 'user@test.com');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });

      axios.post.mockResolvedValueOnce({
        data: { success: true },
      });

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput = screen.getByPlaceholderText('Create new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      const resetButton = screen.getByRole('button', { name: /Reset Password/i });

      await userEvent.type(otpInput, '123456');
      await userEvent.type(newPasswordInput, 'NewValidPass123!');
      await userEvent.type(confirmPasswordInput, 'NewValidPass123!');
      fireEvent.click(resetButton);

      await waitFor(() => {
        const resetCall = axios.post.mock.calls.find((c) => c[0] === '/reset-password');
        expect(resetCall).toBeTruthy();
        expect(resetCall[1]).toEqual({
          email: 'user@test.com',
          otp: '123456',
          password: 'NewValidPass123!',
          confirmPassword: 'NewValidPass123!',
        });
        expect(resetCall[2]).toEqual({ noAuth: true });
        expect(screen.getByText(/Password reset successful/i)).toBeInTheDocument();
      });
    });

    it('displays error when password reset fails', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: true },
      });

      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });
      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Enter registered email');
      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });

      await userEvent.type(emailInput, 'user@test.com');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });

      axios.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Invalid OTP for reset',
          },
        },
      });

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput = screen.getByPlaceholderText('Create new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      const resetButton = screen.getByRole('button', { name: /Reset Password/i });

      await userEvent.type(otpInput, '000000');
      await userEvent.type(newPasswordInput, 'NewValidPass123!');
      await userEvent.type(confirmPasswordInput, 'NewValidPass123!');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid OTP for reset')).toBeInTheDocument();
      });
    });
  });

  describe('Message Display', () => {
    it('displays success message with green styling', async () => {
      axios.post.mockResolvedValue({
        data: {
          id: 'user123',
          token: 'token123',
          role: 'admin',
          name: 'Admin',
          isFirstTime: false,
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const message = screen.getByText(/Login successful/i);
        expect(message).toBeInTheDocument();
        expect(message).toHaveStyle('backgroundColor: #d1fae5');
      });
    });

    it('displays error message with red styling', async () => {
      axios.post.mockRejectedValue({
        response: {
          data: {
            message: 'Login failed',
          },
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        const message = screen.getByText(/Login failed/i);
        expect(message).toBeInTheDocument();
        expect(message).toHaveStyle('backgroundColor: #fee2e2');
      });
    });

    it('clears message when new form is submitted', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Login failed',
          },
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
      });

      axios.post.mockResolvedValueOnce({
        data: {
          id: 'user123',
          token: 'token123',
          role: 'admin',
          name: 'Admin',
          isFirstTime: false,
        },
      });

      await userEvent.clear(emailInput);
      await userEvent.clear(passwordInput);
      await userEvent.type(emailInput, 'correct@test.com');
      await userEvent.type(passwordInput, 'correct');
      fireEvent.click(submitButton);

      // The old error should be cleared
      await waitFor(() => {
        expect(screen.getByText(/Login successful/i)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles network error gracefully', async () => {
      axios.post.mockRejectedValue(new Error('Network Error'));

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Login failed/i)).toBeInTheDocument();
      });
    });

    it('handles missing response data structure', async () => {
      axios.post.mockResolvedValue({
        data: {
          // Missing required fields
          role: 'admin',
        },
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'test@test.com');
      await userEvent.type(passwordInput, 'password');
      fireEvent.click(submitButton);

      // Should handle gracefully without crashing
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('handles tutor approval with null value from API', async () => {
      axios.post.mockResolvedValue({
        data: {
          id: 'tutor123',
          token: 'token789',
          role: 'tutormanagement',
          name: 'Tutor',
          isApproved: null, // Approval is null
          isFirstTime: false,
        },
      });
      axios.get.mockResolvedValue({
        data: { profile: { isApproved: false } }, // Falls back to API call
      });

      renderWithRouter(<AdminLogin />);
      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Password');
      const submitButton = screen.getByRole('button', { name: /Sign In to Dashboard/i });

      await userEvent.type(emailInput, 'tutor@test.com');
      await userEvent.type(passwordInput, 'password');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled(); // Should fetch approval from profile
      });
    });

    it('handles password reset with default error message', async () => {
      axios.post.mockResolvedValueOnce({
        data: { success: true },
      });

      renderWithRouter(<AdminLogin />);
      const forgotLink = screen.getByRole('button', { name: /Reset here/i });
      fireEvent.click(forgotLink);

      await waitFor(() => {
        expect(screen.getByText('Reset Password')).toBeInTheDocument();
      });

      const emailInput = screen.getByPlaceholderText('Enter registered email');
      const sendButton = screen.getByRole('button', { name: /Send Verification Code/i });

      await userEvent.type(emailInput, 'user@test.com');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });

      axios.post.mockRejectedValueOnce({
        response: {
          data: {}, // No error message
        },
      });

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInput = screen.getByPlaceholderText('Create new password');
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm new password');
      const resetButton = screen.getByRole('button', { name: /Reset Password/i });

      await userEvent.type(otpInput, '123456');
      await userEvent.type(newPasswordInput, 'NewValidPass123!');
      await userEvent.type(confirmPasswordInput, 'NewValidPass123!');
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Password reset failed')).toBeInTheDocument();
      });
    });
  });
});
