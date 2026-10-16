// Admin registration/login use the Express + PostgreSQL hospital backend.
// Configure VITE_HOSPITAL_API_BASE when the backend is deployed elsewhere.
const HOSPITAL_API_BASE = import.meta.env.VITE_HOSPITAL_API_BASE || 'http://localhost:5000';

const hospitalApi = {
  async post(path, body) {
    const response = await fetch(`${HOSPITAL_API_BASE}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || data.error || `Request failed (${response.status})`);
    }
    return data;
  },
};

export default hospitalApi;
