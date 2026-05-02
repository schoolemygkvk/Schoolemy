


export const formatAmount = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }
  return Math.round(amount * 100) / 100;
};


export const calculatePercentage = (baseAmount, percentage) => {
  if (!baseAmount || !percentage) return 0;
  return formatAmount((baseAmount * percentage) / 100);
};


export const calculateGST = (baseAmount) => {
  const amount = formatAmount(baseAmount);
  const cgst = calculatePercentage(amount, 9); // 9% CGST
  const sgst = calculatePercentage(amount, 9); // 9% SGST
  const gstTotal = formatAmount(cgst + sgst);

  return {
    baseAmount: amount,
    cgst,
    sgst,
    gstTotal
  };
};


export const calculateTransactionFee = (baseAmount, gstBreakdown) => {
  const totalBeforeFee = formatAmount(baseAmount + gstBreakdown.gstTotal);
  return calculatePercentage(totalBeforeFee, 2); // 2% transaction fee
};


export const getPaymentBreakdown = (coursePrice) => {
  const courseValue = formatAmount(coursePrice);
  const gst = calculateGST(courseValue);
  const transactionFee = calculateTransactionFee(courseValue, gst);
  const totalAmount = formatAmount(courseValue + gst.gstTotal + transactionFee);

  return {
    courseValue,
    cgst: gst.cgst,
    sgst: gst.sgst,
    gstTotal: gst.gstTotal,
    transactionFee,
    totalAmount
  };
};


export const validateAmountMatch = (amount1, amount2, toleranceInPaise = 100) => {
  const formatted1 = formatAmount(amount1);
  const formatted2 = formatAmount(amount2);
  const differenceInPaise = Math.abs((formatted1 - formatted2) * 100);

  return differenceInPaise <= toleranceInPaise;
};


export const reverseCalculateBase = (finalAmount) => {
  // Formula: baseAmount = finalAmount / 1.18
  const estimated = finalAmount / 1.18;
  return formatAmount(estimated);
};


export const rupeesToPaise = (rupees) => {
  return Math.round(formatAmount(rupees) * 100);
};


export const paiseToRupees = (paise) => {
  return formatAmount(paise / 100);
};

export default {
  formatAmount,
  calculatePercentage,
  calculateGST,
  calculateTransactionFee,
  getPaymentBreakdown,
  validateAmountMatch,
  reverseCalculateBase,
  rupeesToPaise,
  paiseToRupees
};
