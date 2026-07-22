const MEDIA_KIND_ALIASES = new Map([
  ['2d', 'image'],
  ['image', 'image'],
  ['illustration', 'image'],
  ['video', 'video'],
  ['game', 'webgl'],
  ['webgl', 'webgl'],
  ['asset', 'gltf'],
  ['3d', 'gltf'],
  ['gltf', 'gltf'],
  ['glb', 'gltf'],
])

const CONTENT_TYPE_ALIASES = new Map([
  ['project', 'project'],
  ['post', 'post'],
  ['game', 'game'],
  ['asset', 'asset'],
  ['3d asset', 'asset'],
  ['demo', 'demo'],
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
  return [...new Set(values.flatMap(asArray).map((value) => String(value).trim()).filter(Boolean))]
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

function normalizeContentType(value) {
  if (!hasValue(value)) return 'unknown'
  return CONTENT_TYPE_ALIASES.get(String(value).trim().toLowerCase()) ?? 'unknown'
}

function normalizeDeclaredMediaKind(value) {
  if (!hasValue(value)) return null
  return MEDIA_KIND_ALIASES.get(String(value).trim().toLowerCase()) ?? 'unknown'
}

function extractFeedContentId(feedId) {
  if (typeof feedId !== 'string') return feedId ?? null
  const separatorIndex = feedId.indexOf(':')
  return separatorIndex >= 0 ? feedId.slice(separatorIndex + 1) || feedId : feedId
}

function getMediaUrls(raw, media) {
  return {
    posterUrl: firstValue(media.posterUrl, raw.posterUrl, raw.previewUrl, raw.loadingScreenUrl, raw.thumbnail),
    imageUrl: firstValue(media.imageUrl, raw.imageUrl, raw.previewUrl, raw.image, raw.thumbnail),
    videoUrl: firstValue(media.videoUrl, media.src, raw.videoUrl, raw.video),
    gameUrl: firstValue(media.manifestUrl, media.gameUrl, raw.gameUrl, raw.manifestUrl),
    modelUrl: firstValue(media.modelUrl, raw.modelUrl),
  }
}

function resolveMediaKind({ declaredKind, urls, diagnostics }) {
  const hasImage = Boolean(urls.imageUrl || urls.posterUrl)

  if (declaredKind === 'webgl') {
    if (urls.gameUrl) return 'webgl'
    diagnostics.push('Declared game/WebGL media has no playable URL.')
    return hasImage ? 'image' : 'unknown'
  }
  if (declaredKind === 'gltf') {
    if (urls.modelUrl) return 'gltf'
    diagnostics.push('Declared 3D media has no model URL.')
    return hasImage ? 'image' : 'unknown'
  }
  if (declaredKind === 'video') {
    if (urls.videoUrl) return 'video'
    diagnostics.push('Declared video media has no video URL.')
    return hasImage ? 'image' : 'unknown'
  }
  if (declaredKind === 'image') {
    if (hasImage) return 'image'
    diagnostics.push('Declared image media has no image or poster URL.')
    return 'unknown'
  }
  if (declaredKind === 'unknown') diagnostics.push('The declared media kind is not supported.')

  const interactiveSources = [urls.gameUrl && 'webgl', urls.modelUrl && 'gltf', urls.videoUrl && 'video'].filter(Boolean)
  if (interactiveSources.length > 1) {
    diagnostics.push('Conflicting playable media sources were supplied.')
    return 'unknown'
  }
  if (interactiveSources.length === 1) return interactiveSources[0]
  if (hasImage) return 'image'
  diagnostics.push('No supported media source was supplied.')
  return 'unknown'
}

function resolveCreator(raw, creatorOverride) {
  const nested = creatorOverride ?? (raw.creator && typeof raw.creator === 'object' ? raw.creator : {})
  const directCreator = typeof raw.creator === 'string' ? raw.creator : null
  return {
    id: firstValue(nested.id, nested._id, nested.userId, raw.creatorId, raw.ownerId),
    username: firstValue(nested.username, raw.ownerUsername, directCreator),
    name: firstValue(nested.name, raw.ownerName, directCreator, nested.username, raw.ownerUsername),
    avatarUrl: firstValue(nested.avatarUrl, nested.avatar, raw.ownerAvatar, raw.creatorAvatar),
    verified: Boolean(nested.verified ?? nested.isVerified ?? raw.creatorVerified),
  }
}

function resolveEngagement(raw) {
  const engagement = raw.engagement && typeof raw.engagement === 'object' ? raw.engagement : {}
  return {
    likesCount: normalizeCount(firstValue(engagement.likesCount, raw.likesCount, raw.likes)),
    commentsCount: normalizeCount(firstValue(engagement.commentsCount, raw.commentsCount, raw.comments)),
    savesCount: normalizeCount(firstValue(engagement.savesCount, raw.savesCount, raw.saves)),
    sharesCount: normalizeCount(firstValue(engagement.sharesCount, raw.sharesCount, raw.shares)),
    viewerHasLiked: Boolean(engagement.viewerHasLiked ?? engagement.isLiked ?? raw.viewerHasLiked ?? raw.isLiked),
    viewerHasSaved: Boolean(engagement.viewerHasSaved ?? engagement.isSaved ?? raw.viewerHasSaved ?? raw.isSaved),
    comments: Array.isArray(engagement.comments) ? engagement.comments : [],
  }
}

/**
 * @typedef {'project'|'post'|'game'|'asset'|'demo'|'unknown'} ProjectContentType
 * @typedef {'image'|'video'|'webgl'|'gltf'|'unknown'} ProjectMediaKind
 *
 * @typedef {Object} ProjectCardModel
 * @property {string|number|null} id Stable presentation identity.
 * @property {ProjectContentType} contentType Server content family; never inferred from display copy.
 * @property {string|number|null} contentId Raw engagement identifier.
 * @property {string|number|null} projectId Raw project route/collaboration identifier.
 * @property {string|null} routeTarget Existing canonical project route, when supported.
 * @property {string} title
 * @property {string} summary
 * @property {{id: string|number|null, username: string|null, name: string|null, avatarUrl: string|null, verified: boolean}} creator
 * @property {{kind: ProjectMediaKind, posterUrl: string|null, imageUrl: string|null, videoUrl: string|null, gameUrl: string|null, manifestUrl: string|null, modelUrl: string|null, assets: Array, textures: Object|null, mode: string, thumbnailMode: string, aspectRatio: string|number|null, background: string|null, build: {entryUrl: string|null, manifestUrl: string|null, metadata: Object|null}}} media
 * @property {string|null} projectType
 * @property {string|null} category
 * @property {string[]} tools
 * @property {string[]} tags
 * @property {{likesCount: number, commentsCount: number, savesCount: number, sharesCount: number, viewerHasLiked: boolean, viewerHasSaved: boolean, comments: Array}} engagement
 * @property {{open: boolean|null, viewerRole: string|null}} collaboration
 * @property {{feedId: string|number|null, sourceId: string|number|null, contentId: string|number|null, projectId: string|number|null, ownerId: string|number|null}} rawIds
 * @property {string[]} diagnostics Non-empty when input is incomplete, conflicting, or unsupported.
 */

function createProjectCardModel(rawInput, options = {}) {
  const raw = rawInput && typeof rawInput === 'object' ? rawInput : {}
  const media = raw.media && typeof raw.media === 'object' ? raw.media : {}
  const diagnostics = []
  const feedId = firstValue(raw.feedId, options.feedId)
  const sourceId = firstValue(raw.id, raw._id)
  const hintedContentType = normalizeContentType(options.contentTypeHint)
  const rawTypeAsContentType = options.useRawTypeAsContentType === false ? 'unknown' : normalizeContentType(raw.type)
  const contentType = normalizeContentType(raw.contentType) !== 'unknown'
    ? normalizeContentType(raw.contentType)
    : rawTypeAsContentType !== 'unknown'
      ? rawTypeAsContentType
      : hintedContentType
  const contentId = firstValue(raw.contentId, options.contentId, feedId && extractFeedContentId(feedId), sourceId)
  const projectId = firstValue(raw.projectId, options.projectId, contentType === 'project' ? contentId : null)
  const sourceDeclaredKind = options.mediaKindHint ?? media.kind ?? raw.mediaKind ?? (options.useRawTypeAsMediaKind ? raw.type : null)
  const declaredKind = normalizeDeclaredMediaKind(sourceDeclaredKind)
  const urls = getMediaUrls(raw, media)
  const kind = resolveMediaKind({ declaredKind, urls, diagnostics })
  const creator = resolveCreator(raw, options.creator)
  const projectType = firstValue(raw.projectType, options.projectTypeHint, options.useRawTypeAsMediaKind ? raw.type : null)
  const category = firstValue(raw.category, raw.genre)
  const collaboration = raw.collaboration && typeof raw.collaboration === 'object' ? raw.collaboration : {}

  if (!hasValue(contentId)) diagnostics.push('No content identifier was supplied.')
  if (contentType === 'project' && !hasValue(projectId)) diagnostics.push('Project content has no project route identifier.')

  return {
    id: firstValue(feedId, sourceId, contentId),
    contentType,
    contentId,
    projectId,
    routeTarget: hasValue(projectId) ? `/app/project/${encodeURIComponent(String(projectId))}` : null,
    title: String(firstValue(raw.title, raw.projectTitle, options.title, 'Untitled project')),
    summary: String(firstValue(raw.summary, raw.description, '') ?? ''),
    creator,
    media: {
      kind,
      posterUrl: urls.posterUrl,
      imageUrl: urls.imageUrl,
      videoUrl: urls.videoUrl,
      gameUrl: urls.gameUrl,
      manifestUrl: firstValue(media.manifestUrl, raw.manifestUrl, urls.gameUrl),
      modelUrl: urls.modelUrl,
      assets: Array.isArray(media.assets ?? raw.assets) ? (media.assets ?? raw.assets) : [],
      textures: firstValue(media.textures, raw.textures),
      mode: String(firstValue(media.mode, raw.mode, 'landscape')),
      thumbnailMode: String(firstValue(media.thumbnailMode, raw.thumbnailMode, media.mode, raw.mode, 'landscape')),
      aspectRatio: firstValue(media.aspectRatio, raw.aspectRatio),
      background: firstValue(media.background, raw.background),
      build: {
        entryUrl: urls.gameUrl,
        manifestUrl: firstValue(media.manifestUrl, raw.manifestUrl, urls.gameUrl),
        metadata: firstValue(media.buildMetadata, raw.buildMetadata, raw.build),
      },
    },
    projectType: projectType ? String(projectType) : null,
    category: category ? String(category) : null,
    tools: uniqueStrings(raw.software, raw.tools, raw.engine, media.engine),
    tags: uniqueStrings(raw.tags),
    engagement: resolveEngagement(raw),
    collaboration: {
      open: normalizeBoolean(raw.collaborationOpen ?? collaboration.open),
      viewerRole: firstValue(raw.viewerRole, collaboration.viewerRole),
    },
    rawIds: {
      feedId,
      sourceId,
      contentId,
      projectId,
      ownerId: firstValue(raw.ownerId, creator.id),
    },
    diagnostics,
  }
}

export function fromFeedItem(raw) {
  return createProjectCardModel(raw, { feedId: raw?.feedId, useRawTypeAsMediaKind: false })
}

export function fromProject(raw) {
  return createProjectCardModel(raw, {
    contentTypeHint: 'project',
    projectId: firstValue(raw?.id, raw?._id),
    useRawTypeAsContentType: false,
    useRawTypeAsMediaKind: true,
  })
}

export function fromContentItem(raw, kind) {
  const normalizedKind = normalizeContentType(kind)
  return createProjectCardModel(raw, {
    contentTypeHint: normalizedKind,
    projectId: normalizedKind === 'project' ? firstValue(raw?.id, raw?._id, raw?.contentId) : raw?.projectId,
    mediaKindHint: normalizedKind === 'game' ? 'game' : normalizedKind === 'asset' ? 'asset' : undefined,
    projectTypeHint: kind,
    useRawTypeAsContentType: false,
    useRawTypeAsMediaKind: normalizedKind === 'project',
  })
}

export function fromDiscoveryItem(raw) {
  return createProjectCardModel(raw, {
    contentTypeHint: 'project',
    projectId: firstValue(raw?.id, raw?._id),
    mediaKindHint: 'image',
    creator: { username: raw?.creator, name: raw?.creator, avatarUrl: raw?.creatorAvatar },
    projectTypeHint: raw?.category,
    useRawTypeAsContentType: false,
  })
}

export function fromCreatorPortfolioItem(raw, creator = {}) {
  return createProjectCardModel(raw, {
    contentTypeHint: 'project',
    projectId: firstValue(raw?.id, raw?._id),
    mediaKindHint: 'image',
    creator,
    projectTypeHint: raw?.category,
    useRawTypeAsContentType: false,
  })
}
