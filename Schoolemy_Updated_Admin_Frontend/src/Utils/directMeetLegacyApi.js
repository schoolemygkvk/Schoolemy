import axios from "./api";


const BASE = "/api/direct-meets";

export const legacyDirectMeetApi = {
  create: (body) =>
    axios.post(`${BASE}/create-direct-meet`, body),
  getAll: (params) =>
    axios.get(`${BASE}/get-all-direct-meets`, { params }),
  getById: (id) =>
    axios.get(`${BASE}/get-direct-meet/${id}`),
  getByMeetId: (meetId) =>
    axios.get(`${BASE}/get-direct-meet-by-meet-id/${meetId}`),
  update: (id, body) =>
    axios.put(`${BASE}/update-direct-meet/${id}`, body),
  delete: (id) =>
    axios.delete(`${BASE}/delete-direct-meet/${id}`),
  softDelete: (id) =>
    axios.patch(`${BASE}/soft-delete-direct-meet/${id}`),
  getActive: () =>
    axios.get(`${BASE}/get-active-direct-meets`),
  getUpcoming: () =>
    axios.get(`${BASE}/get-upcoming-direct-meets`),
  markCompleted: (id) =>
    axios.patch(`${BASE}/mark-direct-meet-completed/${id}`),
  getStats: () =>
    axios.get(`${BASE}/get-direct-meet-stats`),
  sendNotification: (id) =>
    axios.post(`${BASE}/send-notification/${id}`),
};
