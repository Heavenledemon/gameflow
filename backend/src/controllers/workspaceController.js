import mongoose from 'mongoose'
import path from 'node:path'
import asyncHandler from '../middlewares/asyncHandler.js'
import env from '../config/env.js'
import Conversation from '../models/Conversation.js'
import ConversationParticipant from '../models/ConversationParticipant.js'
import Project from '../models/Project.js'
import ProjectFile from '../models/ProjectFile.js'
import ProjectMember from '../models/ProjectMember.js'
import { createPresignedGetUrl, objectStorageReady } from '../services/objectStorage.js'
import { canManageProjectAssets, canUploadProjectAssets, canUseProjectChat, canViewProjectAssets, getProjectRole } from '../services/projectAccessService.js'

const error = (statusCode, message) => { const value = new Error(message); value.statusCode = statusCode; return value }
const validId = (value) => mongoose.isValidObjectId(value)

async function loadProject(projectId) {
  if (!validId(projectId)) throw error(400, 'Invalid project ID.')
  const project = await Project.findById(projectId).lean()
  if (!project) throw error(404, 'Project not found.')
  return project
}

async function requireAssetViewer(project, userId) {
  const role = await getProjectRole(project, userId)
  if (!role || !await canViewProjectAssets(project, userId)) throw error(403, 'You cannot access this project workspace.')
  return role
}

function fileDto(file) {
  const uploader = file.uploadedById
  return {
    id: String(file._id), projectId: String(file.projectId), name: file.name, relativePath: file.relativePath,
    mimeType: file.mimeType || '', size: Number(file.size || 0), checksum: file.checksum, version: file.version,
    status: file.status, visibility: file.visibility || 'workspace-private', createdAt: file.createdAt, updatedAt: file.updatedAt,
    deletedAt: file.deletedAt || null, purgeAfter: file.purgeAfter || null,
    uploader: uploader && typeof uploader === 'object' ? { id: String(uploader._id), username: uploader.username || '', name: uploader.name || '', avatar: uploader.avatar || '' } : null,
  }
}

async function usageFor(project, ownerId) {
  const [projectRows, userRows] = await Promise.all([
    ProjectFile.aggregate([{ $match: { projectId: project._id, status: 'ready' } }, { $group: { _id: null, bytes: { $sum: '$size' }, files: { $sum: 1 } } }]),
    ProjectFile.aggregate([{ $match: { ownerId: new mongoose.Types.ObjectId(ownerId), status: 'ready' } }, { $group: { _id: null, bytes: { $sum: '$size' } } }]),
  ])
  return {
    projectBytes: Number(projectRows[0]?.bytes || 0), projectFiles: Number(projectRows[0]?.files || 0), projectLimitBytes: env.workspaceMaxProjectBytes,
    userBytes: Number(userRows[0]?.bytes || 0), userLimitBytes: env.workspaceMaxUserBytes, fileLimitBytes: env.workspaceMaxFileBytes,
    fileCountLimit: env.workspaceMaxProjectFiles,
  }
}

async function ensureProjectConversation(project, userId) {
  if (!await canUseProjectChat(project, userId)) return null
  let conversation = await Conversation.findOne({ kind: 'project', projectId: project._id })
  if (!conversation) {
    try {
      conversation = await Conversation.create({ kind: 'project', projectId: project._id, participantIds: [project.ownerId], createdBy: project.ownerId, lastMessageAt: new Date(), lastMessagePreview: 'Project chat is ready.' })
    } catch (creationError) {
      if (creationError?.code !== 11000) throw creationError
      conversation = await Conversation.findOne({ kind: 'project', projectId: project._id })
    }
  }
  const chatMembers = await ProjectMember.find({ projectId: project._id, status: 'active', role: { $in: ['owner', 'editor', 'contributor'] } }).select('userId').lean()
  const participantIds = [...new Set([String(project.ownerId), ...chatMembers.map((member) => String(member.userId))])]
  await Promise.all([
    Conversation.updateOne({ _id: conversation._id }, { $addToSet: { participantIds: { $each: participantIds } } }),
    ...participantIds.map((participantId) => ConversationParticipant.updateOne(
      { conversationId: conversation._id, userId: participantId },
      { $set: { hiddenAt: null }, $setOnInsert: { conversationId: conversation._id, userId: participantId } },
      { upsert: true },
    )),
  ])
  return conversation
}

