// Change this once you deploy the backend (Render, etc.) — every page
// imports api from here rather than hardcoding the URL itself.
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || `Request failed (${res.status})`);
  }
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('audio')) return res.blob();
  return contentType.includes('application/json') ? res.json() : res.text();
}

const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
};

export default api;