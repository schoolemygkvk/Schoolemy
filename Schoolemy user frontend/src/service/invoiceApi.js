// service/invoiceApi.js
import api from './api';

const BASE_URL = '/api/user';

/**
 * Get all invoices for the logged-in user
 * @param {Object} filters - Optional filters: invoiceType, status, startDate, endDate
 * @returns {Promise<Object>} Invoices data
 */
export const getMyInvoices = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (filters.invoiceType) queryParams.append('invoiceType', filters.invoiceType);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    
    const queryString = queryParams.toString();
    const url = `${BASE_URL}/invoices${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoices:', error);
    throw error;
  }
};

/**
 * Get invoice details by invoice number
 * @param {String} invoiceNumber - Invoice number
 * @returns {Promise<Object>} Invoice details
 */
export const getInvoiceByNumber = async (invoiceNumber) => {
  try {
    const response = await api.get(`${BASE_URL}/invoice/${invoiceNumber}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    throw error;
  }
};

/**
 * Get invoice by payment ID
 * @param {String} paymentId - Payment ID
 * @returns {Promise<Object>} Invoice details
 */
export const getInvoiceByPaymentId = async (paymentId) => {
  try {
    const response = await api.get(`${BASE_URL}/invoice/payment/${paymentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice by payment ID:', error);
    throw error;
  }
};

/**
 * Get invoice statistics for the user
 * @returns {Promise<Object>} Invoice statistics
 */
export const getInvoiceStatistics = async () => {
  try {
    const response = await api.get(`${BASE_URL}/invoice/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching invoice statistics:', error);
    throw error;
  }
};

/**
 * Download invoice as PDF
 * @param {String} invoiceNumber - Invoice number
 * @returns {Promise<Object>} Download data or link
 */
export const downloadInvoice = async (invoiceNumber) => {
  try {
    const response = await api.get(
      `${BASE_URL}/invoice/${invoiceNumber}/download`,
      { responseType: "blob" },
    );
    return response;
  } catch (error) {
    console.error('Error downloading invoice:', error);
    throw error;
  }
};

export default {
  getMyInvoices,
  getInvoiceByNumber,
  getInvoiceByPaymentId,
  getInvoiceStatistics,
  downloadInvoice,
};
