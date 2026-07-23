/**
 * ProjectCardModel — Canonical Data Normalizer
 * Reference: GAMEFLOW_MOBILE_FIRST_UI_DESIGN_GUIDE.md — Section 8
 *
 * Normalizes raw backend payloads from feed, discover, detail, and profile endpoints
 * into a single canonical shape consumed by all UI components.
 */

const isDev = Boolean(
  (typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'development') ||
  (typeof import.meta !== 'undefined' && import.meta.env?.DEV)
)

const MEDIA_KIND_ALIASES = new Map([
  ['2d', 'image'],
  ['image', 'image'],
  ['illustration', 'image'],
  ['art', 'image'],
  ['photo', 'image'],
  ['video', 'video'],
  ['game', 'webgl'],
  ['webgl', 'webgl'],
  ['playable', 'webgl'],
  ['asset', 'gltf'],
  ['3d', 'gltf'],
  ['3d-asset', 'gltf'],
  ['3d asset', 'gltf'],
  ['gltf', 'gltf'],
  ['glb', 'gltf'],
  ['model', 'gltf'],
])

const PROJECT_TYPE_ALIASES = new Map([
  ['game', 'game'],
  ['webgl', 'game'],
  ['playable', 'game'],
  ['3d', '3d-asset'],
  ['3d-asset', '3d-asset'],
  ['3d asset', '3d-asset'],
  ['gltf', '3d-asset'],
  ['model', '3d-asset'],
  ['2d', '2d-art'],
  ['2d-art', '2d-art'],
  ['2d art', '2d-art'],
  ['illustration', '2d-art'],
  ['art', '2d-art'],
  ['asset', 'asset'],
  ['mod', 'asset'],
])

function hasValue(value) {
  return value !== undefined && value !== null && value !== ''
}

function firstValue(...values) {
  return values.find(hasValue) ?? null
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter(hasValue)
  return hasValue(value) ? [value] : []
}

function uniqueStrings(...values) {
  return [...new Set(values.flatMap(asArray).map((val) => String(val).trim()).filter(Boolean))]
}

function normalizeBoolean(value) {
  return typeof value === 'boolean' ? value : null
}

function normalizeCount(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value)
  if (typeof value !== 'string') return 0
  const match = value.trim().match(/^(\d+(?:\.\d+)?)\s*([km])?$/i)
  if (!match) return 0
  const multiplier = match[2]?.toLowerCase() === 'm' ? 1_000_000 : match[2]?.toLowerCase() === 'k' ? 1_000 : 1
  return Math.max(0, Math.round(Number(match[1]) * multiplier))
}

function extractFeedContentId(feedId) {
  if (typeof feedId !== 'string') return feedId ?? null
  const separatorIndex = feedId.indexOf(':')
  return separatorIndex >= 0 ? feedId.slice(separatorIndex + 1) || feedId : feedId
}

/**
 * @typedef {'game'|'3d-asset'|'2d-art'|'asset'|'other'} ProjectType
 * @typedef {'image'|'video'|'webgl'|'gltf'|'unknown'} MediaKind
 *
 * @typedef {Object} ProjectCardModel
 * @property {string} id Unique identifier for presentation / feed.
 * @property {string} contentId Engagement / content ID (may differ from id).
 * @property {string} title Project title.
 * @property {string|null} summary Short summary or description.
 * @property {{id: string|null, name: string|null, handle: string|null, username: string|null, avatarUrl: string|null, verified: boolean}} creator
 * @property {MediaKind} mediaKind Normalized media kind.
 * @property {string|null} posterUrl Cover or poster image URL.
 * @property {string|null} playableUrl Executable / video / model URL if playable.
 * @property {Object|null} buildMetadata Build metadata for WebGL/GLTF.
 * @property {ProjectType} projectType Category / type classification.
 * @property {string[]} tools Array of tools / engine tags used.
 * @property {string[]} tags Array of general tags.
 * @property {{likes: number, comments: number, saves: number, shares: number}} engagementCounts
 * @property {{liked: boolean, saved: boolean, following: boolean}} viewerState
 * @property {boolean|null} collaborationOpen Whether open to collaboration.
 * @property {string} canonicalRoute The /app/project/:id path.
 * @property {Object} media Nested media structure for legacy components.
 * @property {Object} engagement Nested engagement structure for legacy components.
 * @property {Object} rawIds Original raw identifiers for backend calls.
 * @property {string[]} diagnostics Diagnostic log warnings.
 */

