import { authHeaders, request } from './api'

export const INSIGHTS_PERIODS = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
]

export function fetchAnalyticsOverview(token, period = '30d', options = {}) {
  return request(`/analytics/overview?period=${encodeURIComponent(period)}`, { ...options, headers: { ...(options.headers || {}), ...authHeaders(token) } })
}

export function fetchAnalyticsContent(token, { period = '30d', sort = 'views', limit = 12, cursor = '' } = {}, options = {}) {
  const params = new URLSearchParams({ period, sort, limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  return request(`/analytics/content?${params.toString()}`, { ...options, headers: { ...(options.headers || {}), ...authHeaders(token) } })
}

export function fetchAnalyticsFootprints(token, period = '30d', options = {}) {
  return request(`/analytics/footprints?period=${encodeURIComponent(period)}`, { ...options, headers: { ...(options.headers || {}), ...authHeaders(token) } })
}

function analyticsIdentity() {
  const key = 'gameflow:analytics-id'
  try {
    const existing = localStorage.getItem(key)
    if (existing) return existing
    const value = crypto.randomUUID()
    localStorage.setItem(key, value)
    return value
  } catch { return '' }
}

export function trackAnalyticsEvents(events, token = '') {
  const anonymousId = analyticsIdentity()
  const body = { events: (events || []).map((event) => ({ anonymousId, sessionId: anonymousId, occurredAt: new Date().toISOString(), ...event })) }
  return request('/analytics/events', { method: 'POST', headers: authHeaders(token), body }).catch(() => null)
}
