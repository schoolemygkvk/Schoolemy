import { renderHook, act, waitFor } from '@testing-library/react';
import { useOTPTimer } from '../../hooks/useOTPTimer';

describe('useOTPTimer Hook', () => {
  // Mock timers for deterministic testing
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('initializes with default seconds (120)', () => {
      const { result } = renderHook(() => useOTPTimer());

      expect(result.current.seconds).toBe(120);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.isActive).toBe(true);
    });

    it('initializes with custom initial seconds', () => {
      const { result } = renderHook(() => useOTPTimer(60));

      expect(result.current.seconds).toBe(60);
      expect(result.current.isExpired).toBe(false);
    });

    it('initializes with correct formatted time', () => {
      const { result } = renderHook(() => useOTPTimer(125));

      expect(result.current.formattedTime).toBe('2:05');
    });

    it('initializes with correct time percentage', () => {
      const { result } = renderHook(() => useOTPTimer(120));

      expect(result.current.timePercentage).toBe(100);
    });
  });

  describe('Countdown Timer', () => {
    it('decrements seconds every 1 second', () => {
      const { result } = renderHook(() => useOTPTimer(10));

      expect(result.current.seconds).toBe(10);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.seconds).toBe(9);
    });

    it('continues countdown for multiple seconds', () => {
      const { result } = renderHook(() => useOTPTimer(5));

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(result.current.seconds).toBe(2);
    });

    it('stops countdown when timer expires', () => {
      const { result } = renderHook(() => useOTPTimer(2));

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(result.current.isExpired).toBe(true);
      expect(result.current.seconds).toBe(0);
      expect(result.current.isActive).toBe(false);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should stay at 0 and not go negative
      expect(result.current.seconds).toBe(0);
    });

    it('marks as expired when seconds reach 0', () => {
      const { result } = renderHook(() => useOTPTimer(1));

      expect(result.current.isExpired).toBe(false);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.isExpired).toBe(true);
    });
  });

  describe('Time Formatting', () => {
    it('formats time correctly for MM:SS format', () => {
      const { result } = renderHook(() => useOTPTimer(65));

      expect(result.current.formattedTime).toBe('1:05');
    });

    it('pads single-digit seconds with leading zero', () => {
      const { result } = renderHook(() => useOTPTimer(65));

      // 65 seconds = 1:05
      expect(result.current.formattedTime).toMatch(/\d:\d{2}/);
    });

    it('formats zero seconds correctly', () => {
      const { result } = renderHook(() => useOTPTimer(1));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.formattedTime).toBe('0:00');
    });

    it('updates formatted time as seconds decrease', () => {
      const { result } = renderHook(() => useOTPTimer(125));

      expect(result.current.formattedTime).toBe('2:05');

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.formattedTime).toBe('2:00');
    });
  });

  describe('Time Percentage', () => {
    it('returns 100% when timer is full', () => {
      const { result } = renderHook(() => useOTPTimer(120));

      expect(result.current.timePercentage).toBe(100);
    });

    it('decreases percentage as time passes', () => {
      const { result } = renderHook(() => useOTPTimer(100));

      expect(result.current.timePercentage).toBe(100);

      act(() => {
        jest.advanceTimersByTime(25000); // 25 seconds passed
      });

      expect(result.current.timePercentage).toBe(75);
    });

    it('returns 0% when expired', () => {
      const { result } = renderHook(() => useOTPTimer(1));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.timePercentage).toBe(0);
    });

    it('never goes below 0%', () => {
      const { result } = renderHook(() => useOTPTimer(1));

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.timePercentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Reset Function', () => {
    it('resets timer to initial seconds', () => {
      const { result } = renderHook(() => useOTPTimer(120));

      act(() => {
        jest.advanceTimersByTime(30000);
      });

      expect(result.current.seconds).toBe(90);

      act(() => {
        result.current.reset();
      });

      expect(result.current.seconds).toBe(120);
      expect(result.current.isExpired).toBe(false);
      expect(result.current.isActive).toBe(true);
    });

    it('resets timer to custom new initial seconds', () => {
      const { result } = renderHook(() => useOTPTimer(120));

      act(() => {
        result.current.reset(60);
      });

      expect(result.current.seconds).toBe(60);
      expect(result.current.isExpired).toBe(false);
    });

    it('resumes counting after reset', () => {
      const { result } = renderHook(() => useOTPTimer(10));

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.seconds).toBe(5);

      act(() => {
        result.current.reset(10);
      });

      expect(result.current.seconds).toBe(10);

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.seconds).toBe(9);
    });

    it('resets expired timer', () => {
      const { result } = renderHook(() => useOTPTimer(1));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.isExpired).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isExpired).toBe(false);
    });
  });

  describe('Pause Function', () => {
    it('pauses the timer', () => {
      const { result } = renderHook(() => useOTPTimer(120));

      act(() => {
        result.current.pause();
      });

      expect(result.current.isActive).toBe(false);

      const secondsBefore = result.current.seconds;

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.seconds).toBe(secondsBefore);
    });

    it('maintains expired state when paused', () => {
      const { result } = renderHook(() => useOTPTimer(1));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.isExpired).toBe(true);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isExpired).toBe(true);
    });
  });

  describe('Resume Function', () => {
    it('resumes a paused timer', () => {
      const { result } = renderHook(() => useOTPTimer(120));

      act(() => {
        result.current.pause();
      });

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.resume();
      });

      expect(result.current.isActive).toBe(true);
    });

    it('does not resume after expiry', () => {
      const { result } = renderHook(() => useOTPTimer(1));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.isExpired).toBe(true);

      act(() => {
        result.current.resume();
      });

      // Should still be expired and not active
      expect(result.current.isExpired).toBe(true);
      expect(result.current.isActive).toBe(false);
    });

    it('resumes countdown after pause', () => {
      const { result } = renderHook(() => useOTPTimer(120));

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.seconds).toBe(110);

      act(() => {
        result.current.pause();
      });

      const secondsAfterPause = result.current.seconds;

      act(() => {
        result.current.resume();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.seconds).toBe(secondsAfterPause - 1);
    });
  });

  describe('Stop Function', () => {
    it('stops the timer permanently', () => {
      const { result } = renderHook(() => useOTPTimer(120));

      act(() => {
        result.current.stop();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isExpired).toBe(true);
    });

    it('prevents further countdown after stop', () => {
      const { result } = renderHook(() => useOTPTimer(120));

      act(() => {
        result.current.stop();
      });

      const seconds = result.current.seconds;

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.seconds).toBe(seconds);
    });

    it('cannot be resumed after stop', () => {
      const { result } = renderHook(() => useOTPTimer(120));

      act(() => {
        result.current.stop();
      });

      act(() => {
        result.current.resume();
      });

      expect(result.current.isExpired).toBe(true);
      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles very short countdown (1 second)', () => {
      const { result } = renderHook(() => useOTPTimer(1));

      expect(result.current.seconds).toBe(1);
      expect(result.current.formattedTime).toBe('0:01');

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.seconds).toBe(0);
      expect(result.current.isExpired).toBe(true);
    });

    it('handles large countdown (3600 seconds)', () => {
      const { result } = renderHook(() => useOTPTimer(3600));

      expect(result.current.seconds).toBe(3600);
      expect(result.current.timePercentage).toBe(100);
    });

    it('handles zero initial seconds', () => {
      const { result } = renderHook(() => useOTPTimer(0));

      expect(result.current.seconds).toBe(0);
      expect(result.current.isExpired).toBe(true);
    });

    it('cleanup removes interval on unmount', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = renderHook(() => useOTPTimer(120));

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });

  describe('Multiple State Changes', () => {
    it('handles pause, resume, and reset sequence', () => {
      const { result } = renderHook(() => useOTPTimer(120));

      act(() => {
        jest.advanceTimersByTime(10000);
      });

      expect(result.current.seconds).toBe(110);

      act(() => {
        result.current.pause();
      });

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(result.current.seconds).toBe(110);

      act(() => {
        result.current.resume();
      });

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(result.current.seconds).toBe(109);

      act(() => {
        result.current.reset(60);
      });

      expect(result.current.seconds).toBe(60);
    });
  });
});
