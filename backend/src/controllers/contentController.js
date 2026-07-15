import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import mongoose from 'mongoose'
import Asset from '../models/Asset.js'
import Game from '../models/Game.js'
import PostComment from '../models/PostComment.js'
import CommentReaction from '../models/CommentReaction.js'
import PostEngagement from '../models/PostEngagement.js'
import Project from '../models/Project.js'
import ProjectMember from '../models/ProjectMember.js'
import Upload from '../models/Upload.js'
import ProjectFile from '../models/ProjectFile.js'
import { publishProjectEngagement } from '../realtime/eventPublisher.js'
import { seedAssets, seedGames } from '../data/seedData.js'
import asyncHandler from '../middlewares/asyncHandler.js'
import env from '../config/env.js'
import { getRedisReadiness } from '../config/redis.js'
import { recordUploadMetric } from '../middlewares/observabilityMiddleware.js'
import { removeFeedProjection, upsertFeedProjection } from '../services/feedProjection.js'
import MutationReceipt from '../models/MutationReceipt.js'
import { createPresignedPutUrl, immutableObjectKey, objectStorageReady, publicObjectUrl } from '../services/objectStorage.js'
import { canManageProject, canViewProject, getProjectRole } from '../services/projectAccessService.js'

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads', 'projects')
const PUBLIC_UPLOADS_PREFIX = '/api/uploads/projects'
const MAX_UPLOAD_BYTES = 150 * 1024 * 1024
const MAX_PROJECT_BYTES = 500 * 1024 * 1024
const MAX_PROJECT_FILES = 100
const MAX_PATH_BYTES = 512
const MAX_NAME_BYTES = 255
const SAFE_TEXT_EXTENSIONS = new Set(['.html', '.htm', '.js', '.mjs', '.css', '.json', '.txt', '.svg'])
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.ico'])
const GAME_BINARY_EXTENSIONS = new Set(['.wasm', '.br', '.gz', '.unityweb'])

function hasMagicBytes(buffer, extension) {
  if (extension === '.png') return buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  if (extension === '.jpg' || extension === '.jpeg') return buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
  if (extension === '.gif') return buffer.subarray(0, 6).toString('ascii').match(/^GIF8[79]a$/) !== null
  if (extension === '.webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  if (extension === '.glb') return buffer.subarray(0, 4).toString('ascii') === 'glTF'
  if (extension === '.wasm') return buffer.subarray(0, 4).equals(Buffer.from([0, 97, 115, 109]))
  return true
}

function validateUploadMetadata(project, fileName, relativePath, buffer) {
  if (Buffer.byteLength(fileName, 'utf8') > MAX_NAME_BYTES || Buffer.byteLength(relativePath, 'utf8') > MAX_PATH_BYTES) {
    throw createError(400, 'The uploaded filename or path is too long.')
  }

  if (/\0|[\u0000-\u001f\u007f]/.test(fileName) || /\0|[\u0000-\u001f\u007f]/.test(relativePath)) {
    throw createError(400, 'Uploaded filenames and paths contain invalid characters.')
  }

  const normalizedPath = safeRelativePath(relativePath, fileName)
  const extension = path.posix.extname(normalizedPath).toLowerCase()
  const allowed = project.type === 'game'
    ? SAFE_TEXT_EXTENSIONS.has(extension) || GAME_BINARY_EXTENSIONS.has(extension) || IMAGE_EXTENSIONS.has(extension)
    : project.type === '3d'
      ? extension === '.glb' || extension === '.gltf' || IMAGE_EXTENSIONS.has(extension) || extension === '.bin'
      : IMAGE_EXTENSIONS.has(extension)

  if (!allowed || extension === '.zip' || extension === '.rar' || extension === '.7z' || extension === '.exe') {
    throw createError(400, `Unsupported upload type: ${extension || 'unknown'}.`)
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw createError(413, 'The uploaded file exceeds the 150 MB limit.')
  }

  if (!hasMagicBytes(buffer, extension)) {
    throw createError(400, 'The uploaded file signature does not match its extension.')
  }

  return normalizedPath
}

function includeDrafts(request) {
  return request.query.includeDrafts === 'true'
}

function listQuery(onlyPublished = true) {
  return onlyPublished ? { isPublished: true } : {}
}

function createError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'project'
}

function safeRelativePath(inputPath, fallbackName) {
  const rawPath = String(inputPath || fallbackName || '').replace(/\\/g, '/').trim()

  if (!rawPath) {
    throw createError(400, 'Every uploaded file needs a name.')
  }

  const normalized = path.posix.normalize(rawPath)

  if (
    normalized.startsWith('../') ||
    normalized === '..' ||
    normalized.includes(':/') ||
    normalized.startsWith('/')
  ) {
    throw createError(400, `Invalid upload path: ${rawPath}`)
  }

  return normalized
}

function decodeDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string' || !dataUrl.trim()) {
    throw createError(400, 'Missing uploaded file data.')
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)

  if (!match) {
    throw createError(400, 'Uploaded files must be sent as data URLs.')
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  }
}

function normalizeList(input) {
  if (!Array.isArray(input)) {
    return []
  }

  return input
    .map((item) => String(item || '').trim())
    .filter(Boolean)
}

function toPublicUrl(relativePath) {
  return `${PUBLIC_UPLOADS_PREFIX}/${relativePath.replace(/\\/g, '/')}`
}

function getProjectRoot(projectSlug) {
  return path.join(UPLOADS_ROOT, projectSlug)
}

function getProjectFilePath(projectSlug, relativePath) {
  return path.join(getProjectRoot(projectSlug), safeRelativePath(relativePath))
}

function normalizeRelativeUrl(relativeUrl) {
  return String(relativeUrl || '')
    .replace(/\\/g, '/')
    .split('?')[0]
    .split('#')[0]
    .trim()
}

function extractAssetReferences(htmlContent) {
  const references = new Set()
  const patterns = [
    /(?:src|href|data|codebase)=["']([^"'<>]+)["']/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi,
  ]

  for (const pattern of patterns) {
    let match = pattern.exec(htmlContent)
    while (match) {
      const reference = normalizeRelativeUrl(match[1])
      if (
        reference &&
        !reference.startsWith('/') &&
        !reference.startsWith('data:') &&
        !reference.startsWith('blob:') &&
        !reference.startsWith('http://') &&
        !reference.startsWith('https://') &&
        !reference.startsWith('//') &&
        !reference.startsWith('mailto:')
      ) {
        references.add(reference)
      }
      match = pattern.exec(htmlContent)
    }
  }

  return [...references]
}

function resolveProjectRelativePath(basePath, referencePath) {
  const normalizedReference = normalizeRelativeUrl(referencePath)

  if (!normalizedReference) {
    return ''
  }

  const baseDir = normalizeRelativeUrl(basePath)
  const joinedPath = path.posix.normalize(path.posix.join(path.posix.dirname(baseDir), normalizedReference))

  if (
    joinedPath.startsWith('../') ||
    joinedPath === '..' ||
    joinedPath.startsWith('/') ||
    joinedPath.includes(':/')
  ) {
    return ''
  }

  return joinedPath
}

