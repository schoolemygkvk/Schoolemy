import api from "./api";

const INVOICE_BASE = "/api/invoice";

export const listInvoices = (params = {}) =>
  api.get(`${INVOICE_BASE}/list`, { params });

// Get invoice by ID
export const getInvoice = (invoiceId) =>
  api.get(`${INVOICE_BASE}/${invoiceId}`);

// Get invoice by invoice number
export const getInvoiceByNumber = (invoiceNumber) =>
  api.get(`${INVOICE_BASE}/number/${encodeURIComponent(invoiceNumber)}`);

// Create new invoice
export const createInvoice = (payload) =>
  api.post(`${INVOICE_BASE}/create`, payload);

// Update invoice
export const updateInvoice = (invoiceId, payload) =>
  api.put(`${INVOICE_BASE}/${invoiceId}`, payload);

// Delete invoice
export const deleteInvoice = (invoiceId) =>
  api.delete(`${INVOICE_BASE}/${invoiceId}`);

// Update invoice status
export const updateInvoiceStatus = (invoiceId, status) =>
  api.patch(`${INVOICE_BASE}/${invoiceId}/status`, { status });

// Get invoice statistics
export const getInvoiceStatistics = (params = {}) =>
  api.get(`${INVOICE_BASE}/statistics`, { params });

// Download invoice (this would trigger the download flow)
export const downloadInvoice = (invoiceNumber) =>
  api.get(`${INVOICE_BASE}/number/${invoiceNumber}`);

const invoiceApi = {
  listInvoices,
  getInvoice,
  getInvoiceByNumber,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus,
  getInvoiceStatistics,
  downloadInvoice,
};

export default invoiceApi;
