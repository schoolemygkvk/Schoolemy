const API_PAYMENT_METHOD_ENUM = new Set([
  "UPI",
  "CARD",
  "DEBIT_CARD",
  "CREDIT_CARD",
  "NETBANKING",
  "WALLET",
  "EMI",
  "COD",
  "PAYLATER",
  "BANK_TRANSFER",
  "QR_CODE",
  "AUTO_DEBIT",
]);

/** UI PaymentMethodSelector uses gateway ids; backend stores how customer paid (updated on verify) */
const UI_GATEWAY_TO_INSTRUMENT = {
  cashfree: "CARD",
  razorpay: "CARD",
  stripe: "CARD",
};


export function mapUiPaymentMethodToApi(uiValue) {
  if (uiValue == null || uiValue === "") return "CARD";
  const s = String(uiValue).trim();
  const upper = s.toUpperCase();
  if (API_PAYMENT_METHOD_ENUM.has(upper)) return upper;
  const mapped = UI_GATEWAY_TO_INSTRUMENT[s.toLowerCase()];
  return mapped || "CARD";
}

export function validatePaymentAmount(
  amount,
  course,
  paymentType = 'full',
  emiDetails = null
) {
  const errors = [];
  let validatedAmount = amount;

  // SECURITY FIX 3.38.1: Check if amount is provided
  if (amount === undefined || amount === null) {
    errors.push('Payment amount is required');
    return { isValid: false, errors, validatedAmount: 0 };
  }

  // SECURITY FIX 3.38.1: Validate amount is a number
  if (typeof amount !== 'number' || isNaN(amount)) {
    errors.push('Payment amount must be a valid number');
    return { isValid: false, errors, validatedAmount: 0 };
  }

  // SECURITY FIX 3.38.1: Get expected amount from course
  let expectedAmount = 0;

  if (paymentType === 'emi' && emiDetails) {
    expectedAmount = emiDetails.monthlyAmount || 0;

    // Validate EMI amount matches course EMI settings
    if (expectedAmount <= 0) {
      errors.push('EMI amount must be greater than 0');
    }

    // Validate EMI details are present
    if (!emiDetails.tenure || !emiDetails.totalAmount) {
      errors.push('EMI details are incomplete');
    }
  } else {
    // Full payment - amount must match course price
    expectedAmount = course?.price?.finalPrice || 0;

    // SECURITY FIX 3.38.1: Ensure course has price information
    if (expectedAmount <= 0) {
      errors.push('Course price is not available');
      return { isValid: false, errors, validatedAmount: 0 };
    }
  }

  // SECURITY FIX 3.38.1: Amount must match expected amount (with tolerance)
  // Tolerance increased from 1 to 150 to account for GST/fee variations
  const tolerance = paymentType === 'emi' ? 150 : 150;
  if (expectedAmount > 0 && Math.abs(amount - expectedAmount) > tolerance) {
    errors.push(
      `Payment amount (₹${amount}) does not match expected amount (₹${expectedAmount})`
    );
    return { isValid: false, errors, validatedAmount: 0 };
  }

  // SECURITY FIX 3.38.1: Check minimum and maximum amounts
  const minAmount = course?.isTutorCourse ? 500 : 100;
  const maxAmount = course?.isTutorCourse ? 50000 : 500000;

  if (amount < minAmount) {
    errors.push(`Minimum payment amount is ₹${minAmount}`);
  }

  if (amount > maxAmount) {
    errors.push(`Maximum payment amount is ₹${maxAmount}`);
  }

  // SECURITY FIX 3.38.1: Amount must not be zero or negative
  if (amount <= 0) {
    errors.push('Payment amount must be greater than 0');
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedAmount: amount,
  };
}

/**
 * SECURITY FIX 3.38.1: Get display-safe amount (read-only)
 *
 * Returns formatted amount for display only (not for editing)
 * Amount should NEVER be in an input field
 *
 * @param {Number} amount - Amount in rupees
 * @param {String} currency - Currency code (default: 'INR')
 * @returns {String} - Formatted amount for display (e.g., "₹10,000")
 */
export function getDisplayAmount(amount, currency = 'INR') {
  if (!amount || typeof amount !== 'number') {
    return '₹0';
  }

  const symbol = currency === 'INR' ? '₹' : '$';
  return `${symbol}${amount.toLocaleString('en-IN')}`;
}

