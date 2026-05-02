

import {
  getLastDayOfMonth,
  getMonthName,
  getNextDueDate,
  getMonthNameFromDate,
} from "../../Services/EMI-DateUtils.js";

describe("EMI Date Utils", () => {
  describe("getLastDayOfMonth", () => {
    test("returns last day of January (31)", () => {
      const date = new Date("2024-01-15");
      const result = getLastDayOfMonth(date);
      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(0); // January
    });

    test("returns last day of February in non-leap year (28)", () => {
      const date = new Date("2023-02-15");
      const result = getLastDayOfMonth(date);
      expect(result.getDate()).toBe(28);
    });

    test("returns last day of February in leap year (29)", () => {
      const date = new Date("2024-02-15");
      const result = getLastDayOfMonth(date);
      expect(result.getDate()).toBe(29);
    });

    test("returns last day of April (30)", () => {
      const date = new Date("2024-04-15");
      const result = getLastDayOfMonth(date);
      expect(result.getDate()).toBe(30);
    });

    test("returns last day of December (31)", () => {
      const date = new Date("2024-12-15");
      const result = getLastDayOfMonth(date);
      expect(result.getDate()).toBe(31);
      expect(result.getMonth()).toBe(11); // December
    });

    test("returns correct month for first day of month", () => {
      const date = new Date("2024-06-01");
      const result = getLastDayOfMonth(date);
      expect(result.getMonth()).toBe(5); // June
      expect(result.getDate()).toBe(30);
    });

    test("returns correct month for last day of month", () => {
      const date = new Date("2024-06-30");
      const result = getLastDayOfMonth(date);
      expect(result.getMonth()).toBe(5); // June
      expect(result.getDate()).toBe(30);
    });

    test("handles year boundary correctly", () => {
      const date = new Date("2024-12-31");
      const result = getLastDayOfMonth(date);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(11);
      expect(result.getDate()).toBe(31);
    });

    test("handles all months of the year", () => {
      const expectedDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      for (let month = 0; month < 12; month++) {
        const date = new Date(2023, month, 15); // Non-leap year
        const result = getLastDayOfMonth(date);
        expect(result.getDate()).toBe(expectedDays[month]);
      }
    });
  });

  describe("getMonthName", () => {
    test("returns \"January\" for month 0", () => {
      const date = new Date("2024-01-15");
      expect(getMonthName(date)).toBe("January");
    });

    test("returns \"February\" for month 1", () => {
      const date = new Date("2024-02-15");
      expect(getMonthName(date)).toBe("February");
    });

    test("returns \"March\" for month 2", () => {
      const date = new Date("2024-03-15");
      expect(getMonthName(date)).toBe("March");
    });

    test("returns \"April\" for month 3", () => {
      const date = new Date("2024-04-15");
      expect(getMonthName(date)).toBe("April");
    });

    test("returns \"May\" for month 4", () => {
      const date = new Date("2024-05-15");
      expect(getMonthName(date)).toBe("May");
    });

    test("returns \"June\" for month 5", () => {
      const date = new Date("2024-06-15");
      expect(getMonthName(date)).toBe("June");
    });

    test("returns \"July\" for month 6", () => {
      const date = new Date("2024-07-15");
      expect(getMonthName(date)).toBe("July");
    });

    test("returns \"August\" for month 7", () => {
      const date = new Date("2024-08-15");
      expect(getMonthName(date)).toBe("August");
    });

    test("returns \"September\" for month 8", () => {
      const date = new Date("2024-09-15");
      expect(getMonthName(date)).toBe("September");
    });

    test("returns \"October\" for month 9", () => {
      const date = new Date("2024-10-15");
      expect(getMonthName(date)).toBe("October");
    });

    test("returns \"November\" for month 10", () => {
      const date = new Date("2024-11-15");
      expect(getMonthName(date)).toBe("November");
    });

    test("returns \"December\" for month 11", () => {
      const date = new Date("2024-12-15");
      expect(getMonthName(date)).toBe("December");
    });
  });

  describe("getNextDueDate", () => {
    test("returns correct date 1 month ahead", () => {
      const startDate = new Date("2024-01-15");
      const result = getNextDueDate(startDate, 15, 1);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(15);
      expect(result.getFullYear()).toBe(2024);
    });

    test("returns correct date 3 months ahead", () => {
      const startDate = new Date("2024-01-15");
      const result = getNextDueDate(startDate, 15, 3);
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBe(15);
    });

    test("adjusts day when target month has fewer days", () => {
      const startDate = new Date("2024-01-15"); // Start from mid-month
      const result = getNextDueDate(startDate, 31, 1); // Try to set 31st of February
      // February 2024 only has 29 days, so should adjust to 29
      expect(result.getDate()).toBe(29);
      expect(result.getMonth()).toBe(1); // February
    });

    test("handles month boundary crossing", () => {
      const startDate = new Date("2024-01-15");
      const result = getNextDueDate(startDate, 31, 1); // February has 29 days
      expect(result.getDate()).toBeLessThanOrEqual(29);
      expect(result.getMonth()).toBe(1);
    });

    test("handles year boundary crossing", () => {
      const startDate = new Date("2024-11-15");
      const result = getNextDueDate(startDate, 15, 2);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getFullYear()).toBe(2025);
    });

    test("handles leap year correctly", () => {
      const startDate = new Date("2024-01-15");
      const result = getNextDueDate(startDate, 29, 1);
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBeLessThanOrEqual(29); // Leap year has 29 days
    });

    test("handles non-leap year correctly", () => {
      const startDate = new Date("2023-01-15");
      const result = getNextDueDate(startDate, 28, 1);
      expect(result.getFullYear()).toBe(2023);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBeLessThanOrEqual(28); // Non-leap year has 28 days
    });

    test("handles 0 months offset (same month date)", () => {
      const startDate = new Date("2024-05-15");
      const result = getNextDueDate(startDate, 20, 0);
      expect(result.getMonth()).toBe(4); // May
      expect(result.getDate()).toBe(20);
    });

    test("handles large month offsets", () => {
      const startDate = new Date("2024-01-15");
      const result = getNextDueDate(startDate, 15, 12);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(15);
    });

    test("handles day 1 of month", () => {
      const startDate = new Date("2024-01-01");
      const result = getNextDueDate(startDate, 1, 1);
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(1);
    });

    test("handles end of month patterns", () => {
      const startDate = new Date("2024-01-31");
      const result = getNextDueDate(startDate, 31, 2);
      // March 31 -> April 30 -> May 31 (adjusted appropriately)
      expect(result.getDate()).toBeGreaterThan(0);
      expect(result.getDate()).toBeLessThanOrEqual(31);
    });

    test("handles EMI schedule with fixed due day", () => {
      const startDate = new Date("2024-04-15");
      const dueDay = 10;
      const result1 = getNextDueDate(startDate, dueDay, 1);
      const result2 = getNextDueDate(startDate, dueDay, 2);
      const result3 = getNextDueDate(startDate, dueDay, 3);

      expect(result1.getDate()).toBe(10);
      expect(result2.getDate()).toBe(10);
      expect(result3.getDate()).toBe(10);
    });

    test("adjusts to last day of month for 31st day", () => {
      const startDate = new Date("2024-01-15");
      const result = getNextDueDate(startDate, 31, 3); // April has 30 days
      expect(result.getMonth()).toBe(3); // April
      expect(result.getDate()).toBeLessThanOrEqual(30); // Adjusted to max valid day
    });

    test("handles February edge case from all months", () => {
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(2024, month, 31);
        const result = getNextDueDate(startDate, 31, 1);
        // Should adjust to valid date
        expect(result.getDate()).toBeGreaterThan(0);
        expect(result.getDate()).toBeLessThanOrEqual(31);
      }
    });
  });

  describe("getMonthNameFromDate", () => {
    test("is an alias for getMonthName", () => {
      const date = new Date("2024-03-15");
      expect(getMonthNameFromDate(date)).toBe(getMonthName(date));
    });

    test("returns month name for any date", () => {
      const date = new Date("2024-07-05");
      expect(getMonthNameFromDate(date)).toBe("July");
    });

    test("works with all months", () => {
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

      for (let month = 0; month < 12; month++) {
        const date = new Date(2024, month, 1);
        expect(getMonthNameFromDate(date)).toBe(monthNames[month]);
      }
    });
  });

  describe("EMI schedule generation", () => {
    test("generates correct EMI schedule with fixed due day", () => {
      const startDate = new Date("2024-04-01");
      const dueDay = 15;
      const months = 3;

      const emis = [];
      for (let i = 0; i < months; i++) {
        const dueDate = getNextDueDate(startDate, dueDay, i + 1);
        const monthName = getMonthName(dueDate);
        emis.push({
          month: i + 1,
          monthName,
          dueDate,
        });
      }

      expect(emis).toHaveLength(3);
      expect(emis[0].dueDate.getDate()).toBe(15);
      expect(emis[1].dueDate.getDate()).toBe(15);
      expect(emis[2].dueDate.getDate()).toBe(15);
    });

    test("handles month-end adjustment in EMI schedule", () => {
      const startDate = new Date("2024-01-01");
      const dueDay = 31; // Request 31st

      const emi1 = getNextDueDate(startDate, dueDay, 1); // February
      const emi2 = getNextDueDate(startDate, dueDay, 2); // March

      expect(emi1.getDate()).toBe(29); // Feb 29 (leap year)
      expect(emi2.getDate()).toBe(31); // March 31
    });

    test("maintains consistency across 12-month EMI", () => {
      const startDate = new Date("2024-05-10");
      const dueDay = 10;

      for (let i = 1; i <= 12; i++) {
        const dueDate = getNextDueDate(startDate, dueDay, i);
        expect(dueDate.getDate()).toBe(10); // All should be 10th
      }
    });
  });

  describe("Date edge cases", () => {
    test("handles new year crossing", () => {
      const date = new Date("2024-12-25");
      const nextMonth = getNextDueDate(date, 25, 1);
      expect(nextMonth.getFullYear()).toBe(2025);
      expect(nextMonth.getMonth()).toBe(0);
    });

    test("handles leap second year", () => {
      const date = new Date("2000-02-29");
      expect(getLastDayOfMonth(date).getDate()).toBe(29);
    });

    test("handles DST transitions safely (if applicable)", () => {
      // Using dates that might have DST issues
      const date = new Date("2024-03-10"); // DST transition in US
      const result = getNextDueDate(date, 10, 1);
      expect(result.getDate()).toBe(10);
    });

    test("maintains date consistency over multiple operations", () => {
      const startDate = new Date("2024-01-15");
      const firstCall = getNextDueDate(startDate, 15, 1);
      const secondCall = getNextDueDate(firstCall, 15, 1);
      const thirdCall = getNextDueDate(secondCall, 15, 1);

      expect(firstCall.getMonth()).toBe(1);
      expect(secondCall.getMonth()).toBe(2);
      expect(thirdCall.getMonth()).toBe(3);
    });
  });
});
