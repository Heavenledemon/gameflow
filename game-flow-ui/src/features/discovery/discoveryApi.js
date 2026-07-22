import { fetchContent } from '../../lib/content'
import { fromContentItem } from '../project/model/projectCardModel'

function asList(value) {
  return Array.isArray(value) ? value : []
}

/**
 * Adapts the existing `/content` response into the canonical project model.
 * The collection groups are real server distinctions; no discovery category,
 * creator recommendation, or route is invented here.
 */
export function adaptDiscoveryPayload(payload) {
  const candidates = [
    ...asList(payload?.projects).map((item) => fromContentItem(item, 'project')),
    ...asList(payload?.games).map((item) => fromContentItem(item, 'game')),
    ...asList(payload?.assets).map((item) => fromContentItem(item, 'asset')),
  ]
  const seen = new Set()
  const items = candidates.filter((project) => {
    const key = `${project.contentType}:${project.contentId ?? project.id ?? ''}`
    if (!project.id || seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    items,
    source: 'content',
    loadedCount: items.length,
  }
}

export async function fetchDiscoveryCollection(token = '', { signal } = {}) {
  const payload = await fetchContent(token, { signal })
  return adaptDiscoveryPayload(payload)
}
