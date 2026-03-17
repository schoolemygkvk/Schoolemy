/**
 * Calculate EMI payment breakdown with GST and transaction fee.
 *
 * Flow: baseAmount -> +GST -> amountWithGST -> +transactionFee -> finalAmount -> /emiMonths -> emiAmount
 */
export const calculateEmiBreakdown = (
  baseAmount,
  gstPercent,
  transactionPercent,
  emiMonths,
) => {
  if (!baseAmount || baseAmount <= 0)
    throw new Error("baseAmount must be a positive number");
  if (!emiMonths || emiMonths <= 0)
    throw new Error("emiMonths must be a positive number");

  const gstAmount = Math.round(baseAmount * (gstPercent / 100) * 100) / 100;
  const amountWithGST = Math.round((baseAmount + gstAmount) * 100) / 100;
  const transactionFee =
    Math.round(amountWithGST * (transactionPercent / 100) * 100) / 100;
  const finalAmount = Math.round((amountWithGST + transactionFee) * 100) / 100;
  const emiAmount = Math.round((finalAmount / emiMonths) * 100) / 100;

  const monthlyBase = Math.round((baseAmount / emiMonths) * 100) / 100;
  const monthlyCgst = Math.round(monthlyBase * (gstPercent / 200) * 100) / 100;
  const monthlySgst = Math.round(monthlyBase * (gstPercent / 200) * 100) / 100;
  const monthlyGst = monthlyCgst + monthlySgst;
  const monthlyTxnFee =
    Math.round((monthlyBase + monthlyGst) * (transactionPercent / 100) * 100) /
    100;

  return {
    baseAmount,
    gstAmount,
    amountWithGST,
    transactionFee,
    finalAmount,
    emiAmount,
    perMonth: {
      courseValue: monthlyBase,
      cgst: monthlyCgst,
      sgst: monthlySgst,
      gstTotal: monthlyGst,
      transactionFee: monthlyTxnFee,
      emiAmount:
        Math.round((monthlyBase + monthlyGst + monthlyTxnFee) * 100) / 100,
    },
  };
};

export const getEmiDetails = (course) => {
  const isEmiAvailable =
    course?.emi?.isAvailable === true ||
    course?.emi?.isAvailable === "true" ||
    course?.emi?.isAvailable === "True";

  if (!isEmiAvailable) {
    return {
      eligible: false,
      months: 0,
      monthlyAmount: 0,
      totalAmount: 0,
      reason: "EMI not available for this course",
    };
  }

  const emiConfig = course.emi;

  const months =
    typeof emiConfig.emiDurationMonths === "string"
      ? parseInt(emiConfig.emiDurationMonths)
      : emiConfig.emiDurationMonths;

  const baseMonthlyAmount =
    typeof emiConfig.monthlyAmount === "string"
      ? parseFloat(emiConfig.monthlyAmount)
      : emiConfig.monthlyAmount;

  const baseTotalAmount =
    typeof emiConfig.totalAmount === "string"
      ? parseFloat(emiConfig.totalAmount)
      : emiConfig.totalAmount || baseMonthlyAmount * months;

  const breakdown = calculateEmiBreakdown(baseTotalAmount, 18, 2, months);

  return {
    eligible: true,
    months,
    monthlyAmount: Math.round(breakdown.perMonth.emiAmount),
    totalAmount: Math.round(breakdown.finalAmount),
    baseMonthlyAmount,
    baseTotalAmount,
    breakdown: breakdown.perMonth,
    notes: emiConfig.notes || null,
  };
};

export const validateCourseForEmi = (course) => {
  if (!course?.emi) {
    throw new Error("EMI configuration not found for this course");
  }

  const emiDetails = getEmiDetails(course);

  if (!emiDetails.eligible) {
    throw new Error(emiDetails.reason || "EMI not available for this course");
  }

  return emiDetails;
};