/**
 * Maps any raw backend project payload to a canonical ProjectCardModel.
 * @param {Object} rawInput Raw payload from backend API or feed item.
 * @param {Object} [options] Optional context hints.
 * @returns {ProjectCardModel}
 */
export function toProjectCardModel(rawInput, options = {}) {
  const raw = rawInput && typeof rawInput === 'object' ? rawInput : {}
  const media = raw.media && typeof raw.media === 'object' ? raw.media : {}
  const diagnostics = []

  // Extract raw IDs
  const feedId = firstValue(raw.feedId, options.feedId)
  const sourceId = firstValue(raw.id, raw._id)
  const contentId = String(
    firstValue(raw.contentId, options.contentId, feedId && extractFeedContentId(feedId), sourceId, 'unknown_content_id')
  )
  const projectId = firstValue(raw.projectId, options.projectId, sourceId, contentId)
  const id = String(firstValue(feedId, sourceId, contentId, 'unknown_id'))

  if (!hasValue(raw.id) && !hasValue(raw._id) && !hasValue(feedId)) {
    diagnostics.push('Missing primary project identifier.')
    if (isDev) {
      console.warn('[ProjectCardModel] Warning: Payload missing primary id:', rawInput)
    }
  }

  // Extract URLs (explicit alias map: posterUrl, previewUrl, imageUrl, thumbnail, videoUrl, gameUrl, manifestUrl, modelUrl)
  const posterUrl = firstValue(media.posterUrl, raw.posterUrl, raw.previewUrl, raw.imageUrl, media.imageUrl, raw.thumbnail, raw.loadingScreenUrl)
  const imageUrl = firstValue(media.imageUrl, raw.imageUrl, raw.previewUrl, raw.image, raw.thumbnail, posterUrl)
  const videoUrl = firstValue(media.videoUrl, media.src, raw.videoUrl, raw.video)
  const gameUrl = firstValue(media.gameUrl, media.manifestUrl, raw.gameUrl, raw.manifestUrl)
  const modelUrl = firstValue(media.modelUrl, raw.modelUrl)
  const playableUrl = firstValue(gameUrl, modelUrl, videoUrl)

  // Resolve mediaKind
  const sourceDeclaredKind = options.mediaKindHint ?? media.kind ?? raw.mediaKind ?? raw.type ?? raw.category
  let declaredKind = sourceDeclaredKind ? (MEDIA_KIND_ALIASES.get(String(sourceDeclaredKind).trim().toLowerCase()) ?? null) : null

  let mediaKind = 'unknown'
  if (declaredKind) {
    mediaKind = declaredKind
  } else if (gameUrl) {
    mediaKind = 'webgl'
  } else if (modelUrl) {
    mediaKind = 'gltf'
  } else if (videoUrl) {
    mediaKind = 'video'
  } else if (imageUrl || posterUrl) {
    mediaKind = 'image'
  }

  if (mediaKind === 'unknown') {
    diagnostics.push('Unknown or unsupported media kind.')
    if (isDev) {
      console.warn('[ProjectCardModel] Warning: Payload produced mediaKind "unknown":', rawInput)
    }
  }

  // Resolve projectType
  const rawType = firstValue(raw.projectType, raw.category, raw.type, options.projectTypeHint)
  const normalizedTypeKey = rawType ? String(rawType).trim().toLowerCase() : ''
  const projectType = PROJECT_TYPE_ALIASES.get(normalizedTypeKey) ?? 'other'

  // Resolve creator
  const creatorObj = raw.creator && typeof raw.creator === 'object' ? raw.creator : {}
  const directCreator = typeof raw.creator === 'string' ? raw.creator : null
  const creatorId = firstValue(creatorObj.id, creatorObj._id, creatorObj.userId, raw.creatorId, raw.ownerId)
  const creatorUsername = firstValue(creatorObj.username, creatorObj.handle, raw.ownerUsername, directCreator)
  const creatorName = firstValue(creatorObj.name, raw.ownerName, directCreator, creatorUsername, 'Anonymous')
  const creatorAvatar = firstValue(creatorObj.avatarUrl, creatorObj.avatar, raw.ownerAvatar, raw.creatorAvatar)
  const creatorVerified = Boolean(creatorObj.verified ?? creatorObj.isVerified ?? raw.creatorVerified)

  // Engagement
  const engagement = raw.engagement && typeof raw.engagement === 'object' ? raw.engagement : {}
  const likesCount = normalizeCount(firstValue(engagement.likesCount, raw.likesCount, raw.likes))
  const commentsCount = normalizeCount(firstValue(engagement.commentsCount, raw.commentsCount, raw.comments))
  const savesCount = normalizeCount(firstValue(engagement.savesCount, raw.savesCount, raw.saves))
  const sharesCount = normalizeCount(firstValue(engagement.sharesCount, raw.sharesCount, raw.shares))
  const viewerHasLiked = Boolean(engagement.viewerHasLiked ?? engagement.isLiked ?? raw.viewerHasLiked ?? raw.isLiked ?? raw.liked)
  const viewerHasSaved = Boolean(engagement.viewerHasSaved ?? engagement.isSaved ?? raw.viewerHasSaved ?? raw.isSaved ?? raw.saved)
  const viewerIsFollowing = Boolean(creatorObj.following ?? raw.viewerIsFollowing ?? raw.isFollowing)

  // Collaboration
  const collaboration = raw.collaboration && typeof raw.collaboration === 'object' ? raw.collaboration : {}
  const collaborationOpen = normalizeBoolean(raw.collaborationOpen ?? collaboration.open)

  // Build metadata
  const buildMetadata = firstValue(media.buildMetadata, raw.buildMetadata, media.build?.metadata, raw.build)

  // Canonical route
  const canonicalRoute = `/app/project/${encodeURIComponent(String(projectId || id))}`

  return {
    id,
    contentId,
    title: String(firstValue(raw.title, raw.projectTitle, options.title, 'Untitled project')),
    summary: firstValue(raw.summary, raw.description, raw.body, null),
    creator: {
      id: creatorId ? String(creatorId) : null,
      name: creatorName ? String(creatorName) : null,
      handle: creatorUsername ? String(creatorUsername) : null,
      username: creatorUsername ? String(creatorUsername) : null,
      avatarUrl: creatorAvatar ? String(creatorAvatar) : null,
      verified: creatorVerified,
    },
    mediaKind,
    posterUrl: posterUrl ? String(posterUrl) : null,
    playableUrl: playableUrl ? String(playableUrl) : null,
    buildMetadata: buildMetadata && typeof buildMetadata === 'object' ? buildMetadata : null,
    projectType,
    tools: uniqueStrings(raw.software, raw.tools, raw.engine, media.engine),
    tags: uniqueStrings(raw.tags),
    engagementCounts: {
      likes: likesCount,
      comments: commentsCount,
      saves: savesCount,
      shares: sharesCount,
    },
    viewerState: {
      liked: viewerHasLiked,
      saved: viewerHasSaved,
      following: viewerIsFollowing,
    },
    collaborationOpen,
    canonicalRoute,

    // Legacy fields for backward compatibility with existing features
    projectId,
    contentType: projectType === 'game' ? 'game' : projectType === 'asset' ? 'asset' : 'project',
    routeTarget: canonicalRoute,
    media: {
      kind: mediaKind,
      posterUrl,
      imageUrl,
      videoUrl,
      gameUrl,
      manifestUrl: firstValue(media.manifestUrl, raw.manifestUrl, gameUrl),
      modelUrl,
      assets: Array.isArray(media.assets ?? raw.assets) ? (media.assets ?? raw.assets) : [],
      textures: firstValue(media.textures, raw.textures),
      mode: String(firstValue(media.mode, raw.mode, 'landscape')),
      thumbnailMode: String(firstValue(media.thumbnailMode, raw.thumbnailMode, media.mode, raw.mode, 'landscape')),
      aspectRatio: firstValue(media.aspectRatio, raw.aspectRatio),
      background: firstValue(media.background, raw.background),
      build: {
        entryUrl: gameUrl,
        manifestUrl: firstValue(media.manifestUrl, raw.manifestUrl, gameUrl),
        metadata: buildMetadata,
      },
    },
    engagement: {
      likesCount,
      commentsCount,
      savesCount,
      sharesCount,
      viewerHasLiked,
      viewerHasSaved,
      comments: Array.isArray(engagement.comments) ? engagement.comments : [],
    },
    collaboration: {
      open: collaborationOpen,
      viewerRole: firstValue(raw.viewerRole, collaboration.viewerRole),
    },
    rawIds: {
      feedId,
      sourceId,
      contentId,
      projectId,
      ownerId: firstValue(raw.ownerId, creatorId),
    },
    diagnostics,
  }
}

