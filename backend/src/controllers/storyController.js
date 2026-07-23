import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import Story from '../models/Story.js'
import asyncHandler from '../middlewares/asyncHandler.js'

const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000
const MIME_EXTENSIONS = new Map([
  ['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'],
  ['image/gif', '.gif'], ['image/avif', '.avif'], ['video/mp4', '.mp4'],
  ['video/webm', '.webm'], ['video/quicktime', '.mov'],
])

function createError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function storyPayload(story) {
  const owner = story.ownerId && typeof story.ownerId === 'object' ? story.ownerId : {}
  return {
    id: String(story._id),
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType,
    caption: story.caption || '',
    createdAt: story.createdAt,
    expiresAt: story.expiresAt,
    creator: {
      id: owner._id ? String(owner._id) : String(story.ownerId || ''),
      username: owner.username || 'creator',
      name: owner.name || owner.username || 'Creator',
      avatarUrl: owner.avatar || '',
    },
  }
}

export const getStories = asyncHandler(async (_request, response) => {
  const stories = await Story.find({ expiresAt: { $gt: new Date() } })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate('ownerId', 'username name avatar')
    .lean()
  response.json({ items: stories.map(storyPayload) })
})

export const createStory = asyncHandler(async (request, response) => {
  const mimeType = String(request.headers['x-mime-type'] || '').toLowerCase()
  const extension = MIME_EXTENSIONS.get(mimeType)
  const caption = decodeURIComponent(String(request.headers['x-story-caption'] || '')).trim()
  if (!Buffer.isBuffer(request.body) || request.body.length === 0) throw createError(400, 'Choose an image or video for your story.')
  if (!extension) throw createError(400, 'Stories support JPG, PNG, WebP, GIF, AVIF, MP4, WebM, or MOV files.')
  if (caption.length > 280) throw createError(400, 'Story captions must be 280 characters or fewer.')

  const ownerDirectory = path.join(process.cwd(), 'uploads', 'stories', String(request.user._id))
  const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`
  await fs.mkdir(ownerDirectory, { recursive: true })
  await fs.writeFile(path.join(ownerDirectory, fileName), request.body, { flag: 'wx' })

  const story = await Story.create({
    ownerId: request.user._id,
    mediaUrl: `/api/uploads/stories/${encodeURIComponent(String(request.user._id))}/${fileName}`,
    mediaType: mimeType.startsWith('video/') ? 'video' : 'image',
    mimeType,
    caption,
    expiresAt: new Date(Date.now() + STORY_LIFETIME_MS),
  })
  await story.populate('ownerId', 'username name avatar')
  response.status(201).json({ message: 'Story shared.', story: storyPayload(story) })
})

export const deleteStory = asyncHandler(async (request, response) => {
  const story = await Story.findOne({ _id: request.params.storyId, ownerId: request.user._id })
  if (!story) throw createError(404, 'Story not found.')
  const relativePath = story.mediaUrl.replace(/^\/api\/uploads\//, '')
  const resolvedPath = path.resolve(process.cwd(), 'uploads', relativePath)
  const uploadsRoot = path.resolve(process.cwd(), 'uploads') + path.sep
  if (resolvedPath.startsWith(uploadsRoot)) await fs.rm(resolvedPath, { force: true })
  await story.deleteOne()
  response.json({ message: 'Story deleted.' })
})
