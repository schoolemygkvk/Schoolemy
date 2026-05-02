/**
 * Currency Converter Utility (Frontend)
 * Handles conversion between Rupees and Paise consistently
 * Bug Fix 2.11.2: Ensures no decimal mismatches causing payment failures
 */

/**
 * Convert Rupees to Paise
 * Ensures integer conversion without floating point errors
 * @param {number} rupees - Amount in Indian Rupees
 * @returns {number} Amount in Paise (integer)
 */
export const rupeesToPaise = (rupees) => {
  if (typeof rupees !== 'number' || isNaN(rupees)) {
    throw new Error('Invalid rupees amount. Must be a valid number.');
  }

  if (rupees < 0) {
    throw new Error('Amount cannot be negative.');
  }

  // Convert to paise and ensure integer (no decimals)
  const paise = Math.round(rupees * 100);

  if (!Number.isInteger(paise)) {
    throw new Error('Conversion resulted in non-integer paise. Check input.');
  }

  return paise;
};

/**
 * Convert Paise to Rupees
 * Converts back from paise to rupees for display
 * @param {number} paise - Amount in Paise (integer)
 * @returns {number} Amount in Indian Rupees
 */
export const paiseToRupees = (paise) => {
  if (typeof paise !== 'number' || isNaN(paise)) {
    throw new Error('Invalid paise amount. Must be a valid number.');
  }

  if (paise < 0) {
    throw new Error('Amount cannot be negative.');
  }

  // Convert to rupees
  return paise / 100;
};

/**
 * Format rupees for display
 * @param {number} rupees - Amount in rupees
 * @param {number} decimalPlaces - Number of decimal places (default 2)
 * @returns {string} Formatted string (e.g., "₹999.00")
 */
export const formatRupees = (rupees, decimalPlaces = 2) => {
  if (typeof rupees !== 'number' || isNaN(rupees)) {
    return '₹0.00';
  }

  return '₹' + rupees.toLocaleString('en-IN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  });
};

/**
 * Validate and convert amount for payment processing
 * Ensures consistent conversion and validation
 * @param {number} amountInRupees - Amount in Rupees from user input
 * @param {object} rules - Validation rules { minAmount, maxAmount }
 * @returns {object} { amountInRupees, amountInPaise, isValid, errors }
 */
export const validateAndConvertAmount = (amountInRupees, rules = {}) => {
  const result = {
    amountInRupees: null,
    amountInPaise: null,
    isValid: true,
    errors: []
  };

  // Check if amount is a valid number
  if (typeof amountInRupees !== 'number' || isNaN(amountInRupees)) {
    result.isValid = false;
    result.errors.push('Amount must be a valid number.');
    return result;
  }

  // Check for negative amounts
  if (amountInRupees < 0) {
    result.isValid = false;
    result.errors.push('Amount cannot be negative.');
    return result;
  }

  // Check minimum amount rule
  if (rules.minAmount && amountInRupees < rules.minAmount) {
    result.isValid = false;
    result.errors.push(`Minimum amount is ${formatRupees(rules.minAmount)}`);
  }

  // Check maximum amount rule
  if (rules.maxAmount && amountInRupees > rules.maxAmount) {
    result.isValid = false;
    result.errors.push(`Maximum amount is ${formatRupees(rules.maxAmount)}`);
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

/**
 * Safe amount comparison for floating point numbers
 * @param {number} amount1 - First amount
 * @param {number} amount2 - Second amount
 * @param {number} tolerance - Tolerance for comparison (default 0.01 paise)
 * @returns {boolean} Whether amounts are equal within tolerance
 */
export const amountsEqual = (amount1, amount2, tolerance = 0.01) => {
  return Math.abs(amount1 - amount2) < tolerance;
};

export default {
  rupeesToPaise,
  paiseToRupees,
  formatRupees,
  validateAndConvertAmount,
  amountsEqual
};
