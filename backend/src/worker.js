import { connectDatabase, disconnectDatabase } from './config/database.js'
import { startOutboxWorker, stopOutboxWorker } from './realtime/eventPublisher.js'
import { closeRedisClient } from './config/redis.js'
import { logger } from './utils/logger.js'

await connectDatabase()
startOutboxWorker()
logger.info('outbox_worker_started', { pid: process.pid })

async function shutdown(signal) {
  logger.info('outbox_worker_shutdown', { signal })
  stopOutboxWorker()
  await closeRedisClient()
  await disconnectDatabase()
  process.exit(0)
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))

