import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchConversations } from '../lib/messaging'

const initialState = { items: [], status: 'loading', error: '', nextCursor: null }

export function useConversations(token, { limit = 30, enabled = true } = {}) {
  const controllerRef = useRef(null)
  const [state, setState] = useState(initialState)

  const load = useCallback(async ({ cursor = '', append = false } = {}) => {
    if (!enabled || !token) { setState({ ...initialState, status: 'ready' }); return }
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setState((current) => ({ ...current, status: append ? 'loading-more' : 'loading', error: '' }))
    try {
      const data = await fetchConversations(token, { cursor, limit, signal: controller.signal })
      if (controller.signal.aborted) return
      setState((current) => ({ items: append ? [...current.items, ...data.items] : data.items, status: 'ready', error: '', nextCursor: data.nextCursor }))
    } catch (error) {
      if (error?.name === 'AbortError') return
      setState((current) => ({ ...current, status: 'error', error: error.message || 'Unable to load conversations.' }))
    }
  }, [enabled, limit, token])

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [load])

  const reload = useCallback(() => load(), [load])
  const loadMore = useCallback(() => state.nextCursor ? load({ cursor: state.nextCursor, append: true }) : undefined, [load, state.nextCursor])
  const findProjectConversation = useCallback(async (projectId) => {
    if (!token || !projectId) return null
    const existing = state.items.find((item) => item.kind === 'project' && String(item.projectId) === String(projectId))
    if (existing) return existing
    let cursor = state.nextCursor
    let pages = 0
    while (cursor && pages < 10) {
      const data = await fetchConversations(token, { cursor, limit })
      setState((current) => {
        const known = new Set(current.items.map((item) => item.id))
        return { ...current, items: [...current.items, ...data.items.filter((item) => !known.has(item.id))], nextCursor: data.nextCursor }
      })
      const found = data.items.find((item) => item.kind === 'project' && String(item.projectId) === String(projectId))
      if (found) return found
      cursor = data.nextCursor
      pages += 1
    }
    return null
  }, [limit, state.items, state.nextCursor, token])
  return { ...state, reload, loadMore, findProjectConversation, setItems: (updater) => setState((current) => ({ ...current, items: typeof updater === 'function' ? updater(current.items) : updater })) }
}
