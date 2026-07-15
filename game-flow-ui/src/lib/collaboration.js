import { authHeaders, request } from './api'

const headers = (token) => ({ ...authHeaders(token), 'Idempotency-Key': crypto.randomUUID() })

const normalizeUser = (user) => user ? { ...user, id: user.id || user._id || '' } : null

export function normalizeCollaborationRequest(record) {
  if (!record) return null
  return {
    ...record,
    id: record.id || record._id || '',
    projectId: record.projectId || record.project?.id || '',
    project: record.project ? { ...record.project, id: record.project.id || record.project._id || '' } : null,
    requester: normalizeUser(record.requester),
    recipient: normalizeUser(record.recipient),
    conversationId: record.conversationId || null,
  }
}

export function normalizeProjectMember(record) {
  if (!record) return null
  return { ...record, userId: record.userId || record.user?.id || record.user?._id || '' }
}

/** Fetches one cursor-paginated box of collaboration requests. */
export async function fetchCollaborationRequests(token, { box = 'incoming', status = 'pending', cursor = '', signal } = {}) {
  const params = new URLSearchParams({ box, status })
  if (cursor) params.set('cursor', cursor)
  const data = await request(`/collaboration/requests?${params}`, { signal, headers: authHeaders(token) })
  return { ...data, items: (data.items || []).map(normalizeCollaborationRequest), nextCursor: data.nextCursor || null }
}

/** Fetches a request the signed-in user is permitted to view. */
export async function fetchCollaborationRequest(token, requestId, { signal } = {}) {
  const data = await request(`/collaboration/requests/${encodeURIComponent(requestId)}`, { signal, headers: authHeaders(token) })
  return { ...data, request: normalizeCollaborationRequest(data.request) }
}

/** Creates either an owner invitation (recipientId supplied) or creator join request. */
export async function createCollaborationRequest(token, projectId, payload) {
  const data = await request(`/projects/${encodeURIComponent(projectId)}/collaboration-requests`, { method: 'POST', headers: headers(token), body: payload })
  return { ...data, request: normalizeCollaborationRequest(data.request) }
}

export async function acceptCollaborationRequest(token, requestId) {
  const data = await request(`/collaboration/requests/${encodeURIComponent(requestId)}/accept`, { method: 'POST', headers: headers(token) })
  return { ...data, request: normalizeCollaborationRequest(data.request) }
}

export async function declineCollaborationRequest(token, requestId) {
  const data = await request(`/collaboration/requests/${encodeURIComponent(requestId)}/decline`, { method: 'POST', headers: headers(token) })
  return { ...data, request: normalizeCollaborationRequest(data.request) }
}

export async function cancelCollaborationRequest(token, requestId) {
  const data = await request(`/collaboration/requests/${encodeURIComponent(requestId)}/cancel`, { method: 'POST', headers: headers(token) })
  return { ...data, request: normalizeCollaborationRequest(data.request) }
}

export async function fetchMyCollaborations(token, { signal } = {}) {
  const data = await request('/collaboration/projects', { signal, headers: authHeaders(token) })
  return { ...data, items: data.items || [] }
}

export async function fetchProjectMembers(token, projectId, { signal } = {}) {
  const data = await request(`/projects/${encodeURIComponent(projectId)}/members`, { signal, headers: authHeaders(token) })
  return { ...data, items: (data.items || []).map(normalizeProjectMember) }
}

export async function updateProjectMember(token, projectId, userId, role) {
  const data = await request(`/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`, { method: 'PATCH', headers: headers(token), body: { role } })
  return { ...data, member: normalizeProjectMember(data.member) }
}

export const removeProjectMember = (token, projectId, userId) => request(`/projects/${encodeURIComponent(projectId)}/members/${encodeURIComponent(userId)}`, { method: 'DELETE', headers: headers(token) })
