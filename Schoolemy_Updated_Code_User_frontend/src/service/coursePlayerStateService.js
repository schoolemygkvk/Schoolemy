import api from "./api";

export async function getPlayerState(courseId) {
  const { data } = await api.get(`/api/v1/progress/player-state/${courseId}`);
  return data;
}

export async function savePlayerState(courseId, payload) {
  const { data } = await api.put(`/api/v1/progress/player-state/${courseId}`, payload);
  return data;
}

export async function requestCertificateEmail(courseId) {
  const { data } = await api.post("/api/v1/certificates/send-completion", {
    courseId,
  });
  return data;
}
