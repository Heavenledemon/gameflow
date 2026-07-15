import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchConversationMessages, markConversationRead, sendMessage } from '../lib/messaging'

const initialState = { conversation: null, items: [], status: 'loading', error: '', nextCursor: null }

export function useConversation(token, conversationId) {
  const key = `gameflow:draft:${conversationId}`
  const controllerRef = useRef(null)
  const [state, setState] = useState(initialState)
  const [draft, setDraft] = useState(() => localStorage.getItem(key) || '')

  useEffect(() => { setDraft(localStorage.getItem(key) || '') }, [key])
  useEffect(() => { localStorage.setItem(key, draft) }, [draft, key])

  const load = useCallback(async ({ before = '', append = false } = {}) => {
    if (!token || !conversationId) { setState({ ...initialState, status: 'ready' }); return }
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setState((current) => ({ ...current, status: append ? 'loading-more' : 'loading', error: '' }))
    try {
      const data = await fetchConversationMessages(token, conversationId, { before, signal: controller.signal })
      if (controller.signal.aborted) return
      setState((current) => ({ conversation: data.conversation, items: append ? [...data.items, ...current.items] : data.items, status: 'ready', error: '', nextCursor: data.nextCursor }))
      if (!append) {
        const latest = data.items.at(-1)
        if (latest) markConversationRead(token, conversationId, latest.id).catch(() => {})
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setState((current) => ({ ...current, status: 'error', error: error.message || 'Unable to load messages.' }))
    }
  }, [conversationId, token])

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [load])

  const reload = useCallback(() => load(), [load])
  const loadMore = useCallback(() => state.nextCursor ? load({ before: state.nextCursor, append: true }) : undefined, [load, state.nextCursor])
  const send = useCallback(async (body, clientMessageId) => {
    const optimistic = { id: `local:${clientMessageId}`, conversationId, senderId: 'me', body, type: 'text', clientMessageId, createdAt: new Date().toISOString(), pending: true }
    setState((current) => ({ ...current, items: [...current.items, optimistic] }))
    try {
      const result = await sendMessage(token, conversationId, { body, clientMessageId })
      setState((current) => ({ ...current, items: current.items.map((item) => item.clientMessageId === clientMessageId ? result.message : item) }))
      setDraft('')
      return result.message
    } catch (error) {
      setState((current) => ({ ...current, items: current.items.map((item) => item.clientMessageId === clientMessageId ? { ...item, failed: true, pending: false } : item) }))
      throw error
    }
  }, [conversationId, token])

  return { ...state, draft, setDraft, reload, loadMore, send }
}
