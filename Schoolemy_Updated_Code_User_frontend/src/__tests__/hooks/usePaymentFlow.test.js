import { renderHook, act } from '@testing-library/react';
import { usePaymentFlow } from '../../hooks/usePaymentFlow';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('usePaymentFlow', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    test('initializes with default values', () => {
      const { result } = renderHook(() => usePaymentFlow());

      expect(result.current.amount).toBe(0);
      expect(result.current.paymentMethod).toBe('cashfree');
      expect(result.current.paymentType).toBe('full');
      expect(result.current.emiDueDay).toBe(1);
      expect(result.current.agreedToTerms).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('');
      expect(result.current.success).toBe(false);
    });

    test('initializes with provided data', () => {
      const initialData = {
        amount: 500,
        paymentMethod: 'upi',
        paymentType: 'emi',
        emiDueDay: 15,
      };

      const { result } = renderHook(() => usePaymentFlow(initialData));

      expect(result.current.amount).toBe(500);
      expect(result.current.paymentMethod).toBe('upi');
      expect(result.current.paymentType).toBe('emi');
      expect(result.current.emiDueDay).toBe(15);
    });
  });

  describe('form state updates', () => {
    test('updates amount', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setAmount(1000);
      });

      expect(result.current.amount).toBe(1000);
    });

    test('updates payment method', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setPaymentMethod('upi');
      });

      expect(result.current.paymentMethod).toBe('upi');
    });

    test('updates payment type', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setPaymentType('emi');
      });

      expect(result.current.paymentType).toBe('emi');
    });

    test('updates EMI due day', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setEmiDueDay(15);
      });

      expect(result.current.emiDueDay).toBe(15);
    });

    test('updates terms agreement', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setAgreedToTerms(true);
      });

      expect(result.current.agreedToTerms).toBe(true);
    });
  });

  describe('loading state', () => {
    test('startLoading sets loading to true and clears errors', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setError('Previous error');
        result.current.startLoading();
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe('');
      expect(result.current.success).toBe(false);
    });

    test('setSuccess sets success state', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.startLoading();
        result.current.setSuccess(true);
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.success).toBe(true);
    });

    test('setError sets error state', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.startLoading();
        result.current.setError('Payment failed');
      });

      expect(result.current.error).toBe('Payment failed');
    });
  });

  describe('error handling', () => {
    test('clearError clears error and warning messages', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setError('Error message');
        result.current.setWarning('Warning message');
        result.current.clearError();
      });

      expect(result.current.error).toBe('');
      expect(result.current.warningMessage).toBe('');
    });

    test('setWarning sets warning message', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setWarning('Warning message');
      });

      expect(result.current.warningMessage).toBe('Warning message');
    });
  });

  describe('form validation', () => {
    test('validates successful form', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setAmount(500);
        result.current.setPaymentMethod('cashfree');
        result.current.setPaymentType('full');
        result.current.setAgreedToTerms(true);
      });

      let isValid;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(true);
      expect(result.current.error).toBe('');
    });

    test('rejects zero amount', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setAmount(0);
        result.current.setPaymentMethod('cashfree');
        result.current.setPaymentType('full');
        result.current.setAgreedToTerms(true);
      });

      let isValid;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.error.length).toBeGreaterThan(0);
    });

    test('rejects negative amount', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setAmount(-100);
        result.current.setPaymentMethod('cashfree');
        result.current.setPaymentType('full');
        result.current.setAgreedToTerms(true);
      });

      let isValid;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
    });

    test('rejects missing payment method', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setAmount(500);
        result.current.setPaymentMethod('');
        result.current.setPaymentType('full');
        result.current.setAgreedToTerms(true);
      });

      let isValid;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
    });

    test('rejects missing terms agreement', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setAmount(500);
        result.current.setPaymentMethod('cashfree');
        result.current.setPaymentType('full');
        result.current.setAgreedToTerms(false);
      });

      let isValid;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
    });

    test('validates EMI due day', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setAmount(500);
        result.current.setPaymentMethod('cashfree');
        result.current.setPaymentType('emi');
        result.current.setEmiDueDay(32); // Invalid
        result.current.setAgreedToTerms(true);
      });

      let isValid;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
    });
  });

  describe('form reset', () => {
    test('resets form to initial values', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setAmount(1000);
        result.current.setPaymentMethod('upi');
        result.current.setError('Error');
        result.current.setSuccess(true);
        result.current.resetForm();
      });

      expect(result.current.amount).toBe(0);
      expect(result.current.paymentMethod).toBe('cashfree');
      expect(result.current.error).toBe('');
      expect(result.current.success).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    test('resets form to provided initial values', () => {
      const initialData = { amount: 500, paymentMethod: 'upi' };
      const { result } = renderHook(() => usePaymentFlow(initialData));

      act(() => {
        result.current.setAmount(1000);
        result.current.setPaymentMethod('cashfree');
        result.current.resetForm();
      });

      expect(result.current.amount).toBe(500);
      expect(result.current.paymentMethod).toBe('upi');
    });
  });

  describe('retry support', () => {
    test('retryCount initializes to 0', () => {
      const { result } = renderHook(() => usePaymentFlow());

      expect(result.current.retryCount).toBe(0);
    });

    test('canRetry returns true initially', () => {
      const { result } = renderHook(() => usePaymentFlow());

      expect(result.current.canRetry()).toBe(true);
    });

    test('getRetryMessage shows initial message', () => {
      const { result } = renderHook(() => usePaymentFlow());

      const message = result.current.getRetryMessage();
      expect(message).toBeDefined();
    });
  });

  describe('localStorage management', () => {
    test('savePaymentData stores data with expiry', () => {
      const { result } = renderHook(() => usePaymentFlow());
      const data = { amount: 500, courseId: 'course-1' };

      act(() => {
        result.current.savePaymentData(data);
      });

      const stored = localStorage.getItem('paymentData');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored);
      expect(parsed.amount).toBe(500);
      expect(parsed.expiresAt).toBeTruthy();
    });

    test('getPaymentData retrieves non-expired data', () => {
      const { result } = renderHook(() => usePaymentFlow());
      const data = { amount: 500, courseId: 'course-1' };

      act(() => {
        result.current.savePaymentData(data);
      });

      const retrieved = result.current.getPaymentData();

      expect(retrieved).toBeTruthy();
      expect(retrieved.amount).toBe(500);
    });

    test('getPaymentData returns null for expired data', () => {
      const { result } = renderHook(() => usePaymentFlow());
      const data = {
        amount: 500,
        courseId: 'course-1',
        expiresAt: Date.now() - 1000, // Already expired
      };

      localStorage.setItem('paymentData', JSON.stringify(data));

      const retrieved = result.current.getPaymentData();

      expect(retrieved).toBeNull();
    });

    test('clearPaymentData removes all payment data', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.savePaymentData({ amount: 500 });
      });

      expect(localStorage.getItem('paymentData')).toBeTruthy();

      act(() => {
        result.current.clearPaymentData();
      });

      expect(localStorage.getItem('paymentData')).toBeNull();
    });
  });

  describe('clearSuccess', () => {
    test('clears success state', () => {
      const { result } = renderHook(() => usePaymentFlow());

      act(() => {
        result.current.setSuccess(true);
        result.current.clearSuccess();
      });

      expect(result.current.success).toBe(false);
    });
  });
});
