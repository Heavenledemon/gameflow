import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchProjectMembers } from '../lib/collaboration'

const initialState = { items: [], status: 'loading', error: '' }

export function useProjectMembers(token, projectId) {
  const controllerRef = useRef(null)
  const [state, setState] = useState(initialState)

  const load = useCallback(async () => {
    if (!token || !projectId) { setState({ ...initialState, status: 'ready' }); return }
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      const data = await fetchProjectMembers(token, projectId, { signal: controller.signal })
      if (!controller.signal.aborted) setState({ items: data.items, status: 'ready', error: '' })
    } catch (error) {
      if (error?.name !== 'AbortError') setState((current) => ({ ...current, status: 'error', error: error.message || 'Unable to load project members.' }))
    }
  }, [projectId, token])

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [load])

  return { ...state, reload: load, setItems: (updater) => setState((current) => ({ ...current, items: typeof updater === 'function' ? updater(current.items) : updater })) }
}
