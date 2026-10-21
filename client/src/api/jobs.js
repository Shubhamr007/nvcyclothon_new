import { adminRequest } from "./http";

export async function fetchAdminJobs(accessToken, { limit = 20, status, type } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (status) params.set("status", String(status));
  if (type) params.set("type", String(type));

  const query = params.toString() ? `?${params.toString()}` : "";
  return adminRequest(`/jobs${query}`, accessToken);
}

export async function fetchAdminJob(accessToken, jobId) {
  return adminRequest(`/jobs/${encodeURIComponent(jobId)}`, accessToken);
}

export async function cancelAdminJob(accessToken, jobId) {
  return adminRequest(`/jobs/${encodeURIComponent(jobId)}/cancel`, accessToken, {
    method: "POST",
  });
}

export async function enqueueAdminJob(accessToken, { type, payload }) {
  return adminRequest("/jobs/enqueue", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload }),
  });
}
