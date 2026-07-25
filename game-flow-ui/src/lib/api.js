const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const AUTH_EXPIRED_EVENT = 'gameflow:auth-expired'

export function normalizeError(error, fallback = 'Request failed.') {
  if (error instanceof Error) return error
  return new Error(error?.message || fallback)
}

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
  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed.')
    error.status = response.status
    error.retryAfter = Number(data?.retryAfter || response.headers.get('Retry-After') || 0)
    throw error
  }
  return data
}

export const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {})

export const normalizeList = (data, key = 'items') => {
  const value = Array.isArray(data) ? data : data?.[key] ?? data?.data ?? []
  return { items: Array.isArray(value) ? value : [], nextCursor: data?.nextCursor ?? data?.pagination?.nextCursor ?? null }
}

export const normalizeUser = (user) => user ? { ...user, id: user.id ?? user._id ?? null } : null
