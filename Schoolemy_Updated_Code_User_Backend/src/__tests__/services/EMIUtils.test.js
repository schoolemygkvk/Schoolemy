

import {
  calculateEmiBreakdown,
  getEmiDetails,
  validateCourseForEmi,
  calculateEmiStatus,
  calculatePaymentAllocation,
} from "../../Services/EMI-Utils.js";

describe("EMI Utils", () => {
  describe("calculateEmiBreakdown", () => {
    test("calculates EMI breakdown for basic amount", () => {
      const result = calculateEmiBreakdown(10000, 18, 2, 12);
      expect(result).toHaveProperty("baseAmount", 10000);
      expect(result).toHaveProperty("gstAmount");
      expect(result).toHaveProperty("amountWithGST");
      expect(result).toHaveProperty("transactionFee");
      expect(result).toHaveProperty("finalAmount");
      expect(result).toHaveProperty("emiAmount");
    });

    test("calculates GST correctly", () => {
      const result = calculateEmiBreakdown(10000, 18, 0, 1);
      const expectedGst = 10000 * 0.18;
      expect(result.gstAmount).toBe(expectedGst);
    });

    test("calculates transaction fee correctly", () => {
      const result = calculateEmiBreakdown(10000, 0, 2, 1);
      const expectedFee = 10000 * 0.02;
      expect(result.transactionFee).toBe(expectedFee);
    });

    test("calculates EMI amount by dividing final amount by months", () => {
      const result = calculateEmiBreakdown(5000, 0, 0, 5);
      expect(result.emiAmount).toBe(1000);
    });

    test("breaks down monthly amounts correctly", () => {
      const result = calculateEmiBreakdown(10000, 18, 2, 12);
      expect(result.perMonth).toHaveProperty("courseValue");
      expect(result.perMonth).toHaveProperty("cgst");
      expect(result.perMonth).toHaveProperty("sgst");
      expect(result.perMonth).toHaveProperty("gstTotal");
      expect(result.perMonth).toHaveProperty("transactionFee");
      expect(result.perMonth).toHaveProperty("emiAmount");
    });

    test("splits GST into CGST and SGST equally", () => {
      const result = calculateEmiBreakdown(10000, 18, 0, 1);
      expect(result.perMonth.cgst).toBe(result.perMonth.sgst);
    });

    test("throws error for zero base amount", () => {
      expect(() => calculateEmiBreakdown(0, 18, 2, 12)).toThrow();
    });

    test("throws error for negative base amount", () => {
      expect(() => calculateEmiBreakdown(-5000, 18, 2, 12)).toThrow();
    });

    test("throws error for zero EMI months", () => {
      expect(() => calculateEmiBreakdown(5000, 18, 2, 0)).toThrow();
    });

    test("throws error for negative EMI months", () => {
      expect(() => calculateEmiBreakdown(5000, 18, 2, -3)).toThrow();
    });

    test("handles high-value amounts", () => {
      const result = calculateEmiBreakdown(100000, 18, 2, 24);
      expect(result.finalAmount).toBeGreaterThan(100000);
      expect(result.emiAmount).toBeGreaterThan(0);
    });

    test("maintains precision with decimal amounts", () => {
      const result = calculateEmiBreakdown(5000.50, 18, 2, 12);
      expect(result.finalAmount).toBeGreaterThan(0);
    });

    test("monthly EMI equals sum of course value + GST + transaction fee", () => {
      const result = calculateEmiBreakdown(12000, 18, 2, 12);
      const monthly = result.perMonth;
      const expectedEmi = monthly.courseValue + monthly.gstTotal + monthly.transactionFee;
      expect(Math.round(monthly.emiAmount * 100)).toBe(Math.round(expectedEmi * 100));
    });
  });

  describe("getEmiDetails", () => {
    test("returns ineligible when EMI not available", () => {
      const course = { emi: { isAvailable: false } };
      const result = getEmiDetails(course);
      expect(result.eligible).toBe(false);
      expect(result.months).toBe(0);
      expect(result.monthlyAmount).toBe(0);
    });

    test("detects EMI availability with string value \"true\"", () => {
      const course = {
        emi: {
          isAvailable: "true",
          emiDurationMonths: 12,
          monthlyAmount: 1000,
          totalAmount: 12000,
        },
      };
      const result = getEmiDetails(course);
      expect(result.eligible).toBe(true);
    });

    test("detects EMI availability with capital \"True\"", () => {
      const course = {
        emi: {
          isAvailable: "True",
          emiDurationMonths: 12,
          monthlyAmount: 1000,
          totalAmount: 12000,
        },
      };
      const result = getEmiDetails(course);
      expect(result.eligible).toBe(true);
    });

    test("parses emiDurationMonths from string", () => {
      const course = {
        emi: {
          isAvailable: true,
          emiDurationMonths: "12",
          monthlyAmount: 1000,
          totalAmount: 12000,
        },
      };
      const result = getEmiDetails(course);
      expect(result.months).toBe(12);
    });

    test("parses monthlyAmount from string", () => {
      const course = {
        emi: {
          isAvailable: true,
          emiDurationMonths: 12,
          monthlyAmount: "1000.50",
          totalAmount: 12000,
        },
      };
      const result = getEmiDetails(course);
      expect(result.baseMonthlyAmount).toBe(1000.50);
    });

    test("calculates totalAmount from monthlyAmount if not provided", () => {
      const course = {
        emi: {
          isAvailable: true,
          emiDurationMonths: 12,
          monthlyAmount: 1000,
        },
      };
      const result = getEmiDetails(course);
      expect(result.baseTotalAmount).toBe(12000);
    });

    test("includes EMI breakdown in result", () => {
      const course = {
        emi: {
          isAvailable: true,
          emiDurationMonths: 12,
          monthlyAmount: 1000,
          totalAmount: 12000,
        },
      };
      const result = getEmiDetails(course);
      expect(result.breakdown).toHaveProperty("courseValue");
      expect(result.breakdown).toHaveProperty("emiAmount");
    });

    test("includes EMI notes if available", () => {
      const course = {
        emi: {
          isAvailable: true,
          emiDurationMonths: 12,
          monthlyAmount: 1000,
          totalAmount: 12000,
          notes: "Special offer",
        },
      };
      const result = getEmiDetails(course);
      expect(result.notes).toBe("Special offer");
    });

    test("handles course without EMI config", () => {
      const course = {};
      const result = getEmiDetails(course);
      expect(result.eligible).toBe(false);
    });
  });

  describe("validateCourseForEmi", () => {
    test("throws error when EMI config not found", () => {
      const course = {};
      expect(() => validateCourseForEmi(course)).toThrow("EMI configuration");
    });

    test("throws error when EMI not available", () => {
      const course = { emi: { isAvailable: false } };
      expect(() => validateCourseForEmi(course)).toThrow();
    });

    test("returns EMI details when eligible", () => {
      const course = {
        emi: {
          isAvailable: true,
          emiDurationMonths: 12,
          monthlyAmount: 1000,
          totalAmount: 12000,
        },
      };
      const result = validateCourseForEmi(course);
      expect(result.eligible).toBe(true);
      expect(result.months).toBe(12);
    });
  });

  describe("calculateEmiStatus", () => {
    test("categorizes EMIs by status", () => {
      const emiPlan = {
        status: "active",
        totalAmount: 12000,
        emis: [
          { _id: 1, status: "paid", amount: 1000, dueDate: new Date("2024-01-01"), gracePeriodEnd: new Date("2024-02-01") },
          { _id: 2, status: "pending", amount: 1000, dueDate: new Date("2026-05-15"), gracePeriodEnd: new Date("2026-06-15") },
          { _id: 3, status: "late", amount: 1000, dueDate: new Date("2024-02-01"), gracePeriodEnd: new Date("2024-03-01") },
        ],
      };
      const result = calculateEmiStatus(emiPlan);
      expect(result.paidCount).toBe(1);
      expect(result.pendingCount).toBe(1);
      expect(result.lateCount).toBe(1);
    });

    test("identifies overdue EMIs based on dueDate", () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const emiPlan = {
        status: "active",
        totalAmount: 2000,
        emis: [
          {
            _id: 1,
            status: "pending",
            amount: 1000,
            dueDate: pastDate,
            gracePeriodEnd: new Date(),
          },
        ],
      };
      const result = calculateEmiStatus(emiPlan);
      expect(result.overdueCount).toBeGreaterThan(0);
    });

    test("identifies due EMIs within grace period", () => {
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 3);
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + 7);

      const emiPlan = {
        status: "active",
        totalAmount: 1000,
        emis: [
          {
            _id: 1,
            status: "pending",
            amount: 1000,
            dueDate: pastDate,
            gracePeriodEnd: futureDate,
          },
        ],
      };
      const result = calculateEmiStatus(emiPlan);
      expect(result.dueCount).toBe(1);
      expect(result.hasDuePayments).toBe(true);
    });

    test("calculates total amounts correctly", () => {
      const emiPlan = {
        status: "active",
        totalAmount: 5000,
        emis: [
          { _id: 1, status: "paid", amount: 1000, dueDate: new Date("2024-01-01"), gracePeriodEnd: new Date("2024-02-01") },
          { _id: 2, status: "pending", amount: 1500, dueDate: new Date("2026-05-15"), gracePeriodEnd: new Date("2026-06-15") },
          { _id: 3, status: "pending", amount: 2500, dueDate: new Date("2024-02-01"), gracePeriodEnd: new Date("2024-03-01") },
        ],
      };
      const result = calculateEmiStatus(emiPlan);
      expect(result.totalPaid).toBe(1000);
      expect(result.totalRemaining).toBe(4000);
    });

    test("indicates course access based on payment status", () => {
      const emiPlan = {
        status: "active",
        totalAmount: 2000,
        emis: [
          { _id: 1, status: "paid", amount: 1000, dueDate: new Date("2024-01-01"), gracePeriodEnd: new Date("2024-02-01") },
          { _id: 2, status: "paid", amount: 1000, dueDate: new Date("2024-02-01"), gracePeriodEnd: new Date("2024-03-01") },
        ],
      };
      const result = calculateEmiStatus(emiPlan);
      expect(result.isCurrentOnPayments).toBe(true);
      expect(result.hasAccessToContent).toBe(true);
    });

    test("blocks access when payments are due", () => {
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 5);

      const emiPlan = {
        status: "active",
        totalAmount: 1000,
        emis: [
          {
            _id: 1,
            status: "pending",
            amount: 1000,
            dueDate: pastDate,
            gracePeriodEnd: new Date(today.getTime() + 86400000),
          },
        ],
      };
      const result = calculateEmiStatus(emiPlan);
      expect(result.hasAccessToContent).toBe(false);
    });

    test("calculates next due date correctly", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const emiPlan = {
        status: "active",
        totalAmount: 2000,
        emis: [
          { _id: 1, status: "paid", amount: 1000, dueDate: new Date("2024-01-01"), gracePeriodEnd: new Date("2024-02-01") },
          { _id: 2, status: "pending", amount: 1000, dueDate: futureDate, gracePeriodEnd: new Date() },
        ],
      };
      const result = calculateEmiStatus(emiPlan);
      expect(result.nextDueDate).toBeDefined();
    });

    test("handles empty EMI array", () => {
      const emiPlan = { status: "active", totalAmount: 0, emis: [] };
      const result = calculateEmiStatus(emiPlan);
      expect(result.totalEmis).toBe(0);
      expect(result.isCurrentOnPayments).toBe(true);
    });
  });

  describe("calculatePaymentAllocation", () => {
    test("allocates payment to overdue EMIs first", () => {
      const today = new Date();
      const pastDate = new Date(today);
      pastDate.setDate(pastDate.getDate() - 10);

      const emiPlan = {
        emis: [
          {
            _id: 1,
            status: "pending",
            amount: 1000,
            month: 1,
            monthName: "April",
            dueDate: pastDate,
            gracePeriodEnd: new Date(),
          },
          {
            _id: 2,
            status: "pending",
            amount: 1000,
            month: 2,
            monthName: "May",
            dueDate: new Date(today.getTime() + 86400000 * 10),
            gracePeriodEnd: new Date(),
          },
        ],
      };

      const result = calculatePaymentAllocation(emiPlan, 1000);
      expect(result.emisToPay[0].month).toBe(1);
    });

    test("allocates payment to multiple EMIs if amount sufficient", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const emiPlan = {
        emis: [
          { _id: 1, status: "pending", amount: 1000, month: 1, monthName: "April", dueDate: futureDate, gracePeriodEnd: futureDate },
          { _id: 2, status: "pending", amount: 1000, month: 2, monthName: "May", dueDate: futureDate, gracePeriodEnd: futureDate },
        ],
      };

      const result = calculatePaymentAllocation(emiPlan, 2000);
      expect(result.emisToPay).toHaveLength(2);
      expect(result.totalAllocated).toBe(2000);
      expect(result.remainingAmount).toBe(0);
    });

    test("returns valid when payment matches EMI amounts exactly", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const emiPlan = {
        emis: [
          { _id: 1, status: "pending", amount: 1000, month: 1, monthName: "April", dueDate: futureDate, gracePeriodEnd: futureDate },
        ],
      };

      const result = calculatePaymentAllocation(emiPlan, 1000);
      expect(result.isValidAmount).toBe(true);
    });

    test("returns invalid when payment does not match EMI amounts", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const emiPlan = {
        emis: [
          { _id: 1, status: "pending", amount: 1000, month: 1, monthName: "April", dueDate: futureDate, gracePeriodEnd: futureDate },
        ],
      };

      const result = calculatePaymentAllocation(emiPlan, 1500);
      expect(result.isValidAmount).toBe(false);
    });

    test("suggests next EMI amount when partial payment made", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const emiPlan = {
        emis: [
          { _id: 1, status: "pending", amount: 1000, month: 1, monthName: "April", dueDate: futureDate, gracePeriodEnd: futureDate },
          { _id: 2, status: "pending", amount: 1500, month: 2, monthName: "May", dueDate: futureDate, gracePeriodEnd: futureDate },
        ],
      };

      const result = calculatePaymentAllocation(emiPlan, 1000);
      expect(result.nextEmiAmount).toBe(1500);
    });

    test("handles empty EMI list", () => {
      const emiPlan = { emis: [] };
      const result = calculatePaymentAllocation(emiPlan, 1000);
      expect(result.emisToPay).toHaveLength(0);
    });

    test("canPayPartial is false (partial payments disabled)", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const emiPlan = {
        emis: [
          { _id: 1, status: "pending", amount: 1000, month: 1, monthName: "April", dueDate: futureDate, gracePeriodEnd: futureDate },
        ],
      };

      const result = calculatePaymentAllocation(emiPlan, 500);
      expect(result.canPayPartial).toBe(false);
    });
  });

  describe("EMI edge cases", () => {
    test("handles EMI with single month", () => {
      const result = calculateEmiBreakdown(5000, 18, 2, 1);
      expect(result.finalAmount).toBeDefined();
      expect(result.emiAmount).toBe(result.finalAmount);
    });

    test("handles EMI with zero GST", () => {
      const result = calculateEmiBreakdown(10000, 0, 2, 12);
      expect(result.gstAmount).toBe(0);
      expect(result.amountWithGST).toBe(10000);
    });

    test("handles EMI with zero transaction fee", () => {
      const result = calculateEmiBreakdown(10000, 18, 0, 12);
      expect(result.transactionFee).toBe(0);
    });

    test("handles very long EMI duration", () => {
      const result = calculateEmiBreakdown(5000, 18, 2, 60);
      expect(result.emiAmount).toBeGreaterThan(0);
      expect(result.emiAmount).toBeLessThan(5000);
    });
  });
});
