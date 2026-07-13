import { useCallback } from 'react'
import { togglePostLike, togglePostSave, updateContentEngagement } from '../lib/content'
import { useAsync } from './useAsync'

export function useEngagement(token) {
  const mutate = useCallback((type, id, payload) => updateContentEngagement(token, type, id, payload), [token])
  const state = useAsync(mutate, { immediate: false })
  return { ...state, like: (id) => togglePostLike(token, id), save: (id) => togglePostSave(token, id), update: mutate }
}

