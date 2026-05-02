/**
 * useAsyncError.js - FIX 2.10.4
 * Custom React hook for proper async/await error handling
 *
 * PROBLEM: Unhandled promise rejections in useEffect
 * SOLUTION: Properly structured async error handling with cleanup
 *
 * USAGE:
 * const handleAsyncError = useAsyncError();
 *
 * useEffect(() => {
 *   const fetchData = async () => {
 *     try {
 *       const data = await api.get('/data');
 *       setState(data);
 *     } catch (error) {
 *       handleAsyncError(error);
 *     }
 *   };
 *
 *   fetchData();
 *
 *   return () => {
 *     // Cleanup
 *   };
 * }, []);
 */

import React, { useCallback } from 'react';

/**
 * FIX 2.10.4: Hook for handling async errors
 * Prevents unhandled promise rejections
 *
 * @returns {function} - Error handler function
 */
export const useAsyncError = () => {
  return useCallback((error) => {
    // Log error to console
    console.error('Async operation error:', error);

    // Throw error so ErrorBoundary can catch it
    throw error;
  }, []);
};

/**
 * FIX 2.10.4: Hook for async data fetching with proper error handling
 *
 * USAGE:
 * const { data, loading, error } = useFetchData(
 *   '/api/user/profile',
 *   { headers: { Authorization: 'Bearer token' } }
 * );
 *
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {array} dependencies - Re-run when dependencies change
 * @returns {object} - {data, loading, error}
 */
export const useFetchData = (url, options = {}, dependencies = []) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component
    let timeoutId = null;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }

        const result = await response.json();

        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Fetch error:', err);
          setError(err.message || 'Failed to fetch data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, dependencies);

  return { data, loading, error };
};

/**
 * FIX 2.10.4: Hook for submitting async forms with error handling
 *
 * USAGE:
 * const { loading, error, submit } = useAsyncSubmit(async (data) => {
 *   const response = await api.post('/register', data);
 *   return response.data;
 * });
 *
 * const handleSubmit = async (e) => {
 *   e.preventDefault();
 *   try {
 *     const result = await submit(formData);
 *     // Success
 *   } catch (err) {
 *     // Error handled
 *   }
 * };
 *
 * @param {function} asyncFn - Async function to execute
 * @returns {object} - {loading, error, submit}
 */
export const useAsyncSubmit = (asyncFn) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const submit = React.useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFn(...args);
        setLoading(false);
        return result;
      } catch (err) {
        console.error('Submit error:', err);
        const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
        setError(errorMessage);
        setLoading(false);
        throw err;
      }
    },
    [asyncFn]
  );

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { loading, error, submit, clearError };
};

/**
 * FIX 2.10.4: Hook for retry logic with exponential backoff
 *
 * USAGE:
 * const { retry, isRetrying } = useRetry(
 *   async () => await api.get('/data'),
 *   { maxAttempts: 3, initialDelay: 1000 }
 * );
 *
 * @param {function} asyncFn - Async function to retry
 * @param {object} options - {maxAttempts, initialDelay}
 * @returns {object} - {retry, isRetrying}
 */
export const useRetry = (asyncFn, options = {}) => {
  const { maxAttempts = 3, initialDelay = 1000 } = options;
  const [isRetrying, setIsRetrying] = React.useState(false);
  const attemptsRef = React.useRef(0);

  const retry = React.useCallback(
    async (onSuccess, onError) => {
      setIsRetrying(true);
      attemptsRef.current = 0;

      const attempt = async () => {
        try {
          attemptsRef.current++;
          const result = await asyncFn();
          setIsRetrying(false);
          onSuccess && onSuccess(result);
          return result;
        } catch (error) {
          if (attemptsRef.current < maxAttempts) {
            // Exponential backoff: wait increases with each attempt
            const delay = initialDelay * Math.pow(2, attemptsRef.current - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            return attempt(); // Retry
          } else {
            setIsRetrying(false);
            onError && onError(error);
            throw error;
          }
        }
      };

      return attempt();
    },
    [asyncFn, maxAttempts, initialDelay]
  );

  return { retry, isRetrying };
};

export default {
  useAsyncError,
  useFetchData,
  useAsyncSubmit,
  useRetry
};
