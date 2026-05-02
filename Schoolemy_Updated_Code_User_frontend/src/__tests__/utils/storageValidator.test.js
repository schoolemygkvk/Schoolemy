import {
  validateString,
  validateNumber,
  validateBoolean,
  validateArray,
  validateObject,
  getStorageString,
  getStorageNumber,
  getStorageBoolean,
  validateEmail,
  getStorageEmail,
  validatePhoneNumber,
  getStoragePhone,
  validateUUID,
  getStorageUUID,
} from '../../utils/storageValidator';

describe('storageValidator', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('validateString coerces types', () => {
    expect(validateString(null, 'x')).toBe('x');
    expect(validateString('ab')).toBe('ab');
  });

  it('validateNumber enforces numbers', () => {
    expect(validateNumber('3', 0)).toBe(3);
    expect(validateNumber('bad', 7)).toBe(7);
  });

  it('validateBoolean parses booleans', () => {
    expect(validateBoolean('true', false)).toBe(true);
    expect(validateBoolean(0, true)).toBe(true);
  });

  it('validateArray returns arrays', () => {
    expect(validateArray([1], [])).toEqual([1]);
    expect(validateArray('{}', [])).toEqual([]);
  });

  it('validateObject returns objects', () => {
    expect(validateObject({ a: 1 }, {})).toEqual({ a: 1 });
  });

  it('getStorage helpers read localStorage', () => {
    localStorage.setItem('s', 'hello');
    localStorage.setItem('n', '42');
    localStorage.setItem('b', 'true');
    expect(getStorageString('s', '')).toBe('hello');
    expect(getStorageNumber('n', 0)).toBe(42);
    expect(getStorageBoolean('b', false)).toBe(true);
  });

  it('email and phone validators', () => {
    expect(validateEmail('a@b.com', '')).toMatch(/@/);
    localStorage.setItem('e', 'x@y.co');
    expect(getStorageEmail('e', '')).toContain('@');
    expect(validatePhoneNumber('9876543210', '')).toBeTruthy();
    localStorage.setItem('p', '9876543210');
    expect(getStoragePhone('p', '')).toBeTruthy();
  });

  it('uuid validators', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    expect(validateUUID(id, '')).toBe(id);
    localStorage.setItem('u', id);
    expect(getStorageUUID('u', '')).toBe(id);
  });
});
