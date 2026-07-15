import { authHeaders, request } from './api'

const headers = (token) => ({ ...authHeaders(token), 'Idempotency-Key': crypto.randomUUID() })

export function fetchCollaborationRequests(token, { box = 'incoming', status = 'pending', cursor = '' } = {}) {
  const params = new URLSearchParams({ box, status })
  if (cursor) params.set('cursor', cursor)
  return request(`/collaboration/requests?${params}`, { headers: authHeaders(token) })
}

export function acceptCollaborationRequest(token, requestId) {
  return request(`/collaboration/requests/${encodeURIComponent(requestId)}/accept`, { method: 'POST', headers: headers(token) })
}

export function declineCollaborationRequest(token, requestId) {
  return request(`/collaboration/requests/${encodeURIComponent(requestId)}/decline`, { method: 'POST', headers: headers(token) })
}

export function cancelCollaborationRequest(token, requestId) {
  return request(`/collaboration/requests/${encodeURIComponent(requestId)}/cancel`, { method: 'POST', headers: headers(token) })
}
