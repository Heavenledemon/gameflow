import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchConversations } from '../lib/messaging'

const initialState = { items: [], status: 'loading', error: '', nextCursor: null }

export function useConversations(token, { limit = 30 } = {}) {
  const controllerRef = useRef(null)
  const [state, setState] = useState(initialState)

  const load = useCallback(async ({ cursor = '', append = false } = {}) => {
    if (!token) { setState({ ...initialState, status: 'ready' }); return }
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
  }, [limit, token])

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [load])

  const reload = useCallback(() => load(), [load])
  const loadMore = useCallback(() => state.nextCursor ? load({ cursor: state.nextCursor, append: true }) : undefined, [load, state.nextCursor])
  return { ...state, reload, loadMore, setItems: (updater) => setState((current) => ({ ...current, items: typeof updater === 'function' ? updater(current.items) : updater })) }
}
