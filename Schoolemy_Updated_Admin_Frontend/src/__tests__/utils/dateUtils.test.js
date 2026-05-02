import { formatDate } from '../../Utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('returns "N/A" when dateString is null', () => {
      expect(formatDate(null)).toBe('N/A');
    });

    it('returns "N/A" when dateString is undefined', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });

    it('returns "N/A" when dateString is empty string', () => {
      expect(formatDate('')).toBe('N/A');
    });

    it('formats valid ISO date string correctly', () => {
      const result = formatDate('2025-04-20T10:30:00Z');
      // en-US locale + local timezone: date parts stable; clock time varies by TZ
      expect(result).toMatch(/Apr/);
      expect(result).toMatch(/20/);
      expect(result).toMatch(/2025/);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('formats Date object correctly', () => {
      const date = new Date('2025-04-20T10:30:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/Apr/);
      expect(result).toMatch(/20/);
      expect(result).toMatch(/2025/);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });

    it('returns "N/A" for invalid date string', () => {
      expect(formatDate('invalid-date')).toBe('N/A');
    });

    it('returns "N/A" for malformed date string', () => {
      expect(formatDate('2025-13-45')).toBe('N/A');
    });

    it('respects custom date format options', () => {
      const customOpts = {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
      };
      const result = formatDate('2025-04-20', customOpts);
      expect(result).toMatch(/04\/20\/25|25\/04\/20/);
    });

    it('handles dates without time component', () => {
      const result = formatDate('2025-04-20');
      expect(result).toMatch(/Apr.*20.*2025/);
    });

    it('uses default options when opts is not provided', () => {
      const result = formatDate('2025-04-20T10:30:00Z');
      expect(result).toContain('Apr');
      expect(result).toContain('20');
      expect(result).toContain('2025');
    });

    it('handles edge case: Unix timestamp', () => {
      const timestamp = 1713607800000; // April 20, 2024
      const result = formatDate(new Date(timestamp));
      expect(result).not.toBe('N/A');
      expect(result).toContain('Apr');
    });

    it('handles very old dates', () => {
      const result = formatDate('1900-01-01');
      expect(result).toMatch(/Jan.*1.*1900/);
    });

    it('handles future dates', () => {
      const result = formatDate('2099-12-31');
      expect(result).toMatch(/Dec.*31.*2099/);
    });
  });
});
