const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: 'application/json', ...options.headers },
      ...options,
      signal: options.signal || controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.detail || 'Something went wrong. Please try again.');
    return body;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The API did not respond. Check that the backend is running on port 8000.');
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function createAdminSession(adminKey) {
  return request("/admin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_key: adminKey }),
  });
}

export async function createCheckinSession(volunteerPin, volunteerName) {
  return request("/checkin/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      volunteer_pin: volunteerPin,
      volunteer_name: volunteerName,
    }),
  });
}

export async function getCheckinStatus() {
  return request("/checkin/status");
}

export async function getSiteSettings() {
  return request("/content/settings");
}

export async function updateSiteSettings(accessToken, patch) {
  return adminRequest("/settings", accessToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function getAdminSettings(accessToken) {
  return adminRequest("/settings", accessToken);
}

export async function listVolunteers(accessToken) {
  return adminRequest("/volunteers", accessToken);
}

export async function createVolunteer(accessToken, payload) {
  return adminRequest("/volunteers", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function updateVolunteer(accessToken, id, payload) {
  return adminRequest(`/volunteers/${id}`, accessToken, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getCommunityPosts() {
  return request("/community/posts");
}

export async function submitCommunityPost(formData) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_BASE}/community/posts`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.detail || "We could not accept your submission.");
    }
    return body;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function listAdminCommunityPosts(accessToken, status = "pending") {
  return adminRequest(`/community/posts?status=${encodeURIComponent(status)}`, accessToken);
}

export async function moderateCommunityPost(accessToken, id, payload) {
  return adminRequest(`/community/posts/${id}/moderate`, accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getAdminCommunityMedia(accessToken, key) {
  const response = await fetch(
    `${API_BASE}/admin/community/media/${encodeURIComponent(key)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || "Unable to load community image.");
  }
  return response.blob();
}

export function adminRequest(path, accessToken, options = {}) {
  const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  return request(`/admin${path}`, {
    ...options,
    headers: { ...authHeader, ...options.headers },
  });
}

export function checkinRequest(path, accessToken, options = {}) {
  const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  return request(`/checkin${path}`, {
    ...options,
    headers: { ...authHeader, ...options.headers },
  });
}

export async function adminDownload(path, accessToken) {
  const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const response = await fetch(`${API_BASE}/admin${path}`, {
    headers: authHeader,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || "Unable to load the certificate preview.");
  }
  return response.blob();
}
