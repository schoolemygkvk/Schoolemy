import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ToastContainer } from 'react-toastify';
import SignupPage from '../../components/page/SignupPage';

// Mock components
jest.mock('../../components/auth/common/StepperComponent', () => {
  return function MockStepper({ activeStep }) {
    return <div data-testid="stepper">Step {activeStep + 1}</div>;
  };
});

jest.mock('../../components/auth/RegisterForm', () => {
  return function MockRegisterForm({ onRegisterSuccess }) {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        onRegisterSuccess({ email: 'user@example.com', mobile: '9876543210' });
      }}>
        <input type="email" placeholder="Email" />
        <input type="tel" placeholder="Mobile" />
        <button type="submit">Register</button>
      </form>
    );
  };
});

jest.mock('../../components/auth/VerifyOtpForm', () => {
  return function MockVerifyOtpForm({ onOtpVerified }) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onOtpVerified({ otp: '000000' });
        }}
      >
        <input type="text" placeholder="OTP" />
        <button type="submit">Verify OTP</button>
      </form>
    );
  };
});

jest.mock('../../components/auth/CreatePasswordForm', () => {
  return function MockPasswordForm({ onPasswordCreated }) {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        onPasswordCreated({ password: 'Password@123' });
      }}>
        <input type="password" placeholder="Password" />
        <button type="submit">Create Password</button>
      </form>
    );
  };
});

jest.mock('../../components/auth/ProfileForm', () => {
  return function MockProfileForm({ onProfileSaved }) {
    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        onProfileSaved({ name: 'Test User' });
      }}>
        <input type="text" placeholder="Name" />
        <button type="submit">Complete Profile</button>
      </form>
    );
  };
});

jest.mock('../../components/services/authService', () => ({
  __esModule: true,
  default: {
    register: jest.fn(() => Promise.resolve({ data: { message: 'OTP Sent' } })),
    verifyOtp: jest.fn(() => Promise.resolve({ data: { message: 'OTP Verified' } })),
    createPassword: jest.fn(() => Promise.resolve({ data: { message: 'Password Created' } })),
    saveProfileData: jest.fn(() => Promise.resolve({ data: { message: 'Profile Saved' } })),
    resendOtp: jest.fn(() =>
      Promise.resolve({ data: { success: true, message: 'OTP resent' } })
    ),
  },
}));

jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
    info: jest.fn(),
  },
  ToastContainer: () => <div data-testid="toast-container" />,
}));

const theme = createTheme();