async function validatePlayableGameBundle(project) {
  const uploadedFiles = await ProjectFile.find({ projectId: project._id, status: 'ready' }).lean()
  const indexFile = uploadedFiles.find((file) => file.relativePath.toLowerCase().endsWith('index.html'))

  if (!indexFile) {
    throw createError(400, 'A WebGL project needs an index.html entry file.')
  }

  const indexPath = getProjectFilePath(project.slug, indexFile.relativePath)
  const indexHtml = await fs.readFile(indexPath, 'utf8')
  const referencedAssets = extractAssetReferences(indexHtml)

  const availablePaths = new Set(
    uploadedFiles.map((file) => normalizeRelativeUrl(file.relativePath)),
  )

  const missingAssets = referencedAssets
    .map((reference) => resolveProjectRelativePath(indexFile.relativePath, reference))
    .filter((referencePath) => referencePath && !availablePaths.has(referencePath))

  if (missingAssets.length > 0) {
    const sampleMissing = missingAssets.slice(0, 5).join(', ')
    throw createError(
      400,
      `Your WebGL build is incomplete. Missing referenced file(s): ${sampleMissing}. Upload the full Unity WebGL build folder, including the Build files and any compressed .br assets.`,
    )
  }
}

function pickMainFile(uploadedFiles, type) {
  const byRelativePath = [...uploadedFiles]
    .filter((file) => !file.relativePath.toLowerCase().startsWith('cover/'))
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))

  if (type === 'game') {
    const htmlFile = byRelativePath.find((file) => file.relativePath.toLowerCase().endsWith('index.html'))
      ?? byRelativePath.find((file) => file.relativePath.toLowerCase().endsWith('.html'))

    return htmlFile ?? null
  }

  if (type === '3d') {
    const glbFile = byRelativePath.find((file) => file.relativePath.toLowerCase().endsWith('.glb'))
      ?? byRelativePath.find((file) => file.relativePath.toLowerCase().endsWith('.gltf'))

    return glbFile ?? null
  }

  if (type === '2d') {
    const imageFile = byRelativePath.find((file) =>
      ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'].some((ext) =>
        file.relativePath.toLowerCase().endsWith(ext),
      ),
    )

    return imageFile ?? null
  }

  return null
}

function safeAvatarUrl(avatar) {
  // Strip huge base64 data URLs — only keep external/CDN URLs
  if (typeof avatar === 'string' && avatar.startsWith('data:')) {
    return ''
  }
  return avatar || ''
}

function normalizeProjectEngagementSummary(summary = {}, viewerState = {}, comments = []) {
  return {
    likesCount: Number(summary.likesCount || 0),
    commentsCount: Number(summary.commentsCount || 0),
    savesCount: Number(summary.savesCount || 0),
    sharesCount: Number(summary.sharesCount || 0),
    isLiked: Boolean(viewerState.isLiked),
    isSaved: Boolean(viewerState.isSaved),
    viewerHasLiked: Boolean(viewerState.isLiked),
    viewerHasSaved: Boolean(viewerState.isSaved),
    comments,
  }
}

function normalizeEngagement(engagement = {}, viewerId = '') {
  const reactions = Array.isArray(engagement.reactions) ? engagement.reactions : []
  const savedBy = Array.isArray(engagement.savedBy) ? engagement.savedBy : []
  const comments = Array.isArray(engagement.comments) ? engagement.comments : []
  const viewerKey = String(viewerId || '')

  return {
    likesCount: Number(engagement.likesCount || 0),
    commentsCount: Number(engagement.commentsCount || 0),
    savesCount: Number(engagement.savesCount || 0),
    sharesCount: Number(engagement.sharesCount || 0),
    viewerHasLiked: viewerKey
      ? reactions.some((reaction) => String(reaction.userId) === viewerKey)
      : false,
    viewerHasSaved: viewerKey
      ? savedBy.some((entry) => String(entry.userId) === viewerKey)
      : false,
    comments: comments
      .map((comment) => ({
        commentId: String(comment.commentId || ''),
        userId: String(comment.userId || ''),
        username: comment.username || '',
        name: comment.name || '',
        avatar: safeAvatarUrl(comment.avatar),
        text: comment.text || '',
        createdAt: comment.createdAt,
      }))
      .filter((comment) => comment.commentId && comment.text),
  }
}

function formatProjectComment(comment, replies = []) {
  return {
    commentId: String(comment._id),
    userId: String(comment.userId || ''),
    username: comment.username || '',
    name: comment.name || '',
    avatar: safeAvatarUrl(comment.avatar),
    text: comment.text || '',
    parentCommentId: comment.parentCommentId ? String(comment.parentCommentId) : null,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    replies,
  }
}

