import api from "./api";

const DONATION_BASE = "/api/donation";

// Get all donations with filters
export const listDonations = (params = {}) =>
  api.get(`${DONATION_BASE}/list`, { params });

// Get donation by ID
export const getDonation = (donationId) =>
  api.get(`${DONATION_BASE}/${donationId}`);

// Create new donation
export const createDonation = (payload) =>
  api.post(`${DONATION_BASE}/create`, payload);

// Update donation
export const updateDonation = (donationId, payload) =>
  api.put(`${DONATION_BASE}/${donationId}`, payload);

// Delete donation
export const deleteDonation = (donationId) =>
  api.delete(`${DONATION_BASE}/${donationId}`);

// Verify donation
export const verifyDonation = (donationId) =>
  api.patch(`${DONATION_BASE}/${donationId}/verify`);

// Get donation statistics
export const getDonationStatistics = (params = {}) =>
  api.get(`${DONATION_BASE}/statistics`, { params });

const donationApi = {
  listDonations,
  getDonation,
  createDonation,
  updateDonation,
  deleteDonation,
  verifyDonation,
  getDonationStatistics,
};

export default donationApi;
