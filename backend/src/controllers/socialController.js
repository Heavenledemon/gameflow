import mongoose from 'mongoose'
import asyncHandler from '../middlewares/asyncHandler.js'
import CollaborationRequest from '../models/CollaborationRequest.js'
import Follow from '../models/Follow.js'
import Project from '../models/Project.js'
import ProjectMember from '../models/ProjectMember.js'
import Conversation from '../models/Conversation.js'
import ConversationParticipant from '../models/ConversationParticipant.js'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { canManageProject } from '../services/projectAccessService.js'

function createError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function publicUser(user, relationship) {
  return {
    id: String(user._id),
    username: user.username,
    name: user.name,
    avatar: user.avatar || '',
    headline: user.headline || user.creatorType || '',
    relationship,
  }
}

export const getCollaborationCandidates = asyncHandler(async (request, response) => {
  const viewerId = request.user._id
  const relationships = await Follow.find({ $or: [{ followerId: viewerId }, { followingId: viewerId }] }).lean()
  const candidates = new Map()

  for (const relationship of relationships) {
    const followsThem = String(relationship.followerId) === String(viewerId)
    const personId = followsThem ? relationship.followingId : relationship.followerId
    const existing = candidates.get(String(personId)) || { id: personId, follows: false, followsYou: false }
    if (followsThem) existing.follows = true
    else existing.followsYou = true
    candidates.set(String(personId), existing)
  }

  const users = await User.find({ _id: { $in: [...candidates.values()].map((candidate) => candidate.id) } })
    .select('username name avatar headline creatorType')
    .sort({ name: 1 })
    .lean()

  response.json({
    candidates: users.map((person) => {
      const relationship = candidates.get(String(person._id))
      return publicUser(person, relationship.follows && relationship.followsYou ? 'Following each other' : relationship.follows ? 'Following' : 'Follows you')
    }),
  })
})

export const toggleFollow = asyncHandler(async (request, response) => {
  const { userId } = request.params
  if (!mongoose.isValidObjectId(userId)) throw createError(400, 'Invalid user ID.')
  if (String(userId) === String(request.user._id)) throw createError(400, 'You cannot follow yourself.')
  if (!await User.exists({ _id: userId })) throw createError(404, 'User not found.')

  const existing = await Follow.findOne({ followerId: request.user._id, followingId: userId })
  if (existing) {
    await existing.deleteOne()
    response.json({ following: false })
    return
  }
  await Follow.create({ followerId: request.user._id, followingId: userId })
  response.status(201).json({ following: true })
})

function requestDto(record) {
  const project = record.projectId && typeof record.projectId === 'object' ? record.projectId : null
  const requester = record.requesterId && typeof record.requesterId === 'object' ? record.requesterId : null
  const recipient = record.recipientId && typeof record.recipientId === 'object' ? record.recipientId : null
  return {
    id: String(record._id), projectId: String(project?._id || record.projectId),
    project: project ? { id: String(project._id), title: project.title, slug: project.slug, previewUrl: project.previewUrl || '' } : undefined,
    requester: requester ? publicUser(requester, '') : { id: String(record.requesterId) },
    recipient: recipient ? publicUser(recipient, '') : { id: String(record.recipientId) },
    initiatedBy: record.initiatedBy, proposedRole: record.proposedRole, message: record.message,
    status: record.status, conversationId: record.conversationId ? String(record.conversationId) : null,
    resolvedBy: record.resolvedBy ? String(record.resolvedBy) : null, resolvedAt: record.resolvedAt,
    createdAt: record.createdAt, updatedAt: record.updatedAt,
  }
}

function populateRequest(query) {
  return query
    .populate('projectId', 'title slug previewUrl ownerId visibility isPublished collaborationOpen')
    .populate('requesterId', 'username name avatar headline creatorType')
    .populate('recipientId', 'username name avatar headline creatorType')
}

async function hasFollowRelationship(leftId, rightId) {
  return Boolean(await Follow.exists({ $or: [{ followerId: leftId, followingId: rightId }, { followerId: rightId, followingId: leftId }] }))
}

async function ensureRequestConversation(requestRecord, session = null) {
  if (requestRecord.conversationId) return requestRecord.conversationId
  const options = session ? { session } : {}
  const conversation = await Conversation.create([{
    kind: 'collaboration_request', participantIds: [requestRecord.requesterId, requestRecord.recipientId],
    projectId: requestRecord.projectId, collaborationRequestId: requestRecord._id,
    createdBy: requestRecord.requesterId, lastMessageAt: new Date(),
    lastMessagePreview: requestRecord.message || 'Collaboration request created.',
  }], options).then(([created]) => created)
  await ConversationParticipant.insertMany([
    { conversationId: conversation._id, userId: requestRecord.requesterId },
    { conversationId: conversation._id, userId: requestRecord.recipientId },
  ], options)
  await Message.create([{
    conversationId: conversation._id, senderId: requestRecord.requesterId,
    body: requestRecord.message || 'Collaboration request created.', type: requestRecord.message ? 'text' : 'system',
    clientMessageId: `request:${requestRecord._id}`,
  }], options)
  requestRecord.conversationId = conversation._id
  await requestRecord.save(options)
  return conversation._id
}

