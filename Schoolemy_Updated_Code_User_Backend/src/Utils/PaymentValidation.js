

import { validateAndConvertAmount } from "./CurrencyConverter.js";


export const paymentValidationRules = {
  regular: {
    name: "Regular Course",
    minAmount: 100,
    maxAmount: 100000,
    allowEMI: false,
    allowFull: true,
    currency: "INR",
    description: "One-time full payment",
  },
  emi: {
    name: "EMI Course",
    minAmount: 500,
    maxAmount: 500000,
    allowEMI: true,
    allowFull: true,
    minEmiAmount: 100, // Minimum monthly EMI amount
    currency: "INR",
    description: "Full payment or EMI options",
  },
  tutor: {
    name: "Tutor Course",
    minAmount: 500,
    maxAmount: 50000,
    allowEMI: false,
    allowFull: true,
    currency: "INR",
    description: "One-time full payment (no EMI)",
  },
};


export const validatePayment = (params) => {
  const {
    courseType,
    amount,
    paymentType = "full",
    emiDueDay = null,
  } = params;

  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    amountInPaise: null,
  };

  // Validate course type
  if (!courseType || !paymentValidationRules[courseType]) {
    result.isValid = false;
    result.errors.push(
      `Invalid course type: ${courseType}. Must be one of: ${Object.keys(paymentValidationRules).join(", ")}`,
    );
    return result;
  }

  const rules = paymentValidationRules[courseType];

  // Validate amount
  const amountValidation = validateAndConvertAmount(amount, {
    minAmount: rules.minAmount,
    maxAmount: rules.maxAmount,
  });

  if (!amountValidation.isValid) {
    result.isValid = false;
    result.errors.push(...amountValidation.errors);
    return result;
  }

  result.amountInPaise = amountValidation.amountInPaise;

  // Validate payment type
  if (!paymentType || !["full", "emi"].includes(paymentType)) {
    result.isValid = false;
    result.errors.push(`Invalid payment type: ${paymentType}. Must be 'full' or 'emi'.`);
    return result;
  }

  // Check if payment type is allowed for course type
  if (paymentType === "full" && !rules.allowFull) {
    result.isValid = false;
    result.errors.push(`Full payment is not available for ${rules.name}`);
    return result;
  }

  if (paymentType === "emi" && !rules.allowEMI) {
    result.isValid = false;
    result.errors.push(
      `EMI is not available for ${rules.name}. Only full payment is supported.`,
    );
    return result;
  }

  // EMI-specific validation
  if (paymentType === "emi") {
    // Validate EMI due day
    if (!Number.isInteger(emiDueDay) || emiDueDay < 1 || emiDueDay > 31) {
      result.isValid = false;
      result.errors.push("EMI due day must be between 1 and 31");
      return result;
    }

    // Check if amount qualifies for EMI
    if (amount < rules.minAmount) {
      result.isValid = false;
      result.errors.push(
        `Amount too low for EMI. Minimum: ₹${rules.minAmount}`,
      );
      return result;
    }

    // Check minimum EMI amount
    const estimatedMonthlyEMI = Math.ceil(amount / 12);
    if (estimatedMonthlyEMI < rules.minEmiAmount) {
      result.isValid = false;
      result.errors.push(
        `Amount too low for EMI. Estimated monthly EMI (₹${estimatedMonthlyEMI}) is below minimum (₹${rules.minEmiAmount})`,
      );
      return result;
    }
  }

  return result;
};


export const checkEmiEligibility = (params) => {
  const { courseType, amount } = params;

  const result = {
    isEligible: false,
    reason: null,
    minAmount: null,
    minMonthlyEmi: null,
  };

  if (!courseType || !paymentValidationRules[courseType]) {
    result.reason = "Invalid course type";
    return result;
  }

  const rules = paymentValidationRules[courseType];

  // Check if course type allows EMI
  if (!rules.allowEMI) {
    result.reason = `${rules.name} does not support EMI. Only full payment is available.`;
    result.minAmount = rules.minAmount;
    return result;
  }

  // Check if amount qualifies for EMI
  if (amount < rules.minAmount) {
    result.reason = `Amount too low for EMI. Minimum required: ₹${rules.minAmount}`;
    result.minAmount = rules.minAmount;
    return result;
  }

  // Check monthly EMI amount
  const estimatedMonthlyEMI = Math.ceil(amount / 12);
  if (estimatedMonthlyEMI < rules.minEmiAmount) {
    result.reason = `Amount too low for EMI. Estimated monthly payment (₹${estimatedMonthlyEMI}) is below minimum (₹${rules.minEmiAmount})`;
    result.minAmount = rules.minEmiAmount * 12;
    result.minMonthlyEmi = rules.minEmiAmount;
    return result;
  }

  // EMI is eligible
  result.isEligible = true;
  result.minMonthlyEmi = estimatedMonthlyEMI;
  return result;
};


export const getValidationErrorMessage = (validation) => {
  if (validation.isValid) {
    return null;
  }

  if (validation.errors && validation.errors.length > 0) {
    return validation.errors[0]; // Return first error
  }

  return "Payment validation failed";
};


export const getValidationWarnings = (validation) => {
  return validation.warnings || [];
};


export const formatValidationError = (validation, context = {}) => {
  return {
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    amountInPaise: validation.amountInPaise,
    context,
  };
};

export default {
  paymentValidationRules,
  validatePayment,
  checkEmiEligibility,
  getValidationErrorMessage,
  getValidationWarnings,
  formatValidationError,
};
