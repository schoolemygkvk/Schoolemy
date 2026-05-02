import { useState, useEffect, useRef, useCallback } from 'react';
import WebSocketNotificationService from '../service/webSocketNotificationService';
import { getUnreadCount } from '../service/notificationApi';

/**
 * useWebSocketNotifications Hook
 *
 * Implements real-time notifications with:
 * - WebSocket connection management
 * - Fallback to smart polling if WebSocket unavailable
 * - Auto-reconnection
 * - Connection status tracking
 *
 * Usage:
 * const { unreadCount, isConnected, connectionStatus } = useWebSocketNotifications(userId);
 */

export const useWebSocketNotifications = (userId) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [isLoading, setIsLoading] = useState(false);
  const [wsStatus, setWsStatus] = useState(null);

  const wsRef = useRef(null);
  const unsubscribeRef = useRef([]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!userId) return;

    // Get or create WebSocket instance
    wsRef.current = WebSocketNotificationService.getInstance(userId);

    if (!wsRef.current) {
      console.warn('Failed to create WebSocket service');
      return;
    }

    // Setup event listeners
    const unsubscribe1 = wsRef.current.on('connected', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      console.log('WebSocket connected');
    });

    const unsubscribe2 = wsRef.current.on('disconnected', () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      console.log('WebSocket disconnected');
    });

    const unsubscribe3 = wsRef.current.on('notification', (data) => {
      console.log('New notification received:', data);
      // Update unread count
      if (data.unread_count !== undefined) {
        setUnreadCount(data.unread_count);
      }
      // Add to notifications list
      setNotifications((prev) => [data, ...prev]);
    });

    const unsubscribe4 = wsRef.current.on('error', (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    });

    const unsubscribe5 = wsRef.current.on('authenticated', () => {
      console.log('WebSocket authenticated');
      // Fetch initial unread count
      fetchUnreadCount();
    });

    unsubscribeRef.current = [unsubscribe1, unsubscribe2, unsubscribe3, unsubscribe4, unsubscribe5];

    // Attempt to connect
    setConnectionStatus('connecting');
    wsRef.current.connect().catch((error) => {
      console.error('Failed to establish WebSocket connection:', error);
      setConnectionStatus('error');
      setIsConnected(false);
      // Fallback to polling will be handled by parent component
    });

    // Keep-alive ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (wsRef.current?.isConnected) {
        wsRef.current.ping();
      }
    }, 30000);

    // Cleanup function
    return () => {
      clearInterval(pingInterval);
      unsubscribeRef.current.forEach((unsubscribe) => unsubscribe());
      // Don't disconnect on unmount - keep connection alive for other components
      // wsRef.current?.disconnect();
    };
  }, [userId]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const result = await getUnreadCount(userId);

      if (result.success) {
        setUnreadCount(result.unread_count);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Get WebSocket status
  const getConnectionStatus = useCallback(() => {
    if (!wsRef.current) return null;
    return wsRef.current.getStatus();
  }, []);

  // Manual disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    if (wsRef.current) {
      setConnectionStatus('connecting');
      wsRef.current.connect().catch((error) => {
        console.error('Reconnection failed:', error);
        setConnectionStatus('error');
      });
    }
  }, []);

  return {
    unreadCount,
    notifications,
    isConnected,
    connectionStatus,
    isLoading,
    wsStatus: getConnectionStatus(),
    fetchUnreadCount,
    disconnect,
    reconnect,
  };
};

export default useWebSocketNotifications;