function buildProjectPayload(project, engagement = {}, projectFiles = [], collaboration = {}) {
  return {
    contentType: 'project',
    contentId: String(project._id),
    id: String(project._id),
    feedKey: `project:${String(project._id)}`,
    ownerId: String(project.ownerId),
    ownerUsername: project.ownerUsername,
    ownerName: project.ownerName,
    ownerAvatar: safeAvatarUrl(project.ownerAvatar),
    type: project.type,
    title: project.title,
    slug: project.slug,
    category: project.category,
    description: project.description,
    tags: project.tags,
    software: project.software,
    mode: project.mode,
    visibility: project.visibility,
    isPublished: project.isPublished,
    previewUrl: project.previewUrl,
    gameUrl: project.gameUrl,
    modelUrl: project.modelUrl,
    imageUrl: project.imageUrl,
    collaborationOpen: Boolean(project.collaborationOpen),
    collaborationRoles: Array.isArray(project.collaborationRoles) ? project.collaborationRoles : [],
    collaborationSummary: project.collaborationSummary || '',
    collaborators: collaboration.collaborators ?? [],
    viewerRole: collaboration.viewerRole ?? null,
    uploadedFiles: projectFiles.length > 0 ? projectFiles : (project.uploadedFiles ?? []),
    engagement,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}

async function getProjectCollaborationMap(projects = [], viewerId = '') {
  const ids = projects.map((project) => project?._id).filter(Boolean)
  const members = ids.length
    ? await ProjectMember.find({ projectId: { $in: ids }, status: 'active' }).select('projectId userId role').populate('userId', 'username name avatar').lean()
    : []
  const map = new Map(projects.map((project) => [String(project._id), { collaborators: [], viewerRole: null }]))
  for (const member of members) {
    const entry = map.get(String(member.projectId))
    if (!entry || !member.userId) continue
    entry.collaborators.push({ id: String(member.userId._id), username: member.userId.username, name: member.userId.name, avatar: safeAvatarUrl(member.userId.avatar), role: member.role })
    if (viewerId && String(member.userId._id) === String(viewerId)) entry.viewerRole = member.role
  }
  for (const project of projects) {
    const entry = map.get(String(project._id))
    if (!entry) continue
    if (!entry.collaborators.some((member) => member.id === String(project.ownerId))) {
      entry.collaborators.unshift({ id: String(project.ownerId), username: project.ownerUsername, name: project.ownerName, avatar: safeAvatarUrl(project.ownerAvatar), role: 'owner' })
    }
    if (viewerId && String(project.ownerId) === String(viewerId)) entry.viewerRole = 'owner'
  }
  return map
}

function buildGamePayload(game, index, viewerId = '') {
  return {
    contentType: 'game',
    contentId: String(game._id),
    id: String(game._id),
    feedKey: `game:${game.slug ?? index}`,
    title: game.title,
    slug: game.slug,
    description: game.description,
    gameUrl: game.gameUrl,
    loadingScreenUrl: game.loadingScreenUrl,
    mode: game.mode,
    aspectRatio: game.aspectRatio,
    isPublished: game.isPublished,
    displayOrder: game.displayOrder,
    engagement: normalizeEngagement(game.engagement, viewerId),
    createdAt: game.createdAt,
    updatedAt: game.updatedAt,
  }
}

function buildAssetPayload(asset, index, viewerId = '') {
  return {
    contentType: 'asset',
    contentId: String(asset._id),
    id: String(asset._id),
    feedKey: `asset:${asset.slug ?? index}`,
    title: asset.title,
    slug: asset.slug,
    description: asset.description,
    modelUrl: asset.modelUrl,
    background: asset.background,
    mode: asset.mode,
    isPublished: asset.isPublished,
    displayOrder: asset.displayOrder,
    engagement: normalizeEngagement(asset.engagement, viewerId),
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  }
}

function getViewerId(request) {
  return request.user?._id ? String(request.user._id) : ''
}

async function computeProjectEngagementMap(projectIds = [], viewerId = '') {
  const normalizedIds = projectIds.filter(Boolean).map(String)

  if (normalizedIds.length === 0) {
    return new Map()
  }

  const [likesAgg, savesAgg, commentsAgg, viewerRows] = await Promise.all([
    PostEngagement.aggregate([
      { $match: { contentType: 'project', contentId: { $in: normalizedIds }, liked: true } },
      { $group: { _id: '$contentId', count: { $sum: 1 } } },
    ]),
    PostEngagement.aggregate([
      { $match: { contentType: 'project', contentId: { $in: normalizedIds }, saved: true } },
      { $group: { _id: '$contentId', count: { $sum: 1 } } },
    ]),
    PostComment.aggregate([
      { $match: { contentType: 'project', contentId: { $in: normalizedIds } } },
      { $group: { _id: '$contentId', count: { $sum: 1 } } },
    ]),
    viewerId
      ? PostEngagement.find({
          contentType: 'project', contentId: { $in: normalizedIds },
          userId: viewerId,
        })
          .select('contentId liked saved')
          .lean()
      : [],
  ])

  const likesMap = new Map(likesAgg.map((entry) => [String(entry._id), Number(entry.count || 0)]))
  const savesMap = new Map(savesAgg.map((entry) => [String(entry._id), Number(entry.count || 0)]))
  const commentsMap = new Map(commentsAgg.map((entry) => [String(entry._id), Number(entry.count || 0)]))
  const viewerMap = new Map(
    viewerRows.map((entry) => [
      String(entry.contentId),
      {
        isLiked: Boolean(entry.liked),
        isSaved: Boolean(entry.saved),
      },
    ]),
  )

  const result = new Map()

  for (const projectKey of normalizedIds) {
    result.set(
      projectKey,
      normalizeProjectEngagementSummary(
        {
          likesCount: likesMap.get(projectKey) ?? 0,
          commentsCount: commentsMap.get(projectKey) ?? 0,
          savesCount: savesMap.get(projectKey) ?? 0,
          sharesCount: 0,
        },
        viewerMap.get(projectKey) ?? {},
        [],
      ),
    )
  }

  return result
}

async function buildProjectCommentsTree(postId) {
  const comments = await PostComment.find({ contentType: 'project', contentId: String(postId) }).sort({ createdAt: -1 }).limit(200).lean()
  const byParent = new Map()

  for (const comment of comments) {
    const parentKey = comment.parentCommentId ? String(comment.parentCommentId) : 'root'
    const siblings = byParent.get(parentKey) ?? []
    siblings.push(comment)
    byParent.set(parentKey, siblings)
  }

  const buildBranch = (parentKey) =>
    (byParent.get(parentKey) ?? []).map((comment) =>
      formatProjectComment(comment, buildBranch(String(comment._id))),
    )

  return buildBranch('root')
}

async function getProjectEngagementPayload(postId, viewerId = '', options = {}) {
  const includeComments = options.includeComments !== false
  const [countsMap, comments] = await Promise.all([
    computeProjectEngagementMap([postId], viewerId),
    includeComments ? buildProjectCommentsTree(postId) : [],
  ])

  const summary = countsMap.get(String(postId)) ?? normalizeProjectEngagementSummary()

  return {
    ...summary,
    sharesCount: Number(options.sharesCount ?? summary.sharesCount ?? 0),
    comments,
  }
}

async function enrichProjects(projects = [], viewerId = '', options = {}) {
  const [engagementMap, collaborationMap] = await Promise.all([
    computeProjectEngagementMap(projects.map((project) => project._id), viewerId),
    getProjectCollaborationMap(projects, viewerId),
  ])

  return projects.map((project) => {
    const engagement = engagementMap.get(String(project._id)) ?? normalizeProjectEngagementSummary()
    return buildProjectPayload(project, {
      ...engagement,
      sharesCount: Number(project?.engagement?.sharesCount || 0),
      comments: options.includeComments ? engagement.comments : [],
    }, [], collaborationMap.get(String(project._id)))
  })
}

function getEngagementTarget(contentType) {
  if (contentType === 'project') {
    return Project
  }

  if (contentType === 'game') {
    return Game
  }

  if (contentType === 'asset') {
    return Asset
  }

  return null
}

function resolveContentQuery(contentType, contentId) {
  if (contentType === 'project') {
    return mongoose.Types.ObjectId.isValid(contentId)
      ? { $or: [{ _id: contentId }, { slug: String(contentId).toLowerCase() }] }
      : { slug: String(contentId).toLowerCase() }
  }

  if (mongoose.Types.ObjectId.isValid(contentId)) {
    return { _id: contentId }
  }

  return { slug: String(contentId).toLowerCase() }
}

async function loadEngagementTarget(contentType, contentId) {
  const Model = getEngagementTarget(contentType)

  if (!Model) {
    throw createError(400, 'Invalid content type.')
  }

  const query = resolveContentQuery(contentType, contentId)
  const target = await Model.findOne(query)

  if (!target) {
    throw createError(404, 'Content item not found.')
  }

  return target
}

async function ensureProjectEngagementAccess(project, userId) {
  if (project.visibility === 'private' && !await getProjectRole(project, userId)) {
    throw createError(403, 'You cannot interact with a private project.')
  }
}

function ensureEngagement(target) {
  if (!target.engagement) {
    target.engagement = {}
  }

  target.engagement.likesCount = Number(target.engagement.likesCount || 0)
  target.engagement.commentsCount = Number(target.engagement.commentsCount || 0)
  target.engagement.savesCount = Number(target.engagement.savesCount || 0)
  target.engagement.sharesCount = Number(target.engagement.sharesCount || 0)
  target.engagement.reactions = Array.isArray(target.engagement.reactions) ? target.engagement.reactions : []
  target.engagement.savedBy = Array.isArray(target.engagement.savedBy) ? target.engagement.savedBy : []
  target.engagement.comments = Array.isArray(target.engagement.comments) ? target.engagement.comments : []
}

function buildContentPayload(contentType, content, viewerId = '', index = 0) {
  if (contentType === 'project') {
    return buildProjectPayload(content, normalizeEngagement(content.engagement, viewerId))
  }

  if (contentType === 'game') {
    return buildGamePayload(content, index, viewerId)
  }

  return buildAssetPayload(content, index, viewerId)
}

async function storeProjectFiles(projectSlug, files = []) {
  const savedFiles = []
  const baseDir = getProjectRoot(projectSlug)
  const normalizedBaseDir = `${path.normalize(baseDir)}${path.sep}`

  await fs.mkdir(baseDir, { recursive: true })

  for (const file of files) {
    const relativePath = safeRelativePath(file.relativePath, file.name)
    const targetPath = path.join(baseDir, relativePath)
    const normalizedTarget = path.normalize(targetPath)

    if (!normalizedTarget.startsWith(normalizedBaseDir)) {
      throw createError(400, `Refusing to write outside the project folder: ${relativePath}`)
    }

    await fs.mkdir(path.dirname(normalizedTarget), { recursive: true })

    const { buffer, mimeType } = decodeDataUrl(file.dataUrl)
    await fs.writeFile(normalizedTarget, buffer)

    savedFiles.push({
      name: String(file.name || path.basename(relativePath)),
      relativePath,
      url: toPublicUrl(`${projectSlug}/${relativePath}`),
      mimeType: file.mimeType || mimeType || '',
      size: buffer.length,
    })
  }

  return savedFiles
}

async function writeProjectFile(projectSlug, fileMeta, buffer) {
  const baseDir = getProjectRoot(projectSlug)
  const normalizedBaseDir = `${path.normalize(baseDir)}${path.sep}`
  const relativePath = safeRelativePath(fileMeta.relativePath, fileMeta.name)
  const targetPath = path.join(baseDir, relativePath)
  const normalizedTarget = path.normalize(targetPath)

  if (!normalizedTarget.startsWith(normalizedBaseDir)) {
    throw createError(400, `Refusing to write outside the project folder: ${relativePath}`)
  }

  await fs.mkdir(path.dirname(normalizedTarget), { recursive: true })
  await fs.writeFile(normalizedTarget, buffer)

  return {
    name: String(fileMeta.name || path.basename(relativePath)),
    relativePath,
    url: toPublicUrl(`${projectSlug}/${relativePath}`),
    mimeType: fileMeta.mimeType || '',
    size: buffer.length,
  }
}

export function getHealth(_request, response) {
  response.json({
    status: 'ok',
    service: 'gameflow-api',
    timestamp: new Date().toISOString(),
  })
}

export const getReadiness = asyncHandler(async (_request, response) => {
  const mongoReady = mongoose.connection.readyState === 1
  const redis = await getRedisReadiness()
  const redisRequired = env.nodeEnv === 'production'
  const ready = mongoReady && (!redisRequired || redis.ready)

  response.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    service: 'gameflow-api',
    dependencies: {
      mongo: mongoReady ? 'ready' : 'not_ready',
      redis: redis.ready ? 'ready' : redis.configured ? 'not_ready' : 'not_configured',
    },
    timestamp: new Date().toISOString(),
  })
})

