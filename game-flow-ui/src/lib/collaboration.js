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

export const fetchMyCollaborations = (token) => request('/collaboration/projects', { headers: authHeaders(token) })
export const fetchProjectMembers = (token, projectId) => request(`/projects/${encodeURIComponent(projectId)}/members`, { headers: authHeaders(token) })
export const updateProjectMember = (token, projectId, userId, role) => request(`/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`, { method: 'PATCH', headers: headers(token), body: { role } })
export const removeProjectMember = (token, projectId, userId) => request(`/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`, { method: 'DELETE', headers: headers(token) })
