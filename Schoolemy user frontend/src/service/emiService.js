import api from "./api";

class EMIService {
  // Get EMI status for a course
  static async getEMIStatus(courseId) {
    try {
      const response = await api.get(`/user/emi/status/${courseId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching EMI status:", error);
      throw error;
    }
  }

  // Get monthly due amount for existing EMI users
  static async getMonthlyDueAmount(courseId) {
    try {
      const response = await api.get(`/user/emi/monthly-due/${courseId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching monthly due amount:", error);
      throw error;
    }
  }

  // Get comprehensive EMI summary for user dashboard
  static async getUserEmiSummary() {
    try {
      const response = await api.get("/user/emi/summary");
      return response.data;
    } catch (error) {
      console.error("Error fetching user EMI summary:", error);
      throw error;
    }
  }

  // Get EMI due amounts and payment options
  static async getEmiDueAmounts(courseId) {
    try {
      const response = await api.get(`/user/emi/due-amounts/${courseId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching EMI due amounts:", error);
      throw error;
    }
  }

  // Pay monthly EMI for existing users
  static async payMonthlyEmi(courseId, amount) {
    try {
      const response = await api.post("/user/emi/pay-monthly", {
        courseId,
        amount,
        paymentType: "monthly",
      });
      return response.data;
    } catch (error) {
      console.error("Error processing monthly EMI payment:", error);
      throw error;
    }
  }

  // Pay overdue EMIs
  static async payOverdueEMIs(courseId, amount) {
    try {
      const response = await api.post("/user/emi/pay-overdue", {
        courseId,
        amount,
      });
      return response.data;
    } catch (error) {
      console.error("Error paying overdue EMIs:", error);
      throw error;
    }
  }

  // Get EMI details for course (existing endpoint)
  static async getEMIDetails(courseId) {
    try {
      const response = await api.get(`/user/payment/emi-details/${courseId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching EMI details:", error);
      throw error;
    }
  }

  // Enhanced course content fetch with EMI error handling
  static async getCourseContent(courseId) {
    try {
      const response = await api.get(`/courses/${courseId}/content`);
      return response.data;
    } catch (error) {
      // Handle specific EMI-related errors
      if (error.response?.status === 403) {
        const errorData = error.response.data;

        if (errorData.code === "EMI_OVERDUE") {
          throw {
            type: "EMI_OVERDUE",
            message: errorData.message,
            overdueCount: errorData.overdueCount,
          };
        }

        if (errorData.code === "PAYMENT_REQUIRED") {
          throw {
            type: "PAYMENT_REQUIRED",
            message: errorData.message,
          };
        }
      }

      console.error("Error fetching course content:", error);
      throw error;
    }
  }

  // Enhanced course details fetch with EMI error handling
  static async getCourseDetails(courseId) {
    try {
      const response = await api.get(`/courses/${courseId}`);
      return response.data;
    } catch (error) {
      // Handle specific EMI-related errors
      if (error.response?.status === 403) {
        const errorData = error.response.data;

        if (errorData.code === "EMI_OVERDUE") {
          throw {
            type: "EMI_OVERDUE",
            message: errorData.message,
            overdueCount: errorData.overdueCount,
          };
        }

        if (errorData.code === "PAYMENT_REQUIRED") {
          throw {
            type: "PAYMENT_REQUIRED",
            message: errorData.message,
          };
        }
      }

      console.error("Error fetching course details:", error);
      throw error;
    }
  }

  /**
   * Calculate EMI details based on admin course settings
   * @param {number} coursePrice - Base course price
   * @param {object} courseEmiSettings - Admin-defined EMI settings from course.emi
   * @returns {object} EMI calculation result
   */
  static calculateEMI(coursePrice, courseEmiSettings = null) {
    console.log("🔍 EMI Calculation Input:", {
      coursePrice,
      courseEmiSettings,
    });

    // Validate course price
    if (!coursePrice || typeof coursePrice !== "number" || coursePrice <= 0) {
      console.warn("❌ Invalid course price");
      return {
        eligible: false,
        reason: "Invalid course price",
        isAdminDefined: false,
      };
    }

    // Check if EMI settings exist and are valid
    if (!courseEmiSettings || typeof courseEmiSettings !== "object") {
      console.warn("❌ No EMI settings provided");
      return {
        eligible: false,
        reason: "EMI is not configured for this course",
        isAdminDefined: false,
      };
    }

    // Check if admin has enabled EMI for this course
    const isEmiAvailable =
      courseEmiSettings.isAvailable === true ||
      courseEmiSettings.isAvailable === "true" ||
      courseEmiSettings.isAvailable === "True";

    if (!isEmiAvailable) {
      console.warn("❌ EMI not enabled by admin");
      return {
        eligible: false,
        reason: "EMI option is not available for this course",
        isAdminDefined: false,
      };
    }

    // Validate admin-defined EMI configuration
    if (
      !courseEmiSettings.monthlyAmount ||
      !courseEmiSettings.emiDurationMonths
    ) {
      console.warn("❌ Incomplete EMI configuration");
      return {
        eligible: false,
        reason: "EMI configuration is incomplete",
        isAdminDefined: false,
      };
    }

    // Parse and validate admin-defined values
    const monthlyAmount =
      typeof courseEmiSettings.monthlyAmount === "string"
        ? parseFloat(courseEmiSettings.monthlyAmount)
        : courseEmiSettings.monthlyAmount;

    const emiDurationMonths =
      typeof courseEmiSettings.emiDurationMonths === "string"
        ? parseInt(courseEmiSettings.emiDurationMonths)
        : courseEmiSettings.emiDurationMonths;

    const totalAmount =
      typeof courseEmiSettings.totalAmount === "string"
        ? parseFloat(courseEmiSettings.totalAmount)
        : courseEmiSettings.totalAmount || monthlyAmount * emiDurationMonths;

    // Validate parsed values
    if (
      isNaN(monthlyAmount) ||
      isNaN(emiDurationMonths) ||
      monthlyAmount <= 0 ||
      emiDurationMonths <= 0
    ) {
      console.warn("❌ Invalid EMI values after parsing");
      return {
        eligible: false,
        reason: "Invalid EMI configuration values",
        isAdminDefined: false,
      };
    }

    const processingFee =
      typeof courseEmiSettings.processingFee === "string"
        ? parseFloat(courseEmiSettings.processingFee)
        : courseEmiSettings.processingFee || 0;

    // monthlyAmount and totalAmount from admin are BASE values (before GST/txnFee)
    // Calculate per-month GST + transaction fee breakdown
    const monthlyBase = monthlyAmount;
    const monthlyCgst = Math.round(monthlyBase * 0.09);
    const monthlySgst = Math.round(monthlyBase * 0.09);
    const monthlyGst = monthlyCgst + monthlySgst;
    const monthlyTxnFee = Math.round((monthlyBase + monthlyGst) * 0.02);
    const actualMonthlyEmi = monthlyBase + monthlyGst + monthlyTxnFee;
    const actualTotalAmount = actualMonthlyEmi * emiDurationMonths;

    console.log("✅ EMI Calculation Success:", {
      monthlyBase,
      monthlyGst,
      monthlyTxnFee,
      actualMonthlyEmi,
      actualTotalAmount,
    });

    return {
      eligible: true,
      monthlyAmount: actualMonthlyEmi,
      monthlyBase,
      tenure: emiDurationMonths,
      totalAmount: actualTotalAmount,
      baseTotalAmount: totalAmount,
      processingFee,
      basePrice: coursePrice,
      breakdown: {
        courseValue: monthlyBase,
        cgst: monthlyCgst,
        sgst: monthlySgst,
        gstTotal: monthlyGst,
        transactionFee: monthlyTxnFee,
      },
      notes: courseEmiSettings.notes || "",
      isAdminDefined: true,
      emiPerMonth: `₹${actualMonthlyEmi.toLocaleString("en-IN")}`,
      totalPayable: `₹${actualTotalAmount.toLocaleString("en-IN")}`,
    };
  }

  /**
   * Validate if a course is eligible for EMI
   * @param {object} course - Complete course object
   * @returns {object} Validation result
   */
  static validateCourseForEMI(course) {
    if (!course) {
      return {
        valid: false,
        reason: "Course data not available",
      };
    }

    // Check if course has EMI settings
    if (!course.emi) {
      return {
        valid: false,
        reason: "No EMI configuration found",
      };
    }

    // Check if EMI is enabled
    const isEmiAvailable =
      course.emi.isAvailable === true ||
      course.emi.isAvailable === "true" ||
      course.emi.isAvailable === "True";

    if (!isEmiAvailable) {
      return {
        valid: false,
        reason: "EMI not enabled for this course",
      };
    }

    // Check if required fields exist
    if (!course.emi.monthlyAmount || !course.emi.emiDurationMonths) {
      return {
        valid: false,
        reason: "Incomplete EMI configuration",
      };
    }

    return {
      valid: true,
      reason: "Course is eligible for EMI",
    };
  }

  /**
   * Get formatted EMI details for display
   * @param {object} course - Complete course object
   * @returns {object} Formatted EMI details
   */
  static getFormattedEMIDetails(course) {
    const validation = this.validateCourseForEMI(course);

    if (!validation.valid) {
      return {
        available: false,
        reason: validation.reason,
        displayText: "EMI Not Available",
      };
    }

    const emiCalculation = this.calculateEMI(
      course.price?.finalPrice,
      course.emi
    );

    if (!emiCalculation.eligible) {
      return {
        available: false,
        reason: emiCalculation.reason,
        displayText: "EMI Not Available",
      };
    }

    return {
      available: true,
      monthlyAmount: emiCalculation.monthlyAmount,
      tenure: emiCalculation.tenure,
      totalAmount: emiCalculation.totalAmount,
      processingFee: emiCalculation.processingFee,
      displayText: `₹${emiCalculation.monthlyAmount.toLocaleString(
        "en-IN"
      )}/month for ${emiCalculation.tenure} months`,
      fullDisplayText: `Pay in ${
        emiCalculation.tenure
      } easy installments of ₹${emiCalculation.monthlyAmount.toLocaleString(
        "en-IN"
      )} each`,
      notes: emiCalculation.notes,
    };
  }

  // Verify EMI payment after Razorpay success
  static async verifyEmiPayment(paymentData) {
    try {
      const response = await api.post("/user/emi/verify-payment", paymentData);
      return response.data;
    } catch (error) {
      console.error("Error verifying EMI payment:", error);
      throw error;
    }
  }

  // Check if error is EMI-related
  static isEMIError(error) {
    return error?.type === "EMI_OVERDUE" || error?.type === "PAYMENT_REQUIRED";
  }

  // Get error details for display
  static getErrorDetails(error) {
    if (error?.type === "EMI_OVERDUE") {
      return {
        code: "EMI_OVERDUE",
        message: error.message,
        overdueCount: error.overdueCount,
      };
    }

    if (error?.type === "PAYMENT_REQUIRED") {
      return {
        code: "PAYMENT_REQUIRED",
        message: error.message,
      };
    }

    return {
      code: "GENERAL_ERROR",
      message: error?.message || "An unexpected error occurred",
    };
  }
}

export default EMIService;
