


export const rupeesToPaise = (rupees) => {
  if (typeof rupees !== "number" || isNaN(rupees)) {
    throw new Error("Invalid rupees amount. Must be a valid number.");
  }

  if (rupees < 0) {
    throw new Error("Amount cannot be negative.");
  }

  // Convert to paise and ensure integer (no decimals)
  const paise = Math.round(rupees * 100);

  if (!Number.isInteger(paise)) {
    throw new Error("Conversion resulted in non-integer paise. Check input.");
  }

  return paise;
};


export const paiseToRupees = (paise) => {
  if (typeof paise !== "number" || isNaN(paise)) {
    throw new Error("Invalid paise amount. Must be a valid number.");
  }

  if (paise < 0) {
    throw new Error("Amount cannot be negative.");
  }

  // Convert to rupees
  return paise / 100;
};


export const validateAndConvertAmount = (amountInRupees, rules = {}) => {
  const result = {
    amountInRupees: null,
    amountInPaise: null,
    isValid: true,
    errors: [],
  };

  // Check if amount is a valid number
  if (typeof amountInRupees !== "number" || isNaN(amountInRupees)) {
    result.isValid = false;
    result.errors.push("Amount must be a valid number.");
    return result;
  }

  // Check for negative amounts
  if (amountInRupees < 0) {
    result.isValid = false;
    result.errors.push("Amount cannot be negative.");
    return result;
  }

  // Check minimum amount rule
  if (rules.minAmount && amountInRupees < rules.minAmount) {
    result.isValid = false;
    result.errors.push(`Minimum amount is ₹${rules.minAmount}`);
  }

  // Check maximum amount rule
  if (rules.maxAmount && amountInRupees > rules.maxAmount) {
    result.isValid = false;
    result.errors.push(`Maximum amount is ₹${rules.maxAmount}`);
  }

  // If validation passed, convert
  if (result.isValid) {
    try {
      const amountInPaise = rupeesToPaise(amountInRupees);
      result.amountInRupees = amountInRupees;
      result.amountInPaise = amountInPaise;
    } catch (error) {
      result.isValid = false;
      result.errors.push(error.message);
    }
  }

  return result;
};


export const getDecimalPlaces = (num) => {
  const match = String(num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
  return match ? Math.max(0, (match[1] || "").length - (match[2] || 0)) : 0;
};


export const amountsEqual = (amount1, amount2, tolerance = 0.01) => {
  return Math.abs(amount1 - amount2) < tolerance;
};

export default {
  rupeesToPaise,
  paiseToRupees,
  validateAndConvertAmount,
  getDecimalPlaces,
  amountsEqual,
};
