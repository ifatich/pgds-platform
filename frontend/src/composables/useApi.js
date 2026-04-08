// src/composables/useApi.js
const BASE = import.meta.env.VITE_API_URL || '/api'

console.log('[useApi] BASE URL configured:', BASE)

function getToken() {
  return localStorage.getItem('pgds_token')
}

async function apiFetch(path, opts = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
  if (opts.headers) {
    Object.assign(headers, opts.headers)
  }
  
  const fullUrl = BASE + path
  const method = opts.method || 'GET'
  console.log(`[API] ${method} ${fullUrl}`)
  
  try {
    const res = await fetch(fullUrl, {
      ...opts,
      credentials: 'include',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
    console.log(`[API Response] ${method} ${fullUrl} → ${res.status}`)
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  } catch (error) {
    console.error(`[API Error] ${method} ${fullUrl}:`, error.message)
    throw error
  }
}

export const api = {
  get:    (path)         => apiFetch(path),
  post:   (path, body)   => apiFetch(path, { method: 'POST',   body }),
  put:    (path, body)   => apiFetch(path, { method: 'PUT',    body }),
  patch:  (path, body)   => apiFetch(path, { method: 'PATCH',  body }),
  delete: (path)         => apiFetch(path, { method: 'DELETE' }),
}
