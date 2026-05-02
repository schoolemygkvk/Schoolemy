import { getLessonUnlockDate, formatUnlockDate, isUnlocked, daysUntilUnlock } from '../../pages/Course/utils/dateUtils';

describe('dateUtils', () => {
  describe('getLessonUnlockDate', () => {
    test('returns null for lesson 0 (first lesson)', () => {
      const purchaseDate = new Date('2026-04-01');
      expect(getLessonUnlockDate(0, purchaseDate)).toBeNull();
    });

    test('returns null when purchase date is null', () => {
      expect(getLessonUnlockDate(5, null)).toBeNull();
      expect(getLessonUnlockDate(5, undefined)).toBeNull();
    });

    test('calculates correct unlock date for lesson 1 (first Mon/Wed/Fri on or after purchase)', () => {
      const purchaseDate = new Date(2026, 3, 1); // Wednesday Apr 1, 2026 local
      const result = getLessonUnlockDate(1, purchaseDate);
      expect(result).not.toBeNull();
      expect(result.getDate()).toBe(1);
      expect(result.getMonth()).toBe(3);
      expect(result.getFullYear()).toBe(2026);
      expect([1, 3, 5]).toContain(result.getDay());
    });

    test('uses Mon/Wed/Fri sequence for lesson index (not calendar days)', () => {
      const purchaseDate = new Date(2026, 3, 1); // Wed — lesson 3 is 3rd MWF: Apr 6
      const lesson3 = getLessonUnlockDate(3, purchaseDate);
      expect(lesson3.getDate()).toBe(6);
      expect(lesson3.getMonth()).toBe(3);
      expect([1, 3, 5]).toContain(lesson3.getDay());
    });

    test('handles unlock dates correctly even with time in purchase date', () => {
      const purchaseDate = new Date('2026-04-01T15:30:00');
      const result = getLessonUnlockDate(1, purchaseDate);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });

    test('accepts ISO string as purchase date', () => {
      const result = getLessonUnlockDate(2, '2026-04-01');
      expect(result).not.toBeNull();
      expect([1, 3, 5]).toContain(result.getDay());
    });

    test('handles month boundaries correctly (next MWF may be in the next month)', () => {
      const purchaseDate = new Date(2026, 2, 31); // Tue Mar 31, 2026 local — 2nd MWF is Fri Apr 3
      const result = getLessonUnlockDate(2, purchaseDate);
      expect(result.getDate()).toBe(3);
      expect(result.getMonth()).toBe(3);
      expect(result.getDay()).toBe(5);
    });
  });

  describe('formatUnlockDate', () => {
    test('returns empty string for null date', () => {
      expect(formatUnlockDate(null)).toBe('');
      expect(formatUnlockDate(undefined)).toBe('');
    });

    test('formats date correctly', () => {
      const date = new Date('2026-04-14');
      const result = formatUnlockDate(date);
      expect(result).toContain('April');
      expect(result).toContain('14');
      expect(result).toContain('2026');
    });

    test('includes day of week in formatted string', () => {
      const date = new Date('2026-04-14'); // This is a Tuesday
      const result = formatUnlockDate(date);
      expect(result).toContain('Tuesday');
    });

    test('formats different dates correctly', () => {
      const date1 = new Date('2026-01-01');
      const result1 = formatUnlockDate(date1);
      expect(result1).toContain('January');
      expect(result1).toContain('1');

      const date2 = new Date('2026-12-31');
      const result2 = formatUnlockDate(date2);
      expect(result2).toContain('December');
      expect(result2).toContain('31');
    });
  });

  describe('isUnlocked', () => {
    test('returns true for null unlock date', () => {
      expect(isUnlocked(null)).toBe(true);
      expect(isUnlocked(undefined)).toBe(true);
    });

    test('returns true if unlock date is today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(isUnlocked(today)).toBe(true);
    });

    test('returns true if unlock date is in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isUnlocked(yesterday)).toBe(true);
    });

    test('returns false if unlock date is in the future', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isUnlocked(tomorrow)).toBe(false);
    });

    test('ignores time portion of date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(12, 30, 45);
      expect(isUnlocked(futureDate)).toBe(false);
    });

    test('handles edge case at midnight', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(isUnlocked(today)).toBe(true);
    });
  });

  describe('daysUntilUnlock', () => {
    test('returns 0 for null unlock date', () => {
      expect(daysUntilUnlock(null)).toBe(0);
      expect(daysUntilUnlock(undefined)).toBe(0);
    });

    test('returns 0 for today', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(daysUntilUnlock(today)).toBe(0);
    });

    test('returns 1 for tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      expect(daysUntilUnlock(tomorrow)).toBe(1);
    });

    test('returns correct days for future dates', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      future.setHours(0, 0, 0, 0);
      expect(daysUntilUnlock(future)).toBe(5);
    });

    test('returns negative for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      expect(daysUntilUnlock(yesterday)).toBe(-1);
    });

    test('returns 0 or negative for past dates', () => {
      const past = new Date();
      past.setDate(past.getDate() - 3);
      expect(daysUntilUnlock(past)).toBeLessThanOrEqual(0);
    });

    test('calculates days correctly even with time portion set', () => {
      const tomorrowAfternoon = new Date();
      tomorrowAfternoon.setDate(tomorrowAfternoon.getDate() + 1);
      tomorrowAfternoon.setHours(15, 30, 0);
      // Since time is set, daysUntilUnlock will calculate more than 1 day and ceil it
      const result = daysUntilUnlock(tomorrowAfternoon);
      expect(result).toBeGreaterThanOrEqual(1);
    });
  });
});
