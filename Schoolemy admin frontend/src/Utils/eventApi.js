import api from "./api";

const EVENT_BASE = "/event";

/**
 * Resolve event cover image to a displayable URL.
 * Backend stores S3 URLs (strings); legacy data may be base64 object.
 */
export function getEventCoverImageSrc(cover) {
  if (!cover) return null;
  if (typeof cover === "string") {
    if (cover.startsWith("http") || cover.startsWith("data:")) return cover;
    return cover;
  }
  if (cover && (cover.contentType || cover.data)) {
    try {
      if (typeof cover.data === "string")
        return `data:${cover.contentType || "image/jpeg"};base64,${cover.data}`;
      if (cover.data?.data || Array.isArray(cover.data)) {
        const arr = cover.data?.data ?? cover.data;
        let binary = "";
        for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
        return `data:${cover.contentType || "image/jpeg"};base64,${btoa(binary)}`;
      }
    } catch (e) {
      console.warn("Event cover image decode error:", e);
    }
  }
  return null;
}

export const listEvents = (params = {}) =>
  api.get(`${EVENT_BASE}/list`, { params });
export const getEvent = (eventId) =>
  api.get(`${EVENT_BASE}/details/${eventId}`);
export const createEvent = (payload) =>
  api.post(`${EVENT_BASE}/create`, payload);
export const updateEvent = (eventId, payload) =>
  api.put(`${EVENT_BASE}/update/${eventId}`, payload);
export const deleteEvent = (eventId) =>
  api.delete(`${EVENT_BASE}/remove/${eventId}`);
export const getEventsByStatus = (status) =>
  api.get(`${EVENT_BASE}/status/${status}`);

const eventApi = {
  listEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByStatus,
};

export default eventApi;
