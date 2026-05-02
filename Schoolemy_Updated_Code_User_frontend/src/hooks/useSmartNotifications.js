import { useState, useEffect, useRef, useCallback } from 'react';
import { getUnreadCount, getUserNotifications } from '../service/notificationApi';

/**
 * useSmartNotifications Hook
 *
 * Implements intelligent notification polling with:
 * - Visibility API integration (pauses when tab not focused)
 * - Reduced polling interval (30s → 5 minutes)
 * - Connection status tracking
 * - Exponential backoff on failures
 * - Graceful cleanup on unmount
 *
 * Usage:
 * const { unreadCount, notifications, isLoading, isPolling, connectionStatus } = useSmartNotifications(userId);
 */

const INITIAL_POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes (300,000 ms)
const FALLBACK_POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes fallback
const MAX_BACKOFF_INTERVAL = 30 * 60 * 1000; // 30 minutes max
const MAX_RETRY_ATTEMPTS = 3;

export const useSmartNotifications = (userId) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected'); // connected, paused, error, offline
  const [lastFetchTime, setLastFetchTime] = useState(null);

  const intervalRef = useRef(null);
  const retryCountRef = useRef(0);
  const backoffIntervalRef = useRef(INITIAL_POLL_INTERVAL);
  const isVisibleRef = useRef(!document.hidden);

  // Handle visibility change (pause polling when tab not focused)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      isVisibleRef.current = isVisible;

      if (isVisible) {
        setConnectionStatus('connected');
        // Immediately fetch when tab becomes visible
        if (userId) {
          fetchUnreadCount();
        }
        // Restart polling
        startPolling();
      } else {
        setConnectionStatus('paused');
        // Clear interval when tab is hidden
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('connected');
      if (userId) {
        fetchUnreadCount();
      }
      startPolling();
    };

    const handleOffline = () => {
      setConnectionStatus('offline');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId]);

  // Fetch unread count with error handling
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const result = await getUnreadCount(userId);

      if (result.success) {
        setUnreadCount(result.unread_count);
        retryCountRef.current = 0; // Reset retry count on success
        backoffIntervalRef.current = INITIAL_POLL_INTERVAL; // Reset backoff
        setConnectionStatus('connected');
        setLastFetchTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      handleFetchError();
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch recent notifications
  const fetchRecentNotifications = useCallback(async (limit = 5) => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const result = await getUserNotifications(userId, { limit });

      if (result.success) {
        setNotifications(result.notifications || []);
        retryCountRef.current = 0;
        backoffIntervalRef.current = INITIAL_POLL_INTERVAL;
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      handleFetchError();
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Handle fetch errors with exponential backoff
  const handleFetchError = useCallback(() => {
    retryCountRef.current += 1;

    if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
      // Stop polling after max retries
      setConnectionStatus('error');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
      console.warn('Max retry attempts reached, stopping polling');
      return;
    }

    // Calculate exponential backoff
    const exponentialBackoff = INITIAL_POLL_INTERVAL * Math.pow(2, retryCountRef.current - 1);
    backoffIntervalRef.current = Math.min(exponentialBackoff, MAX_BACKOFF_INTERVAL);
    setConnectionStatus('error');
  }, []);

  // Start polling with smart interval
  const startPolling = useCallback(() => {
    if (!userId || !isVisibleRef.current) return;

    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsPolling(true);

    // Set initial fetch
    fetchUnreadCount();

    // Set polling interval (5 minutes or with exponential backoff on error)
    const pollInterval = retryCountRef.current > 0
      ? backoffIntervalRef.current
      : INITIAL_POLL_INTERVAL;

    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current && navigator.onLine) {
        fetchUnreadCount();
      }
    }, pollInterval);
  }, [userId, fetchUnreadCount]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Initialize polling on mount
  useEffect(() => {
    if (userId && !document.hidden && navigator.onLine) {
      startPolling();
    }

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, [userId, startPolling, stopPolling]);

  return {
    unreadCount,
    notifications,
    isLoading,
    isPolling,
    connectionStatus,
    lastFetchTime,
    fetchUnreadCount,
    fetchRecentNotifications,
    startPolling,
    stopPolling,
  };
};

export default useSmartNotifications;
