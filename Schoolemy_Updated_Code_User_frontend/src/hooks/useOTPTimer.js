import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for OTP countdown timer and expiry management
 * Handles OTP countdown, expiry detection, and provides formatted time display
 */
export const useOTPTimer = (initialSeconds = 300) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isExpired, setIsExpired] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Format seconds to MM:SS format
  const formatTime = useCallback((totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Start the countdown timer
  useEffect(() => {
    if (!isActive || isExpired) return;

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isExpired]);

  // Reset timer
  const reset = useCallback((newInitialSeconds = initialSeconds) => {
    setSeconds(newInitialSeconds);
    setIsExpired(false);
    setIsActive(true);
  }, [initialSeconds]);

  // Pause timer
  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  // Resume timer
  const resume = useCallback(() => {
    if (!isExpired) {
      setIsActive(true);
    }
  }, [isExpired]);

  // Stop timer (permanent)
  const stop = useCallback(() => {
    setIsActive(false);
    setIsExpired(true);
  }, []);

  return {
    seconds,
    isExpired,
    isActive,
    formattedTime: formatTime(seconds),
    reset,
    pause,
    resume,
    stop,
    timePercentage: Math.max(0, (seconds / initialSeconds) * 100),
  };
};

export default useOTPTimer;
