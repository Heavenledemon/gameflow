import { authHeaders, request } from './api'

const mutationHeaders = (token) => ({ ...authHeaders(token), 'Idempotency-Key': crypto.randomUUID() })

/** Blocks or unblocks a creator. The server returns the resulting blocked state. */
export const toggleUserBlock = (token, userId) => request(`/auth/social/users/${encodeURIComponent(userId)}/block`, { method: 'POST', headers: mutationHeaders(token) })

/** Sends a plain-text safety report for a creator, conversation, or project context. */
export const createModerationReport = (token, payload) => request('/auth/social/reports', { method: 'POST', headers: mutationHeaders(token), body: payload })
