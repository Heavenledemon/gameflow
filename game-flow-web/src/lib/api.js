const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const AUTH_EXPIRED_EVENT = 'gameflow:auth-expired'

export async function request(path, options = {}) {
  const { headers: extraHeaders, body: rawBody, ...restOptions } = options
  const isJsonBody = rawBody !== undefined && rawBody !== null && typeof rawBody !== 'string' && !(rawBody instanceof FormData) && !(rawBody instanceof ArrayBuffer) && !ArrayBuffer.isView(rawBody)
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { ...(isJsonBody ? { 'Content-Type': 'application/json' } : {}), ...(extraHeaders ?? {}) },
    body: isJsonBody ? JSON.stringify(rawBody) : rawBody,
    ...restOptions,
  })
  const data = await response.json().catch(() => ({}))

  if (response.status === 401) window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT))
  if (!response.ok) throw new Error(data?.message || 'Request failed.')
  return data
}

export const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {})
