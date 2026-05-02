

import {
  paymentValidationRules,
  validatePayment,
  checkEmiEligibility,
  getValidationErrorMessage,
  getValidationWarnings,
  formatValidationError,
} from "../../Utils/PaymentValidation.js";

describe("PaymentValidation Utils", () => {
  describe("paymentValidationRules", () => {
    test("defines rules for regular course", () => {
      expect(paymentValidationRules.regular).toHaveProperty("minAmount");
      expect(paymentValidationRules.regular).toHaveProperty("maxAmount");
      expect(paymentValidationRules.regular.allowEMI).toBe(false);
      expect(paymentValidationRules.regular.allowFull).toBe(true);
    });

    test("defines rules for emi course", () => {
      expect(paymentValidationRules.emi).toHaveProperty("allowEMI", true);
      expect(paymentValidationRules.emi).toHaveProperty("minEmiAmount");
    });

    test("defines rules for tutor course", () => {
      expect(paymentValidationRules.tutor).toHaveProperty("allowEMI", false);
      expect(paymentValidationRules.tutor).toHaveProperty("allowFull", true);
    });
  });

  describe("validatePayment", () => {
    test("validates full payment for regular course", () => {
      const payment = {
        courseType: "regular",
        amount: 5000,
        paymentType: "full",
      };
      const result = validatePayment(payment);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("rejects payment with invalid course type", () => {
      const payment = {
        courseType: "invalid_type",
        amount: 5000,
        paymentType: "full",
      };
      const result = validatePayment(payment);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("rejects payment with invalid amount", () => {
      const payment = {
        courseType: "regular",
        amount: -1000,
        paymentType: "full",
      };
      const result = validatePayment(payment);
      expect(result.isValid).toBe(false);
    });

    test("rejects payment below minimum amount", () => {
      const payment = {
        courseType: "regular",
        amount: 50, // Below minimum 100
        paymentType: "full",
      };
      const result = validatePayment(payment);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Minimum");
    });

    test("rejects payment above maximum amount", () => {
      const payment = {
        courseType: "regular",
        amount: 200000, // Above maximum 100000
        paymentType: "full",
      };
      const result = validatePayment(payment);
      expect(result.isValid).toBe(false);
    });

    test("validates EMI payment for emi course", () => {
      const payment = {
        courseType: "emi",
        amount: 12000,
        paymentType: "emi",
        emiDueDay: 15,
      };
      const result = validatePayment(payment);
      expect(result.isValid).toBe(true);
    });

    test("rejects EMI for non-EMI course type", () => {
      const payment = {
        courseType: "tutor",
        amount: 5000,
        paymentType: "emi",
        emiDueDay: 15,
      };
      const result = validatePayment(payment);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("not available");
    });

    test("rejects invalid payment type", () => {
      const payment = {
        courseType: "regular",
        amount: 5000,
        paymentType: "invalid_type",
      };
      const result = validatePayment(payment);
      expect(result.isValid).toBe(false);
    });

    test("rejects EMI with invalid due day", () => {
      const payment = {
        courseType: "emi",
        amount: 12000,
        paymentType: "emi",
        emiDueDay: 32, // Invalid: must be 1-31
      };
      const result = validatePayment(payment);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("due day");
    });

    test("returns amountInPaise when valid", () => {
      const payment = {
        courseType: "regular",
        amount: 1000,
        paymentType: "full",
      };
      const result = validatePayment(payment);
      expect(result.amountInPaise).toBe(100000);
    });
  });

  describe("checkEmiEligibility", () => {
    test("allows EMI for emi course with sufficient amount", () => {
      const result = checkEmiEligibility({
        courseType: "emi",
        amount: 10000,
      });
      expect(result.isEligible).toBe(true);
    });

    test("blocks EMI for non-EMI course type", () => {
      const result = checkEmiEligibility({
        courseType: "regular",
        amount: 10000,
      });
      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain("not support EMI");
    });

    test("blocks EMI for emi course with insufficient amount", () => {
      const result = checkEmiEligibility({
        courseType: "emi",
        amount: 400, // Below minimum 500
      });
      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain("too low");
    });

    test("includes minimum amount in result", () => {
      const result = checkEmiEligibility({
        courseType: "emi",
        amount: 400,
      });
      expect(result.minAmount).toBeDefined();
    });

    test("calculates monthly EMI estimate", () => {
      const result = checkEmiEligibility({
        courseType: "emi",
        amount: 12000,
      });
      expect(result.minMonthlyEmi).toBeDefined();
      expect(result.minMonthlyEmi).toBeGreaterThan(0);
    });

    test("handles invalid course type", () => {
      const result = checkEmiEligibility({
        courseType: "invalid",
        amount: 10000,
      });
      expect(result.isEligible).toBe(false);
      expect(result.reason).toContain("Invalid");
    });
  });

  describe("getValidationErrorMessage", () => {
    test("returns null for valid validation", () => {
      const validation = { isValid: true };
      const message = getValidationErrorMessage(validation);
      expect(message).toBeNull();
    });

    test("returns first error message", () => {
      const validation = {
        isValid: false,
        errors: ["Error 1", "Error 2"],
      };
      const message = getValidationErrorMessage(validation);
      expect(message).toBe("Error 1");
    });

    test("returns generic message when no errors array", () => {
      const validation = { isValid: false };
      const message = getValidationErrorMessage(validation);
      expect(message).toBe("Payment validation failed");
    });

    test("returns empty errors default message", () => {
      const validation = {
        isValid: false,
        errors: [],
      };
      const message = getValidationErrorMessage(validation);
      expect(message).toBe("Payment validation failed");
    });
  });

  describe("getValidationWarnings", () => {
    test("returns warnings array when present", () => {
      const validation = {
        warnings: ["Warning 1", "Warning 2"],
      };
      const warnings = getValidationWarnings(validation);
      expect(warnings).toHaveLength(2);
    });

    test("returns empty array when no warnings", () => {
      const validation = {};
      const warnings = getValidationWarnings(validation);
      expect(Array.isArray(warnings)).toBe(true);
      expect(warnings.length).toBe(0);
    });
  });

  describe("formatValidationError", () => {
    test("formats validation result correctly", () => {
      const validation = {
        isValid: false,
        errors: ["Error 1"],
        warnings: ["Warning 1"],
        amountInPaise: 100000,
      };
      const formatted = formatValidationError(validation);
      expect(formatted).toHaveProperty("isValid", false);
      expect(formatted).toHaveProperty("errors");
      expect(formatted).toHaveProperty("warnings");
      expect(formatted).toHaveProperty("amountInPaise", 100000);
    });

    test("includes context in formatted error", () => {
      const validation = { isValid: false, errors: [] };
      const context = { courseId: "course123" };
      const formatted = formatValidationError(validation, context);
      expect(formatted.context).toEqual(context);
    });

    test("includes empty context by default", () => {
      const validation = { isValid: true, errors: [] };
      const formatted = formatValidationError(validation);
      expect(formatted.context).toEqual({});
    });
  });

  describe("Integration scenarios", () => {
    test("validates complete EMI payment flow", () => {
      const payment = {
        courseType: "emi",
        amount: 12000,
        paymentType: "emi",
        emiDueDay: 15,
      };

      const validation = validatePayment(payment);
      expect(validation.isValid).toBe(true);

      const emiEligibility = checkEmiEligibility({
        courseType: payment.courseType,
        amount: payment.amount,
      });
      expect(emiEligibility.isEligible).toBe(true);

      const warnings = getValidationWarnings(validation);
      expect(Array.isArray(warnings)).toBe(true);
    });

    test("rejects invalid payment with proper error messaging", () => {
      const payment = {
        courseType: "regular",
        amount: -5000,
        paymentType: "full",
      };

      const validation = validatePayment(payment);
      expect(validation.isValid).toBe(false);

      const errorMessage = getValidationErrorMessage(validation);
      expect(errorMessage).toBeTruthy();
      expect(typeof errorMessage).toBe("string");
    });

    test("handles regular course full payment", () => {
      const payment = {
        courseType: "regular",
        amount: 5000,
        paymentType: "full",
      };

      const validation = validatePayment(payment);
      expect(validation.isValid).toBe(true);
      expect(validation.amountInPaise).toBe(500000);
    });
  });
});
