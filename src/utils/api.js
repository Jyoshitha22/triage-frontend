// Change this once you deploy the backend (Render, etc.) — every page
// imports api from here rather than hardcoding the URL itself.
const API_BASE = import.meta.env.VITE_API_BASE || '';
const GET_CACHE_TTL_MS = 8000;
const REQUEST_TIMEOUT_MS = 12000;
const getCache = new Map();
const inFlightGets = new Map();
let preferredBase = API_BASE || null;

function unique(items) {
  return Array.from(new Set(items.filter(Boolean)));
}

function candidateBases() {
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const hostDefaults = [
    `${protocol}//${hostname}:8000`,
  ];
  const localDefaults = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
  ];

  return unique([preferredBase, API_BASE, ...hostDefaults, ...localDefaults]);
}

async function parseErrorResponse(res) {
  const detail = await res.json().catch(() => ({}));
  return detail.detail || detail.error || `Request failed (${res.status})`;
}

async function request(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const cacheKey = `${method}:${path}`;

  if (method === 'GET' && !options.noCache) {
    const cached = getCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    if (inFlightGets.has(cacheKey)) return inFlightGets.get(cacheKey);
  }

  const { noCache, timeoutMs = REQUEST_TIMEOUT_MS, ...fetchOptions } = options;

  const doFetch = async () => {
    const bases = candidateBases();
    let lastError = null;

    for (let i = 0; i < bases.length; i += 1) {
      const base = bases[i];
      const isLast = i === bases.length - 1;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(`${base}${path}`, {
          headers: fetchOptions.body instanceof FormData ? undefined : { 'Content-Type': 'application/json', ...fetchOptions.headers },
          ...fetchOptions,
          signal: controller.signal,
        });

        if (!res.ok) {
          const message = await parseErrorResponse(res);
          const err = new Error(message);
          const shouldRetry = [404, 405].includes(res.status) || res.status >= 500;
          if (shouldRetry && !isLast) {
            lastError = err;
            continue;
          }
          throw err;
        }

        const contentType = res.headers.get('content-type') || '';
        // If a dev web server responds with HTML for API paths, keep probing real API candidates.
        if (!contentType.includes('application/json') && contentType.includes('text/html') && !isLast) {
          lastError = new Error('HTML response from non-API endpoint');
          continue;
        }
        preferredBase = base;
        if (contentType.includes('audio')) return res.blob();
        return contentType.includes('application/json') ? res.json() : res.text();
      } catch (err) {
        lastError = err;
        const isNetworkError = err?.name === 'TypeError' || err?.name === 'AbortError';
        if (!isNetworkError || isLast) {
          if (isNetworkError && isLast) {
            throw new Error('Server is temporarily unreachable. Please try again in a moment.');
          }
          throw err;
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw lastError || new Error('Server is temporarily unreachable.');
  };

  if (method === 'GET' && !options.noCache) {
    const promise = doFetch()
      .then((value) => {
        getCache.set(cacheKey, { value, expiresAt: Date.now() + GET_CACHE_TTL_MS });
        return value;
      })
      .finally(() => {
        inFlightGets.delete(cacheKey);
      });
    inFlightGets.set(cacheKey, promise);
    return promise;
  }

  return doFetch();
}

const api = {
  get: (path) => request(path),
  getWithOptions: (path, options = {}) => request(path, options),
  post: (path, body, options = {}) => request(path, {
    ...options,
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
  }),
  put: (path, body, options = {}) => request(path, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  del: (path, options = {}) => request(path, { ...options, method: 'DELETE' }),
};

export default api;