import {
  handleApiError,
  sanitizeErrorMessage,
  getDefaultErrorMessage,
} from '../../service/apiErrorHandler';

describe('apiErrorHandler', () => {
  it('handleApiError maps network errors', () => {
    const r = handleApiError({ message: 'Network Error' }, 'fallback');
    expect(r.code).toBe('NETWORK_ERROR');
    expect(r.error).toMatch(/connection/i);
  });

  it('handleApiError uses response status', () => {
    const r = handleApiError({
      response: { status: 404, data: { message: 'Not found' } },
      config: { url: '/x', method: 'get' },
    });
    expect(r.statusCode).toBe(404);
    expect(r.success).toBe(false);
  });

  it('sanitizeErrorMessage strips file paths', () => {
    const s = sanitizeErrorMessage('Error in /app/src/foo.js line', 500);
    expect(s).not.toContain('/app/src');
  });

  it('getDefaultErrorMessage returns map entries', () => {
    expect(getDefaultErrorMessage(401)).toMatch(/log in/i);
    expect(getDefaultErrorMessage(9999)).toBeTruthy();
  });
});
