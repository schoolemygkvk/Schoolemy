import api from "./api"; // Use centralized API instance

// Get all events
export const getAllEvents = (page = 1, limit = 3) => {
  return api.get(`/events?page=${page}&limit=${limit}`);
};

// Get single event by ID
// excludeImages=1 returns event without images (lighter payload) - use when images fail
export const getEventById = (id, excludeImages = false) => {
  const params = excludeImages ? "?excludeImages=1" : "";
  return api.get(`/events/${id}${params}`);
};
