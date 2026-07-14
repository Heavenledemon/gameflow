import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchFeed } from '../lib/content'

const PAGE_SIZE = 12
const MAX_ITEMS = 60

export function useReelFeed(token) {
  const [state, setState] = useState({ items: [], nextCursor: null, status: 'loading', error: '', retryAfter: 0 })
  const seenFeedIds = useRef(new Set())
  const inFlightCursor = useRef(null)
  const controllerRef = useRef(null)

  const load = useCallback(async ({ reset = false } = {}) => {
    const cursor = reset ? '' : state.nextCursor
    if (!reset && (!cursor || inFlightCursor.current === cursor)) return
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    inFlightCursor.current = cursor || '__initial__'
    setState((current) => ({ ...current, status: current.items.length ? 'loading-more' : 'loading', error: '' }))

    try {
      const data = await fetchFeed(token, { cursor, limit: PAGE_SIZE, signal: controller.signal })
      const incoming = Array.isArray(data.items) ? data.items : []
      if (reset) seenFeedIds.current.clear()
      const unique = incoming.filter((item) => item?.feedId && !seenFeedIds.current.has(item.feedId))
      unique.forEach((item) => seenFeedIds.current.add(item.feedId))
      setState((current) => ({
        items: (reset ? unique : [...current.items, ...unique]).slice(-MAX_ITEMS),
        nextCursor: data.nextCursor || null,
        status: 'ready', error: '', retryAfter: 0,
      }))
    } catch (error) {
      if (error?.name !== 'AbortError') {
        const retryAfter = Number(error?.retryAfter || 0)
        setState((current) => ({ ...current, status: current.items.length ? 'error-more' : 'error', error: error?.message || 'Unable to load the feed.', retryAfter }))
      }
    } finally {
      inFlightCursor.current = null
    }
  }, [state.nextCursor, token])

  useEffect(() => {
    load({ reset: true })
    return () => controllerRef.current?.abort()
    // load intentionally changes as cursors advance; this effect only resets when the viewer changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return { ...state, loadNext: () => load(), retry: () => load({ reset: state.items.length === 0 }), seenFeedIds: seenFeedIds.current }
}
