// src/composables/useApi.js
const BASE = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('pgds_token')
}

async function apiFetch(path, opts = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  if (opts.headers) {
    Object.assign(headers, opts.headers)
  }
  const res = await fetch(BASE + path, {
    ...opts,
    credentials: 'include',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  get:    (path)         => apiFetch(path),
  post:   (path, body)   => apiFetch(path, { method: 'POST',   body }),
  put:    (path, body)   => apiFetch(path, { method: 'PUT',    body }),
  patch:  (path, body)   => apiFetch(path, { method: 'PATCH',  body }),
  delete: (path)         => apiFetch(path, { method: 'DELETE' }),
}
