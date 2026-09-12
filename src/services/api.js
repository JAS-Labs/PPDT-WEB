const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://issb-ppdt-api.icyglacier-8bd82619.centralindia.azurecontainerapps.io/api/v1'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || data.error || 'The service could not complete the request.')
  return data
}

export function login(email, password) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function getProfile(token) {
  return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
}

export { API_BASE_URL }
