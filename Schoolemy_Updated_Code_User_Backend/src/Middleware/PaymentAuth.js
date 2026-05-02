


export const verifyPaymentAuth = (req, res, next) => {
  // This middleware assumes verifyToken has already run and set req.userId
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in to proceed with payment.",
      code: "UNAUTHENTICATED",
    });
  }

  // User is authenticated, proceed to next handler
  next();
};


export const verifyPaymentIntent = (req, res, next) => {
  const userId = req.userId;
  const { courseId, tutorCourseId, amount, paymentType } = req.body;

  // Check authentication
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please log in to proceed with payment.",
      code: "UNAUTHENTICATED",
    });
  }

  // Check payment intent (at least one course and amount provided)
  if (!courseId && !tutorCourseId) {
    return res.status(400).json({
      success: false,
      message: "Course ID is required for payment.",
      code: "MISSING_COURSE",
    });
  }

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: "Valid payment amount is required.",
      code: "INVALID_AMOUNT",
    });
  }

  if (!paymentType || !["full", "emi"].includes(paymentType)) {
    return res.status(400).json({
      success: false,
      message: "Valid payment type (full or emi) is required.",
      code: "INVALID_PAYMENT_TYPE",
    });
  }

  // All checks passed, proceed
  next();
};


export const verifyPaymentSensitiveAuth = async (req, res, next) => {
  const userId = req.userId;
  const paymentId =
    req.params?.paymentId ?? req.params?.id ?? req.body?.paymentId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required for this sensitive operation.",
      code: "UNAUTHENTICATED",
    });
  }

  if (!paymentId) {
    return res.status(400).json({
      success: false,
      message: "Payment ID is required.",
      code: "MISSING_PAYMENT_ID",
    });
  }

  // In production, you might verify the payment belongs to the user here
  // This prevents users from modifying other users' payments

  next();
};

export default {
  verifyPaymentAuth,
  verifyPaymentIntent,
  verifyPaymentSensitiveAuth,
};
