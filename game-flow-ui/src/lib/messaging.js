import { authHeaders, request } from './api'

const mutationHeaders = (token) => ({ ...authHeaders(token), 'Idempotency-Key': crypto.randomUUID() })
export const fetchConversationMessages = (token, conversationId, before = '') => request(`/conversations/${encodeURIComponent(conversationId)}/messages${before ? `?before=${encodeURIComponent(before)}` : ''}`, { headers: authHeaders(token) })
export const sendMessage = (token, conversationId, payload) => request(`/conversations/${encodeURIComponent(conversationId)}/messages`, { method: 'POST', headers: mutationHeaders(token), body: payload })
export const markConversationRead = (token, conversationId, messageId) => request(`/conversations/${encodeURIComponent(conversationId)}/read`, { method: 'POST', headers: mutationHeaders(token), body: messageId ? { messageId } : {} })
export const createDirectConversation = (token, recipientId) => request('/conversations/direct', { method: 'POST', headers: mutationHeaders(token), body: { recipientId } })
