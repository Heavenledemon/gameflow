import UserBlock from '../models/UserBlock.js'
import AuditLog from '../models/AuditLog.js'

export async function isBlockedBetween(leftId, rightId) {
  if (!leftId || !rightId) return false
  return Boolean(await UserBlock.exists({ $or: [{ blockerId: leftId, blockedId: rightId }, { blockerId: rightId, blockedId: leftId }] }))
}
export function recordAudit(actorId, action, targetType, targetId, metadata = {}) {
  return AuditLog.create({ actorId, action, targetType, targetId: String(targetId), metadata }).catch(() => {})
}
