import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ExpenseForm from '../../Components/Pages/Financial/ExpenseForm';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../../Utils/expenseApi.js', () => ({
  createExpense: jest.fn(),
  updateExpense: jest.fn(),
  getExpense: jest.fn(),
}));

// Import mocked modules
import { useNavigate, useParams } from 'react-router-dom';
import { createExpense, updateExpense, getExpense } from '../../Utils/expenseApi.js';

const mockNavigate = jest.fn();

const mockExpenseData = {
  _id: '1',
  title: 'Office Supplies',
  amount: 5000,
  category: 'Supplies',
  subCategory: 'Stationery',
  paymentMethod: 'Cash',
  transactionId: 'TXN123',
  vendorName: 'Local Vendor',
  vendorContact: '9876543210',
  date: '2024-01-15',
  dueDate: '2024-02-15',
  description: 'Monthly office supplies',
  status: 'Approved',
  department: 'Admin',
  isRecurring: false,
  recurringPeriod: 'None',
};

describe('ExpenseForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({});
    window.alert = jest.fn();
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      useParams.mockReturnValue({});
    });

    it('renders "Add New Expense" title in create mode', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      expect(screen.getByText('Add New Expense')).toBeInTheDocument();
    });

    it('renders all required form fields', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      expect(screen.getByPlaceholderText('Enter expense title')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Supplies')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter sub category')).toBeInTheDocument();
    });

    it('renders submit button with "Create Expense" text', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      expect(screen.getByText('Create Expense')).toBeInTheDocument();
    });

    it('allows user to fill form fields', async () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter expense title');
      await userEvent.type(titleInput, 'New Expense');

      expect(titleInput.value).toBe('New Expense');
    });

    it('submits create expense request with form data', async () => {
      createExpense.mockResolvedValue({ data: { success: true } });

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter expense title');
      const amountInput = screen.getByPlaceholderText('Enter amount');
      const submitButton = screen.getByText('Create Expense');

      await userEvent.type(titleInput, 'Office Supplies');
      await userEvent.type(amountInput, '5000');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createExpense).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Office Supplies',
            amount: '5000',
          })
        );
      });
    });

    it('navigates after successful expense creation', async () => {
      createExpense.mockResolvedValue({ data: { success: true } });

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const submitButton = screen.getByText('Create Expense');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/schoolemy/financial-auditing');
      });
    });

    it('shows success alert on create', async () => {
      createExpense.mockResolvedValue({ data: { success: true } });

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const submitButton = screen.getByText('Create Expense');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Expense created successfully');
      });
    });

    it('handles create error', async () => {
      createExpense.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const submitButton = screen.getByText('Create Expense');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to save expense');
      });
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      useParams.mockReturnValue({ expenseId: '1' });
      getExpense.mockResolvedValue({ data: { data: mockExpenseData } });
    });

    it('renders "Edit Expense" title in edit mode', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      expect(screen.getByText('Edit Expense')).toBeInTheDocument();
    });

    it('fetches expense data on mount in edit mode', async () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(getExpense).toHaveBeenCalledWith('1');
      });
    });

    it('populates form fields with fetched data', async () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Office Supplies')).toBeInTheDocument();
        expect(screen.getByDisplayValue('5000')).toBeInTheDocument();
      });
    });

    it('renders submit button with "Update Expense" text', async () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Update Expense')).toBeInTheDocument();
      });
    });

    it('submits update expense request', async () => {
      updateExpense.mockResolvedValue({ data: { success: true } });

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Office Supplies')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Update Expense'));

      await waitFor(() => {
        expect(updateExpense).toHaveBeenCalledWith('1', expect.any(Object));
      });
    });

    it('shows update success alert', async () => {
      updateExpense.mockResolvedValue({ data: { success: true } });

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Office Supplies')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Update Expense'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Expense updated successfully');
      });
    });

    it('handles update error', async () => {
      updateExpense.mockRejectedValue(new Error('Update failed'));

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Office Supplies')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Update Expense'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to save expense');
      });
    });

    it('handles fetch error gracefully', async () => {
      getExpense.mockRejectedValue(new Error('Fetch failed'));

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to fetch expense details');
      });
    });
  });

  describe('Form Fields & Interactions', () => {
    it('updates form state when input changes', async () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter expense title');
      await userEvent.type(titleInput, 'Test Title');

      expect(titleInput.value).toBe('Test Title');
    });

    it('handles checkbox for recurring expense', async () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const recurringCheckbox = screen.getByLabelText(/Recurring Expense/);
      expect(recurringCheckbox.checked).toBe(false);

      await userEvent.click(recurringCheckbox);
      expect(recurringCheckbox.checked).toBe(true);
    });

    it('shows recurring period field when isRecurring is true', async () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const recurringCheckbox = screen.getByLabelText(/Recurring Expense/);
      await userEvent.click(recurringCheckbox);

      await waitFor(() => {
        expect(screen.getByText('Recurring Period')).toBeInTheDocument();
        const select = document.querySelector('select[name="recurringPeriod"]');
        expect(select).toBeTruthy();
        expect(select.value).toBe('None');
      });
    });

    it('hides recurring period field when isRecurring is false', async () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      expect(document.querySelector('select[name="recurringPeriod"]')).toBeNull();
    });

    it('updates category dropdown', async () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const categorySelect = screen.getByDisplayValue('Supplies');
      await userEvent.selectOptions(categorySelect, 'Marketing');

      expect(screen.getByDisplayValue('Marketing')).toBeInTheDocument();
    });

    it('updates payment method dropdown', async () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const paymentSelect = screen.getByDisplayValue('Cash');
      await userEvent.selectOptions(paymentSelect, 'Online');

      expect(screen.getByDisplayValue('Online')).toBeInTheDocument();
    });

    it('updates status dropdown', async () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const statusSelect = screen.getByDisplayValue('Pending');
      await userEvent.selectOptions(statusSelect, 'Approved');

      expect(screen.getByDisplayValue('Approved')).toBeInTheDocument();
    });
  });

  describe('Form Validation & Required Fields', () => {
    it('renders required indicator for required fields', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it('requires title field', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter expense title');
      expect(titleInput).toBeRequired();
    });

    it('requires amount field', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const amountInput = screen.getByPlaceholderText('Enter amount');
      expect(amountInput).toBeRequired();
    });

    it('requires date field', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/);
      const dateInput = dateInputs[0];
      expect(dateInput).toBeRequired();
    });
  });

  describe('Button Actions', () => {
    it('navigates back when Cancel button is clicked', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it('disables submit button when loading', async () => {
      createExpense.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const submitButton = screen.getByText('Create Expense');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('shows loading state during submission', async () => {
      createExpense.mockImplementation(() => new Promise(() => {}));

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const submitButton = screen.getByText('Create Expense');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });
  });

  describe('Form Data Handling', () => {
    it('converts date input to ISO format', async () => {
      createExpense.mockResolvedValue({ data: { success: true } });

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const dateInputs = screen.getAllByDisplayValue(/\d{4}-\d{2}-\d{2}/);
      const dateInput = dateInputs[0];

      await userEvent.clear(dateInput);
      await userEvent.type(dateInput, '2024-06-15');

      const submitButton = screen.getByText('Create Expense');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createExpense).toHaveBeenCalledWith(
          expect.objectContaining({
            date: '2024-06-15',
          })
        );
      });
    });

    it('handles checkbox boolean value correctly', async () => {
      createExpense.mockResolvedValue({ data: { success: true } });

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const recurringCheckbox = screen.getByLabelText(/Recurring Expense/);
      await userEvent.click(recurringCheckbox);

      const submitButton = screen.getByText('Create Expense');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createExpense).toHaveBeenCalledWith(
          expect.objectContaining({
            isRecurring: true,
          })
        );
      });
    });

    it('includes all form fields in submission', async () => {
      createExpense.mockResolvedValue({ data: { success: true } });

      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const titleInput = screen.getByPlaceholderText('Enter expense title');
      const amountInput = screen.getByPlaceholderText('Enter amount');
      const submitButton = screen.getByText('Create Expense');

      await userEvent.type(titleInput, 'Test');
      await userEvent.type(amountInput, '100');

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(createExpense).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Test',
          amount: '100',
          category: 'Supplies',
          paymentMethod: 'Cash',
          status: 'Pending',
          isRecurring: false,
          recurringPeriod: 'None',
        }));
      });
    });
  });

  describe('Form UI Elements', () => {
    it('renders textarea for description', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      expect(screen.getByPlaceholderText('Enter expense details')).toBeInTheDocument();
    });

    it('renders select options for categories', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const categorySelect = screen.getByDisplayValue('Supplies');
      expect(categorySelect.querySelectorAll('option').length).toBeGreaterThan(5);
    });

    it('renders select options for payment methods', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const paymentSelect = screen.getByDisplayValue('Cash');
      expect(paymentSelect.querySelectorAll('option').length).toBeGreaterThan(3);
    });

    it('renders all status options', () => {
      render(
        <BrowserRouter>
          <ExpenseForm />
        </BrowserRouter>
      );

      const statusSelect = screen.getByDisplayValue('Pending');
      const options = statusSelect.querySelectorAll('option');
      expect(options.length).toBeGreaterThanOrEqual(5);
    });
  });
});
