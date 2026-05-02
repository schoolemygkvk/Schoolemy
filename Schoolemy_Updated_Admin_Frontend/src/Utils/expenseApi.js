import api from "./api";

const EXPENSE_BASE = "/api/expense";

// Get all expenses with filters
export const listExpenses = (params = {}) =>
  api.get(`${EXPENSE_BASE}/list`, { params });

// Get expense by ID
export const getExpense = (expenseId) =>
  api.get(`${EXPENSE_BASE}/${expenseId}`);

// Create new expense
export const createExpense = (payload) =>
  api.post(`${EXPENSE_BASE}/create`, payload);

// Update expense
export const updateExpense = (expenseId, payload) =>
  api.put(`${EXPENSE_BASE}/${expenseId}`, payload);

// Delete expense
export const deleteExpense = (expenseId) =>
  api.delete(`${EXPENSE_BASE}/${expenseId}`);

// Approve expense
export const approveExpense = (expenseId) =>
  api.patch(`${EXPENSE_BASE}/${expenseId}/approve`);

// Mark expense as paid
export const markExpenseAsPaid = (expenseId) =>
  api.patch(`${EXPENSE_BASE}/${expenseId}/paid`);

// Reject expense
export const rejectExpense = (expenseId, reason) =>
  api.patch(`${EXPENSE_BASE}/${expenseId}/reject`, { reason });

// Get expense statistics
export const getExpenseStatistics = (params = {}) =>
  api.get(`${EXPENSE_BASE}/statistics`, { params });

const expenseApi = {
  listExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  approveExpense,
  markExpenseAsPaid,
  rejectExpense,
  getExpenseStatistics,
};

export default expenseApi;
