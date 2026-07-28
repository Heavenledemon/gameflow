import { authHeaders, request } from './api'

const mutationHeaders = (token) => ({ ...authHeaders(token), 'Idempotency-Key': crypto.randomUUID() })

export const fetchWorkspace = (token, projectId, options = {}) => request(`/projects/${encodeURIComponent(projectId)}/workspace`, { ...options, headers: { ...authHeaders(token), ...(options.headers || {}) } })

export const fetchWorkspaceAssets = (token, projectId, { query = '', status = 'ready', signal } = {}) => {
  const params = new URLSearchParams({ status })
  if (query) params.set('q', query)
  return request(`/projects/${encodeURIComponent(projectId)}/assets?${params}`, { signal, headers: authHeaders(token) })
}

export const fetchAssetDownloadUrl = (token, projectId, assetId) => request(`/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}/download-url`, { method: 'POST', headers: mutationHeaders(token) })

export const deleteWorkspaceAsset = (token, projectId, assetId) => request(`/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`, { method: 'DELETE', headers: mutationHeaders(token) })

export const restoreWorkspaceAsset = (token, projectId, assetId) => request(`/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}/restore`, { method: 'POST', headers: mutationHeaders(token) })
