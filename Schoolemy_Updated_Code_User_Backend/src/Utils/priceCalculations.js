


export const calculateGST = (courseValue) => {
  if (typeof courseValue !== "number" || courseValue < 0) {
    throw new Error("Course value must be a non-negative number");
  }

  const cgst = Math.round(courseValue * 0.09 * 100) / 100;
  const sgst = Math.round(courseValue * 0.09 * 100) / 100;
  const total = Math.round((cgst + sgst) * 100) / 100;

  return {
    cgst,
    sgst,
    total,
  };
};


export const calculateTransactionFee = (courseValue, gstTotal) => {
  if (typeof courseValue !== "number" || courseValue < 0) {
    throw new Error("Course value must be a non-negative number");
  }
  if (typeof gstTotal !== "number" || gstTotal < 0) {
    throw new Error("GST total must be a non-negative number");
  }

  const subtotal = courseValue + gstTotal;
  return Math.round(subtotal * 0.02 * 100) / 100;
};


export const computeCourseFullPayableAmount = (coursePrice) => {
  if (typeof coursePrice !== "number" || coursePrice <= 0) {
    throw new Error("Course price must be a positive number");
  }

  const gst = calculateGST(coursePrice);
  const gstTotal = gst.total;
  const transactionFee = calculateTransactionFee(coursePrice, gstTotal);
  const totalPayable = coursePrice + gstTotal + transactionFee;

  return {
    courseValue: coursePrice,
    gst: {
      cgst: gst.cgst,
      sgst: gst.sgst,
      total: gstTotal,
    },
    transactionFee,
    totalPayable: Math.round(totalPayable * 100) / 100,
  };
};


export const calculateEMIBreakdown = (totalAmount, numberOfInstalments) => {
  if (typeof totalAmount !== "number" || totalAmount <= 0) {
    throw new Error("Total amount must be a positive number");
  }
  if (!Number.isInteger(numberOfInstalments) || numberOfInstalments <= 0) {
    throw new Error("Number of instalments must be a positive integer");
  }

  const monthlyPayment = Math.round((totalAmount / numberOfInstalments) * 100) / 100;
  const totalEMI = monthlyPayment * numberOfInstalments;

  // Account for rounding differences
  const roundingDifference = totalAmount - totalEMI;

  return {
    totalAmount,
    numberOfInstalments,
    monthlyPayment,
    totalEMI,
    roundingDifference,
  };
};


export const validatePriceBreakdown = (priceBreakdown) => {
  const {
    courseValue,
    gst: { cgst, sgst, total: gstTotal },
    transactionFee,
    totalPayable,
  } = priceBreakdown;

  // Validate GST calculation
  const expectedGSTTotal = cgst + sgst;
  if (Math.abs(expectedGSTTotal - gstTotal) > 0.01) {
    throw new Error("GST calculation mismatch");
  }

  // Validate fee calculation
  const expectedFee = Math.round((courseValue + gstTotal) * 0.02 * 100) / 100;
  if (Math.abs(expectedFee - transactionFee) > 0.01) {
    throw new Error("Transaction fee calculation mismatch");
  }

  // Validate total
  const expectedTotal = courseValue + gstTotal + transactionFee;
  if (Math.abs(expectedTotal - totalPayable) > 0.01) {
    throw new Error("Total payable calculation mismatch");
  }

  return true;
};

export default {
  calculateGST,
  calculateTransactionFee,
  computeCourseFullPayableAmount,
  calculateEMIBreakdown,
  validatePriceBreakdown,
};
