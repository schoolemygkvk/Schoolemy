import { useState, useCallback, useRef } from 'react';

/**
 * useFormLoadingState - SECURITY FIX 3.41.1
 * Custom hook for managing form submission loading states
 *
 * SECURITY FIX 3.41.1: Prevent Duplicate Form Submissions
 * - Tracks form submission state
 * - Prevents multiple concurrent submissions
 * - Disables submit buttons during processing
 * - Shows loading feedback to user
 * - Prevents double-click/rapid submission attacks
 *
 * CRITICAL RULE:
 * ALWAYS use this hook to manage form submission state
 * ALWAYS disable submit buttons while loading (isLoading === true)
 * ALWAYS show loading feedback (spinner, "Processing..." text)
 * NEVER allow multiple concurrent submissions
 *
 * Security Principles:
 * 1. Form submission sets loading state immediately
 * 2. Form button disabled while loading
 * 3. Submit handler prevents concurrent calls
 * 4. Visual feedback shows processing state
 * 5. Timeout protection for stuck requests (30s default)
 *
 * Usage Example:
 * const { isLoading, handleSubmit, error, resetError } = useFormLoadingState();
 *
 * const onSubmit = handleSubmit(async (formData) => {
 *   await api.post('/endpoint', formData);
 *   // isLoading automatically set to false after completion
 * });
 */

/**
 * SECURITY FIX 3.41.1: Custom hook for form loading state management
 *
 * @param {object} options - Configuration options
 * @param {number} options.timeout - Request timeout in ms (default: 30000)
 * @param {function} options.onTimeout - Callback when request times out
 * @returns {object} - Form loading state and handlers
 */
export const useFormLoadingState = (options = {}) => {
  const { timeout = 30000, onTimeout } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Use ref to prevent multiple concurrent submissions
  const submissionInProgressRef = useRef(false);
  const timeoutIdRef = useRef(null);

  /**
   * SECURITY FIX 3.41.1: Wrap form submit handler
   *
   * Prevents concurrent submissions and ensures proper loading state
   *
   * @param {function} submitFn - Async function to execute on form submit
   * @returns {function} - Wrapped submit handler
   */
  const handleSubmit = useCallback((submitFn) => {
    return async (e, formData) => {
      // Prevent default form submission
      if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }

      // SECURITY FIX 3.41.1: Prevent concurrent submissions
      if (submissionInProgressRef.current) {
        console.warn('[FormLoadingState] Duplicate submission attempted - request already in progress');
        return;
      }

      // SECURITY FIX 3.41.1: Set loading state immediately
      submissionInProgressRef.current = true;
      setIsLoading(true);
      setError(null);
      setSuccess(false);

      // SECURITY FIX 3.41.1: Set timeout to prevent stuck requests
      timeoutIdRef.current = setTimeout(() => {
        console.error('[FormLoadingState] Request timeout after', timeout, 'ms');
        submissionInProgressRef.current = false;
        setIsLoading(false);
        setError('Request timed out. Please try again.');

        if (onTimeout) {
          onTimeout();
        }
      }, timeout);

      try {
        // Execute the actual submit function
        const result = await submitFn(formData);

        // Clear timeout on success
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }

        // SECURITY FIX 3.41.1: Set success state
        setSuccess(true);
        setError(null);

        return result;
      } catch (err) {
        // Clear timeout on error
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
        }

        // SECURITY FIX 3.41.1: Set error state
        console.error('[FormLoadingState] Submission error:', err);
        setError(err.message || 'An error occurred. Please try again.');
        setSuccess(false);

        throw err;
      } finally {
        // SECURITY FIX 3.41.1: Always clear loading state
        submissionInProgressRef.current = false;
        setIsLoading(false);
      }
    };
  }, [timeout, onTimeout]);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset success state
   */
  const resetSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  /**
   * Manually set loading state (useful for multi-step forms)
   */
  const setLoadingManual = useCallback((loading) => {
    if (loading) {
      submissionInProgressRef.current = true;
      timeoutIdRef.current = setTimeout(() => {
        console.error('[FormLoadingState] Manual timeout after', timeout, 'ms');
        submissionInProgressRef.current = false;
        setIsLoading(false);
        setError('Request timed out. Please try again.');
      }, timeout);
    } else {
      submissionInProgressRef.current = false;
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    }
    setIsLoading(loading);
  }, [timeout]);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    submissionInProgressRef.current = false;
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    setIsLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    isLoading,
    error,
    success,
    handleSubmit,
    resetError,
    resetSuccess,
    setLoadingManual,
    reset,
    // Useful for debugging
    isSubmissionInProgress: submissionInProgressRef.current,
  };
};

/**
 * SECURITY FIX 3.41.1: Higher-order component for form loading state
 *
 * Wraps a form component to add loading state management
 *
 * @param {component} FormComponent - React component to wrap
 * @returns {component} - Enhanced form component with loading state
 */
export const withFormLoadingState = (FormComponent) => {
  return (props) => {
    const formLoadingState = useFormLoadingState();

    return <FormComponent {...props} formLoadingState={formLoadingState} />;
  };
};

export default useFormLoadingState;
