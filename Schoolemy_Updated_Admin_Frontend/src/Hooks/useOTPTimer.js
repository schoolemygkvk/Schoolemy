import { useState, useEffect } from 'react';


export const useOTPTimer = (initialSeconds = 120) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isExpired, setIsExpired] = useState(initialSeconds === 0);
  const [isActive, setIsActive] = useState(initialSeconds !== 0);

  // Format time as MM:SS
  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formattedTime = formatTime(seconds);

  // Calculate percentage
  const timePercentage = Math.max(0, Math.min(100, (seconds / initialSeconds) * 100));

  // Countdown effect
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setSeconds((prevSeconds) => {
        const newSeconds = Math.max(0, prevSeconds - 1);

        if (newSeconds === 0) {
          setIsActive(false);
          setIsExpired(true);
        }

        return newSeconds;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Control functions
  const reset = (newSeconds = initialSeconds) => {
    setSeconds(newSeconds);
    setIsExpired(newSeconds === 0);
    setIsActive(newSeconds !== 0);
  };

  const pause = () => {
    setIsActive(false);
  };

  const resume = () => {
    if (!isExpired) {
      setIsActive(true);
    }
  };

  const stop = () => {
    setIsActive(false);
    setIsExpired(true);
  };

  return {
    seconds,
    isExpired,
    isActive,
    formattedTime,
    timePercentage,
    reset,
    pause,
    resume,
    stop,
  };
};
