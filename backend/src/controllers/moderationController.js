import mongoose from 'mongoose'
import asyncHandler from '../middlewares/asyncHandler.js'
import ModerationReport from '../models/ModerationReport.js'
import UserBlock from '../models/UserBlock.js'
import User from '../models/User.js'
import { recordAudit } from '../services/moderationService.js'
function error(statusCode, message) { const value = new Error(message); value.statusCode = statusCode; return value }
export const toggleBlock = asyncHandler(async (request, response) => {
  const { userId } = request.params
  if (!mongoose.isValidObjectId(userId) || String(userId) === String(request.user._id)) throw error(400, 'Invalid block target.')
  if (!await User.exists({ _id: userId })) throw error(404, 'User not found.')
  const existing = await UserBlock.findOne({ blockerId: request.user._id, blockedId: userId })
  if (existing) { await existing.deleteOne(); await recordAudit(request.user._id, 'user.unblocked', 'user', userId); return response.json({ blocked: false }) }
  await UserBlock.create({ blockerId: request.user._id, blockedId: userId }); await recordAudit(request.user._id, 'user.blocked', 'user', userId)
  response.status(201).json({ blocked: true })
})
export const createReport = asyncHandler(async (request, response) => {
  const { targetUserId, reason, contextType = 'user', contextId = '' } = request.body ?? {}
  if (!mongoose.isValidObjectId(targetUserId) || String(targetUserId) === String(request.user._id)) throw error(400, 'Invalid report target.')
  if (!String(reason || '').trim() || String(reason).trim().length > 500) throw error(400, 'A report reason of up to 500 characters is required.')
  if (!['user', 'conversation', 'project'].includes(contextType)) throw error(400, 'Invalid report context.')
  const report = await ModerationReport.create({ reporterId: request.user._id, targetUserId, reason: String(reason).trim(), contextType, contextId: String(contextId).trim() })
  await recordAudit(request.user._id, 'report.created', contextType, contextId || targetUserId, { reportId: String(report._id) })
  response.status(201).json({ reportId: String(report._id) })
})
