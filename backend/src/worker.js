import { connectDatabase, disconnectDatabase } from './config/database.js'
import { startOutboxWorker, stopOutboxWorker } from './realtime/eventPublisher.js'
import { closeRedisClient } from './config/redis.js'
import { logger } from './utils/logger.js'
import { purgeExpiredWorkspaceData } from './services/workspaceCleanup.js'

await connectDatabase()
startOutboxWorker()
logger.info('outbox_worker_started', { pid: process.pid })
const cleanupInterval = setInterval(() => purgeExpiredWorkspaceData().catch((error) => logger.error('workspace_cleanup_failed', { message: error.message })), 60 * 60 * 1000)
cleanupInterval.unref()
purgeExpiredWorkspaceData().catch((error) => logger.error('workspace_cleanup_failed', { message: error.message }))

async function shutdown(signal) {
  logger.info('outbox_worker_shutdown', { signal })
  stopOutboxWorker()
  clearInterval(cleanupInterval)
  await closeRedisClient()
  await disconnectDatabase()
  process.exit(0)
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))
