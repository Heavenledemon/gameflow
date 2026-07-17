import { authHeaders, request } from './api.js'

const mutationHeaders = (token) => ({ ...authHeaders(token), 'Idempotency-Key': crypto.randomUUID() })
export const fetchConversations = (token) => request('/conversations?limit=40', { headers: authHeaders(token) })
export const fetchMessages = (token, id) => request(`/conversations/${encodeURIComponent(id)}/messages?limit=60`, { headers: authHeaders(token) })
export const sendMessage = (token, id, body) => request(`/conversations/${encodeURIComponent(id)}/messages`, { method: 'POST', headers: mutationHeaders(token), body })