export const getContent = asyncHandler(async (request, response) => {
  const includeDraftsFlag = includeDrafts(request)
  const viewerId = getViewerId(request)
  const [games, assets, projects] = await Promise.all([
    Game.find(listQuery(!includeDraftsFlag)).sort({ displayOrder: 1, createdAt: 1 }).lean(),
    Asset.find(listQuery(!includeDraftsFlag)).sort({ displayOrder: 1, createdAt: 1 }).lean(),
    Project.find(listQuery(!includeDraftsFlag)).sort({ createdAt: -1 }).lean(),
  ])

  const enrichedProjects = await enrichProjects(projects, viewerId, { includeComments: false })

  const content = {
    games: games.map((game, index) => buildGamePayload(game, index, viewerId)),
    assets: assets.map((asset, index) => buildAssetPayload(asset, index, viewerId)),
    projects: enrichedProjects,
  }
  response.json(content)
})

export const getPublishedGames = asyncHandler(async (request, response) => {
  const viewerId = getViewerId(request)
  const games = await Game.find(listQuery(!includeDrafts(request)))
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean()
  response.json(games.map((game, index) => buildGamePayload(game, index, viewerId)))
})

export const getPublishedAssets = asyncHandler(async (request, response) => {
  const viewerId = getViewerId(request)
  const assets = await Asset.find(listQuery(!includeDrafts(request)))
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean()
  response.json(assets.map((asset, index) => buildAssetPayload(asset, index, viewerId)))
})

export const getPublishedProjects = asyncHandler(async (request, response) => {
  const viewerId = getViewerId(request)
  const projects = await Project.find(listQuery(!includeDrafts(request)))
    .sort({ displayOrder: 1, createdAt: -1 })
    .lean()
  response.json(await enrichProjects(projects, viewerId, { includeComments: false }))
})

export const getProjectById = asyncHandler(async (request, response) => {
  const { projectId } = request.params
  const viewerId = getViewerId(request)

  const query = mongoose.Types.ObjectId.isValid(projectId)
    ? { $or: [{ _id: projectId }, { slug: String(projectId).toLowerCase() }] }
    : { slug: String(projectId).toLowerCase() }

  const project = await Project.findOne(query).lean()

  if (!project) {
    throw createError(404, 'Project not found.')
  }
  if (!await canViewProject(project, viewerId)) {
    throw createError(403, 'You cannot view this private project.')
  }

  const [engagement, collaborationMap] = await Promise.all([getProjectEngagementPayload(project._id, viewerId, {
    includeComments: false,
    sharesCount: project?.engagement?.sharesCount || 0,
  }), getProjectCollaborationMap([project], viewerId)])
  response.json({ project: buildProjectPayload(project, engagement, [], collaborationMap.get(String(project._id))) })
})

