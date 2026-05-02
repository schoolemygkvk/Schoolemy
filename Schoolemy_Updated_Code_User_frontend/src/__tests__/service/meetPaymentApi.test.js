import api from '../../service/api';
import {
  createMeetPaymentOrder,
  verifyMeetPayment,
  getMeetPaymentStatus,
} from '../../service/meetPaymentApi';

jest.mock('../../service/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('meetPaymentApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createMeetPaymentOrder posts payload', async () => {
    api.post.mockResolvedValue({ data: { ok: true } });
    const out = await createMeetPaymentOrder('m1', 'u1', { name: 'A' });
    expect(api.post).toHaveBeenCalledWith('/api/v1/meet-payments/create-order', {
      meet_id: 'm1',
      user_id: 'u1',
      customer_details: { name: 'A' },
    });
    expect(out).toEqual({ ok: true });
  });

  it('verifyMeetPayment posts order id', async () => {
    api.post.mockResolvedValue({ data: { verified: true } });
    await verifyMeetPayment('ord1');
    expect(api.post).toHaveBeenCalledWith('/api/v1/meet-payments/verify', {
      order_id: 'ord1',
    });
  });

  it('getMeetPaymentStatus GETs status URL', async () => {
    api.get.mockResolvedValue({ data: { status: 'paid' } });
    await getMeetPaymentStatus('m1', 'u1');
    expect(api.get).toHaveBeenCalledWith('/api/v1/meet-payments/status/m1/u1');
  });
});
