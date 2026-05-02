import { useState, useCallback, useEffect } from "react";
import api from "../service/api";

/**
 * FIX 2.14: useExamReattemptStatus Hook
 *
 * Custom hook for managing exam reattempt status
 * Handles fetching, caching, and real-time updates
 */

const useExamReattemptStatus = (examId, options = {}) => {
  const { autoFetch = true, pollInterval = null } = options;

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(autoFetch);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch reattempt status from backend
  const fetchStatus = useCallback(async () => {
    if (!examId) {
      setStatus(null);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get("/api/v1/exam/reattempt-status", {
        params: { examId },
      });

      if (response.data.success) {
        setStatus(response.data.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        throw new Error(response.data.message || "Failed to fetch status");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error fetching status");
      console.error("Error fetching exam reattempt status:", err);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  // Auto-fetch on mount or examId change
  useEffect(() => {
    if (autoFetch && examId) {
      fetchStatus();
    }
  }, [examId, autoFetch, fetchStatus]);

  // Poll for status updates if pollInterval is set
  useEffect(() => {
    if (!pollInterval || !examId) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, examId, fetchStatus]);

  return {
    status,
    loading,
    error,
    lastUpdated,
    refetch: fetchStatus,
    canReattempt: status?.canReattempt ?? false,
    reason: status?.reason,
    message: status?.message,
    details: status?.details,
  };
};

export default useExamReattemptStatus;
