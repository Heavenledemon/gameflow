import { useCallback, useEffect, useState } from 'react'
import { fetchCollaborationRequests } from '../lib/collaboration'

export function useInbox(token, box, status = 'pending') {
  const [state, setState] = useState({ items: [], status: 'loading', error: '', nextCursor: null })
  const load = useCallback(async (cursor = '', append = false) => {
    if (!token) return
    setState((current) => ({ ...current, status: append ? 'loading-more' : 'loading', error: '' }))
    try {
      const data = await fetchCollaborationRequests(token, { box, status, cursor })
      setState((current) => ({ items: append ? [...current.items, ...(data.items || [])] : (data.items || []), status: 'ready', error: '', nextCursor: data.nextCursor || null }))
    } catch (error) { setState((current) => ({ ...current, status: 'error', error: error.message || 'Unable to load collaboration requests.' })) }
  }, [box, status, token])
  useEffect(() => { load() }, [load])
  return { ...state, reload: () => load(), loadMore: () => state.nextCursor && load(state.nextCursor, true), setItems: (updater) => setState((current) => ({ ...current, items: typeof updater === 'function' ? updater(current.items) : updater })) }
}
