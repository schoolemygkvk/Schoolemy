import {
  sanitizeSearchInput,
  validateSearchInput,
  getSafeSearchDisplay,
  logSearchActivity,
  sanitizeSearchResults,
} from '../../utils/searchSanitizer';
import {
  safeJsonParse,
  getSafeStorageItem,
  setSafeStorageItem,
  getStorageParseErrorLog,
  clearStorageParseErrorLog,
} from '../../utils/safeStorageParser';

describe('searchSanitizer', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sanitizes and validates search input', () => {
    expect(sanitizeSearchInput('  hello  ')).toBeTruthy();
    expect(validateSearchInput('ab')).toEqual(expect.objectContaining({ isValid: expect.any(Boolean) }));
    expect(typeof getSafeSearchDisplay('<script>x</script>')).toBe('string');
  });

  it('logSearchActivity is safe', () => {
    expect(() => logSearchActivity('q', { page: 'home' })).not.toThrow();
  });

  it('sanitizeSearchResults handles array', () => {
    expect(Array.isArray(sanitizeSearchResults([{ title: 'A' }]))).toBe(true);
  });
});

describe('safeStorageParser', () => {
  beforeEach(() => {
    localStorage.clear();
    clearStorageParseErrorLog();
  });

  it('safeJsonParse parses valid JSON', () => {
    expect(safeJsonParse('{"a":1}', {}).a).toBe(1);
    expect(safeJsonParse('not json', { x: 1 }).x).toBe(1);
  });

  it('getSafeStorageItem and setSafeStorageItem round-trip', () => {
    setSafeStorageItem('k', { v: 2 });
    const v = getSafeStorageItem('k', null, 'test');
    expect(v).toEqual({ v: 2 });
  });

  it('error log accessors', () => {
    expect(Array.isArray(getStorageParseErrorLog())).toBe(true);
    clearStorageParseErrorLog();
  });
});
