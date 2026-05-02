export const calculatePriceBreakdown = (amount, discount) => {
  const finalPrice = amount * (1 - discount / 100);
  const courseValue = finalPrice;
  const cgst = courseValue * 0.09;
  const sgst = courseValue * 0.09;
  const gstTotal = cgst + sgst;
  const subtotalWithGst = courseValue + cgst + sgst;
  const transactionFee = subtotalWithGst * 0.02;

  return {
    finalPrice,
    breakdown: {
      courseValue: Math.round(courseValue * 100) / 100,
      gst: {
        cgst: Math.round(cgst * 100) / 100,
        sgst: Math.round(sgst * 100) / 100,
        total: Math.round(gstTotal * 100) / 100,
      },
      transactionFee: Math.round(transactionFee * 100) / 100,
    },
  };
};

export const updatePriceBreakdown = (formData) => {
  const amount = parseFloat(formData.price.amount) || 0;
  const discount = parseFloat(formData.price.discount) || 0;

  if (amount <= 0 || discount < 0 || discount > 100) {
    return formData;
  }

  const { finalPrice, breakdown } = calculatePriceBreakdown(amount, discount);

  return {
    ...formData,
    price: {
      ...formData.price,
      finalPrice,
      breakdown,
    },
  };
};

export const parseDurationToMonths = (duration) => {
  if (duration === "6 months") return 6;
  if (duration === "1 year") return 12;
  if (duration === "2 years") return 24;
  return 0;
};

export const calculateEmiMonthly = (formData) => {
  const months = parseDurationToMonths(formData.courseduration);
  const finalPrice = formData.price.finalPrice;

  if (months <= 0 || finalPrice <= 0) {
    return {
      monthlyAmount: 0,
      emiDurationMonths: "",
      totalAmount: finalPrice,
    };
  }

  const calculatedMonthly = Math.ceil(finalPrice / months);

  return {
    monthlyAmount: calculatedMonthly,
    emiDurationMonths: months,
    totalAmount: finalPrice,
  };
};
