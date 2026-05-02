import api from '../../service/api';
import {
  getPlayerState,
  savePlayerState,
  requestCertificateEmail,
} from '../../service/coursePlayerStateService';

jest.mock('../../service/api', () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
}));

describe('coursePlayerStateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getPlayerState returns data', async () => {
    api.get.mockResolvedValue({ data: { position: 1 } });
    const d = await getPlayerState('c1');
    expect(api.get).toHaveBeenCalledWith('/api/v1/progress/player-state/c1');
    expect(d).toEqual({ position: 1 });
  });

  it('savePlayerState puts payload', async () => {
    api.put.mockResolvedValue({ data: { saved: true } });
    const payload = { t: 10 };
    const d = await savePlayerState('c1', payload);
    expect(api.put).toHaveBeenCalledWith(
      '/api/v1/progress/player-state/c1',
      payload,
    );
    expect(d).toEqual({ saved: true });
  });

  it('requestCertificateEmail posts courseId', async () => {
    api.post.mockResolvedValue({ data: { sent: true } });
    await requestCertificateEmail('c9');
    expect(api.post).toHaveBeenCalledWith('/api/v1/certificates/send-completion', {
      courseId: 'c9',
    });
  });
});