export const getWorkspace = asyncHandler(async (request, response) => {
  const project = await loadProject(request.params.projectId)
  const role = await requireAssetViewer(project, request.user._id)
  const [members, assetsCount, usage, conversation] = await Promise.all([
    ProjectMember.countDocuments({ projectId: project._id, status: 'active' }),
    ProjectFile.countDocuments({ projectId: project._id, status: 'ready' }),
    usageFor(project, project.ownerId),
    ensureProjectConversation(project, request.user._id),
  ])
  response.json({
    workspace: {
      project: { id: String(project._id), title: project.title, previewUrl: project.previewUrl || project.imageUrl || project.modelUrl || '', type: project.type, visibility: project.visibility, isPublished: project.isPublished },
      role, permissions: {
        canUseChat: await canUseProjectChat(project, request.user._id),
        canUploadAssets: await canUploadProjectAssets(project, request.user._id),
        canManageAssets: await canManageProjectAssets(project, request.user._id),
        canDownloadAssets: true,
      },
      conversationId: conversation ? String(conversation._id) : null,
      counts: { members, assets: assetsCount }, usage,
    },
  })
})

export const listWorkspaceAssets = asyncHandler(async (request, response) => {
  const project = await loadProject(request.params.projectId)
  await requireAssetViewer(project, request.user._id)
  const requestedDeleted = request.query.status === 'deleted'
  if (requestedDeleted && !await canManageProjectAssets(project, request.user._id)) throw error(403, 'You cannot view deleted project assets.')
  const includeDeleted = requestedDeleted
  const search = String(request.query.q || '').trim()
  const query = { projectId: project._id, status: includeDeleted ? 'deleted' : 'ready' }
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { relativePath: { $regex: search, $options: 'i' } }]
  const rows = await ProjectFile.find(query).populate('uploadedById', 'username name avatar').sort({ updatedAt: -1 }).limit(200).lean()
  response.json({ items: rows.map(fileDto), usage: await usageFor(project, project.ownerId) })
})

export const getAssetDownloadUrl = asyncHandler(async (request, response) => {
  const project = await loadProject(request.params.projectId)
  await requireAssetViewer(project, request.user._id)
  const file = await ProjectFile.findOne({ _id: request.params.assetId, projectId: project._id, status: 'ready' }).lean()
  if (!file) throw error(404, 'Asset not found.')
  const url = objectStorageReady() && file.storageKey ? createPresignedGetUrl(file.storageKey) : file.url
  if (!url) throw error(503, 'This asset is temporarily unavailable.')
  response.json({ url, expiresInSeconds: objectStorageReady() ? env.privateUrlExpiresSeconds : null, fileName: path.posix.basename(file.relativePath) })
})

export const deleteWorkspaceAsset = asyncHandler(async (request, response) => {
  const project = await loadProject(request.params.projectId)
  if (!await canManageProjectAssets(project, request.user._id)) throw error(403, 'You cannot delete project assets.')
  const file = await ProjectFile.findOne({ _id: request.params.assetId, projectId: project._id, status: 'ready' })
  if (!file) throw error(404, 'Asset not found.')
  file.status = 'deleted'; file.deletedAt = new Date(); file.purgeAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); await file.save()
  response.json({ asset: fileDto(file) })
})

export const restoreWorkspaceAsset = asyncHandler(async (request, response) => {
  const project = await loadProject(request.params.projectId)
  if (!await canManageProjectAssets(project, request.user._id)) throw error(403, 'You cannot restore project assets.')
  const file = await ProjectFile.findOne({ _id: request.params.assetId, projectId: project._id, status: 'deleted' })
  if (!file) throw error(404, 'Deleted asset not found.')
  const conflict = await ProjectFile.exists({ projectId: project._id, relativePath: file.relativePath, status: 'ready' })
  if (conflict) throw error(409, 'An active asset already uses this path.')
  file.status = 'ready'; file.deletedAt = null; file.purgeAfter = null; await file.save()
  response.json({ asset: fileDto(file) })
})
