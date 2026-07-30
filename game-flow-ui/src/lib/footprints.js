import { authHeaders, request } from './api'

export const FOOTPRINT_REACTIONS = [
  { id: 'stopped_by', label: 'Stopped by', symbol: '✦' },
  { id: 'loved_work', label: 'Loved your work', symbol: '♥' },
  { id: 'inspired', label: 'Inspired', symbol: '✺' },
  { id: 'following_progress', label: 'Following your progress', symbol: '◎' },
  { id: 'collaboration_interest', label: 'Interested in collaborating', symbol: '◇' },
]

export function fetchMyFootprint(token, userId, options = {}) {
  return request(`/users/${encodeURIComponent(userId)}/footprint`, { ...options, headers: { ...(options.headers || {}), ...authHeaders(token) } })
}

export function saveMyFootprint(token, userId, reaction) {
  return request(`/users/${encodeURIComponent(userId)}/footprint`, { method: 'PUT', headers: authHeaders(token), body: { reaction } })
}

export function removeMyFootprint(token, userId) {
  return request(`/users/${encodeURIComponent(userId)}/footprint`, { method: 'DELETE', headers: authHeaders(token) })
}

export function fetchProfileFootprints(token, options = {}) {
  return request('/profile/footprints', { ...options, headers: { ...(options.headers || {}), ...authHeaders(token) } })
}

export function markProfileFootprintsReviewed(token) {
  return request('/profile/footprints/reviewed', { method: 'POST', headers: authHeaders(token) })
}
