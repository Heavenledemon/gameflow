import mongoose from 'mongoose'
import asyncHandler from '../middlewares/asyncHandler.js'
import ProfileFootprint, { FOOTPRINT_LIFETIME_MS, FOOTPRINT_REACTIONS } from '../models/ProfileFootprint.js'
import User from '../models/User.js'
import UserBlock from '../models/UserBlock.js'
import { isBlockedBetween } from '../services/moderationService.js'
import { recordAnalyticsEvent } from './analyticsController.js'

function error(statusCode, message) { const value = new Error(message); value.statusCode = statusCode; return value }

function unexpiredFootprints(now = new Date()) {
  return { $or: [{ expiresAt: { $gt: now } }, { expiresAt: { $exists: false }, updatedAt: { $gt: new Date(now.getTime() - FOOTPRINT_LIFETIME_MS) } }] }
}

async function loadOwner(userId) {
  if (!mongoose.isValidObjectId(userId)) throw error(400, 'Invalid creator ID.')
  const owner = await User.findById(userId).select('companionFootprintsEnabled').lean()
  if (!owner) throw error(404, 'Creator not found.')
  return owner
}

export const getMyFootprintForCreator = asyncHandler(async (request, response) => {
  const owner = await loadOwner(request.params.userId)
  if (String(owner._id) === String(request.user._id)) throw error(400, 'Your own profile does not use visitor footprints.')
  if (await isBlockedBetween(owner._id, request.user._id)) throw error(403, 'This interaction is unavailable.')
  const footprint = await ProfileFootprint.findOne({ ownerId: owner._id, visitorId: request.user._id, isActive: true, ...unexpiredFootprints() }).lean()
  response.json({ enabled: owner.companionFootprintsEnabled !== false, footprint: footprint ? { id: String(footprint._id), reaction: footprint.reaction, updatedAt: footprint.updatedAt } : null })
})

export const upsertMyFootprint = asyncHandler(async (request, response) => {
  const owner = await loadOwner(request.params.userId)
  if (String(owner._id) === String(request.user._id)) throw error(400, 'You cannot leave a footprint on your own profile.')
  if (owner.companionFootprintsEnabled === false) throw error(403, 'This creator is not accepting footprints.')
  if (await isBlockedBetween(owner._id, request.user._id)) throw error(403, 'This interaction is unavailable.')
  const reaction = String(request.body?.reaction || '')
  if (!FOOTPRINT_REACTIONS.includes(reaction)) throw error(400, 'Choose a valid footprint reaction.')
  const existing = await ProfileFootprint.findOne({ ownerId: owner._id, visitorId: request.user._id }).select('isActive').lean()
  const footprint = await ProfileFootprint.findOneAndUpdate(
    { ownerId: owner._id, visitorId: request.user._id },
    { $set: { reaction, isActive: true, hiddenByOwner: false, expiresAt: new Date(Date.now() + FOOTPRINT_LIFETIME_MS) } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  )
  await recordAnalyticsEvent({ creatorId: owner._id, contentType: 'profile', eventType: existing?.isActive ? 'footprint_updated' : 'footprint_created', viewerId: request.user._id, metadata: { reaction } })
  response.json({ message: 'Your footprint was left privately for this creator.', footprint: { id: String(footprint._id), reaction: footprint.reaction, updatedAt: footprint.updatedAt } })
})

export const removeMyFootprint = asyncHandler(async (request, response) => {
  const owner = await loadOwner(request.params.userId)
  if (String(owner._id) === String(request.user._id)) throw error(400, 'Your own profile does not use visitor footprints.')
  const result = await ProfileFootprint.updateOne({ ownerId: owner._id, visitorId: request.user._id, isActive: true }, { $set: { isActive: false } })
  if (result.modifiedCount) await recordAnalyticsEvent({ creatorId: owner._id, contentType: 'profile', eventType: 'footprint_removed', viewerId: request.user._id })
  response.json({ message: 'Your footprint was removed.', footprint: null })
})

export const listMyProfileFootprints = asyncHandler(async (request, response) => {
  const blockedRows = await UserBlock.find({ $or: [{ blockerId: request.user._id }, { blockedId: request.user._id }] }).lean()
  const blockedIds = blockedRows.map((row) => String(row.blockerId) === String(request.user._id) ? row.blockedId : row.blockerId)
  const rows = await ProfileFootprint.find({ ownerId: request.user._id, isActive: true, hiddenByOwner: false, ...unexpiredFootprints(), ...(blockedIds.length ? { visitorId: { $nin: blockedIds } } : {}) })
    .sort({ updatedAt: -1 }).limit(100).populate('visitorId', 'username name avatar isVerified').lean()
  const reviewedAt = request.user.companionFootprintsReviewedAt || new Date(0)
  const items = rows.filter((row) => row.visitorId).map((row) => ({ id: String(row._id), reaction: row.reaction, updatedAt: row.updatedAt, unread: new Date(row.updatedAt) > reviewedAt, visitor: { id: String(row.visitorId._id), username: row.visitorId.username, name: row.visitorId.name, avatar: row.visitorId.avatar || '', isVerified: Boolean(row.visitorId.isVerified) } }))
  response.json({ items, unreadCount: items.filter((item) => item.unread).length })
})

export const markFootprintsReviewed = asyncHandler(async (request, response) => {
  request.user.companionFootprintsReviewedAt = new Date()
  await request.user.save()
  response.json({ message: 'Footprints marked as reviewed.', reviewedAt: request.user.companionFootprintsReviewedAt })
})