const renderSignupPage = () => {
  return render(
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <SignupPage />
        <ToastContainer />
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('SignupPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const authService = require('../../components/services/authService').default;
    authService.register.mockImplementation(() =>
      Promise.resolve({ data: { message: 'OTP Sent' } })
    );
    authService.verifyOtp.mockImplementation(() =>
      Promise.resolve({ data: { message: 'OTP Verified' } })
    );
    authService.createPassword.mockImplementation(() =>
      Promise.resolve({ data: { message: 'Password Created' } })
    );
    authService.saveProfileData.mockImplementation(() =>
      Promise.resolve({ data: { message: 'Profile Saved' } })
    );
    authService.resendOtp.mockImplementation(() =>
      Promise.resolve({ data: { success: true, message: 'OTP resent' } })
    );
  });

  describe('rendering', () => {
    test('renders signup page with stepper', () => {
      renderSignupPage();

      const stepper = screen.getByTestId('stepper');
      expect(stepper).toBeInTheDocument();
    });

    test('renders step 1 (account setup) by default', () => {
      renderSignupPage();

      const stepper = screen.getByTestId('stepper');
      expect(stepper).toHaveTextContent('Step 1');
    });

    test('renders register form on step 1', () => {
      renderSignupPage();

      const emailInput = screen.getByPlaceholderText('Email');
      const mobileInput = screen.getByPlaceholderText('Mobile');

      expect(emailInput).toBeInTheDocument();
      expect(mobileInput).toBeInTheDocument();
    });

    test('renders register button on step 1', () => {
      renderSignupPage();

      const registerBtn = screen.getByRole('button', { name: /register/i });
      expect(registerBtn).toBeInTheDocument();
    });
  });

  describe('step progression', () => {
    test('progresses to step 2 after registration', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const registerBtn = screen.getByRole('button', { name: /register/i });
      await user.click(registerBtn);

      await waitFor(() => {
        const stepper = screen.getByTestId('stepper');
        expect(stepper).toHaveTextContent('Step 2');
      });
    });

    test('shows OTP verification form on step 2', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const registerBtn = screen.getByRole('button', { name: /register/i });
      await user.click(registerBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('OTP')).toBeInTheDocument();
      });
    });

    test('progresses to step 3 after OTP verification', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      // Step 1: Register
      let registerBtn = screen.getByRole('button', { name: /register/i });
      await user.click(registerBtn);

      // Step 2: Verify OTP
      await waitFor(() => {
        const verifyBtn = screen.getByRole('button', { name: /verify otp/i });
        expect(verifyBtn).toBeInTheDocument();
      });

      const verifyBtn = screen.getByRole('button', { name: /verify otp/i });
      await user.click(verifyBtn);

      await waitFor(() => {
        const stepper = screen.getByTestId('stepper');
        expect(stepper).toHaveTextContent('Step 3');
      });
    });

    test('shows password form on step 3', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      // Progress through steps
      const registerBtn = screen.getByRole('button', { name: /register/i });
      await user.click(registerBtn);

      await waitFor(() => {
        const verifyBtn = screen.getByRole('button', { name: /verify otp/i });
        return verifyBtn;
      });

      const verifyBtn = screen.getByRole('button', { name: /verify otp/i });
      await user.click(verifyBtn);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      });
    });

    test('progresses to step 4 after password creation', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      // Register
      await user.click(screen.getByRole('button', { name: /register/i }));

      // Verify OTP
      await waitFor(() => {
        expect(screen.getByPlaceholderText('OTP')).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /verify otp/i }));

      // Create Password
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /create password/i }));

      // Stepper is hidden on the final profile step (activeStep === 3)
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      });
    });
  });

  describe('form submissions', () => {
    test('handles registration submission', async () => {
      const user = userEvent.setup();
      const authService = require('../../components/services/authService').default;

      renderSignupPage();

      const registerBtn = screen.getByRole('button', { name: /register/i });
      await user.click(registerBtn);

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalled();
      });
    });

    test('handles OTP verification submission', async () => {
      const user = userEvent.setup();
      const authService = require('../../components/services/authService').default;

      renderSignupPage();

      // Register first
      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('OTP')).toBeInTheDocument();
      });

      // Verify OTP
      await user.click(screen.getByRole('button', { name: /verify otp/i }));

      await waitFor(() => {
        expect(authService.verifyOtp).toHaveBeenCalled();
      });
    });

    test('handles password creation submission', async () => {
      const user = userEvent.setup();
      const authService = require('../../components/services/authService').default;

      renderSignupPage();

      // Register
      await user.click(screen.getByRole('button', { name: /register/i }));
      await waitFor(() => screen.getByPlaceholderText('OTP'));

      // Verify OTP
      await user.click(screen.getByRole('button', { name: /verify otp/i }));
      await waitFor(() => screen.getByPlaceholderText('Password'));

      // Create password
      await user.click(screen.getByRole('button', { name: /create password/i }));

      await waitFor(() => {
        expect(authService.createPassword).toHaveBeenCalled();
      });
    });

    test('handles profile completion submission', async () => {
      const user = userEvent.setup();
      const authService = require('../../components/services/authService').default;

      renderSignupPage();

      // Progress through all steps
      await user.click(screen.getByRole('button', { name: /register/i }));
      await waitFor(() => screen.getByPlaceholderText('OTP'));

      await user.click(screen.getByRole('button', { name: /verify otp/i }));
      await waitFor(() => screen.getByPlaceholderText('Password'));

      await user.click(screen.getByRole('button', { name: /create password/i }));
      await waitFor(() => screen.getByPlaceholderText('Name'));

      // Complete profile
      await user.click(screen.getByRole('button', { name: /complete profile/i }));

      await waitFor(() => {
        expect(authService.saveProfileData).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    test('shows error toast on registration failure', async () => {
      const user = userEvent.setup();
      const authService = require('../../components/services/authService').default;
      const toast = require('react-toastify').toast;

      authService.register.mockRejectedValueOnce({
        response: { data: { message: 'Email already exists' } },
      });

      renderSignupPage();

      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Email already exists'),
          expect.any(Object)
        );
      });
    });

    test('handles duplicate email error', async () => {
      const user = userEvent.setup();
      const authService = require('../../components/services/authService').default;
      const toast = require('react-toastify').toast;

      authService.register.mockRejectedValueOnce({
        response: { status: 409, data: { message: 'Account already exists' } },
      });

      renderSignupPage();

      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('user identifier tracking', () => {
    test('stores user identifier from registration', async () => {
      const user = userEvent.setup();
      const authService = require('../../components/services/authService').default;

      renderSignupPage();

      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'user@example.com',
            mobile: '9876543210',
          })
        );
      });
    });

    test('uses stored identifier for OTP verification', async () => {
      const user = userEvent.setup();
      const authService = require('../../components/services/authService').default;

      renderSignupPage();

      // Register
      await user.click(screen.getByRole('button', { name: /register/i }));
      await waitFor(() => screen.getByPlaceholderText('OTP'));

      // Verify OTP
      await user.click(screen.getByRole('button', { name: /verify otp/i }));

      await waitFor(() => {
        expect(authService.verifyOtp).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'user@example.com',
            mobile: '9876543210',
            otp: '000000',
          })
        );
      });
    });
  });

  describe('success messages', () => {
    test('shows success toast after registration', async () => {
      const user = userEvent.setup();
      const toast = require('react-toastify').toast;

      renderSignupPage();

      await user.click(screen.getByRole('button', { name: /register/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          'OTP Sent',
          expect.any(Object)
        );
      });
    });

    test('shows success message after OTP verification', async () => {
      const user = userEvent.setup();
      const toast = require('react-toastify').toast;

      renderSignupPage();

      await user.click(screen.getByRole('button', { name: /register/i }));
      await waitFor(() => screen.getByPlaceholderText('OTP'));

      await user.click(screen.getByRole('button', { name: /verify otp/i }));

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });
  });
});
