import { connectDatabase, disconnectDatabase } from '../config/database.js'
import AuditLog from '../models/AuditLog.js'
import Message from '../models/Message.js'

const auditRetentionDays = Number(process.env.AUDIT_RETENTION_DAYS || 365)
const deletedMessageRetentionDays = Number(process.env.DELETED_MESSAGE_RETENTION_DAYS || 30)

try {
  await connectDatabase()
  const now = Date.now()
  const [audits, messages] = await Promise.all([
    AuditLog.deleteMany({ createdAt: { $lt: new Date(now - auditRetentionDays * 86400000) } }),
    Message.deleteMany({ deletedAt: { $ne: null, $lt: new Date(now - deletedMessageRetentionDays * 86400000) } }),
  ])
  console.log(`Retention purge completed: ${audits.deletedCount} audit logs, ${messages.deletedCount} deleted messages.`)
} catch (error) {
  console.error('Retention purge failed:', error)
  process.exitCode = 1
} finally { await disconnectDatabase().catch(() => {}) }
