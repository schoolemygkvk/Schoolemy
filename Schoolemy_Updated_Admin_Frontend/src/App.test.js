import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('./Utils/securityCheck', () => ({
  initializeSecurity: jest.fn(),
  cleanupOnUnload: jest.fn(),
}));

jest.mock('./Routes/AdminDashboard', () => ({
  __esModule: true,
  default: function MockAdminDashboard() {
    return <div data-testid="admin-dashboard-mock" />;
  },
}));

jest.mock('./Utils/api', () => {
  const api = {
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn(),
    defaults: { headers: {} },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
  return { __esModule: true, default: api };
});

test('renders public login after auth finishes loading', async () => {
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText(/Welcome to Schoolemy/i)).toBeInTheDocument();
  });
});
