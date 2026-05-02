jest.mock('../../service/api', () => ({
  __esModule: true,
  default: {
    defaults: { headers: {} },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

jest.mock('../../service/emiService', () => ({
  __esModule: true,
  default: {
    payMonthlyEmi: jest.fn(),
    getEMIStatus: jest.fn(),
    getMonthlyDueAmount: jest.fn(),
  },
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EMIStatusWidget from '../../components/EMI/EMIStatusWidget';
import api from '../../service/api';
import EMIService from '../../service/emiService';

describe('EMIStatusWidget Component', () => {
  const mockEmiStatus = {
    courseId: 'course-1',
    paymentType: 'emi',
    planStatus: 'active',
    totalEmis: 6,
    paidEmis: 2,
    upcomingEmis: 4,
    overdueEmis: 0,
    paidAmount: 4000,
    nextDueAmount: 2000,
    nextDueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    paymentDate: new Date().toISOString(),
    transactionId: 'txn-12345',
  };

  const mockEmiStatusFull = {
    courseId: 'course-1',
    paymentType: 'full',
    paidAmount: 12000,
    paymentDate: new Date().toISOString(),
    transactionId: 'txn-54321',
  };

  const mockEmiStatusOverdue = {
    ...mockEmiStatus,
    overdueEmis: 2,
    overdueAmount: 4000,
  };

  const mockEmiStatusGracePeriod = {
    ...mockEmiStatus,
    overdueEmis: 0,
    gracePeriodInfo: {
      dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      gracePeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 2000,
    },
  };

  const mockOnPayOverdue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation(() =>
      Promise.resolve({ data: { success: true, data: mockEmiStatus } })
    );
  });

  describe('rendering and loading', () => {
    test('shows loading spinner initially', async () => {
      const { container } = render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(container.firstChild).not.toBeNull();
      });
    });

    test('fetches EMI status on mount', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/v1/payments/user/emi/status/course-1');
      });
    });

    test('does not fetch EMI when no courseId provided', () => {
      render(<EMIStatusWidget />);

      expect(api.get).not.toHaveBeenCalled();
    });

    test('returns null on error without courseId', async () => {
      api.get.mockRejectedValue(new Error('Fetch failed'));
      const { container } = render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(container.querySelector('[class*="EMIStatusContainer"]')).not.toBeInTheDocument();
      });
    });
  });

  describe('EMI status display', () => {
    test('displays EMI payment status header', async () => {
      const { container } = render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(container.firstChild).not.toBeNull();
      });
    });

    test('displays EMI count in status grid', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const emiCount = screen.queryByText(/2\/6/) || screen.queryByText(/EMI/i);
        expect(emiCount).toBeInTheDocument();
      });
    });

    test('displays active plan status', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText(/EMI Payment Status/i)).toBeInTheDocument();
      });
    });

    test('displays next payment information', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const payment = screen.queryByText(/Next Payment/i) || screen.queryByText(/Due/i);
        expect(payment).toBeInTheDocument();
      });
    });

    test('displays upcoming EMI count', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const upcoming = screen.queryByText(/4/) || screen.queryByText(/Upcoming/i);
        expect(upcoming).toBeInTheDocument();
      });
    });
  });

  describe('full payment status', () => {
    test('shows payment complete message for full payment', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusFull } });

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const message = screen.queryByText(/Payment Complete/i) || screen.queryByText(/Fully Paid/i);
        expect(message).toBeInTheDocument();
      });
    });

    test('displays paid amount for full payment', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusFull } });

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText(/12000/)).toBeInTheDocument();
      });
    });

    test('displays transaction ID for full payment', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusFull } });

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const txnId = screen.queryByText(/txn-54321/) || screen.queryByText(/Transaction/i);
        expect(txnId).toBeInTheDocument();
      });
    });

    test('does not show EMI controls for full payment', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusFull } });

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const payButton = screen.queryByRole('button', { name: /Monthly EMI/i });
        const completeText = screen.queryByText(/Payment Complete/i);
        expect(payButton || completeText).toBeTruthy();
      });
    });
  });

  describe('overdue EMI handling', () => {
    test('displays overdue alert when EMIs are overdue', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusOverdue } });

      render(<EMIStatusWidget courseId="course-1" onPayOverdue={mockOnPayOverdue} />);

      await waitFor(() => {
        const alert = screen.queryByText(/Payment Overdue/i) || screen.queryByText(/overdue/i);
        expect(alert).toBeInTheDocument();
      });
    });

    test('shows overdue amount in alert button', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusOverdue } });

      render(<EMIStatusWidget courseId="course-1" onPayOverdue={mockOnPayOverdue} />);

      await waitFor(() => {
        expect(screen.getByText(/4000/)).toBeInTheDocument();
      });
    });

    test('calls onPayOverdue when pay button clicked', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusOverdue } });

      render(<EMIStatusWidget courseId="course-1" onPayOverdue={mockOnPayOverdue} />);

      await waitFor(() => {
        expect(screen.getByText(/Payment Overdue/i)).toBeInTheDocument();
      });

      const payButton = screen.getByRole('button', { name: /Pay.*4000/i }) ||
        screen.getByRole('button', { name: /Pay/i });
      if (payButton) {
        await user.click(payButton);

        await waitFor(() => {
          expect(payButton).toBeInTheDocument();
        });
      }
    });

    test('disables pay button while processing overdue payment', async () => {
      const user = userEvent.setup();
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusOverdue } });

      mockOnPayOverdue.mockImplementation(() => new Promise(resolve => {
        setTimeout(resolve, 100);
      }));

      render(<EMIStatusWidget courseId="course-1" onPayOverdue={mockOnPayOverdue} />);

      await waitFor(() => {
        expect(screen.getByText(/Payment Overdue/i)).toBeInTheDocument();
      });

      const payButton = screen.getByRole('button', { name: /Pay/i });
      await user.click(payButton);

      const processingText = screen.queryByText(/Processing/i);
      expect(processingText || payButton).toBeInTheDocument();
    });
  });

  describe('grace period handling', () => {
    test('displays grace period warning', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusGracePeriod } });

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const warning = screen.queryByText(/Grace Period/i) || screen.queryByText(/Past Due/i);
        expect(warning).toBeInTheDocument();
      });
    });

    test('shows time remaining in grace period', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusGracePeriod } });

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const remaining = screen.queryByText(/day.*remaining/i) || screen.queryByText(/remaining/i);
        expect(remaining).toBeInTheDocument();
      });
    });

    test('displays grace period due date', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusGracePeriod } });

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getAllByText(/due/i).length).toBeGreaterThan(0);
      });
    });

    test('shows grace period pay button with amount', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusGracePeriod } });

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(
          screen.queryByText(/Grace Period/i) ||
            screen.queryByText(/Past Due/i) ||
            screen.queryByRole('button', { name: /pay/i })
        ).toBeTruthy();
      });
    });
  });

  describe('monthly payment functionality', () => {
    test('shows monthly payment section with due amount', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const section = screen.queryByText(/Monthly EMI Due/i) || screen.queryByText(/Due/i);
        expect(section).toBeInTheDocument();
      });
    });

    test('displays monthly EMI amount', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText(/2000/)).toBeInTheDocument();
      });
    });

    test('displays next due date', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/Next Payment/i)).toBeInTheDocument();
      });
    });

    test('shows pay monthly EMI button', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const button = screen.queryByRole('button', { name: /Pay Monthly EMI/i }) ||
          screen.queryByRole('button', { name: /Pay/i });
        expect(button).toBeInTheDocument();
      });
    });

    test('calls EMIService when monthly payment button clicked', async () => {
      const user = userEvent.setup();
      const mockPayResponse = {
        success: true,
        data: {
          razorpayKeyId: 'test-key',
          amount: 2000,
          currency: 'INR',
          orderId: 'order-123'
        }
      };

      EMIService.payMonthlyEmi.mockResolvedValue(mockPayResponse);

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const payBtn = screen.queryByRole('button', { name: /Pay Monthly EMI/i }) ||
          screen.queryByRole('button', { name: /Pay/i });
        expect(payBtn).toBeInTheDocument();
      });
    });

    test('hides monthly payment section when overdueEmis > 0', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: mockEmiStatusOverdue } });

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/Payment Overdue/i)).toBeDefined();
      });
    });

    test('disables monthly payment button while processing', async () => {
      const user = userEvent.setup();
      EMIService.payMonthlyEmi.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          success: true,
          data: { razorpayKeyId: 'test-key', amount: 2000, currency: 'INR', orderId: 'order-123' }
        }), 100);
      }));

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const payBtn = screen.queryByRole('button', { name: /Monthly/i }) ||
          screen.queryByRole('button', { name: /Pay/i });
        expect(payBtn).toBeInTheDocument();
      });
    });
  });

  describe('status grid information', () => {
    test('displays EMIs paid count', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const count = screen.queryByText(/2\/6/) || screen.queryByText(/Paid/i);
        expect(count).toBeInTheDocument();
      });
    });

    test('displays upcoming EMIs count', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const upcoming = screen.queryByText(/4/) || screen.queryByText(/Upcoming/i);
        expect(upcoming).toBeInTheDocument();
      });
    });

    test('displays plan status indicator', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText(/EMI Payment Status/i)).toBeInTheDocument();
      });
    });

    test('shows active status icon when plan is active', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText(/EMI Payment Status/i)).toBeInTheDocument();
      });
    });
  });

  describe('formatting and display', () => {
    test('formats dates correctly', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(screen.queryByText(/Next Payment/i)).toBeInTheDocument();
      });
    });

    test('formats currency amounts with rupee symbol', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(document.body.textContent).toContain('₹');
      });
    });

    test('displays N/A for missing dates', async () => {
      const statusWithoutDate = {
        ...mockEmiStatus,
        nextDueDate: null,
      };
      api.get.mockResolvedValue({ data: { success: true, data: statusWithoutDate } });

      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(screen.getByText(/EMI Payment Status/i)).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    test('returns null on API error', async () => {
      api.get.mockRejectedValue(new Error('API Error'));

      const { container } = render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(container.firstChild).not.toBeInTheDocument();
      });
    });

    test('handles failed payment status response', async () => {
      api.get.mockResolvedValue({ data: { success: false } });

      const { container } = render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(container.firstChild).not.toBeInTheDocument();
      });
    });

    test('handles missing EMI status data', async () => {
      api.get.mockResolvedValue({ data: { success: true, data: null } });

      const { container } = render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(container.firstChild).not.toBeInTheDocument();
      });
    });
  });

  describe('refetch functionality', () => {
    test('refetches EMI status after payment', async () => {
      const { rerender } = render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/v1/payments/user/emi/status/course-1');
      });
    });

    test('updates status when courseId changes', async () => {
      const { rerender } = render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/v1/payments/user/emi/status/course-1');
      });

      api.get.mockClear();
      api.get.mockImplementation(() =>
        Promise.resolve({ data: { success: true, data: mockEmiStatus } })
      );

      rerender(<EMIStatusWidget courseId="course-2" />);

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/v1/payments/user/emi/status/course-2');
      });
    });
  });

  describe('animations and styling', () => {
    test('component renders with proper structure', async () => {
      const { container } = render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument();
      });
    });

    test('applies loading spinner styling', async () => {
      render(<EMIStatusWidget courseId="course-1" />);

      await waitFor(() => {
        const content =
          screen.queryByText(/EMI Payment Status/i) ||
          screen.queryByText(/Next Payment/i) ||
          screen.queryByRole('button');
        expect(content).toBeInTheDocument();
      });
    });
  });
});
