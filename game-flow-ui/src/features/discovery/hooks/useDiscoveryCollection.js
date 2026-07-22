import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchDiscoveryCollection } from '../discoveryApi'

const EMPTY_COLLECTION = { items: [], source: 'content', loadedCount: 0 }

export function useDiscoveryCollection(token) {
  const [state, setState] = useState({ data: EMPTY_COLLECTION, loading: true, error: null })
  const controllerRef = useRef(null)

  const load = useCallback(async () => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setState((current) => ({ ...current, loading: true, error: null }))

    try {
      const data = await fetchDiscoveryCollection(token, { signal: controller.signal })
      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setState((current) => ({ ...current, loading: false, error }))
      }
      return null
    }
  }, [token])

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [load])

  return { ...state, retry: load }
}