export const createProject = asyncHandler(async (request, response) => {
  const {
    title,
    type,
    category,
    description,
    tags,
    software,
    visibility,
    mode,
    collaborationOpen,
    collaborationRoles,
    collaborationSummary,
  } = request.body ?? {}

  const normalizedTitle = String(title || '').trim()
  const normalizedType = String(type || '').trim()
  const normalizedCategory = String(category || '').trim()
  const normalizedDescription = String(description || '').trim()
  const normalizedVisibility = visibility === 'private' ? 'private' : 'public'
  const normalizedMode = mode === 'portrait' ? 'portrait' : 'landscape'
  const normalizedTags = normalizeList(tags)
  const normalizedSoftware = normalizeList(software)
  const normalizedCollaborationSummary = String(collaborationSummary || '').trim()

  if (!normalizedTitle) {
    throw createError(400, 'Project title is required.')
  }

  if (!['game', '3d', '2d'].includes(normalizedType)) {
    throw createError(400, 'Please choose a valid project type.')
  }

  if (!normalizedCategory) {
    throw createError(400, 'Project category is required.')
  }
  if (normalizedCollaborationSummary.length > 500) {
    throw createError(400, 'Collaboration summary must be 500 characters or fewer.')
  }

  const existingOwnerProjects = await Project.countDocuments({ ownerId: request.user._id })
  const slugBase = `${slugify(normalizedTitle)}-${crypto.randomUUID().slice(0, 8)}`
  const projectSlug = slugBase

  const project = await Project.create({
    ownerId: request.user._id,
    ownerUsername: request.user.username,
    ownerName: request.user.name,
    ownerAvatar: safeAvatarUrl(request.user.avatar),
    type: normalizedType,
    title: normalizedTitle,
    slug: projectSlug,
    category: normalizedCategory,
    description: normalizedDescription,
    tags: normalizedTags,
    software: normalizedSoftware,
    mode: normalizedMode,
    visibility: normalizedVisibility,
    isPublished: false,
    previewUrl: '',
    gameUrl: '',
    modelUrl: '',
    imageUrl: '',
    collaborationOpen: Boolean(collaborationOpen),
    collaborationRoles: normalizeList(collaborationRoles),
    collaborationSummary: normalizedCollaborationSummary,
    displayOrder: existingOwnerProjects + 1,
  })
  await ProjectMember.updateOne(
    { projectId: project._id, userId: request.user._id },
    { $setOnInsert: { role: 'owner', status: 'active', invitedBy: request.user._id, joinedAt: new Date() } },
    { upsert: true },
  )

  const collaborationMap = await getProjectCollaborationMap([project], String(request.user._id))
  response.status(201).json({
    message: 'Project draft created successfully.',
    project: buildProjectPayload(
      project,
      normalizeProjectEngagementSummary({ sharesCount: Number(project?.engagement?.sharesCount || 0) }), [], collaborationMap.get(String(project._id)),
    ),
  })
})

export const uploadProjectFile = asyncHandler(async (request, response) => {
  const { projectId } = request.params
  const fileName = String(request.headers['x-file-name'] || '').trim()
  const relativePath = String(request.headers['x-relative-path'] || '').trim()
  const mimeType = String(request.headers['x-mime-type'] || '').trim()
  const idempotencyKey = String(request.headers['idempotency-key'] || '').trim()
  const buffer = request.body

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw createError(400, 'Uploaded file content is missing.')
  }

  if (!fileName || !relativePath) {
    throw createError(400, 'Uploaded files require a file name and relative path.')
  }

  if (!idempotencyKey || idempotencyKey.length > 128) {
    throw createError(400, 'A valid Idempotency-Key header is required.')
  }

  if (!mongoose.isValidObjectId(projectId)) {
    throw createError(400, 'Invalid project ID.')
  }

  const project = await Project.findById(projectId)

  if (!project) {
    throw createError(404, 'Project not found.')
  }

  if (!await canManageProject(project, request.user._id)) {
    throw createError(403, 'You cannot modify this project.')
  }

  const priorUpload = await Upload.findOne({ idempotencyKey, ownerId: request.user._id }).lean()
  if (priorUpload) {
    response.status(200).json({ message: 'Upload already processed.', uploadId: priorUpload.uploadId, status: priorUpload.status })
    return
  }

  const normalizedPath = validateUploadMetadata(project, fileName, relativePath, buffer)
  const uploadId = crypto.randomUUID()
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex')
  const existingFiles = await ProjectFile.find({ projectId: project._id, status: 'ready' }).lean()
  const existingBytes = existingFiles.reduce((total, file) => total + Number(file.size || 0), 0)
  const duplicateFile = existingFiles.find((file) => file.relativePath === normalizedPath)

  if (duplicateFile) {
    throw createError(409, 'A file with this relative path already exists. Remove it before uploading a replacement.')
  }

  if (existingFiles.length >= MAX_PROJECT_FILES) {
    throw createError(413, `A project cannot contain more than ${MAX_PROJECT_FILES} files.`)
  }
  if (existingBytes + buffer.length > MAX_PROJECT_BYTES) {
    throw createError(413, 'The project storage quota has been exceeded.')
  }

  let savedFile
  try {
    savedFile = await writeProjectFile(project.slug, { name: path.posix.basename(normalizedPath), relativePath: normalizedPath, mimeType }, buffer)
  } catch (error) {
    throw error
  }

  let projectFile
  try {
    projectFile = await ProjectFile.create({
    projectId: project._id,
    ownerId: project.ownerId,
    name: savedFile.name,
    relativePath: savedFile.relativePath,
    url: savedFile.url,
    storageKey: `${project.slug}/${normalizedPath}`,
    mimeType: savedFile.mimeType,
    size: savedFile.size,
    checksum,
    version: 1,
    status: 'ready',
    })
  } catch (error) {
    await fs.rm(getProjectFilePath(project.slug, normalizedPath), { force: true }).catch(() => {})
    throw error
  }

  let uploadRecord
  try {
    uploadRecord = await Upload.create({
      uploadId,
      idempotencyKey,
      ownerId: request.user._id,
      projectId: project._id,
      storageKey: `${project.slug}/${normalizedPath}`,
      relativePath: normalizedPath,
      detectedType: path.posix.extname(normalizedPath).toLowerCase(),
      mimeType,
      size: buffer.length,
      checksum,
      status: 'ready',
    })
  } catch (error) {
    await fs.rm(getProjectFilePath(project.slug, normalizedPath), { force: true }).catch(() => {})
    await ProjectFile.deleteOne({ _id: projectFile._id }).catch(() => {})
    throw error
  }

  const nextFiles = [...existingFiles, projectFile.toObject()].sort((a, b) => a.relativePath.localeCompare(b.relativePath))

  const mainFile = pickMainFile(nextFiles, project.type)
  if (mainFile) {
    const coverFile = nextFiles.find((file) => file.relativePath.toLowerCase().startsWith('cover/'))
      ?? nextFiles.find((file) => ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'].some((ext) => file.relativePath.toLowerCase().endsWith(ext)))
      ?? null

    project.previewUrl = coverFile?.url ?? mainFile.url
    project.gameUrl = project.type === 'game' ? mainFile.url : ''
    project.modelUrl = project.type === '3d' ? mainFile.url : ''
    project.imageUrl = project.type === '2d' ? mainFile.url : ''
  }

  try {
    await project.save()
  } catch (error) {
    // The file is not referenced by the database if metadata persistence fails.
    // Remove it so retries cannot accumulate orphaned local files.
    try {
      await fs.rm(getProjectFilePath(project.slug, savedFile.relativePath), { force: true })
      await Upload.updateOne({ _id: uploadRecord._id }, { $set: { status: 'deleted', error: 'Project metadata persistence failed.' } })
      await ProjectFile.deleteOne({ _id: projectFile._id })
    } catch (cleanupError) {
      console.error('Failed to clean up an unreferenced upload:', cleanupError)
    }
    throw error
  }

  response.status(201).json({
    message: 'File uploaded successfully.',
    uploadId: uploadRecord.uploadId,
    status: uploadRecord.status,
    file: savedFile,
  })
  recordUploadMetric()
})

