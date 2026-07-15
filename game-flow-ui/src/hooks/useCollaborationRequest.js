import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchCollaborationRequest } from '../lib/collaboration'

const initialState = { request: null, status: 'loading', error: '' }

export function useCollaborationRequest(token, requestId) {
  const controllerRef = useRef(null)
  const [state, setState] = useState(initialState)

  const load = useCallback(async () => {
    if (!token || !requestId) { setState({ ...initialState, status: 'ready' }); return }
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setState((current) => ({ ...current, status: 'loading', error: '' }))
    try {
      const data = await fetchCollaborationRequest(token, requestId, { signal: controller.signal })
      if (!controller.signal.aborted) setState({ request: data.request, status: 'ready', error: '' })
    } catch (error) {
      if (error?.name !== 'AbortError') setState((current) => ({ ...current, status: 'error', error: error.message || 'Unable to load collaboration request.' }))
    }
  }, [requestId, token])

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [load])

  return { ...state, reload: load, setRequest: (request) => setState((current) => ({ ...current, request })) }
}