/**
 * Maps an array of raw project payloads into an array of ProjectCardModels.
 * @param {Array} rawList Array of raw project payloads.
 * @returns {ProjectCardModel[]}
 */
export function toProjectCardModelList(rawList) {
  if (!Array.isArray(rawList)) {
    if (isDev && rawList) {
      console.warn('[ProjectCardModel] toProjectCardModelList expected array, received:', typeof rawList)
    }
    return []
  }
  return rawList
    .map((item) => {
      if (!item || typeof item !== 'object') {
        if (isDev) {
          console.warn('[ProjectCardModel] Skipping invalid list item:', item)
        }
        return null
      }
      return toProjectCardModel(item)
    })
    .filter(Boolean)
}

// Backward compatibility helper exports
export function fromFeedItem(raw) {
  return toProjectCardModel(raw, { feedId: raw?.feedId })
}

export function fromProject(raw) {
  return toProjectCardModel(raw, {
    projectId: firstValue(raw?.id, raw?._id),
  })
}

export function fromContentItem(raw, kind) {
  return toProjectCardModel(raw, {
    projectId: raw?.projectId || firstValue(raw?.id, raw?._id),
    projectTypeHint: kind,
  })
}

export function fromDiscoveryItem(raw) {
  return toProjectCardModel(raw, {
    projectId: firstValue(raw?.id, raw?._id),
    creator: { username: raw?.creator, name: raw?.creator, avatarUrl: raw?.creatorAvatar },
    projectTypeHint: raw?.category,
  })
}

