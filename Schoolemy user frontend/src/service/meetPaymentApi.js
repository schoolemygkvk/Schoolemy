import api from './api';

const BASE_URL = '/api/meet-payment';

// Create payment order for meet
export const createMeetPaymentOrder = async (meetId, userId, customerDetails) => {
  try {
    const response = await api.post(`${BASE_URL}/create-order`, {
      meet_id: meetId,
      user_id: userId,
      customer_details: customerDetails
    });
    return response.data;
  } catch (error) {
    console.error('Error creating payment order:', error);
    throw error;
  }
};

// Verify payment after completion
export const verifyMeetPayment = async (orderId) => {
  try {
    const response = await api.post(`${BASE_URL}/verify`, { order_id: orderId });
    return response.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};

// Get payment status for meet
export const getMeetPaymentStatus = async (meetId, userId) => {
  try {
    const response = await api.get(`${BASE_URL}/status/${meetId}/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment status:', error);
    throw error;
  }
};

export default {
  createMeetPaymentOrder,
  verifyMeetPayment,
  getMeetPaymentStatus
};
