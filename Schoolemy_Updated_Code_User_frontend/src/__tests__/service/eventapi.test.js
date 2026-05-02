import { getAllEvents, getEventById } from '../../service/eventapi';
import api from '../../service/api';

jest.mock('../../service/api', () => ({
  get: jest.fn(),
}));

describe('eventapi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getAllEvents calls api with pagination', () => {
    api.get.mockResolvedValue({ data: {} });
    getAllEvents(2, 10);
    expect(api.get).toHaveBeenCalledWith('/api/v1/events/?page=2&limit=10');
  });

  it('getEventById appends excludeImages when true', () => {
    api.get.mockResolvedValue({ data: {} });
    getEventById('abc', true);
    expect(api.get).toHaveBeenCalledWith('/api/v1/events/abc?excludeImages=1');
  });

  it('getEventById omits param when false', () => {
    api.get.mockResolvedValue({ data: {} });
    getEventById('abc', false);
    expect(api.get).toHaveBeenCalledWith('/api/v1/events/abc');
  });
});
