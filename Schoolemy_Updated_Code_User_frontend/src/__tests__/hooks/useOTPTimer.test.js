import { renderHook, act } from '@testing-library/react';
import { useOTPTimer } from '../../hooks/useOTPTimer';

describe('useOTPTimer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('initial state', () => {
    test('initializes with provided seconds', () => {
      const { result } = renderHook(() => useOTPTimer(300));

      expect(result.current.seconds).toBe(300);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.isActive).toBe(true);
    });

    test('initializes with default 300 seconds', () => {
      const { result } = renderHook(() => useOTPTimer());

      expect(result.current.seconds).toBe(300);
    });

    test('formats time correctly on init', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      expect(result.current.formattedTime).toBe('1:00');
    });

    test('calculates timePercentage correctly', () => {
      const { result } = renderHook(() => useOTPTimer(100));

      expect(result.current.timePercentage).toBe(100);
    });
  });

  describe('countdown timer', () => {
    test('counts down every second', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.seconds).toBe(59);
    });

    test('counts down multiple seconds', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.seconds).toBe(50);
    });

    test('marks as expired when reaching zero', () => {
      const { result } = renderHook(() => useOTPTimer(5));

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.seconds).toBe(0);
      expect(result.current.isExpired).toBe(true);
      expect(result.current.isActive).toBe(false);
    });

    test('stops counting after expiry', () => {
      const { result } = renderHook(() => useOTPTimer(5));

      act(() => {
        jest.advanceTimersByTime(6000);
      });

      expect(result.current.seconds).toBe(0);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.seconds).toBe(0); // Should stay at 0
    });
  });

  describe('formatting', () => {
    test('formats time as MM:SS', () => {
      const { result } = renderHook(() => useOTPTimer(125));

      expect(result.current.formattedTime).toBe('2:05');
    });

    test('pads seconds with leading zero', () => {
      const { result } = renderHook(() => useOTPTimer(65));

      expect(result.current.formattedTime).toBe('1:05');
    });

    test('updates formattedTime during countdown', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      expect(result.current.formattedTime).toBe('1:00');

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.formattedTime).toBe('0:59');
    });

    test('formats zero time correctly', () => {
      const { result } = renderHook(() => useOTPTimer(5));

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.formattedTime).toBe('0:00');
    });
  });

  describe('time percentage', () => {
    test('calculates initial percentage as 100%', () => {
      const { result } = renderHook(() => useOTPTimer(100));

      expect(result.current.timePercentage).toBe(100);
    });

    test('decreases percentage as time passes', () => {
      const { result } = renderHook(() => useOTPTimer(100));

      act(() => {
        jest.advanceTimersByTime(50000); // 50 seconds
      });

      expect(result.current.timePercentage).toBe(50);
    });

    test('reaches 0% at expiry', () => {
      const { result } = renderHook(() => useOTPTimer(100));

      act(() => {
        jest.advanceTimersByTime(100000);
      });

      expect(result.current.timePercentage).toBe(0);
    });

    test('never goes below 0%', () => {
      const { result } = renderHook(() => useOTPTimer(5));

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.timePercentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('reset', () => {
    test('resets timer to initial seconds', () => {
      const { result } = renderHook(() => useOTPTimer(300));

      act(() => {
        result.current.reset();
      });

      expect(result.current.seconds).toBe(300);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.isActive).toBe(true);
    });

    test('resets to provided seconds', () => {
      const { result } = renderHook(() => useOTPTimer(300));

      act(() => {
        result.current.reset(200);
      });

      expect(result.current.seconds).toBe(200);
    });

    test('provides reset functionality', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      expect(result.current.reset).toBeDefined();
    });

    test('clears expired state on reset', () => {
      const { result } = renderHook(() => useOTPTimer(300));

      act(() => {
        result.current.reset();
      });

      expect(result.current.isExpired).toBe(false);
    });
  });

  describe('pause', () => {
    test('pauses countdown', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      act(() => {
        result.current.pause();
      });

      expect(result.current.isActive).toBe(false);
    });

    test('prevents expiry when paused', () => {
      const { result } = renderHook(() => useOTPTimer(5));

      act(() => {
        result.current.pause();
      });

      expect(result.current.isExpired).toBe(false);
    });
  });

  describe('resume', () => {
    test('resumes countdown after pause', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      act(() => {
        result.current.pause();
        result.current.resume();
      });

      expect(result.current.isActive).toBe(true);
    });

    test('does not resume if expired', () => {
      const { result } = renderHook(() => useOTPTimer(5));

      // First stop the timer
      act(() => {
        result.current.stop();
      });

      expect(result.current.isExpired).toBe(true);

      // Then try to resume - should not work
      act(() => {
        result.current.resume();
      });

      expect(result.current.isExpired).toBe(true);
    });
  });

  describe('stop', () => {
    test('stops timer permanently', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      act(() => {
        result.current.stop();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isExpired).toBe(true);
    });

    test('timer remains stopped', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      act(() => {
        result.current.stop();
      });

      expect(result.current.isActive).toBe(false);
    });

    test('prevents resume after stop', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      // Stop the timer
      act(() => {
        result.current.stop();
      });

      const isExpiredAfterStop = result.current.isExpired;
      expect(isExpiredAfterStop).toBe(true);

      // Try to resume - should not work because timer is expired
      act(() => {
        result.current.resume();
      });

      // Should still be expired
      expect(result.current.isExpired).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    test('OTP resend workflow', () => {
      const { result } = renderHook(() => useOTPTimer(300));

      act(() => {
        jest.advanceTimersByTime(150000); // 150 seconds
      });

      expect(result.current.seconds).toBe(150);

      // User clicks resend
      act(() => {
        result.current.reset(300);
      });

      expect(result.current.seconds).toBe(300);
      expect(result.current.isExpired).toBe(false);
    });

    test('OTP verification during countdown', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      act(() => {
        jest.advanceTimersByTime(10000); // 10 seconds
      });

      expect(result.current.seconds).toBe(50);
      expect(result.current.isExpired).toBe(false);
      // User verifies OTP - continue normally
    });

    test('OTP timeout warning', () => {
      const { result } = renderHook(() => useOTPTimer(300));

      act(() => {
        jest.advanceTimersByTime(250000); // Almost expired
      });

      expect(result.current.seconds).toBe(50);
      expect(result.current.timePercentage).toBeCloseTo(16.67, 1);
    });
  });
});
