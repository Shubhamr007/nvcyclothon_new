const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = `${API_BASE_URL.replace(/\/$/, '')}/api`;

export function apiUrl(path) {
  return `${API_BASE}${path}`;
}

export function resolveApiAssetUrl(url) {
  if (!url || /^(data:|blob:)/i.test(url)) return url;

  const parsed = new URL(url, API_BASE_URL || window.location.origin);
  const isApiAsset = parsed.pathname === "/api" || parsed.pathname.startsWith("/api/");
  if (!isApiAsset) return url;

  const isLocalApiHost = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  if (import.meta.env.DEV && (isLocalApiHost || !/^(https?:)?\/\//i.test(url))) {
    // Use Vite's existing /api proxy so local image loads stay same-origin under CSP.
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  const apiOrigin = API_BASE_URL || window.location.origin;
  return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, apiOrigin).toString();
}

export class ApiError extends Error {
  constructor(status, message, code = null, rawDetail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.rawDetail = rawDetail || message;
  }
}

export async function request(path, options = {}) {
  const { timeoutMs = 15000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      mode: 'cors',
      credentials: 'omit',
      headers: { Accept: 'application/json', ...options.headers },
      ...fetchOptions,
      signal: options.signal || controller.signal,
    });
    if (response.status === 204 || response.status === 205) {
      return null;
    }
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      throw new ApiError(
        502,
        "The API service returned an HTML response instead of JSON.",
        "ERR_INVALID_CONTENT_TYPE",
        `API endpoint ${path} returned HTML.`
      );
    }
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      const detail = body?.detail || "Something went wrong. Please try again.";
      const code = body?.code || null;
      throw new ApiError(response.status, detail, code, detail);
    }
    return body;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.name === 'AbortError') {
      throw new ApiError(408, "The API request timed out.", "ERR_TIMEOUT", "Request aborted or timed out.");
    }
    if (error instanceof TypeError && String(error.message || "").toLowerCase().includes("failed to fetch")) {
      throw new ApiError(
        0,
        "Unable to reach NV Cyclothon servers. Please check your internet connection.",
        "ERR_NETWORK_OFFLINE",
        error.message
      );
    }
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
  return request(`/content/settings?_t=${Date.now()}`);
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

export async function createGalleryBatch(accessToken, items) {
  return adminRequest("/gallery/batch", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
}

export async function bulkDeleteAdminRecords(accessToken, entity, ids) {
  return adminRequest("/bulk-delete", accessToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entity, ids }),
  });
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

