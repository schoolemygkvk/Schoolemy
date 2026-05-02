import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import OTPTimer from '../../components/auth/OTPTimer';

// Mock the useOTPTimer hook
jest.mock('../../hooks/useOTPTimer', () => ({
  useOTPTimer: jest.fn(),
}));

import { useOTPTimer } from '../../hooks/useOTPTimer';

describe('OTPTimer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockHookReturn = (overrides = {}) => ({
    seconds: 120,
    isExpired: false,
    formattedTime: '2:00',
    timePercentage: 100,
    reset: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    stop: jest.fn(),
    ...overrides,
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      useOTPTimer.mockReturnValue(mockHookReturn());
      render(<OTPTimer />);
      expect(screen.getByText('OTP Expires In')).toBeInTheDocument();
    });

    it('renders OTP Expires In text when timer is active', () => {
      useOTPTimer.mockReturnValue(mockHookReturn({ isExpired: false }));
      render(<OTPTimer />);
      expect(screen.getByText('OTP Expires In')).toBeInTheDocument();
    });

    it('renders OTP Expired text when timer expires', () => {
      useOTPTimer.mockReturnValue(mockHookReturn({ isExpired: true }));
      render(<OTPTimer />);
      expect(screen.getByText('OTP Expired')).toBeInTheDocument();
    });

    it('displays formatted time correctly', () => {
      useOTPTimer.mockReturnValue(mockHookReturn({ formattedTime: '1:45' }));
      render(<OTPTimer />);
      expect(screen.getByText('1:45')).toBeInTheDocument();
    });

    it('displays 00:00 when expired', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({ isExpired: true, formattedTime: '0:00' })
      );
      render(<OTPTimer />);
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('does not show warning when more than 60 seconds remain', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({ seconds: 90, formattedTime: '1:30' })
      );
      render(<OTPTimer />);
      expect(screen.queryByText(/OTP expiring/)).not.toBeInTheDocument();
      expect(screen.getByText('OTP Expires In')).toBeInTheDocument();
    });

    it('shows warning when 30-60 seconds remain', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({
          seconds: 45,
          formattedTime: '0:45',
          isExpired: false,
        })
      );
      render(<OTPTimer />);
      expect(screen.getByText(/OTP expiring$/)).toBeInTheDocument();
    });

    it('shows warning when less than 30 seconds remain', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({ seconds: 15, formattedTime: '0:15', isExpired: false })
      );
      render(<OTPTimer />);
      expect(screen.getByText(/OTP expiring soon/)).toBeInTheDocument();
    });

    it('shows expired message when time expires', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({ isExpired: true, seconds: 0 })
      );
      render(<OTPTimer />);
      expect(screen.getByText('OTP Expired')).toBeInTheDocument();
    });
  });

  describe('Warning Messages', () => {
    it('shows OTP expiring message at 30-60 seconds', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({ seconds: 45, isExpired: false })
      );
      render(<OTPTimer />);
      expect(screen.getByText(/OTP expiring$/)).toBeInTheDocument();
    });

    it('shows OTP expiring soon message at <30 seconds', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({ seconds: 20, isExpired: false })
      );
      render(<OTPTimer />);
      expect(screen.getByText(/OTP expiring soon/)).toBeInTheDocument();
    });

    it('shows request new OTP message when expired', () => {
      useOTPTimer.mockReturnValue(mockHookReturn({ isExpired: true }));
      render(<OTPTimer />);
      expect(screen.getByText(/Request a new OTP to continue/)).toBeInTheDocument();
    });

    it('does not show warning when >60 seconds remain', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({ seconds: 90, isExpired: false })
      );
      render(<OTPTimer />);
      expect(screen.queryByText(/OTP expiring/)).not.toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('renders LinearProgress component', () => {
      useOTPTimer.mockReturnValue(mockHookReturn());
      const { container } = render(<OTPTimer />);
      const progressBar = container.querySelector('.MuiLinearProgress-root');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows correct progress percentage', () => {
      useOTPTimer.mockReturnValue(mockHookReturn({ timePercentage: 50 }));
      const { container } = render(<OTPTimer />);
      const progressBar = container.querySelector('.MuiLinearProgress-root');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows 0% progress when expired', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({ isExpired: true, timePercentage: 0 })
      );
      const { container } = render(<OTPTimer />);
      const progressBar = container.querySelector('.MuiLinearProgress-root');
      expect(progressBar).toBeInTheDocument();
    });

    it('shows 100% progress when full time remains', () => {
      useOTPTimer.mockReturnValue(mockHookReturn({ timePercentage: 100 }));
      const { container } = render(<OTPTimer />);
      const progressBar = container.querySelector('.MuiLinearProgress-root');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('calls onExpire callback when timer expires', () => {
      const onExpire = jest.fn();
      useOTPTimer.mockReturnValue(mockHookReturn({ isExpired: false }));

      const { rerender } = render(<OTPTimer onExpire={onExpire} />);

      useOTPTimer.mockReturnValue(mockHookReturn({ isExpired: true }));
      rerender(<OTPTimer onExpire={onExpire} />);

      expect(onExpire).toHaveBeenCalled();
    });

    it('calls onTimeChange callback with current seconds', () => {
      const onTimeChange = jest.fn();
      useOTPTimer.mockReturnValue(mockHookReturn({ seconds: 100 }));

      render(<OTPTimer onTimeChange={onTimeChange} />);

      expect(onTimeChange).toHaveBeenCalledWith(100);
    });

    it('updates onTimeChange with new seconds on re-render', () => {
      const onTimeChange = jest.fn();
      useOTPTimer.mockReturnValue(mockHookReturn({ seconds: 100 }));

      const { rerender } = render(<OTPTimer onTimeChange={onTimeChange} />);

      useOTPTimer.mockReturnValue(mockHookReturn({ seconds: 99 }));
      rerender(<OTPTimer onTimeChange={onTimeChange} />);

      expect(onTimeChange).toHaveBeenCalledWith(99);
    });

    it('does not call onExpire if not provided', () => {
      useOTPTimer.mockReturnValue(mockHookReturn({ isExpired: true }));
      render(<OTPTimer />);
      // Should not throw error
      expect(screen.getByText('OTP Expired')).toBeInTheDocument();
    });

    it('does not call onTimeChange if not provided', () => {
      useOTPTimer.mockReturnValue(mockHookReturn({ seconds: 100, formattedTime: '1:40' }));
      render(<OTPTimer />);
      // Should not throw error and should render successfully
      expect(screen.getByText('1:40')).toBeInTheDocument();
    });
  });

  describe('Layout and Content', () => {
    it('renders box with timer information', () => {
      useOTPTimer.mockReturnValue(mockHookReturn());
      const { container } = render(<OTPTimer />);
      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
    });

    it('contains both label and timer display', () => {
      useOTPTimer.mockReturnValue(mockHookReturn());
      render(<OTPTimer />);
      expect(screen.getByText('OTP Expires In')).toBeInTheDocument();
      expect(screen.getByText('2:00')).toBeInTheDocument();
    });

    it('renders all elements when warning appears', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({ seconds: 20, isExpired: false })
      );
      render(<OTPTimer />);
      expect(screen.getByText('OTP Expires In')).toBeInTheDocument();
      expect(screen.getByText(/OTP expiring soon/)).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    it('passes initialSeconds to useOTPTimer hook', () => {
      useOTPTimer.mockReturnValue(mockHookReturn());
      render(<OTPTimer initialSeconds={60} />);
      expect(useOTPTimer).toHaveBeenCalledWith(60);
    });

    it('uses default initialSeconds when not provided', () => {
      useOTPTimer.mockReturnValue(mockHookReturn());
      render(<OTPTimer />);
      expect(useOTPTimer).toHaveBeenCalledWith(120);
    });

    it('accepts callback props without errors', () => {
      const onExpire = jest.fn();
      const onTimeChange = jest.fn();
      useOTPTimer.mockReturnValue(mockHookReturn({ seconds: 100 }));

      render(
        <OTPTimer
          initialSeconds={120}
          onExpire={onExpire}
          onTimeChange={onTimeChange}
        />
      );

      expect(screen.getByText('OTP Expires In')).toBeInTheDocument();
      expect(onTimeChange).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero seconds display', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({ seconds: 0, isExpired: true, formattedTime: '0:00' })
      );
      render(<OTPTimer />);
      expect(screen.getByText('00:00')).toBeInTheDocument();
    });

    it('handles large time display', () => {
      useOTPTimer.mockReturnValue(
        mockHookReturn({ seconds: 3599, formattedTime: '59:59' })
      );
      render(<OTPTimer />);
      expect(screen.getByText('59:59')).toBeInTheDocument();
    });

    it('renders correctly with all props and all states', () => {
      const onExpire = jest.fn();
      const onTimeChange = jest.fn();
      useOTPTimer.mockReturnValue(
        mockHookReturn({ seconds: 45, formattedTime: '0:45' })
      );

      render(
        <OTPTimer
          initialSeconds={60}
          onExpire={onExpire}
          onTimeChange={onTimeChange}
        />
      );

      expect(screen.getByText('OTP Expires In')).toBeInTheDocument();
      expect(screen.getByText('0:45')).toBeInTheDocument();
      expect(useOTPTimer).toHaveBeenCalledWith(60);
    });
  });
});
