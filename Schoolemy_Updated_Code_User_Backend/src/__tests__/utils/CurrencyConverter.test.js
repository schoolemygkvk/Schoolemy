

import {
  rupeesToPaise,
  paiseToRupees,
  validateAndConvertAmount,
  getDecimalPlaces,
  amountsEqual,
} from "../../Utils/CurrencyConverter.js";

describe("CurrencyConverter Utils", () => {
  describe("rupeesToPaise", () => {
    test("converts whole rupees to paise", () => {
      expect(rupeesToPaise(100)).toBe(10000);
      expect(rupeesToPaise(1)).toBe(100);
      expect(rupeesToPaise(0)).toBe(0);
    });

    test("converts decimal rupees to paise", () => {
      expect(rupeesToPaise(5.50)).toBe(550);
      expect(rupeesToPaise(10.99)).toBe(1099);
      expect(rupeesToPaise(0.01)).toBe(1);
    });

    test("handles large amounts", () => {
      expect(rupeesToPaise(999999)).toBe(99999900);
      expect(rupeesToPaise(1000000)).toBe(100000000);
    });

    test("handles precision correctly", () => {
      expect(rupeesToPaise(1.5)).toBe(150);
      expect(rupeesToPaise(99.99)).toBe(9999);
    });
  });

  describe("paiseToRupees", () => {
    test("converts paise to rupees", () => {
      expect(paiseToRupees(10000)).toBe(100);
      expect(paiseToRupees(100)).toBe(1);
      expect(paiseToRupees(0)).toBe(0);
    });

    test("converts decimal paise to rupees", () => {
      expect(paiseToRupees(550)).toBe(5.5);
      expect(paiseToRupees(1099)).toBe(10.99);
      expect(paiseToRupees(1)).toBe(0.01);
    });

    test("handles large amounts", () => {
      expect(paiseToRupees(99999900)).toBe(999999);
      expect(paiseToRupees(100000000)).toBe(1000000);
    });
  });

  describe("validateAndConvertAmount", () => {
    test("converts positive amounts and returns valid result", () => {
      const result1 = validateAndConvertAmount(100);
      expect(result1.isValid).toBe(true);
      expect(result1.amountInPaise).toBe(10000);

      const result2 = validateAndConvertAmount(50.5);
      expect(result2.isValid).toBe(true);
      expect(result2.amountInPaise).toBe(5050);
    });

    test("rejects negative amounts", () => {
      const result1 = validateAndConvertAmount(-100);
      expect(result1.isValid).toBe(false);
      expect(result1.errors.length).toBeGreaterThan(0);

      const result2 = validateAndConvertAmount(-0.01);
      expect(result2.isValid).toBe(false);
    });

    test("rejects zero amount when minimum is set", () => {
      const result = validateAndConvertAmount(0, { minAmount: 0.01 });
      expect(result.isValid).toBe(false);
    });

    test("rejects amounts exceeding maximum limit", () => {
      const result = validateAndConvertAmount(10000000, { maxAmount: 1000000 });
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("validates decimal precision (max 2 places)", () => {
      const result1 = validateAndConvertAmount(99.99);
      expect(result1.isValid).toBe(true);
      expect(result1.amountInPaise).toBe(9999);

      const result2 = validateAndConvertAmount(99.999);
      expect(result2.isValid).toBe(true); // rupeesToPaise rounds it
    });

    test("accepts valid EMI amounts", () => {
      const result1 = validateAndConvertAmount(5000);
      expect(result1.isValid).toBe(true);
      expect(result1.amountInPaise).toBe(500000);

      const result2 = validateAndConvertAmount(7500.50);
      expect(result2.isValid).toBe(true);
      expect(result2.amountInPaise).toBe(750050);
    });

    test("respects minimum amount rule", () => {
      const result = validateAndConvertAmount(100, { minAmount: 500 });
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Minimum");
    });

    test("respects maximum amount rule", () => {
      const result = validateAndConvertAmount(1000, { maxAmount: 500 });
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain("Maximum");
    });

    test("handles non-numeric input", () => {
      const result = validateAndConvertAmount("100");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("getDecimalPlaces", () => {
    test("returns correct decimal places", () => {
      expect(getDecimalPlaces(10)).toBe(0);
      expect(getDecimalPlaces(10.5)).toBe(1);
      expect(getDecimalPlaces(10.50)).toBe(1);
      expect(getDecimalPlaces(10.99)).toBe(2);
    });

    test("handles edge cases", () => {
      expect(getDecimalPlaces(0.01)).toBe(2);
      expect(getDecimalPlaces(0.1)).toBe(1);
      expect(getDecimalPlaces(0)).toBe(0);
    });
  });

  describe("amountsEqual", () => {
    test("compares equal amounts correctly", () => {
      expect(amountsEqual(100, 100)).toBe(true);
      expect(amountsEqual(50.5, 50.5)).toBe(true);
    });

    test("detects unequal amounts", () => {
      expect(amountsEqual(100, 100.01)).toBe(false);
      expect(amountsEqual(50.5, 50.6)).toBe(false);
    });

    test("handles precision correctly", () => {
      expect(amountsEqual(10.00, 10)).toBe(true);
      // Default tolerance is 0.01, so 0.001 difference is considered equal
      expect(amountsEqual(10.001, 10)).toBe(true);
      // But 0.05 difference should be detected
      expect(amountsEqual(10.05, 10)).toBe(false);
    });

    test("compares paise amounts", () => {
      expect(amountsEqual(10000, 10000)).toBe(true);
      expect(amountsEqual(10000, 10000.005)).toBe(true); // 0.005 difference < 0.01 tolerance
      expect(amountsEqual(10000, 10000.05)).toBe(false); // 0.05 difference > 0.01 tolerance
    });
  });

  describe("Round-trip conversions", () => {
    test("rupees → paise → rupees maintains value", () => {
      const original = 99.99;
      const paise = rupeesToPaise(original);
      const converted = paiseToRupees(paise);
      expect(amountsEqual(converted, original)).toBe(true);
    });

    test("handles multiple conversions", () => {
      let amount = 500;
      for (let i = 0; i < 10; i++) {
        amount = paiseToRupees(rupeesToPaise(amount));
      }
      expect(amountsEqual(amount, 500)).toBe(true);
    });
  });
});