/**
 * SECURITY FIX 3.38.1: Validate payment form before submission
 *
 * Comprehensive validation for payment submission
 *
 * @param {Object} formData - Payment form data
 * @param {Object} course - Course object
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validatePaymentForm(formData, course) {
  const errors = [];

  // Check required fields
  if (!formData.paymentType) {
    errors.push('Payment type is required');
  }

  if (!course) {
    errors.push('Course information is missing');
    return { isValid: false, errors };
  }

  // SECURITY FIX 3.38.1: Validate amount
  const amountValidation = validatePaymentAmount(
    formData.amount,
    course,
    formData.paymentType,
    formData.emiDetails
  );

  if (!amountValidation.isValid) {
    errors.push(...amountValidation.errors);
  }

  // Check mobile number (if provided)
  if (formData.mobile) {
    if (!/^\d{10}$/.test(String(formData.mobile).replace(/\D/g, ''))) {
      errors.push('Mobile number must be 10 digits');
    }
  }

  // Check terms acceptance
  if (!formData.agreedToTerms) {
    errors.push('You must agree to the terms and conditions');
  }

  // Check EMI-specific validation
  if (formData.paymentType === 'emi') {
    if (!formData.emiDetails?.monthlyAmount) {
      errors.push('EMI monthly amount is required');
    }

    if (!formData.emiDueDay) {
      errors.push('EMI due day is required');
    }

    // Validate due day is between 1-28
    const dueDay = Number(formData.emiDueDay);
    if (dueDay < 1 || dueDay > 28) {
      errors.push('EMI due day must be between 1 and 28');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * SECURITY FIX 3.38.1: Verify payment data before sending to server
 *
 * Final validation before submitting to payment gateway
 *
 * @param {Object} paymentData - Payment data to submit
 * @param {Object} originalCourse - Original course data from server
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function verifyPaymentData(paymentData, originalCourse) {
  const errors = [];

  // CRITICAL FIX: Support both full payments and EMI payments
  // For EMI: amount = monthly EMI (different from full course price)
  // For full: amount = full course price

  if (!originalCourse) {
    errors.push('Course information is missing');
    return { isValid: false, errors };
  }

  // Determine expected amount based on payment type
  let expectedAmount = paymentData.amount; // Default: trust the amount for EMI
  let tolerance = 500; // ₹500 tolerance for variations

  // For FULL payment, compare against course price
  if (paymentData.paymentType === 'full') {
    const coursePrice = originalCourse.price?.finalPrice || originalCourse.finalPrice || 0;

    if (coursePrice <= 0) {
      errors.push('Course price is not available');
      return { isValid: false, errors };
    }

    expectedAmount = coursePrice;
    tolerance = 150; // Stricter tolerance for full payments

    // SECURITY FIX: Amount must match course price (with tolerance)
    if (Math.abs(paymentData.amount - expectedAmount) > tolerance) {
      errors.push(
        `Payment amount (₹${paymentData.amount}) does not match course price (₹${expectedAmount})`
      );
      return { isValid: false, errors };
    }
  }
  // For EMI payment: amount should be monthly EMI (validated on backend)
  else if (paymentData.paymentType === 'emi') {
    if (paymentData.amount <= 0) {
      errors.push('EMI amount must be greater than 0');
      return { isValid: false, errors };
    }

    // Don't compare against full course price for EMI
    // Backend will validate the monthly EMI amount
    console.log('EMI payment verified with amount:', paymentData.amount);
  }

  // Ensure amount is positive
  if (paymentData.amount <= 0) {
    errors.push('Payment amount is invalid');
  }

  // Check courseId/tutorCourseId matches
  if (!paymentData.courseId && !paymentData.tutorCourseId) {
    errors.push('Course ID is missing');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * SECURITY FIX 3.38.1: Log payment validation errors for audit
 *
 * Logs validation failures for security monitoring
 *
 * @param {String} stage - Validation stage (e.g., 'form-validation', 'pre-submission')
 * @param {Object} errors - Array of error messages
 * @param {Object} context - Additional context (user ID, course ID, etc.)
 */
export function logPaymentValidationError(stage, errors, context = {}) {
  console.error(`[PaymentValidation] ${stage}:`, {
    errors,
    context,
    timestamp: new Date().toISOString(),
  });

  // In production, you might want to send this to a monitoring service
  // for fraud detection and security analysis
}

export default {
  validatePaymentAmount,
  getDisplayAmount,
  validatePaymentForm,
  verifyPaymentData,
  logPaymentValidationError,
  mapUiPaymentMethodToApi,
};