function readCursor(value) {
  if (!value) return null
  try {
    const [timestamp, id] = Buffer.from(String(value), 'base64url').toString('utf8').split('|')
    if (!mongoose.isValidObjectId(id) || Number.isNaN(new Date(timestamp).getTime())) throw new Error()
    return { createdAt: new Date(timestamp), id }
  } catch { throw createError(400, 'Invalid collaboration request cursor.') }
}

function writeCursor(record) {
  return Buffer.from(`${new Date(record.createdAt).toISOString()}|${record._id}`).toString('base64url')
}

async function loadAuthorizedRequest(requestId, viewerId) {
  if (!mongoose.isValidObjectId(requestId)) throw createError(400, 'Invalid collaboration request ID.')
  const record = await CollaborationRequest.findById(requestId).populate('projectId').populate('requesterId', 'username name avatar headline creatorType').populate('recipientId', 'username name avatar headline creatorType')
  if (!record || !record.projectId) throw createError(404, 'Collaboration request not found.')
  const isParticipant = String(record.requesterId._id || record.requesterId) === String(viewerId) || String(record.recipientId._id || record.recipientId) === String(viewerId)
  if (!isParticipant && !await canManageProject(record.projectId, viewerId)) throw createError(403, 'You cannot view this collaboration request.')
  return record
}

export const createCollaborationRequest = asyncHandler(async (request, response) => {
  const { projectId } = request.params
  const { recipientId, message = '', proposedRole = 'contributor' } = request.body ?? {}
  if (!mongoose.isValidObjectId(projectId)) throw createError(400, 'Invalid project ID.')
  if (String(message).trim().length > 500) throw createError(400, 'Collaboration message must be 500 characters or fewer.')
  if (!['editor', 'contributor', 'viewer'].includes(String(proposedRole))) throw createError(400, 'Invalid proposed role.')

  const project = await Project.findById(projectId)
  if (!project) throw createError(404, 'Project not found.')
  const isInvite = Boolean(recipientId)
  let requesterId = request.user._id
  let targetRecipientId = recipientId
  let initiatedBy = 'owner_invite'
  if (isInvite) {
    if (!mongoose.isValidObjectId(recipientId)) throw createError(400, 'Invalid collaborator ID.')
    if (!await canManageProject(project, request.user._id)) throw createError(403, 'Only project managers can invite collaborators.')
  } else {
    if (!project.isPublished || project.visibility !== 'public' || !project.collaborationOpen) throw createError(403, 'This project is not open for collaboration requests.')
    targetRecipientId = project.ownerId
    initiatedBy = 'creator_request'
  }
  if (String(targetRecipientId) === String(request.user._id)) throw createError(400, 'You cannot create a collaboration request for yourself.')
  if (!await User.exists({ _id: targetRecipientId })) throw createError(404, 'Collaborator not found.')
  if (!await hasFollowRelationship(request.user._id, targetRecipientId)) throw createError(403, 'A follow relationship is required to collaborate.')
  if (await ProjectMember.exists({ projectId: project._id, userId: isInvite ? targetRecipientId : request.user._id, status: 'active' })) throw createError(409, 'This creator is already an active project member.')
  const duplicate = await CollaborationRequest.findOne({ projectId: project._id, status: 'pending', $or: [
    { requesterId, recipientId: targetRecipientId }, { requesterId: targetRecipientId, recipientId: requesterId },
  ] })
  if (duplicate) throw createError(409, 'A pending collaboration request already exists between these creators.')
  const session = await mongoose.startSession()
  let requestRecord
  try {
    await session.withTransaction(async () => {
      requestRecord = await CollaborationRequest.findOne({ projectId: project._id, requesterId, recipientId: targetRecipientId }).session(session)
      if (requestRecord) {
        requestRecord.set({ initiatedBy, proposedRole, message: String(message).trim(), status: 'pending', resolvedBy: null, resolvedAt: null, resolutionEvent: '' })
        await requestRecord.save({ session })
      } else {
        requestRecord = await CollaborationRequest.create([{ projectId: project._id, requesterId, recipientId: targetRecipientId, initiatedBy, proposedRole, message: String(message).trim() }], { session }).then(([created]) => created)
      }
      await ensureRequestConversation(requestRecord, session)
    })
  } finally { await session.endSession() }
  const populated = await populateRequest(CollaborationRequest.findById(requestRecord._id)).lean()
  response.status(201).json({ request: requestDto(populated) })
})

