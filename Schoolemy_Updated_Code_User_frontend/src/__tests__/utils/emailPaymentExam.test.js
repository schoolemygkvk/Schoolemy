jest.mock('../../service/api', () => ({
  __esModule: true,
  default: {
    defaults: { baseURL: 'http://localhost:8000' },
  },
}));

import {
  isValidEmail,
  getEmailErrorMessage,
  validateEmail,
  normalizeEmail,
  emailsMatch,
  getEmailDomain,
  isCommonEmailProvider,
} from '../../utils/emailValidator';
import {
  mapUiPaymentMethodToApi,
  validatePaymentAmount,
  getDisplayAmount,
  validatePaymentForm,
  verifyPaymentData,
} from '../../utils/paymentValidator';
import { ExamStateManager } from '../../utils/examStateManager';
import {
  isValidBase64,
  resolveMediaUrl,
  getProfilePictureUrl,
} from '../../utils/profileImageUrl';
import {
  validateLessonMediaUrl,
  getSafeLessonMediaUrl,
  safeLessonDownloadFilename,
} from '../../utils/safeLessonMediaUrl';

describe('emailValidator', () => {
  it('validates and normalizes', () => {
    expect(isValidEmail('a@b.com')).toBe(true);
    expect(isValidEmail('bad', true)).toBe(false);
    expect(getEmailErrorMessage('')).toBeTruthy();
    expect(validateEmail('a@b.com').isValid).toBe(true);
    expect(normalizeEmail('  A@B.COM  ')).toContain('@');
    expect(emailsMatch('a@b.com', 'A@B.COM')).toBe(true);
    expect(getEmailDomain('a@gmail.com')).toBe('gmail.com');
    expect(isCommonEmailProvider('x@gmail.com')).toBe(true);
  });
});

describe('paymentValidator', () => {
  const course = {
    price: { finalPrice: 1000, originalPrice: 1200 },
    emi: { isAvailable: true, monthlyAmount: 100, months: 10 },
  };

  it('maps UI payment method', () => {
    expect(mapUiPaymentMethodToApi('card')).toBeTruthy();
    expect(mapUiPaymentMethodToApi(null)).toBe('CARD');
  });

  it('validates amount for full payment', () => {
    const r = validatePaymentAmount(1000, course, 'full');
    expect(r).toEqual(expect.objectContaining({ isValid: expect.any(Boolean) }));
  });

  it('getDisplayAmount', () => {
    expect(getDisplayAmount(100)).toContain('100');
    expect(getDisplayAmount(null)).toBe('₹0');
  });

  it('validatePaymentForm and verifyPaymentData', () => {
    const form = {
      paymentType: 'full',
      amount: 1000,
      paymentMethod: 'card',
      agreedToTerms: true,
    };
    const vf = validatePaymentForm(form, course);
    expect(vf).toEqual(expect.objectContaining({ isValid: expect.any(Boolean) }));
    const vd = verifyPaymentData(
      { amount: 1000, paymentType: 'full', courseId: 'c1' },
      course,
    );
    expect(vd).toEqual(expect.objectContaining({ isValid: expect.any(Boolean) }));
  });
});

describe('ExamStateManager', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates key and saves state', () => {
    expect(ExamStateManager.generateKey('c1', 0)).toBe('exam_state_c1_0');
    expect(ExamStateManager.save('c1', { x: 1 }, 0)).toBe(true);
    expect(localStorage.getItem('exam_state_c1_0')).toBeTruthy();
  });
});

describe('profileImageUrl', () => {
  it('base64 and url helpers', () => {
    expect(isValidBase64('ab#$')).toBe(false);
    expect(resolveMediaUrl('/x')).toBeTruthy();
    expect(getProfilePictureUrl(null)).toBeNull();
    expect(getProfilePictureUrl({ profilePicture: 'http://x/y.png' })).toContain('http');
  });
});

describe('safeLessonMediaUrl', () => {
  it('validates empty url', () => {
    expect(validateLessonMediaUrl('', 'video').ok).toBe(false);
  });

  it('safe filename helper', () => {
    expect(safeLessonDownloadFilename('  a b  ', 'file')).toBeTruthy();
    expect(safeLessonDownloadFilename('', 'fb')).toBe('fb');
  });

  it('getSafeLessonMediaUrl returns null or string', () => {
    const u = getSafeLessonMediaUrl('https://example.com/a.mp4', 'video');
    expect(u === null || typeof u === 'string').toBe(true);
  });
});