export async function downloadVolunteerTemplate(accessToken) {
  const blob = await adminDownload("/volunteers/template", accessToken);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "nv-cyclothon-volunteer-template.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function bulkUploadVolunteers(accessToken, formData) {
  const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const response = await fetch(`${API_BASE}/admin/volunteers/bulk-upload`, {
    method: "POST",
    headers: authHeader,
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to bulk upload volunteers");
  }
  return response.json();
}

export async function sendVolunteerCredentials(accessToken, id) {
  return adminRequest(`/volunteers/${id}/send-credentials`, accessToken, {
    method: "POST",
  });
}

export async function previewVolunteerCertificate(accessToken, id) {
  return adminDownload(`/volunteers/${id}/certificate-preview`, accessToken);
}

export async function sendVolunteerCertificate(accessToken, id) {
  return adminRequest(`/volunteers/${id}/certificate-send`, accessToken, {
    method: "POST",
  });
}

export async function getCommunityPosts() {
  return request("/community/posts");
}

export async function submitCommunityPost(payload) {
  if (payload instanceof FormData) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${API_BASE}/community/posts`, {
        method: "POST",
        body: payload,
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

  return request("/community/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
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

export async function deleteAdminCommunityPost(accessToken, id) {
  return adminRequest(`/community/posts/${id}`, accessToken, {
    method: "DELETE",
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
    timeoutMs: options.timeoutMs || 45000,
    ...options,
    headers: { ...authHeader, ...options.headers },
  });
}

export async function uploadAdminProfileImage(accessToken, file) {
  const body = new FormData();
  body.append("image", file);
  const response = await fetch(`${API_BASE}/admin/profile-images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body,
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.detail || "Unable to upload image.");
  return result;
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

// --- Partner API ---
export async function getPartnerTiers() {
  return request('/partners/tiers');
}

export async function submitPartnerApplication(payload) {
  if (payload instanceof FormData) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${API_BASE}/partners/applications`, {
        method: 'POST',
        body: payload,
        signal: controller.signal,
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.detail || 'Unable to submit partner application.');
      return body;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return request('/partners/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function getApprovedPartners() {
  return request('/partnerships/approved');
}

export async function getPartnerApplicationStatus(ref) {
  return request(`/partnerships/applications/${encodeURIComponent(ref)}`);
}

export async function verifyPartnerPayment(id, payload) {
  return request(`/partners/applications/${id}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// --- Vendor API ---
export async function getVendorCategories() {
  return request('/vendors/categories');
}

export async function submitVendorApplication(formData) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${API_BASE}/vendors/applications`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.detail || 'Unable to submit vendor application.');
    return body;
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function getVendorApplicationStatus(ref) {
  return request(`/vendors/applications/${encodeURIComponent(ref)}`);
}

export async function verifyVendorPayment(id, payload) {
  return request(`/vendors/applications/${id}/payment/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

// --- Admin Partner/Vendor API ---
export function listAdminPartnerApplications(accessToken, options = {}) {
  const params = new URLSearchParams();
  if (typeof options === 'string' && options) {
    params.set('status', options);
  } else if (options && typeof options === 'object') {
    if (options.status && options.status !== 'all') params.set('status', options.status);
    if (options.search) params.set('search', options.search);
  }
  const qs = params.toString() ? `?${params.toString()}` : '';
  return adminRequest(`/partner-applications${qs}`, accessToken);
}

export function reviewPartnerApplication(accessToken, id, payload) {
  return adminRequest(`/partner-applications/${id}/review`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getAdminPartnerDeliverables(accessToken, id) {
  return adminRequest(`/partner-applications/${id}/deliverables`, accessToken);
}

export function updateAdminPartnerDeliverable(accessToken, id, deliverableId, payload) {
  return adminRequest(`/partner-applications/${id}/deliverables/${deliverableId}`, accessToken, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function exportAdminPartnersCsv(accessToken) {
  const response = await fetch(`${API_BASE}/admin/partner-applications/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Unable to export partner applications.');
  return response.blob();
}

export async function getAdminPartnerLogo(accessToken, id) {
  const response = await fetch(
    `${API_BASE}/admin/partner-applications/${id}/logo`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || 'Unable to load partner logo.');
  }
  return response.blob();
}

export function listAdminVendorApplications(accessToken, options = {}) {
  const params = new URLSearchParams();
  if (typeof options === 'string' && options) {
    params.set('status', options);
  } else if (options && typeof options === 'object') {
    if (options.status && options.status !== 'all') params.set('status', options.status);
    if (options.search) params.set('search', options.search);
  }
  const qs = params.toString() ? `?${params.toString()}` : '';
  return adminRequest(`/vendor-applications${qs}`, accessToken);
}

export function reviewVendorApplication(accessToken, id, payload) {
  return adminRequest(`/vendor-applications/${id}/review`, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function exportAdminVendorsCsv(accessToken) {
  const response = await fetch(`${API_BASE}/admin/vendor-applications/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error('Unable to export vendor applications.');
  return response.blob();
}

export async function getAdminVendorDocument(accessToken, id) {
  const response = await fetch(
    `${API_BASE}/admin/vendor-applications/${id}/document`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || 'Unable to load vendor document.');
  }
  return response.blob();
}