export const listCollaborationRequests = asyncHandler(async (request, response) => {
  const box = String(request.query.box || 'incoming')
  const status = String(request.query.status || 'pending')
  if (!['incoming', 'outgoing'].includes(box)) throw createError(400, 'Invalid request box.')
  if (!['pending', 'accepted', 'declined', 'cancelled', 'expired', 'all'].includes(status)) throw createError(400, 'Invalid request status.')
  const cursor = readCursor(request.query.cursor)
  const limit = Math.min(50, Math.max(1, Number(request.query.limit) || 20))
  const query = { [box === 'incoming' ? 'recipientId' : 'requesterId']: request.user._id, ...(status === 'all' ? {} : { status }) }
  if (cursor) query.$or = [{ createdAt: { $lt: cursor.createdAt } }, { createdAt: cursor.createdAt, _id: { $lt: cursor.id } }]
  const rows = await populateRequest(CollaborationRequest.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit + 1)).lean()
  const hasMore = rows.length > limit
  const items = rows.slice(0, limit)
  response.json({ items: items.map(requestDto), nextCursor: hasMore ? writeCursor(items.at(-1)) : null })
})

export const getCollaborationRequest = asyncHandler(async (request, response) => {
  response.json({ request: requestDto((await loadAuthorizedRequest(request.params.requestId, request.user._id)).toObject()) })
})

async function resolveRequest(request, response, status) {
  const record = await loadAuthorizedRequest(request.params.requestId, request.user._id)
  const viewerId = String(request.user._id)
  const canResolve = record.initiatedBy === 'creator_request'
    ? await canManageProject(record.projectId, viewerId)
    : String(record.recipientId._id || record.recipientId) === viewerId
  if (!canResolve) throw createError(403, 'You cannot resolve this collaboration request.')
  if (record.status !== 'pending') throw createError(409, 'This collaboration request has already been resolved.')
  record.status = status
  record.resolvedBy = request.user._id
  record.resolvedAt = new Date()
  record.resolutionEvent = status
  await record.save()
  response.json({ request: requestDto(record.toObject()) })
}

export const declineCollaborationRequest = asyncHandler(async (request, response) => resolveRequest(request, response, 'declined'))

export const cancelCollaborationRequest = asyncHandler(async (request, response) => {
  const record = await loadAuthorizedRequest(request.params.requestId, request.user._id)
  if (String(record.requesterId._id || record.requesterId) !== String(request.user._id)) throw createError(403, 'Only the request initiator can cancel this request.')
  if (record.status !== 'pending') throw createError(409, 'This collaboration request has already been resolved.')
  record.status = 'cancelled'; record.resolvedBy = request.user._id; record.resolvedAt = new Date(); record.resolutionEvent = 'cancelled'
  await record.save()
  response.json({ request: requestDto(record.toObject()) })
})

export const acceptCollaborationRequest = asyncHandler(async (request, response) => {
  const record = await loadAuthorizedRequest(request.params.requestId, request.user._id)
  const viewerId = String(request.user._id)
  const canAccept = record.initiatedBy === 'creator_request'
    ? await canManageProject(record.projectId, viewerId)
    : String(record.recipientId._id || record.recipientId) === viewerId
  if (!canAccept) throw createError(403, 'You cannot accept this collaboration request.')
  if (record.status === 'accepted') return response.json({ request: requestDto(record.toObject()) })
  if (record.status !== 'pending') throw createError(409, 'This collaboration request has already been resolved.')
  const memberId = record.initiatedBy === 'creator_request' ? record.requesterId._id || record.requesterId : record.recipientId._id || record.recipientId
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const current = await CollaborationRequest.findOne({ _id: record._id, status: 'pending' }).session(session)
      if (!current) throw createError(409, 'This collaboration request has already been resolved.')
      await ProjectMember.updateOne({ projectId: current.projectId, userId: memberId }, { $set: { role: current.proposedRole, status: 'active', invitedBy: request.user._id, joinedAt: new Date(), removedAt: null } }, { upsert: true, session })
      current.status = 'accepted'; current.resolvedBy = request.user._id; current.resolvedAt = new Date(); current.resolutionEvent = 'accepted'
      await current.save({ session })
    })
  } finally { await session.endSession() }
  const updated = await populateRequest(CollaborationRequest.findById(record._id)).lean()
  response.json({ request: requestDto(updated) })
})
