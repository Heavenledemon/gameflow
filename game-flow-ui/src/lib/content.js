import { authHeaders, request } from './api'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export async function fetchContent(token = '', options = {}) {
  return request('/content', {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      ...authHeaders(token),
    },
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

export async function createProject(token, payload) {
  return request('/projects', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  })
}

export async function uploadProjectFile(token, projectId, fileMeta, file) {
  const body = await file.arrayBuffer()

  const response = await fetch(`${API_BASE_URL}/projects/${encodeURIComponent(projectId)}/files`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'X-File-Name': fileMeta.name,
      'X-Relative-Path': fileMeta.relativePath,
      'X-Mime-Type': fileMeta.mimeType || file.type || 'application/octet-stream',
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
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function updateProject(token, projectId, payload) {
  return request(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  })
}

export async function deleteProject(token, projectId) {
  return request(`/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function updateContentEngagement(token, contentType, contentId, payload) {
  return request(`/content/${encodeURIComponent(contentType)}/${encodeURIComponent(contentId)}/engagement`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

export async function togglePostLike(token, postId) {
  return request(`/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function togglePostSave(token, postId) {
  return request(`/posts/${encodeURIComponent(postId)}/save`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function createPostComment(token, postId, payload) {
  return request(`/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  })
}

export async function createCommentReply(token, commentId, payload) {
  return request(`/comments/${encodeURIComponent(commentId)}/replies`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: payload,
  })
}
