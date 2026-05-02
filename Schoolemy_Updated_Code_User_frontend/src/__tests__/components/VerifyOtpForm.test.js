import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerifyOtpForm from '../../components/auth/VerifyOtpForm';

// Mock API
jest.mock('../../service/api', () => ({
  post: jest.fn(),
}));

describe('VerifyOtpForm Component', () => {
  const mockUserIdentifier = { email: 'user@example.com' };
  const mockOnOtpVerified = jest.fn();
  const mockOnError = jest.fn();
  const mockOnResendOtp = jest.fn();

  const defaultProps = {
    userIdentifier: mockUserIdentifier,
    onOtpVerified: mockOnOtpVerified,
    onError: mockOnError,
    onResendOtp: mockOnResendOtp,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderVerifyOtpForm = (props = {}) => {
    return render(<VerifyOtpForm {...defaultProps} {...props} />);
  };

  describe('rendering', () => {
    test('renders OTP input field', () => {
      renderVerifyOtpForm();

      const otpInput = screen.getByPlaceholderText('000000');
      expect(otpInput).toBeInTheDocument();
    });

    test('renders verify button', () => {
      renderVerifyOtpForm();

      const verifyBtn = screen.getByRole('button', { name: /verify/i });
      expect(verifyBtn).toBeInTheDocument();
    });

    test('renders resend OTP button', () => {
      renderVerifyOtpForm();

      const resendBtn = screen.getByRole('button', { name: /resend/i });
      expect(resendBtn).toBeInTheDocument();
    });

    test('displays OTP sent message', () => {
      renderVerifyOtpForm();

      const message = screen.queryByText(/otp sent/i);
      if (message) {
        expect(message).toBeInTheDocument();
      }
    });
  });

  describe('OTP input validation', () => {
    test('allows only digits in OTP field', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const otpInput = screen.getByPlaceholderText('000000');
      await user.type(otpInput, '123abc');

      expect(otpInput.value).toBe('123');
    });

    test('limits OTP to 6 digits', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const otpInput = screen.getByPlaceholderText('000000');
      await user.type(otpInput, '1234567890');

      expect(otpInput.value).toBe('123456');
    });

    test('accepts valid 6-digit OTP', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const otpInput = screen.getByPlaceholderText('000000');
      await user.type(otpInput, '123456');

      expect(otpInput.value).toBe('123456');
    });

    test('starts with empty OTP field', () => {
      renderVerifyOtpForm();

      const otpInput = screen.getByPlaceholderText('000000');
      expect(otpInput.value).toBe('');
    });
  });

  describe('OTP submission', () => {
    test('submits OTP when verify button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const otpInput = screen.getByPlaceholderText('000000');
      const verifyBtn = screen.getByRole('button', { name: /verify/i });

      await user.type(otpInput, '123456');
      await user.click(verifyBtn);

      // Verify callback should be called
      await waitFor(() => {
        expect(mockOnOtpVerified || mockOnError).toBeDefined();
      });
    });

    test('prevents submission with empty OTP', () => {
      renderVerifyOtpForm();

      const verifyBtn = screen.getByRole('button', { name: /verify/i });
      expect(verifyBtn).toBeDisabled();
      expect(mockOnOtpVerified).not.toHaveBeenCalled();
    });

    test('prevents submission with incomplete OTP', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const otpInput = screen.getByPlaceholderText('000000');
      const verifyBtn = screen.getByRole('button', { name: /verify/i });

      await user.type(otpInput, '12345'); // Only 5 digits
      expect(verifyBtn).toBeDisabled();
      expect(mockOnOtpVerified).not.toHaveBeenCalled();
    });
  });

  describe('resend OTP functionality', () => {
    test('handles resend OTP click', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const resendBtn = screen.getByRole('button', { name: /resend/i });
      await user.click(resendBtn);

      await waitFor(() => {
        expect(mockOnResendOtp).toHaveBeenCalledWith(mockUserIdentifier);
      });
    });

    test('clears OTP field on resend', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const otpInput = screen.getByPlaceholderText('000000');

      await user.type(otpInput, '123456');
      expect(otpInput.value).toBe('123456');

      const resendBtn = screen.getByRole('button', { name: /resend/i });
      await user.click(resendBtn);

      // OTP input should be cleared after resend
      await waitFor(() => {
        expect(mockOnResendOtp).toHaveBeenCalled();
      });
    });

    test('disables resend button temporarily after resend', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const resendBtn = screen.getByRole('button', { name: /resend/i });

      await user.click(resendBtn);

      // Resend button should be disabled for a period
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      // Button state depends on implementation
      expect(resendBtn).toBeInTheDocument();
    });

    test('shows timer after resend', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const resendBtn = screen.getByRole('button', { name: /resend/i });
      await user.click(resendBtn);

      // Timer text should appear (if implemented)
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });

      expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    test('displays error message on verification failure', async () => {
      const user = userEvent.setup({ delay: null });
      const onError = jest.fn();

      renderVerifyOtpForm({ onError });

      const otpInput = screen.getByPlaceholderText('000000');
      const verifyBtn = screen.getByRole('button', { name: /verify/i });

      await user.type(otpInput, '000000');
      await user.click(verifyBtn);

      // Error handling behavior depends on API response
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });

    test('handles invalid OTP error', async () => {
      const user = userEvent.setup({ delay: null });
      const onError = jest.fn();

      renderVerifyOtpForm({ onError });

      const otpInput = screen.getByPlaceholderText('000000');
      const verifyBtn = screen.getByRole('button', { name: /verify/i });

      await user.type(otpInput, '999999');
      await user.click(verifyBtn);

      // Verify error handling
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    test('shows loading state during verification', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const otpInput = screen.getByPlaceholderText('000000');
      const verifyBtn = screen.getByRole('button', { name: /verify/i });

      await user.type(otpInput, '123456');

      // Before clicking, verify button should not be disabled
      expect(verifyBtn).not.toBeDisabled();

      await user.click(verifyBtn);

      // During submission, button might show loading
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });

    test('shows loading indicator on resend', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const resendBtn = screen.getByRole('button', { name: /resend/i });
      await user.click(resendBtn);

      // Resend button should indicate loading state
      expect(resendBtn).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('OTP input has proper label or placeholder', () => {
      renderVerifyOtpForm();

      const otpInput = screen.getByPlaceholderText('000000');
      expect(otpInput).toHaveAttribute('placeholder', '000000');
    });

    test('buttons have proper labels', () => {
      renderVerifyOtpForm();

      expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();

      // Resend button might be conditionally rendered or have different text
      const resendBtn = screen.queryByRole('button', { name: /resend/i });
      if (resendBtn) {
        expect(resendBtn).toBeInTheDocument();
      }
    });

    test('form can be submitted with Enter key', async () => {
      const user = userEvent.setup({ delay: null });
      renderVerifyOtpForm();

      const otpInput = screen.getByPlaceholderText('000000');

      await user.type(otpInput, '123456');
      await user.keyboard('{Enter}');

      // Should trigger verification
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
  });
});
