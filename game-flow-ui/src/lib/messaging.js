import { authHeaders, request } from './api'

const mutationHeaders = (token) => ({ ...authHeaders(token), 'Idempotency-Key': crypto.randomUUID() })

export function normalizeConversation(record) {
  if (!record) return null
  const parsedUnreadCount = record.unreadCount === null || record.unreadCount === undefined ? Number.NaN : Number(record.unreadCount)
  const unreadCount = Number.isFinite(parsedUnreadCount) && parsedUnreadCount >= 0 ? parsedUnreadCount : null
  return {
    ...record,
    id: record.id || record._id || '',
    projectId: record.projectId || null,
    collaborationRequestId: record.collaborationRequestId || null,
    unreadCount,
    isUnread: unreadCount !== null ? unreadCount > 0 : record.isUnread === true,
  }
}

export function normalizeMessage(record) {
  if (!record) return null
  return { ...record, id: record.id || record._id || '', conversationId: record.conversationId || '' }
}

/** Fetches cursor-paginated direct, request, and project conversations. */
export async function fetchConversations(token, { cursor = '', limit = 30, signal } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  const data = await request(`/conversations?${params.toString()}`, { signal, headers: authHeaders(token) })
  return { ...data, items: (data.items || []).map(normalizeConversation), nextCursor: data.nextCursor || null }
}

export async function fetchConversationMessages(token, conversationId, { before = '', limit = 50, signal } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (before) params.set('before', before)
  const data = await request(`/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`, { signal, headers: authHeaders(token) })
  return { ...data, conversation: normalizeConversation(data.conversation), items: (data.items || []).map(normalizeMessage), nextCursor: data.nextCursor || null }
}

export async function sendMessage(token, conversationId, payload) {
  const data = await request(`/conversations/${encodeURIComponent(conversationId)}/messages`, { method: 'POST', headers: mutationHeaders(token), body: payload })
  return { ...data, message: normalizeMessage(data.message) }
}

export const markConversationRead = (token, conversationId, messageId) => request(`/conversations/${encodeURIComponent(conversationId)}/read`, { method: 'POST', headers: mutationHeaders(token), body: messageId ? { messageId } : {} })

export async function createDirectConversation(token, recipientId) {
  const data = await request('/conversations/direct', { method: 'POST', headers: mutationHeaders(token), body: { recipientId } })
  return { ...data, conversation: normalizeConversation(data.conversation) }
}
