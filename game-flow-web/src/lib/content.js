import { authHeaders, request } from './api.js'

const mutationHeaders = (token) => ({ ...authHeaders(token), 'Idempotency-Key': crypto.randomUUID() })

export const fetchFeed = (token, { cursor = '', limit = 16 } = {}) => request(`/feed?${new URLSearchParams({ limit, ...(cursor ? { cursor } : {}) })}`, { headers: authHeaders(token) })
export const fetchProjects = (token) => request('/projects', { headers: authHeaders(token) })
export const fetchProject = (token, id) => request(`/projects/${encodeURIComponent(id)}`, { headers: authHeaders(token) })
export const createProject = (token, body) => request('/projects', { method: 'POST', headers: mutationHeaders(token), body })
export const publishProject = (token, id) => request(`/projects/${encodeURIComponent(id)}/publish`, { method: 'POST', headers: mutationHeaders(token) })
export const updateEngagement = (token, type, id, body) => request(`/content/${encodeURIComponent(type)}/${encodeURIComponent(id)}/engagement`, { method: 'POST', headers: mutationHeaders(token), body })
export async function uploadProjectFile(token, projectId, file) {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/files`, { method: 'PUT', headers: { ...mutationHeaders(token), 'Content-Type': 'application/octet-stream', 'X-File-Name': file.name, 'X-Relative-Path': file.name, 'X-Mime-Type': file.type || 'application/octet-stream' }, body: await file.arrayBuffer() })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Upload failed.')
  return data
}
