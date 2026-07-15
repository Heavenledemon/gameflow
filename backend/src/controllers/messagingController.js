import mongoose from 'mongoose'
import asyncHandler from '../middlewares/asyncHandler.js'
import CollaborationRequest from '../models/CollaborationRequest.js'
import Conversation from '../models/Conversation.js'
import ConversationParticipant from '../models/ConversationParticipant.js'
import Message from '../models/Message.js'
import Follow from '../models/Follow.js'
import User from '../models/User.js'
import ProjectMember from '../models/ProjectMember.js'

function createError(statusCode, message) { const error = new Error(message); error.statusCode = statusCode; return error }
function validId(value) { return mongoose.isValidObjectId(value) }
function messageDto(message) { return { id: String(message._id), conversationId: String(message.conversationId), senderId: String(message.senderId), body: message.body, type: message.type, clientMessageId: message.clientMessageId, createdAt: message.createdAt, editedAt: message.editedAt, deletedAt: message.deletedAt } }

async function loadParticipantConversation(conversationId, userId) {
  if (!validId(conversationId)) throw createError(400, 'Invalid conversation ID.')
  const [conversation, participant] = await Promise.all([
    Conversation.findById(conversationId).lean(),
    ConversationParticipant.findOne({ conversationId, userId, hiddenAt: null }).lean(),
  ])
  if (!conversation) throw createError(404, 'Conversation not found.')
  if (!participant) throw createError(403, 'You cannot access this conversation.')
  return { conversation, participant }
}

async function assertCanSend(conversation, userId) {
  if (conversation.kind === 'project') {
    if (!await ProjectMember.exists({ projectId: conversation.projectId, userId, status: 'active' })) throw createError(403, 'You are no longer an active project member.')
    return
  }
  if (conversation.kind !== 'collaboration_request') return
  const request = await CollaborationRequest.findById(conversation.collaborationRequestId).select('status requesterId recipientId').lean()
  if (!request || request.status !== 'pending') throw createError(409, 'This collaboration conversation is closed.')
  if (![String(request.requesterId), String(request.recipientId)].includes(String(userId))) throw createError(403, 'You cannot send messages in this conversation.')
}

function parseBefore(value) {
  if (!value) return null
  try { const [createdAt, id] = Buffer.from(String(value), 'base64url').toString('utf8').split('|'); if (!validId(id) || Number.isNaN(new Date(createdAt).getTime())) throw new Error(); return { createdAt: new Date(createdAt), id } } catch { throw createError(400, 'Invalid message cursor.') }
}
function nextCursor(message) { return Buffer.from(`${new Date(message.createdAt).toISOString()}|${message._id}`).toString('base64url') }

export const listConversations = asyncHandler(async (request, response) => {
  const limit = Math.min(30, Math.max(1, Number(request.query.limit) || 30))
  const before = parseBefore(request.query.cursor)
  const participants = await ConversationParticipant.find({ userId: request.user._id, hiddenAt: null }).select('conversationId').lean()
  const query = { _id: { $in: participants.map((row) => row.conversationId) }, ...(before ? { $or: [{ lastMessageAt: { $lt: before.createdAt } }, { lastMessageAt: before.createdAt, _id: { $lt: before.id } }] } : {}) }
  const rows = await Conversation.find(query).sort({ lastMessageAt: -1, _id: -1 }).limit(limit + 1).lean()
  const hasMore = rows.length > limit
  const conversations = rows.slice(0, limit)
  response.json({ items: conversations.map((conversation) => ({ id: String(conversation._id), kind: conversation.kind, projectId: conversation.projectId ? String(conversation.projectId) : null, collaborationRequestId: conversation.collaborationRequestId ? String(conversation.collaborationRequestId) : null, lastMessageAt: conversation.lastMessageAt, lastMessagePreview: conversation.lastMessagePreview })), nextCursor: hasMore ? nextCursor({ createdAt: conversations.at(-1).lastMessageAt, _id: conversations.at(-1)._id }) : null })
})