export function fromCreatorPortfolioItem(raw, creator = {}) {
  return toProjectCardModel(raw, {
    projectId: firstValue(raw?.id, raw?._id),
    creator,
    projectTypeHint: raw?.category,
  })
}

// Development-only console assertions (guarded by isDev)
if (isDev) {
  try {
    // Assert 1: Feed payload mapping
    const feedSample = { feedId: 'feed:101', id: '101', title: 'Cyber Racer', likesCount: 42 }
    const feedModel = toProjectCardModel(feedSample)
    console.assert(feedModel.id === 'feed:101', 'Assertion 1 failed: feedModel.id')
    console.assert(feedModel.engagementCounts.likes === 42, 'Assertion 1 failed: feedModel likes')

    // Assert 2: Discover item mapping
    const discoverSample = { _id: 'disc-202', projectTitle: '3D Sword Model', category: '3d-asset', modelUrl: 'https://example.com/sword.gltf' }
    const discoverModel = toProjectCardModel(discoverSample)
    console.assert(discoverModel.mediaKind === 'gltf', 'Assertion 2 failed: discoverModel mediaKind')
    console.assert(discoverModel.projectType === '3d-asset', 'Assertion 2 failed: discoverModel projectType')

    // Assert 3: Project Detail item with WebGL game
    const gameSample = { id: 'game-303', title: 'Space Explorer', gameUrl: 'https://example.com/play', engine: 'Unity' }
    const gameModel = toProjectCardModel(gameSample)
    console.assert(gameModel.mediaKind === 'webgl', 'Assertion 3 failed: gameModel mediaKind')
    console.assert(gameModel.playableUrl === 'https://example.com/play', 'Assertion 3 failed: gameModel playableUrl')
    console.assert(gameModel.tools.includes('Unity'), 'Assertion 3 failed: gameModel tools')

    // Assert 4: Profile portfolio item with creator object
    const profileSample = { id: 'prof-404', title: 'Art Piece', creator: { username: 'alex', avatarUrl: 'https://example.com/avatar.png' } }
    const profileModel = toProjectCardModel(profileSample)
    console.assert(profileModel.creator.handle === 'alex', 'Assertion 4 failed: profileModel creator handle')
    console.assert(profileModel.creator.avatarUrl === 'https://example.com/avatar.png', 'Assertion 4 failed: profileModel creator avatar')

    // Assert 5: List mapping
    const listSample = [feedSample, discoverSample]
    const listModels = toProjectCardModelList(listSample)
    console.assert(listModels.length === 2, 'Assertion 5 failed: listModels length')
  } catch (err) {
    console.error('[ProjectCardModel] Assertion execution error:', err)
  }
}
