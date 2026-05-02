/**
 * usePaymentFlow Hook
 * Manages payment form state and handles state reset on retry/completion
 * Bug Fix 2.11.4: Properly resets state on error for retry
 * Bug Fix 2.11.5: Clears stale localStorage data
 */

import { useState, useCallback, useEffect } from 'react';

/**
 * Storage keys for payment data
 */
const STORAGE_KEYS = {
  PAYMENT_DATA: 'paymentData',
  PAYMENT_METHOD: 'paymentMethod',
  SELECTED_COURSE: 'selectedCourse',
  PAYMENT_INTENT: 'paymentIntent'
};

/**
 * Expiry time for cached payment data (5 minutes)
 */
const PAYMENT_DATA_EXPIRY = 5 * 60 * 1000;

/**
 * usePaymentFlow Hook
 * Provides payment form state management with proper cleanup
 * @returns {object} Payment state and handlers
 */
export const usePaymentFlow = (initialData = {}) => {
  // Form state
  const [amount, setAmount] = useState(initialData.amount || 0);
  const [paymentMethod, setPaymentMethod] = useState(initialData.paymentMethod || 'cashfree');
  const [paymentType, setPaymentType] = useState(initialData.paymentType || 'full');
  const [emiDueDay, setEmiDueDay] = useState(initialData.emiDueDay || 1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Processing state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  // Retry support
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  /**
   * Clear error state (for retry)
   * Bug Fix 2.11.4: Reset state properly
   */
  const clearError = useCallback(() => {
    setError('');
    setWarningMessage('');
  }, []);

  /**
   * Clear success state
   */
  const clearSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  /**
   * Reset form to initial state
   * Used after successful payment or when starting fresh
   */
  const resetForm = useCallback(() => {
    setAmount(initialData.amount || 0);
    setPaymentMethod(initialData.paymentMethod || 'cashfree');
    setPaymentType(initialData.paymentType || 'full');
    setEmiDueDay(initialData.emiDueDay || 1);
    setAgreedToTerms(false);
    setLoading(false);
    setError('');
    setSuccess(false);
    setWarningMessage('');
    setRetryCount(0);
  }, [initialData]);

  /**
   * Handle loading state
   * Used by payment form when processing
   */
  const startLoading = useCallback(() => {
    setLoading(true);
    setError('');
    setSuccess(false);
  }, []);

  /**
   * Handle success
   * Bug Fix 2.11.4: Set success and clear form
   */
  const handleSuccess = useCallback((message = 'Payment successful!') => {
    setLoading(false);
    setSuccess(true);
    setError('');
    clearPaymentData(); // Bug Fix 2.11.5: Clear stale data
    setRetryCount(0);
  }, []);

  /**
   * Handle error
   * Bug Fix 2.11.4: Reset loading state properly, allow retry
   */
  const handleError = useCallback((errorMessage = 'Payment failed') => {
    setLoading(false);
    setError(errorMessage);
    setSuccess(false);

    // Track retry attempts
    setRetryCount(prev => prev + 1);
  }, []);

  /**
   * Set warning message
   * Used to inform user of state changes (e.g., stale payment found)
   */
  const setWarning = useCallback((message) => {
    setWarningMessage(message);
  }, []);

  /**
   * Check if user can retry
   * Based on retry count limit
   */
  const canRetry = useCallback(() => {
    return retryCount < MAX_RETRIES;
  }, [retryCount]);

  /**
   * Get retry message
   */
  const getRetryMessage = useCallback(() => {
    if (!canRetry()) {
      return `Maximum retry attempts (${MAX_RETRIES}) reached. Please contact support.`;
    }
    return `Attempt ${retryCount + 1} of ${MAX_RETRIES}`;
  }, [retryCount, canRetry]);

  // ===== localStorage Management (Bug Fix 2.11.5) =====

  /**
   * Save payment data to localStorage with expiry
   */
  const savePaymentData = useCallback((data) => {
    try {
      const paymentData = {
        ...data,
        expiresAt: Date.now() + PAYMENT_DATA_EXPIRY,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEYS.PAYMENT_DATA, JSON.stringify(paymentData));
    } catch (e) {
      console.warn('Failed to save payment data to localStorage', e);
    }
  }, []);

  /**
   * Get payment data from localStorage
   * Returns null if expired
   */
  const getPaymentData = useCallback(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENT_DATA);
      if (!data) return null;

      const parsed = JSON.parse(data);

      // Check if expired
      if (Date.now() > parsed.expiresAt) {
        localStorage.removeItem(STORAGE_KEYS.PAYMENT_DATA);
        return null;
      }

      return parsed;
    } catch (e) {
      console.warn('Failed to retrieve payment data from localStorage', e);
      return null;
    }
  }, []);

  /**
   * Clear all payment-related data from localStorage
   * Bug Fix 2.11.5: Prevent stale data from being used in future payments
   */
  const clearPaymentData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.PAYMENT_DATA);
      localStorage.removeItem(STORAGE_KEYS.PAYMENT_METHOD);
      localStorage.removeItem(STORAGE_KEYS.SELECTED_COURSE);
      localStorage.removeItem(STORAGE_KEYS.PAYMENT_INTENT);
    } catch (e) {
      console.warn('Failed to clear payment data from localStorage', e);
    }
  }, []);

  /**
   * Validate form before submission
   */
  const validateForm = useCallback(() => {
    const errors = [];

    if (!amount || amount <= 0) {
      errors.push('Valid amount is required');
    }

    if (!paymentMethod) {
      errors.push('Payment method is required');
    }

    if (!paymentType) {
      errors.push('Payment type is required');
    }

    if (paymentType === 'emi') {
      if (!Number.isInteger(emiDueDay) || emiDueDay < 1 || emiDueDay > 31) {
        errors.push('Valid EMI due day is required');
      }
    }

    if (!agreedToTerms) {
      errors.push('You must agree to terms and conditions');
    }

    if (errors.length > 0) {
      setError(errors.join(', '));
      return false;
    }

    return true;
  }, [amount, paymentMethod, paymentType, emiDueDay, agreedToTerms]);

  // Clear stale payment data on component mount
  useEffect(() => {
    const staleData = getPaymentData();
    if (!staleData) return;

    // If we found stale data but it's expired, it's already cleaned up
    // If it exists, you could restore it or warn user
    console.log('Found previously saved payment data:', staleData);
  }, []);

  return {
    // Form state
    amount,
    setAmount,
    paymentMethod,
    setPaymentMethod,
    paymentType,
    setPaymentType,
    emiDueDay,
    setEmiDueDay,
    agreedToTerms,
    setAgreedToTerms,

    // Processing state
    loading,
    startLoading,
    handleSuccess,
    handleError,
    error,
    setError,
    clearError,
    success,
    setSuccess,
    clearSuccess,
    warningMessage,
    setWarning,

    // Form methods
    resetForm,
    validateForm,

    // Retry support
    retryCount,
    canRetry,
    getRetryMessage,

    // localStorage management
    savePaymentData,
    getPaymentData,
    clearPaymentData
  };
};

export default usePaymentFlow;
