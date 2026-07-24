import mongoose from 'mongoose'
import asyncHandler from '../middlewares/asyncHandler.js'
import Conversation from '../models/Conversation.js'
import ConversationParticipant from '../models/ConversationParticipant.js'
import Project from '../models/Project.js'
import ProjectMember from '../models/ProjectMember.js'
import { canManageProject, getProjectRole } from '../services/projectAccessService.js'
import { recordAudit } from '../services/moderationService.js'

function error(statusCode, message) { const value = new Error(message); value.statusCode = statusCode; return value }
function memberDto(member) { const user = member.userId; return { userId: String(user?._id || member.userId), username: user?.username || '', name: user?.name || '', avatar: user?.avatar || '', role: member.role, status: member.status, joinedAt: member.joinedAt } }
async function loadProject(projectId) { if (!mongoose.isValidObjectId(projectId)) throw error(400, 'Invalid project ID.'); const project = await Project.findById(projectId); if (!project) throw error(404, 'Project not found.'); return project }
async function requireManager(project, userId) { if (!await canManageProject(project, userId)) throw error(403, 'You cannot manage project members.') }

export const listProjectMembers = asyncHandler(async (request, response) => {
  const project = await loadProject(request.params.projectId)
  if (!await getProjectRole(project, request.user._id)) throw error(403, 'You cannot view this project membership.')
  const members = await ProjectMember.find({ projectId: project._id, status: 'active' }).populate('userId', 'username name avatar').sort({ role: 1, joinedAt: 1 }).lean()
  response.json({ items: members.map(memberDto) })
})

export const listMyCollaborations = asyncHandler(async (request, response) => {
  const rows = await ProjectMember.find({ userId: request.user._id, status: 'active', role: { $ne: 'owner' } })
    .populate('projectId', 'title slug description previewUrl imageUrl videoUrl gameplayGifUrl gameUrl modelUrl category type mode ownerId ownerUsername ownerName ownerAvatar updatedAt createdAt visibility isPublished')
    .sort({ updatedAt: -1 })
    .lean()
  response.json({
    items: rows.filter((row) => row.projectId).map((row) => ({
      projectId: String(row.projectId._id),
      role: row.role,
      project: {
        ...row.projectId,
        id: String(row.projectId._id),
        contentId: String(row.projectId._id),
        contentType: 'project',
        previewUrl: row.projectId.previewUrl || row.projectId.imageUrl || row.projectId.modelUrl || '',
      },
    })),
  })
})

export const updateProjectMember = asyncHandler(async (request, response) => {
  const project = await loadProject(request.params.projectId); await requireManager(project, request.user._id)
  const { userId } = request.params; const role = String(request.body?.role || '')
  if (!mongoose.isValidObjectId(userId) || !['editor', 'contributor', 'viewer'].includes(role)) throw error(400, 'Invalid member or role.')
  const member = await ProjectMember.findOne({ projectId: project._id, userId, status: 'active' })
  if (!member) throw error(404, 'Active project member not found.')
  if (member.role === 'owner') throw error(403, 'The project owner role cannot be changed.')
  if (String(member.userId) === String(request.user._id) && String(project.ownerId) !== String(request.user._id)) throw error(403, 'Editors cannot change their own role.')
  member.role = role; await member.save(); await member.populate('userId', 'username name avatar')
  recordAudit(request.user._id, 'project.member.role_updated', 'projectMember', member._id, { projectId: String(project._id), role })
  response.json({ member: memberDto(member) })
})

export const removeProjectMember = asyncHandler(async (request, response) => {
  const project = await loadProject(request.params.projectId); await requireManager(project, request.user._id)
  const { userId } = request.params
  if (!mongoose.isValidObjectId(userId)) throw error(400, 'Invalid member ID.')
  if (String(project.ownerId) === String(userId)) throw error(403, 'The project owner cannot be removed.')
  const member = await ProjectMember.findOne({ projectId: project._id, userId, status: 'active' })
  if (!member) throw error(404, 'Active project member not found.')
  member.status = 'removed'; member.removedAt = new Date(); await member.save()
  recordAudit(request.user._id, 'project.member.removed', 'projectMember', member._id, { projectId: String(project._id), userId })
  const workspace = await Conversation.findOne({ kind: 'project', projectId: project._id }).select('_id').lean()
  if (workspace) {
    await Promise.all([
      Conversation.updateOne({ _id: workspace._id }, { $pull: { participantIds: userId } }),
      ConversationParticipant.updateOne({ conversationId: workspace._id, userId }, { $set: { hiddenAt: new Date() } }),
    ])
  }
  response.json({ removedUserId: String(userId) })
})
