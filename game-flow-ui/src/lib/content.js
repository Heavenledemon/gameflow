import { authHeaders, request } from './api'
import { createCollaborationRequest as createCollaborationRequestApi } from './collaboration'
import { flags } from './flags'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const mutationHeaders = (token) => ({ Authorization: `Bearer ${token}`, 'Idempotency-Key': crypto.randomUUID() })
const RETRYABLE_MUTATION_STATUSES = new Set([409, 502, 503, 504])

async function requestMutation(path, options, attempts = 3) {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await request(path, options)
    } catch (error) {
      lastError = error
      const retryable = !error?.status || RETRYABLE_MUTATION_STATUSES.has(error.status)
      if (!retryable || attempt === attempts - 1) throw error
      const delay = error.retryAfter > 0
        ? Math.min(error.retryAfter * 1000, 2000)
        : 250 * (attempt + 1)
      await new Promise((resolve) => window.setTimeout(resolve, delay))
    }
  }
  throw lastError
}

export async function fetchContent(token = '', options = {}) {
  return request('/content', {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...authHeaders(token),
    },
  })
}

export async function searchUsers(query, token = '', options = {}) {
  return request(`/users/search?q=${encodeURIComponent(query)}`, {
    ...options,
    headers: { ...(options.headers ?? {}), ...authHeaders(token) },
  })
}

export async function fetchPublicUser(identity, token = '', options = {}) {
  return request(`/users/${encodeURIComponent(identity)}`, {
    ...options,
    headers: { ...(options.headers ?? {}), ...authHeaders(token) },
  })
}

export async function fetchUserFollows(userId, kind, token = '', options = {}) {
  return request(`/users/${encodeURIComponent(userId)}/${encodeURIComponent(kind)}`, {
    ...options,
    headers: { ...(options.headers ?? {}), ...authHeaders(token) },
  })
}

export async function fetchFeed(token = '', { cursor = '', limit = 12, signal } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  return request(`/feed?${params.toString()}`, {
    signal,
    headers: authHeaders(token),
  })
}

export async function fetchProject(projectId, token = '', options = {}) {
  return request(`/projects/${encodeURIComponent(projectId)}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...authHeaders(token),
    },
  })
}

export async function fetchMyPrivateProjects(token, options = {}) {
  return request('/projects/private', {
    ...options,
    headers: { ...(options.headers ?? {}), ...authHeaders(token) },
  })
}

export async function createProject(token, payload) {
  return request('/projects', {
    method: 'POST',
    headers: {
      ...mutationHeaders(token),
    },
    body: payload,
  })
}

export async function uploadProjectFile(token, projectId, fileMeta, file) {
  const body = await file.arrayBuffer()
  const idempotencyKey = crypto.randomUUID()

  if (flags.objectStorage) {
    const digest = await crypto.subtle.digest('SHA-256', body)
    const checksum = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    const initiated = await request(`/projects/${encodeURIComponent(projectId)}/uploads/initiate`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Idempotency-Key': idempotencyKey },
      body: { name: fileMeta.name, relativePath: fileMeta.relativePath, mimeType: fileMeta.mimeType || file.type || '', size: body.byteLength, checksum },
    })
    const lowerName = String(fileMeta.relativePath || fileMeta.name || '').toLowerCase()
    const contentEncoding = lowerName.endsWith('.br')
      ? 'br'
      : lowerName.endsWith('.gz') || lowerName.endsWith('.unityweb')
        ? 'gzip'
        : ''
    const uploadHeaders = {
      'Content-Type': fileMeta.mimeType || file.type || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...(contentEncoding ? { 'Content-Encoding': contentEncoding } : {}),
    }
    const uploadResponse = await fetch(initiated.uploadUrl, { method: 'PUT', headers: uploadHeaders, body })
    if (!uploadResponse.ok) throw new Error('Direct upload failed.')
    return request(`/uploads/${encodeURIComponent(initiated.uploadId)}/complete`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
      body: { checksum, size: body.byteLength, etag: uploadResponse.headers.get('etag') || '' },
    })
  }

  const response = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/files`, {
    method: 'PUT',
    headers: {
      ...mutationHeaders(token),
      'Content-Type': 'application/octet-stream',
      'X-File-Name': fileMeta.name,
      'X-Relative-Path': fileMeta.relativePath,
      'X-Mime-Type': fileMeta.mimeType || file.type || 'application/octet-stream',
      'Idempotency-Key': idempotencyKey,
    },
    body,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed.')
  }

  return data
}

export async function publishProject(token, projectId) {
  return request(`/projects/${encodeURIComponent(projectId)}/publish`, {
    method: 'POST',
    headers: {
      ...mutationHeaders(token),
    },
  })
}

export async function updateProject(token, projectId, payload) {
  return request(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    headers: {
      ...mutationHeaders(token),
    },
    body: payload,
  })
}

export async function deleteProject(token, projectId) {
  return request(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
    headers: {
      ...mutationHeaders(token),
    },
  })
}

export async function updateContentEngagement(token, contentType, contentId, payload) {
  return request(`/content/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/engagement`, {
    method: 'POST',
    headers: mutationHeaders(token),
    body: payload,
  })
}

export async function fetchPostEngagement(token, postId) {
  return request(`/posts/${encodeURIComponent(postId)}/engagement`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function fetchProjectLikes(token, postId) {
  return request(`/posts/${encodeURIComponent(postId)}/likes`, {
    headers: authHeaders(token),
  })
}

export async function fetchPostComments(token, postId, { cursor = '', limit = 30 } = {}) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  return request(`/posts/${encodeURIComponent(postId)}/comments?${params.toString()}`, { headers: authHeaders(token) })
}

export async function fetchContentComments(token, contentType, contentId) {
  return request(`/content/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/comments`, {
    headers: authHeaders(token),
  })
}

export async function togglePostLike(token, postId) {
  return requestMutation(`/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST',
    headers: mutationHeaders(token),
  })
}

export async function togglePostSave(token, postId) {
  return requestMutation(`/posts/${encodeURIComponent(postId)}/save`, {
    method: 'POST',
    headers: mutationHeaders(token),
  })
}

export async function createPostComment(token, postId, payload) {
  return request(`/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    headers: mutationHeaders(token),
    body: payload,
  })
}

export async function createCommentReply(token, commentId, payload) {
  return request(`/comments/${encodeURIComponent(commentId)}/replies`, {
    method: 'POST',
    headers: mutationHeaders(token),
    body: payload,
  })
}

export async function toggleCommentReaction(token, commentId, emoji) {
  return request(`/comments/${encodeURIComponent(commentId)}/reactions`, {
    method: 'POST', headers: mutationHeaders(token), body: { emoji },
  })
}

export async function fetchCollaborationCandidates(token) {
  return request('/auth/social/collaboration-candidates', { headers: authHeaders(token) })
}

export async function toggleUserFollow(token, userId) {
  const result = await request(`/auth/social/users/${encodeURIComponent(userId)}/follow`, {
    method: 'POST', headers: mutationHeaders(token),
  })
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('gameflow:follow-changed', { detail: { userId: String(userId), ...result } }))
  return result
}

export async function createCollaborationRequest(token, projectId, payload) {
  return createCollaborationRequestApi(token, projectId, payload)
}
