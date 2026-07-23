import { authHeaders, request } from './api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const VIEWED_STORIES_KEY = 'gameflow:viewed-stories'

export function getViewedStoryIds() {
  try { return new Set(JSON.parse(localStorage.getItem(VIEWED_STORIES_KEY) || '[]')) }
  catch { return new Set() }
}

export function markStoryViewed(storyId) {
  const viewed = getViewedStoryIds()
  viewed.add(storyId)
  localStorage.setItem(VIEWED_STORIES_KEY, JSON.stringify([...viewed]))
  return viewed
}

export function fetchStories(token = '', options = {}) {
  return request('/stories', { ...options, headers: { ...authHeaders(token), ...(options.headers || {}) } })
}

export async function uploadStory(token, file, caption = '') {
  const response = await fetch(`${API_BASE_URL}/stories`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      'X-Mime-Type': file.type,
      'X-File-Name': encodeURIComponent(file.name),
      'X-Story-Caption': encodeURIComponent(caption),
    },
    body: await file.arrayBuffer(),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || 'Story upload failed.')
  return data
}

export function deleteStory(token, storyId) {
  return request(`/stories/${encodeURIComponent(storyId)}`, { method: 'DELETE', headers: authHeaders(token) })
}
