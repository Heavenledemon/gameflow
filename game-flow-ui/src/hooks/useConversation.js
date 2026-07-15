import { useCallback, useEffect, useState } from 'react'
import { fetchConversationMessages, markConversationRead, sendMessage } from '../lib/messaging'

export function useConversation(token, conversationId) {
  const key = `gameflow:draft:${conversationId}`
  const [state, setState] = useState({ items: [], status: 'loading', error: '', nextCursor: null })
  const [draft, setDraft] = useState(() => localStorage.getItem(key) || '')
  useEffect(() => { localStorage.setItem(key, draft) }, [draft, key])
  const load = useCallback(async () => { if (!token || !conversationId) return; setState((s) => ({ ...s, status: 'loading', error: '' })); try { const data = await fetchConversationMessages(token, conversationId); setState({ items: data.items || [], status: 'ready', error: '', nextCursor: data.nextCursor || null }); const latest = data.items?.at(-1); if (latest) markConversationRead(token, conversationId, latest.id).catch(() => {}) } catch (error) { setState((s) => ({ ...s, status: 'error', error: error.message || 'Unable to load messages.' })) } }, [conversationId, token])
  useEffect(() => { load() }, [load])
  const send = useCallback(async (body, clientMessageId) => { const optimistic = { id: `local:${clientMessageId}`, conversationId, senderId: 'me', body, type: 'text', clientMessageId, createdAt: new Date().toISOString(), pending: true }; setState((s) => ({ ...s, items: [...s.items, optimistic] })); try { const result = await sendMessage(token, conversationId, { body, clientMessageId }); setState((s) => ({ ...s, items: s.items.map((item) => item.clientMessageId === clientMessageId ? result.message : item) })); setDraft(''); return result.message } catch (error) { setState((s) => ({ ...s, items: s.items.map((item) => item.clientMessageId === clientMessageId ? { ...item, failed: true, pending: false } : item) })); throw error } }, [conversationId, token])
  return { ...state, draft, setDraft, reload: load, send }
}
