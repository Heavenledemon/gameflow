import { useCallback, useEffect, useRef, useState } from 'react'

export function useAsync(asyncFunction, { immediate = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: immediate, mutating: false })
  const mounted = useRef(true)
  useEffect(() => () => { mounted.current = false }, [])
  const run = useCallback(async (...args) => {
    setState((current) => ({ ...current, loading: true, error: null }))
    try { const data = await asyncFunction(...args); if (mounted.current) setState({ data, error: null, loading: false, mutating: false }); return data }
    catch (error) { if (mounted.current) setState((current) => ({ ...current, error, loading: false, mutating: false })); throw error }
  }, [asyncFunction])
  return { ...state, run, retry: run }
}