export const initiateProjectUpload = asyncHandler(async (request, response) => {
  if (!objectStorageReady()) throw createError(503, 'Object storage is not configured.')
  const { projectId } = request.params
  const { name, relativePath, mimeType = '', size, checksum } = request.body ?? {}
  const idempotencyKey = String(request.headers['idempotency-key'] || '').trim()
  if (!idempotencyKey || idempotencyKey.length > 128) throw createError(400, 'A valid Idempotency-Key header is required.')
  if (!mongoose.isValidObjectId(projectId)) throw createError(400, 'Invalid project ID.')
  const project = await Project.findById(projectId)
  if (!project) throw createError(404, 'Project not found.')
  if (!await canManageProject(project, request.user._id)) throw createError(403, 'You cannot modify this project.')
  const byteSize = Number(size)
  const normalizedPath = safeRelativePath(relativePath, name)
  const extension = path.posix.extname(normalizedPath).toLowerCase()
  const allowed = project.type === 'game'
    ? SAFE_TEXT_EXTENSIONS.has(extension) || GAME_BINARY_EXTENSIONS.has(extension) || IMAGE_EXTENSIONS.has(extension)
    : project.type === '3d'
      ? extension === '.glb' || extension === '.gltf' || IMAGE_EXTENSIONS.has(extension) || extension === '.bin'
      : IMAGE_EXTENSIONS.has(extension)
  if (!allowed || !Number.isFinite(byteSize) || byteSize <= 0 || byteSize > MAX_UPLOAD_BYTES || !/^[a-f\d]{64}$/i.test(String(checksum))) throw createError(400, 'Invalid upload manifest.')
  const existing = await Upload.findOne({ ownerId: request.user._id, idempotencyKey }).lean()
  if (existing) return response.json({ uploadId: existing.uploadId, status: existing.status, uploadUrl: existing.status === 'pending' ? createPresignedPutUrl(existing.storageKey) : null, storageKey: existing.storageKey })
  const existingFiles = await ProjectFile.find({ projectId: project._id, status: 'ready' }).lean()
  if (existingFiles.some((file) => file.relativePath === normalizedPath)) throw createError(409, 'A file with this relative path already exists.')
  if (existingFiles.length >= MAX_PROJECT_FILES || existingFiles.reduce((total, file) => total + Number(file.size || 0), 0) + byteSize > MAX_PROJECT_BYTES) throw createError(413, 'Project storage quota exceeded.')
  const storageKey = immutableObjectKey(project.slug, String(checksum).toLowerCase(), normalizedPath)
  const upload = await Upload.create({ uploadId: crypto.randomUUID(), idempotencyKey, ownerId: request.user._id, projectId: project._id, storageKey, relativePath: normalizedPath, detectedType: extension, mimeType: String(mimeType), size: byteSize, checksum: String(checksum).toLowerCase(), status: 'pending', provider: 's3', expiresAt: new Date(Date.now() + 15 * 60 * 1000) })
  response.status(201).json({ uploadId: upload.uploadId, status: upload.status, storageKey, uploadUrl: createPresignedPutUrl(storageKey), expiresAt: upload.expiresAt })
})

export const completeProjectUpload = asyncHandler(async (request, response) => {
  const upload = await Upload.findOne({ uploadId: request.params.uploadId, ownerId: request.user._id })
  if (!upload || upload.status !== 'pending' || (upload.expiresAt && upload.expiresAt < new Date())) throw createError(409, 'Upload is unavailable or expired.')
  const { checksum, size, etag = '' } = request.body ?? {}
  if (String(checksum).toLowerCase() !== upload.checksum || Number(size) !== upload.size) throw createError(400, 'Upload completion manifest does not match the authorized upload.')
  const project = await Project.findById(upload.projectId)
  if (!project) throw createError(404, 'Project not found.')
  const url = publicObjectUrl(upload.storageKey)
  if (!url) throw createError(503, 'Object storage public delivery URL is not configured.')
  const file = await ProjectFile.create({ projectId: project._id, ownerId: project.ownerId, name: path.posix.basename(upload.relativePath), relativePath: upload.relativePath, url, storageKey: upload.storageKey, mimeType: upload.mimeType, size: upload.size, checksum: upload.checksum, version: 1, status: 'ready' })
  upload.status = 'ready'; upload.etag = String(etag); await upload.save()
  const files = await ProjectFile.find({ projectId: project._id, status: 'ready' }).lean()
  const mainFile = pickMainFile(files, project.type)
  if (mainFile) {
    const coverFile = files.find((entry) => entry.relativePath.toLowerCase().startsWith('cover/')) ?? files.find((entry) => IMAGE_EXTENSIONS.has(path.posix.extname(entry.relativePath).toLowerCase()))
    project.previewUrl = coverFile?.url ?? mainFile.url; project.gameUrl = project.type === 'game' ? mainFile.url : ''; project.modelUrl = project.type === '3d' ? mainFile.url : ''; project.imageUrl = project.type === '2d' ? mainFile.url : ''
    await project.save()
  }
  response.status(201).json({ message: 'Upload completed successfully.', uploadId: upload.uploadId, status: upload.status, file })
})

