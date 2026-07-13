import { useCallback } from 'react'
import { fetchContent } from '../lib/content'
import { normalizeList } from '../lib/api'
import { useAsync } from './useAsync'

export function useFeed(token, options = {}) {
  const load = useCallback(() => fetchContent(token, options).then((data) => normalizeList(data, 'content')), [token, options])
  return useAsync(load)
}

