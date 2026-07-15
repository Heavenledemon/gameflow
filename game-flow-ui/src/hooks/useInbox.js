import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCollaborationRequests } from '../lib/collaboration'

export function useInbox(token, box, status = 'pending') {
  const controllerRef = useRef(null)
  const [state, setState] = useState({ items: [], status: 'loading', error: '', nextCursor: null })
  const load = useCallback(async (cursor = '', append = false) => {
    if (!token) { setState({ items: [], status: 'ready', error: '', nextCursor: null }); return }
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setState((current) => ({ ...current, status: append ? 'loading-more' : 'loading', error: '' }))
    try {
      const data = await fetchCollaborationRequests(token, { box, status, cursor, signal: controller.signal })
      if (controller.signal.aborted) return
      setState((current) => ({ items: append ? [...current.items, ...(data.items || [])] : (data.items || []), status: 'ready', error: '', nextCursor: data.nextCursor || null }))
    } catch (error) { if (error?.name !== 'AbortError') setState((current) => ({ ...current, status: 'error', error: error.message || 'Unable to load collaboration requests.' })) }
  }, [box, status, token])
  useEffect(() => { load(); return () => controllerRef.current?.abort() }, [load])
  const reload = useCallback(() => load(), [load])
  const loadMore = useCallback(() => state.nextCursor && load(state.nextCursor, true), [load, state.nextCursor])
  return { ...state, reload, loadMore, setItems: (updater) => setState((current) => ({ ...current, items: typeof updater === 'function' ? updater(current.items) : updater })) }
}
