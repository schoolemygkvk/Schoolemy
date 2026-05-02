import {
  rupeesToPaise,
  paiseToRupees,
  formatRupees,
  validateAndConvertAmount,
} from '../../utils/currencyConverter';

describe('currencyConverter', () => {
  describe('rupeesToPaise', () => {
    it('converts rupees to integer paise', () => {
      expect(rupeesToPaise(10)).toBe(1000);
      expect(rupeesToPaise(0)).toBe(0);
    });

    it('throws on invalid input', () => {
      expect(() => rupeesToPaise('x')).toThrow(/valid number/i);
      expect(() => rupeesToPaise(-1)).toThrow(/negative/i);
    });
  });

  describe('paiseToRupees', () => {
    it('converts paise to rupees', () => {
      expect(paiseToRupees(1000)).toBe(10);
    });

    it('throws on invalid paise', () => {
      expect(() => paiseToRupees(NaN)).toThrow(/valid number/i);
    });
  });

  describe('formatRupees', () => {
    it('formats valid amounts', () => {
      expect(formatRupees(1000)).toMatch(/₹/);
    });

    it('returns zero display for invalid', () => {
      expect(formatRupees(NaN)).toBe('₹0.00');
    });
  });

  describe('validateAndConvertAmount', () => {
    it('returns valid conversion for good amount', () => {
      const r = validateAndConvertAmount(100, { minAmount: 1, maxAmount: 500 });
      expect(r.isValid).toBe(true);
      expect(r.amountInPaise).toBe(10000);
    });

    it('collects errors when below min', () => {
      const r = validateAndConvertAmount(0.5, { minAmount: 1 });
      expect(r.isValid).toBe(false);
      expect(r.errors.length).toBeGreaterThan(0);
    });
  });
});