export const publishProject = asyncHandler(async (request, response) => {
  const { projectId } = request.params
  const project = await Project.findById(projectId)

  if (!project) {
    throw createError(404, 'Project not found.')
  }

  if (!await canManageProject(project, request.user._id)) {
    throw createError(403, 'You cannot publish this project.')
  }

  const uploadedFiles = await ProjectFile.find({ projectId: project._id, status: 'ready' }).lean()

  if (uploadedFiles.length === 0) {
    throw createError(400, 'Please upload at least one file before publishing.')
  }

  const mainFile = pickMainFile(uploadedFiles, project.type)

  if (!mainFile) {
    throw createError(
      400,
      project.type === 'game'
        ? 'A WebGL project needs an index.html or another .html entry file.'
        : project.type === '3d'
          ? 'A 3D project needs a .glb or .gltf file.'
        : 'A 2D project needs an image file.',
    )
  }

  if (project.type === 'game') {
    await validatePlayableGameBundle(project)
  }

  const coverFile = uploadedFiles.find((file) => file.relativePath.toLowerCase().startsWith('cover/'))
    ?? uploadedFiles.find((file) => ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'].some((ext) => file.relativePath.toLowerCase().endsWith(ext)))
    ?? null

  project.previewUrl = coverFile?.url ?? mainFile.url
  project.gameUrl = project.type === 'game' ? mainFile.url : ''
  project.modelUrl = project.type === '3d' ? mainFile.url : ''
  project.imageUrl = project.type === '2d' ? mainFile.url : ''
  project.isPublished = project.visibility === 'public'
  project.publishedAt = project.isPublished ? (project.publishedAt || new Date()) : null

  await project.save()
  await upsertFeedProjection('project', project)

  const collaborationMap = await getProjectCollaborationMap([project], String(request.user._id))
  response.json({
    message: 'Project published successfully.',
    project: buildProjectPayload(
      project,
      normalizeProjectEngagementSummary({ sharesCount: Number(project?.engagement?.sharesCount || 0) }),
      uploadedFiles, collaborationMap.get(String(project._id)),
    ),
  })
})

export const updateProject = asyncHandler(async (request, response) => {
  const { projectId } = request.params
  const { title, category, description, tags, software, visibility, mode, type, collaborationOpen, collaborationRoles, collaborationSummary } = request.body

  const project = await Project.findById(projectId)

  if (!project) {
    throw createError(404, 'Project not found.')
  }

  if (!await canManageProject(project, request.user._id)) {
    throw createError(403, 'You cannot modify this project.')
  }

  if (title !== undefined) project.title = String(title).trim()
  if (category !== undefined) project.category = String(category).trim()
  if (description !== undefined) project.description = String(description).trim()
  if (tags !== undefined) project.tags = normalizeList(tags)
  if (software !== undefined) project.software = normalizeList(software)
  if (visibility !== undefined) {
    if (!['public', 'private'].includes(visibility)) {
      throw createError(400, 'Invalid visibility value.')
    }
    project.visibility = visibility
  }
  if (mode !== undefined) {
    if (!['portrait', 'landscape'].includes(mode)) {
      throw createError(400, 'Invalid mode value.')
    }
    project.mode = mode
  }
  if (type !== undefined) {
    if (!['game', '3d', '2d'].includes(type)) {
      throw createError(400, 'Invalid type value.')
    }
    project.type = type
  }
  if (collaborationOpen !== undefined) project.collaborationOpen = Boolean(collaborationOpen)
  if (collaborationRoles !== undefined) project.collaborationRoles = normalizeList(collaborationRoles)
  if (collaborationSummary !== undefined) {
    const summary = String(collaborationSummary).trim()
    if (summary.length > 500) throw createError(400, 'Collaboration summary must be 500 characters or fewer.')
    project.collaborationSummary = summary
  }

  const uploadedFiles = await ProjectFile.find({ projectId: project._id, status: 'ready' }).lean()
  const mainFile = pickMainFile(uploadedFiles, project.type)
  if (mainFile) {
    const coverFile = uploadedFiles.find((file) => file.relativePath.toLowerCase().startsWith('cover/'))
      ?? uploadedFiles.find((file) => ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'].some((ext) => file.relativePath.toLowerCase().endsWith(ext)))
      ?? null

    project.previewUrl = coverFile?.url ?? mainFile.url
    project.gameUrl = project.type === 'game' ? mainFile.url : ''
    project.modelUrl = project.type === '3d' ? mainFile.url : ''
    project.imageUrl = project.type === '2d' ? mainFile.url : ''
  }

  await project.save()
  await upsertFeedProjection('project', project)

  const collaborationMap = await getProjectCollaborationMap([project], String(request.user._id))
  response.json({
    message: 'Project updated successfully.',
    project: buildProjectPayload(
      project,
      normalizeProjectEngagementSummary({ sharesCount: Number(project?.engagement?.sharesCount || 0) }),
      uploadedFiles, collaborationMap.get(String(project._id)),
    ),
  })
})

function requireIdempotencyKey(request) {
  const key = String(request.headers['idempotency-key'] || '').trim()
  if (!key || key.length > 128) throw createError(400, 'A valid Idempotency-Key header is required.')
  return key
}

async function getGeneralEngagement(contentType, target, viewerId = '') {
  const viewer = viewerId
    ? await PostEngagement.findOne({ contentType, contentId: String(target._id), userId: viewerId }).select('liked saved').lean()
    : null
  return {
    likesCount: Number(target.engagement?.likesCount || 0),
    commentsCount: Number(target.engagement?.commentsCount || 0),
    savesCount: Number(target.engagement?.savesCount || 0),
    sharesCount: Number(target.engagement?.sharesCount || 0),
    viewerHasLiked: Boolean(viewer?.liked), viewerHasSaved: Boolean(viewer?.saved),
    isLiked: Boolean(viewer?.liked), isSaved: Boolean(viewer?.saved),
    comments: [],
  }
}

async function mutateGeneralEngagement(request, contentType, contentId, action, text = '') {
  const idempotencyKey = requireIdempotencyKey(request)
  const target = await loadEngagementTarget(contentType, contentId)
  if (contentType === 'project') await ensureProjectEngagementAccess(target, request.user._id)

  const previousReceipt = await MutationReceipt.findOne({ userId: request.user._id, idempotencyKey }).lean()
  if (previousReceipt?.result) return previousReceipt.result
  if (previousReceipt) throw createError(409, 'This mutation is already being processed.')

  try {
    await MutationReceipt.create({ userId: request.user._id, idempotencyKey, action, contentType, contentId: String(target._id) })
  } catch (error) {
    if (error?.code === 11000) {
      const receipt = await MutationReceipt.findOne({ userId: request.user._id, idempotencyKey }).lean()
      if (receipt?.result) return receipt.result
      throw createError(409, 'This mutation is already being processed.')
    }
    throw error
  }

  const Model = getEngagementTarget(contentType)
  const targetId = target._id
  let message = 'Engagement updated successfully.'
  if (action === 'react' || action === 'save') {
    const field = action === 'react' ? 'liked' : 'saved'
    const counter = action === 'react' ? 'likesCount' : 'savesCount'
    // Read/update the engagement document explicitly. This is compatible with
    // Mongo deployments that reject aggregation expressions in an upsert
    // pipeline and keeps the first like (no existing row) deterministic.
    let record = await PostEngagement.findOne({ contentType, contentId: String(targetId), userId: request.user._id })
    if (!record) {
      try {
        record = await PostEngagement.create({
          contentType,
          contentId: String(targetId),
          userId: request.user._id,
          liked: action === 'react',
          saved: action === 'save',
        })
      } catch (error) {
        if (error?.code !== 11000) throw error
        record = await PostEngagement.findOne({ contentType, contentId: String(targetId), userId: request.user._id })
        record[field] = !Boolean(record[field])
        await record.save()
      }
    } else {
      record[field] = !Boolean(record[field])
      await record.save()
    }
    const delta = record[field] ? 1 : -1
    await Model.updateOne({ _id: targetId }, { $inc: { [`engagement.${counter}`]: delta } })
    // Guard legacy records whose counter may be missing or already below zero.
    await Model.updateOne({ _id: targetId, [`engagement.${counter}`]: { $lt: 0 } }, { $set: { [`engagement.${counter}`]: 0 } })
    message = record[field] ? `${action === 'react' ? 'Liked' : 'Saved'}.` : `${action === 'react' ? 'Unliked' : 'Unsaved'}.`
  } else if (action === 'comment') {
    if (!text) throw createError(400, 'Comment text is required.')
    await PostComment.create({
      postId: contentType === 'project' ? targetId : undefined,
      contentType, contentId: String(targetId), userId: request.user._id,
      username: request.user.username, name: request.user.name, avatar: safeAvatarUrl(request.user.avatar), text, idempotencyKey,
    })
    await Model.updateOne({ _id: targetId }, { $inc: { 'engagement.commentsCount': 1 } })
    message = 'Comment added successfully.'
  } else if (action === 'share') {
    await Model.updateOne({ _id: targetId }, { $inc: { 'engagement.sharesCount': 1 } })
    message = 'Share recorded.'
  } else {
    throw createError(400, 'Invalid engagement action.')
  }

  const updated = await Model.findById(targetId)
  const engagement = await getGeneralEngagement(contentType, updated, getViewerId(request))
  // The comment/engagement write is already durable. Realtime and feed projection
  // failures must not turn a successful user action into a 500 response.
  try {
    await upsertFeedProjection(contentType, updated)
    if (contentType === 'project') await publishProjectEngagement(updated._id, engagement)
  } catch (error) {
    console.error('Engagement projection failed after a committed mutation:', error)
  }
  const result = { message, contentType, contentId: String(updated._id), engagement, version: Number(updated.__v || 0) }
  await MutationReceipt.updateOne({ userId: request.user._id, idempotencyKey }, { $set: { result } })
  return result
}

export const getPostEngagement = asyncHandler(async (request, response) => {
  const { postId } = request.params
  const viewerId = getViewerId(request)
  const project = await loadEngagementTarget('project', postId)
  await ensureProjectEngagementAccess(project, request.user._id)
  const engagement = await getProjectEngagementPayload(project._id, viewerId, {
    includeComments: true,
    sharesCount: project?.engagement?.sharesCount || 0,
  })
  response.json({
    postId: String(project._id),
    engagement,
  })
})

export const togglePostLike = asyncHandler(async (request, response) => {
  response.json(await mutateGeneralEngagement(request, 'project', request.params.postId, 'react'))
})

export const togglePostSave = asyncHandler(async (request, response) => {
  response.json(await mutateGeneralEngagement(request, 'project', request.params.postId, 'save'))
})

export const createPostComment = asyncHandler(async (request, response) => {
  response.status(201).json(await mutateGeneralEngagement(request, 'project', request.params.postId, 'comment', String(request.body?.text || request.body?.commentText || '').trim()))
})

export const createCommentReply = asyncHandler(async (request, response) => {
  const { commentId } = request.params
  if (!mongoose.isValidObjectId(commentId)) {
    throw createError(400, 'Invalid comment ID.')
  }
  const text = String(request.body?.text || '').trim()
  if (!text) {
    throw createError(400, 'Reply text is required.')
  }

  const parentComment = await PostComment.findById(commentId)

  if (!parentComment) {
    throw createError(404, 'Comment not found.')
  }

  const idempotencyKey = requireIdempotencyKey(request)
  const contentType = parentComment.contentType || 'project'
  const contentId = parentComment.contentId || String(parentComment.postId)
  const target = await loadEngagementTarget(contentType, contentId)
  if (contentType === 'project') await ensureProjectEngagementAccess(target, request.user._id)
  const existingReply = await PostComment.findOne({ userId: request.user._id, idempotencyKey }).lean()
  if (!existingReply) {
    await PostComment.create({ postId: contentType === 'project' ? target._id : undefined, contentType, contentId: String(target._id), parentCommentId: parentComment._id, userId: request.user._id, username: request.user.username, name: request.user.name, avatar: safeAvatarUrl(request.user.avatar), text, idempotencyKey })
    await getEngagementTarget(contentType).updateOne({ _id: target._id }, { $inc: { 'engagement.commentsCount': 1 } })
  }
  const updated = await getEngagementTarget(contentType).findById(target._id)
  const result = { message: 'Reply added successfully.', contentType, contentId: String(target._id), engagement: await getGeneralEngagement(contentType, updated, getViewerId(request)) }
  try {
    await upsertFeedProjection(contentType, updated)
    if (contentType === 'project') await publishProjectEngagement(updated._id, result.engagement)
  } catch (error) {
    console.error('Reply projection failed after a committed mutation:', error)
  }
  response.status(201).json(result)
})

export const toggleCommentReaction = asyncHandler(async (request, response) => {
  const { commentId } = request.params
  const emoji = String(request.body?.emoji || '')
  if (!mongoose.isValidObjectId(commentId)) throw createError(400, 'Invalid comment ID.')
  if (!['heart', 'laugh', 'wow', 'sad', 'fire'].includes(emoji)) throw createError(400, 'Invalid reaction.')
  const comment = await PostComment.findById(commentId).lean()
  if (!comment) throw createError(404, 'Comment not found.')
  const existing = await CommentReaction.findOne({ commentId, userId: request.user._id })
  if (existing?.emoji === emoji) await existing.deleteOne()
  else if (existing) { existing.emoji = emoji; await existing.save() }
  else await CommentReaction.create({ commentId, userId: request.user._id, emoji })
  const rows = await CommentReaction.aggregate([{ $match: { commentId: new mongoose.Types.ObjectId(commentId) } }, { $group: { _id: '$emoji', count: { $sum: 1 } } }])
  const viewer = await CommentReaction.findOne({ commentId, userId: request.user._id }).lean()
  response.json({ commentId, reactions: Object.fromEntries(rows.map((row) => [row._id, row.count])), viewerReaction: viewer?.emoji || null })
})

export const updateContentEngagement = asyncHandler(async (request, response) => {
  const { contentType, contentId } = request.params
  const action = String(request.body?.action || '').trim()
  const commentText = String(request.body?.commentText || '').trim()
  response.json(await mutateGeneralEngagement(request, contentType, contentId, action, commentText))
})

export const deleteProject = asyncHandler(async (request, response) => {
  const { projectId } = request.params
  const project = await Project.findById(projectId)

  if (!project) {
    throw createError(404, 'Project not found.')
  }

  if (String(project.ownerId) !== String(request.user._id)) {
    throw createError(403, 'You cannot delete this project.')
  }

  if (project.slug) {
    const projectRoot = getProjectRoot(project.slug)
    try {
      await fs.rm(projectRoot, { recursive: true, force: true })
    } catch (err) {
      console.error('Failed to delete project directory:', err)
    }
  }

  await Promise.all([
    ProjectFile.deleteMany({ projectId: projectId }),
    Upload.updateMany({ projectId: projectId }, { $set: { status: 'deleted' } }),
    PostEngagement.deleteMany({ postId: projectId }),
    PostComment.deleteMany({ postId: projectId }),
  ])
  await Project.deleteOne({ _id: projectId })
  await removeFeedProjection('project', projectId)

  response.json({
    message: 'Project deleted successfully.',
  })
})

export async function seedDatabase() {
  const [gameCount, assetCount] = await Promise.all([
    Game.estimatedDocumentCount(),
    Asset.estimatedDocumentCount(),
  ])

  if (gameCount === 0) {
    await Game.insertMany(seedGames)
  }

  if (assetCount === 0) {
    await Asset.insertMany(seedAssets)
  }
}
