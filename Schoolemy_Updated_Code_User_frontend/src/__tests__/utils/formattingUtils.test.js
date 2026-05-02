import { formatTime, formatTimerDisplay, truncateTitle, getTimerColor } from '../../pages/Course/utils/formattingUtils';

describe('formattingUtils', () => {
  describe('formatTime', () => {
    test('converts seconds to M:SS format', () => {
      expect(formatTime(65)).toBe('1:05');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(0)).toBe('0:00');
    });

    test('handles large values correctly', () => {
      expect(formatTime(3661)).toBe('61:01'); // 1 hour 1 minute 1 second
      expect(formatTime(600)).toBe('10:00'); // 10 minutes
    });

    test('pads seconds with zero when less than 10', () => {
      expect(formatTime(5)).toBe('0:05');
      expect(formatTime(125)).toBe('2:05');
    });

    test('returns 0:00 for NaN', () => {
      expect(formatTime(NaN)).toBe('0:00');
      expect(formatTime(undefined)).toBe('0:00');
    });

    test('handles decimal seconds by flooring', () => {
      expect(formatTime(65.5)).toBe('1:05');
      expect(formatTime(30.9)).toBe('0:30');
    });
  });

  describe('formatTimerDisplay', () => {
    test('formats seconds to MM:SS with padding', () => {
      expect(formatTimerDisplay(65)).toBe('01:05');
      expect(formatTimerDisplay(5)).toBe('00:05');
      expect(formatTimerDisplay(0)).toBe('00:00');
    });

    test('returns 00:00 for zero or negative values', () => {
      expect(formatTimerDisplay(0)).toBe('00:00');
      expect(formatTimerDisplay(-1)).toBe('00:00');
      expect(formatTimerDisplay(-100)).toBe('00:00');
    });

    test('pads both minutes and seconds correctly', () => {
      expect(formatTimerDisplay(3661)).toBe('61:01');
      expect(formatTimerDisplay(600)).toBe('10:00');
    });

    test('handles edge cases near hour boundary', () => {
      expect(formatTimerDisplay(3599)).toBe('59:59');
      expect(formatTimerDisplay(3600)).toBe('60:00');
    });
  });

  describe('truncateTitle', () => {
    test('returns title unchanged if 2 words or fewer', () => {
      expect(truncateTitle('React Hooks')).toBe('React Hooks');
      expect(truncateTitle('JavaScript')).toBe('JavaScript');
    });

    test('truncates titles with more than 2 words', () => {
      expect(truncateTitle('Introduction to JavaScript Programming')).toBe('Introduction to...');
      expect(truncateTitle('How to Build React Applications')).toBe('How to...');
    });

    test('returns default text for empty or null title', () => {
      expect(truncateTitle('')).toBe('Course Content');
      expect(truncateTitle(null)).toBe('Course Content');
      expect(truncateTitle(undefined)).toBe('Course Content');
    });

    test('handles titles with extra whitespace', () => {
      // Returns original title if <= 2 words, truncates if > 2 words
      expect(truncateTitle('  React   Hooks  ')).toBe('  React   Hooks  '); // 2 words, returns as-is
      expect(truncateTitle('  One  Two  Three  ')).toBe('One Two...'); // 3 words, truncates
    });

    test('handles single word title', () => {
      expect(truncateTitle('JavaScript')).toBe('JavaScript');
    });
  });

  describe('getTimerColor', () => {
    test('returns green color when time remaining > 50%', () => {
      expect(getTimerColor(600, 1000)).toBe('#28a745'); // 60% remaining > 50%
      expect(getTimerColor(510, 1000)).toBe('#28a745'); // 51% remaining > 50%
    });

    test('returns yellow color when time remaining > 25% but <= 50%', () => {
      expect(getTimerColor(400, 1000)).toBe('#ffc107'); // 40% remaining (25-50%)
      expect(getTimerColor(260, 1000)).toBe('#ffc107'); // 26% remaining (25-50%)
    });

    test('returns red color when time remaining <= 25%', () => {
      expect(getTimerColor(200, 1000)).toBe('#dc3545'); // 20% remaining < 25%
      expect(getTimerColor(0, 1000)).toBe('#dc3545'); // 0% remaining
    });

    test('returns red color for invalid total time', () => {
      expect(getTimerColor(600, 0)).toBe('#dc3545');
      expect(getTimerColor(600, -100)).toBe('#dc3545');
    });

    test('handles edge cases at 50% and 25% boundaries', () => {
      expect(getTimerColor(500, 1000)).toBe('#ffc107'); // Exactly 50% - NOT > 50%, so yellow
      expect(getTimerColor(250, 1000)).toBe('#dc3545'); // Exactly 25% - NOT > 25%, so red
    });

    test('handles very small percentages', () => {
      expect(getTimerColor(1, 3600)).toBe('#dc3545'); // < 1% remaining
    });
  });
});
