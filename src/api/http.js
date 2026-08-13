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

export function adminRequest(path, accessToken, options = {}) {
  return request(`/admin${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, ...options.headers },
  });
}

export async function adminDownload(path, accessToken) {
  const response = await fetch(`${API_BASE}/admin${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || "Unable to load the certificate preview.");
  }
  return response.blob();
}