// Calculate EMI payment status and due amounts
export const calculateEmiStatus = (emiPlan) => {
  const today = new Date();
  const emis = emiPlan.emis || [];

  // Categorize EMIs
  const paidEmis = emis.filter((emi) => emi.status === "paid");
  const pendingEmis = emis.filter((emi) => emi.status === "pending");
  const lateEmis = emis.filter((emi) => emi.status === "late");

  // 🔥 CRITICAL FIX: Lock course when DUE DATE passes, not grace period
  // Grace period is for late fees, but access should lock on due date
  const overdueEmis = emis.filter(
    (emi) =>
      (emi.status === "pending" || emi.status === "late") &&
      new Date(emi.dueDate) < today, // ✅ Changed from gracePeriodEnd to dueDate
  );

  // 🔥 NEW: EMIs that are DUE TODAY or PAST DUE (but still in grace period)
  // These should LOCK the course and require immediate payment
  const dueEmis = emis.filter(
    (emi) =>
      emi.status === "pending" &&
      new Date(emi.dueDate) <= today &&
      new Date(emi.gracePeriodEnd) >= today,
  );

  const upcomingEmis = emis.filter(
    (emi) => emi.status === "pending" && new Date(emi.dueDate) > today,
  );

  // EMIs that are past due date but within grace period (for notification purposes)
  const gracePeriodEmis = emis.filter(
    (emi) =>
      emi.status === "pending" &&
      new Date(emi.dueDate) <= today &&
      new Date(emi.gracePeriodEnd) >= today,
  );

  // Calculate amounts
  const totalPaid = paidEmis.reduce((sum, emi) => sum + emi.amount, 0);
  const totalDue = dueEmis.reduce((sum, emi) => sum + emi.amount, 0); // Amount due (not yet overdue)
  const totalOverdue = overdueEmis.reduce((sum, emi) => sum + emi.amount, 0);
  const totalRemaining = emis
    .filter((emi) => emi.status !== "paid")
    .reduce((sum, emi) => sum + emi.amount, 0);
  const nextDueAmount =
    [...dueEmis, ...overdueEmis, ...upcomingEmis].sort(
      (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
    )[0]?.amount || 0;

  // 🔥 CRITICAL: Course should be locked if:
  // 1. There are overdue payments OR
  // 2. There are due EMIs (dueDate has arrived) that need payment OR
  // 3. Plan status is locked
  const hasDuePayments = dueEmis.length > 0;
  const hasOverduePayments = overdueEmis.length > 0;
  const hasAnyDuePayments = hasDuePayments || hasOverduePayments; // NEW: Check for due OR overdue
  const isCurrentOnPayments = !hasAnyDuePayments;
  const hasAccessToContent = isCurrentOnPayments && emiPlan.status === "active";

  const result = {
    // EMI counts
    totalEmis: emis.length,
    paidCount: paidEmis.length,
    pendingCount: pendingEmis.length,
    lateCount: lateEmis.length,
    dueCount: dueEmis.length, // NEW: Count of EMIs that are due but not yet overdue
    overdueCount: overdueEmis.length,
    upcomingCount: upcomingEmis.length,
    gracePeriodCount: gracePeriodEmis.length,

    // Amount calculations
    totalAmount: emiPlan.totalAmount,
    totalPaid,
    totalDue, // NEW: Amount that is due but not yet overdue
    totalOverdue,
    totalRemaining,
    nextDueAmount,

    // Status information
    planStatus: emiPlan.status,
    hasDuePayments, // NEW: True if any EMI is due (dueDate <= today)
    hasOverduePayments,
    hasAnyDuePayments, // NEW: True if due OR overdue - use this to lock course
    isCurrentOnPayments,
    hasAccessToContent,

    // Next payment info
    nextDueDate:
      [...dueEmis, ...overdueEmis, ...upcomingEmis].sort(
        (a, b) => new Date(a.dueDate) - new Date(b.dueDate),
      )[0]?.dueDate || null,

    // EMI arrays for detailed info
    dueEmis, // NEW: EMIs that are due but not overdue
    overdueEmis,
    gracePeriodEmis,
    upcomingEmis,
    paidEmis,
  };

  return result;
};

// Calculate which EMIs need to be paid and validate payment amount
export const calculatePaymentAllocation = (emiPlan, paymentAmount) => {
  const today = new Date();
  const emis = emiPlan.emis || [];

  // Get unpaid EMIs in order of priority: overdue first, then due, then upcoming
  // 🔥 FIX: Check dueDate for overdue (consistent with calculateEmiStatus)
  const overdueEmis = emis
    .filter(
      (emi) =>
        (emi.status === "pending" || emi.status === "late") &&
        new Date(emi.dueDate) < today, // ✅ Changed from gracePeriodEnd
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const gracePeriodEmis = emis
    .filter(
      (emi) =>
        emi.status === "pending" &&
        emi.dueDate <= today &&
        emi.gracePeriodEnd >= today,
    )
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const upcomingEmis = emis
    .filter((emi) => emi.status === "pending" && emi.dueDate > today)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Combine in priority order
  const unpaidEmisInOrder = [
    ...overdueEmis,
    ...gracePeriodEmis,
    ...upcomingEmis,
  ];

  let remainingAmount = paymentAmount;
  const emisToPay = [];
  const partialPayment = null; // Currently not supporting partial EMI payments

  for (const emi of unpaidEmisInOrder) {
    if (remainingAmount >= emi.amount) {
      emisToPay.push({
        emiId: emi._id,
        month: emi.month,
        monthName: emi.monthName,
        amount: emi.amount,
        dueDate: emi.dueDate,
        isOverdue: emi.gracePeriodEnd < today,
        isInGracePeriod: emi.dueDate <= today && emi.gracePeriodEnd >= today,
      });
      remainingAmount -= emi.amount;
    } else {
      break; // Cannot afford this EMI, stop allocation
    }
  }

  const result = {
    isValidAmount: remainingAmount === 0, // Must pay exact EMI amounts
    totalAllocated: paymentAmount - remainingAmount,
    remainingAmount,
    emisToPay,
    suggestedAmount: unpaidEmisInOrder
      .slice(0, emisToPay.length + 1)
      .reduce((sum, emi) => sum + emi.amount, 0),
    nextEmiAmount: unpaidEmisInOrder[emisToPay.length]?.amount || 0,
    canPayPartial: false, // Currently disabled
  };

  return result;
};

// Update EMI plan after successful payment
export const updateEmiAfterPayment = async (
  emiPlan,
  paymentAllocation,
  paymentDetails,
) => {
  const EMIPlan = (await import("../Models/Emi-Plan/Emi-Plan-Model.js"))
    .default;

  const updateOperations = [];
  const paymentDate = new Date();

  for (const emiToPay of paymentAllocation.emisToPay) {
    updateOperations.push({
      updateOne: {
        filter: {
          _id: emiPlan._id,
          "emis._id": emiToPay.emiId,
        },
        update: {
          $set: {
            "emis.$.status": "paid",
            "emis.$.paymentDate": paymentDate,
            // Cashfree fields (Migrated from Razorpay)
            "emis.$.cashfreeOrderId": paymentDetails.cashfreeOrderId,
            "emis.$.cashfreePaymentId": paymentDetails.cashfreePaymentId,
            "emis.$.cashfreePaymentSessionId":
              paymentDetails.cashfreePaymentSessionId,
          },
        },
      },
    });
  }

  // Execute all EMI updates
  if (updateOperations.length > 0) {
    await EMIPlan.bulkWrite(updateOperations);
  }

  // Check if plan should be unlocked or completed
  const updatedPlan = await EMIPlan.findById(emiPlan._id);
  const emiStatus = calculateEmiStatus(updatedPlan);

  let planUpdates = {};

  // If no more overdue payments and plan was locked, unlock it
  if (!emiStatus.hasOverduePayments && updatedPlan.status === "locked") {
    planUpdates.status = "active";
    planUpdates["$push"] = {
      lockHistory: {
        lockDate: new Date(),
        unlockDate: new Date(),
        overdueMonths: 0,
        reasonForLock: "Auto-unlocked after payment",
        lockedBy: "system",
      },
    };
  }

  // If all EMIs are paid, mark as completed
  if (emiStatus.pendingCount === 0 && emiStatus.lateCount === 0) {
    planUpdates.status = "completed";
  }

  if (Object.keys(planUpdates).length > 0) {
    await EMIPlan.findByIdAndUpdate(emiPlan._id, planUpdates);
  }

  return {
    updatedEmis: paymentAllocation.emisToPay.length,
    newPlanStatus: planUpdates.status || updatedPlan.status,
    emiStatus,
  };
};

// Create comprehensive payment record for EMI payments
export const createEmiPaymentRecord = async (
  paymentData,
  emiPlan,
  paymentAllocation,
  paymentDetails,
) => {
  const Payment = (await import("../Models/Payment-Model/Payment-Model.js"))
    .default;

  const payment = new Payment({
    // Basic payment info
    userId: paymentData.userId,
    courseId: paymentData.courseId,
    username: emiPlan.username,
    studentRegisterNumber: emiPlan.studentRegisterNumber,
    email: emiPlan.email,
    mobile: emiPlan.mobile || "N/A",
    CourseMotherId: emiPlan.CourseMotherId,
    courseName: emiPlan.coursename,

    // Payment details
    amount: paymentData.amount,
    currency: "INR",
    transactionId: paymentData.transactionId,
    paymentMethod: paymentData.paymentMethod || "CARD",
    paymentStatus: "completed",
    paymentGateway: "cashfree", // Migrated from razorpay
    paymentType: "emi_installment",

    // EMI specific tracking
    emiPlanId: emiPlan._id,
    emiDueDay: emiPlan.selectedDueDay,
    emiInstallments: paymentAllocation.emisToPay.map((emi) => ({
      emiId: emi.emiId,
      month: emi.month,
      monthName: emi.monthName,
      amount: emi.amount,
      dueDate: emi.dueDate,
      wasOverdue: emi.isOverdue,
    })),

    // Cashfree details (Migrated from Razorpay)
    cashfreeOrderId: paymentDetails.cashfreeOrderId,
    cashfreePaymentId: paymentDetails.cashfreePaymentId,
    cashfreePaymentSessionId: paymentDetails.cashfreePaymentSessionId,

    // Technical details
    ipAddress: paymentData.ipAddress,
    platform: paymentData.platform || "web",
    isInternational: false,
  });

  await payment.save();

  return payment;
};
