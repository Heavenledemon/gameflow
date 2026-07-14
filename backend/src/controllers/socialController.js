import mongoose from 'mongoose'
import asyncHandler from '../middlewares/asyncHandler.js'
import CollaborationRequest from '../models/CollaborationRequest.js'
import Follow from '../models/Follow.js'
import Project from '../models/Project.js'
import User from '../models/User.js'

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

export const createCollaborationRequest = asyncHandler(async (request, response) => {
  const { projectId } = request.params
  const { recipientId, message = '' } = request.body ?? {}
  if (!mongoose.isValidObjectId(projectId) || !mongoose.isValidObjectId(recipientId)) throw createError(400, 'Invalid project or collaborator ID.')
  if (String(recipientId) === String(request.user._id)) throw createError(400, 'You cannot send a collaboration request to yourself.')
  if (String(message).trim().length > 500) throw createError(400, 'Collaboration message must be 500 characters or fewer.')

  const project = await Project.findById(projectId).lean()
  if (!project) throw createError(404, 'Project not found.')
  if (String(project.ownerId) !== String(request.user._id)) throw createError(403, 'Only the project owner can invite collaborators.')
  if (!await User.exists({ _id: recipientId })) throw createError(404, 'Collaborator not found.')

  const connected = await Follow.exists({
    $or: [
      { followerId: request.user._id, followingId: recipientId },
      { followerId: recipientId, followingId: request.user._id },
    ],
  })
  if (!connected) throw createError(403, 'You can invite only people you follow or who follow you.')

  const requestRecord = await CollaborationRequest.findOneAndUpdate(
    { projectId: project._id, requesterId: request.user._id, recipientId },
    { $set: { message: String(message).trim(), status: 'pending' } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
  response.status(201).json({ request: { id: String(requestRecord._id), projectId: String(project._id), recipientId: String(recipientId), status: requestRecord.status, message: requestRecord.message } })
})
