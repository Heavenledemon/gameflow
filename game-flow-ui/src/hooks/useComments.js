import { useCallback } from 'react'
import { createCommentReply, createPostComment, fetchPostEngagement } from '../lib/content'
import { useAsync } from './useAsync'

export function useComments(token, postId) {
  const load = useCallback(() => fetchPostEngagement(token, postId), [token, postId])
  const state = useAsync(load, { immediate: false })
  return { ...state, addComment: (payload) => createPostComment(token, postId, payload), addReply: (commentId, payload) => createCommentReply(token, commentId, payload) }
}

