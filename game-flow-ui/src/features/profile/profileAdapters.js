import { fromContentItem, fromProject } from '../project/model/projectCardModel.js'

export function safeExternalUrl(value) {
  if (!value || typeof value !== 'string') return null
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}

export function creatorFromPortfolio(raw, model, fallbackId = '') {
  const nested = raw?.creator && typeof raw.creator === 'object' ? raw.creator : {}
  return {
    id: model?.creator?.id || nested.id || nested._id || raw?.ownerId || null,
    name: model?.creator?.name || nested.name || raw?.ownerName || model?.creator?.username || fallbackId || null,
    username: model?.creator?.username || nested.username || raw?.ownerUsername || fallbackId || null,
    avatar: model?.creator?.avatarUrl || nested.avatar || nested.avatarUrl || raw?.ownerAvatar || null,
    banner: nested.banner || raw?.ownerBanner || null,
    verified: Boolean(model?.creator?.verified || nested.isVerified || nested.verified),
    role: nested.creatorType || nested.role || raw?.ownerRole || null,
    headline: nested.headline || raw?.ownerHeadline || null,
    location: nested.location || raw?.ownerLocation || null,
    bio: nested.bio || raw?.ownerBio || null,
    website: nested.website || raw?.ownerWebsite || null,
    skills: Array.isArray(nested.skills) ? nested.skills : Array.isArray(raw?.ownerSkills) ? raw.ownerSkills : [],
    tools: Array.isArray(nested.tools) ? nested.tools : [],
    platforms: Array.isArray(nested.platforms) ? nested.platforms : [],
    followersCount: nested.followersCount ?? raw?.ownerFollowersCount ?? null,
    followingCount: nested.followingCount ?? raw?.ownerFollowingCount ?? null,
    viewsCount: nested.viewsCount ?? raw?.ownerViewsCount ?? null,
    collaborationOpen: typeof nested.collaborationOpen === 'boolean' ? nested.collaborationOpen : null,
  }
}

export function matchesCreator(item, creatorId) {
  const target = String(creatorId || '').trim().toLowerCase()
  if (!target) return false
  const nested = item?.creator && typeof item.creator === 'object' ? item.creator : {}
  return [item?.ownerId, item?.ownerUsername, item?.creatorId, nested.id, nested._id, nested.username]
    .some((value) => String(value || '').trim().toLowerCase() === target)
}

export function mapPortfolioItems(items, kind = 'project') {
  return (items || []).map((item) => kind === 'project' ? fromProject(item) : fromContentItem(item, kind))
}

export function contentCollections(data) {
  return {
    projects: Array.isArray(data?.projects) ? data.projects : [],
    games: Array.isArray(data?.games) ? data.games : [],
    assets: Array.isArray(data?.assets) ? data.assets : [],
  }
}