export const getConversationMessages = asyncHandler(async (request, response) => {
  const { conversation } = await loadParticipantConversation(request.params.conversationId, request.user._id)
  const before = parseBefore(request.query.before)
  const limit = Math.min(50, Math.max(1, Number(request.query.limit) || 50))
  const query = { conversationId: conversation._id, ...(before ? { $or: [{ createdAt: { $lt: before.createdAt } }, { createdAt: before.createdAt, _id: { $lt: before.id } }] } : {}) }
  const rows = await Message.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean()
  const hasMore = rows.length > limit
  const items = rows.slice(0, limit)
  response.json({ conversation: { id: String(conversation._id), kind: conversation.kind }, items: items.reverse().map(messageDto), nextCursor: hasMore ? nextCursor(items.at(-1)) : null })
})

export const sendConversationMessage = asyncHandler(async (request, response) => {
  const body = String(request.body?.body || '').trim()
  const clientMessageId = String(request.body?.clientMessageId || '').trim()
  if (!body || body.length > 2000) throw createError(400, 'Message body must be between 1 and 2,000 characters.')
  if (!clientMessageId || clientMessageId.length > 128) throw createError(400, 'A valid clientMessageId is required.')
  const { conversation } = await loadParticipantConversation(request.params.conversationId, request.user._id)
  await assertCanSend(conversation, request.user._id)
  const existing = await Message.findOne({ conversationId: conversation._id, clientMessageId }).lean()
  if (existing) return response.json({ message: messageDto(existing), idempotent: true })
  let message
  try { message = await Message.create({ conversationId: conversation._id, senderId: request.user._id, body, type: 'text', clientMessageId }) } catch (error) {
    if (error?.code !== 11000) throw error
    message = await Message.findOne({ conversationId: conversation._id, clientMessageId }).lean()
    return response.json({ message: messageDto(message), idempotent: true })
  }
  await Promise.all([
    Conversation.updateOne({ _id: conversation._id }, { $set: { lastMessageAt: message.createdAt, lastMessagePreview: body } }),
    ConversationParticipant.updateMany({ conversationId: conversation._id }, { $set: { hiddenAt: null } }),
  ])
  response.status(201).json({ message: messageDto(message), idempotent: false })
})

export const markConversationRead = asyncHandler(async (request, response) => {
  const { conversation } = await loadParticipantConversation(request.params.conversationId, request.user._id)
  const requestedId = request.body?.messageId
  let message = requestedId ? await Message.findOne({ _id: requestedId, conversationId: conversation._id }).lean() : await Message.findOne({ conversationId: conversation._id }).sort({ createdAt: -1, _id: -1 }).lean()
  if (requestedId && !message) throw createError(400, 'Message does not belong to this conversation.')
  await ConversationParticipant.updateOne({ conversationId: conversation._id, userId: request.user._id }, { $set: { lastReadMessageId: message?._id || null, lastReadAt: new Date() } })
  response.json({ conversationId: String(conversation._id), lastReadMessageId: message ? String(message._id) : null })
})

export const createDirectConversation = asyncHandler(async (request, response) => {
  const recipientInput = String(request.body?.recipientId || request.body?.username || '').trim()
  if (!recipientInput) throw createError(400, 'A recipient is required.')
  const recipient = validId(recipientInput)
    ? await User.findById(recipientInput).select('_id username').lean()
    : await User.findOne({ username: recipientInput.toLowerCase() }).select('_id username').lean()
  if (!recipient) throw createError(404, 'Creator not found.')
  if (String(recipient._id) === String(request.user._id)) throw createError(400, 'You cannot message yourself.')
  const [followsRecipient, recipientFollows] = await Promise.all([
    Follow.exists({ followerId: request.user._id, followingId: recipient._id }),
    Follow.exists({ followerId: recipient._id, followingId: request.user._id }),
  ])
  if (!followsRecipient || !recipientFollows) throw createError(403, 'Direct messages are available only to mutually following creators.')
  let conversation = await Conversation.findOne({ kind: 'direct', participantIds: { $all: [request.user._id, recipient._id], $size: 2 } })
  if (!conversation) {
    conversation = await Conversation.create({ kind: 'direct', participantIds: [request.user._id, recipient._id], createdBy: request.user._id, lastMessageAt: new Date() })
    await ConversationParticipant.insertMany([{ conversationId: conversation._id, userId: request.user._id }, { conversationId: conversation._id, userId: recipient._id }])
  }
  response.status(201).json({ conversation: { id: String(conversation._id), kind: conversation.kind, recipient: { id: String(recipient._id), username: recipient.username } } })
})
