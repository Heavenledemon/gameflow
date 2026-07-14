import { createClient } from 'redis'
import env from './env.js'
import { logger } from '../utils/logger.js'

let client = null
let connecting = null

export async function getRedisClient() {
  if (!env.redisUrl) return null
  if (client?.isReady) return client

  if (!client) {
    client = createClient({ url: env.redisUrl })
    client.on('error', (error) => logger.warn('redis_client_error', { error: error.message }))
  }

  if (!connecting) {
    connecting = client.connect().catch((error) => {
      connecting = null
      logger.warn('redis_connection_failed', { error: error.message })
      throw error
    })
  }

  await connecting
  return client
}

export async function getRedisReadiness() {
  if (!env.redisUrl) return { configured: false, ready: false }
  try {
    const redis = await getRedisClient()
    const pong = await redis.ping()
    return { configured: true, ready: pong === 'PONG' }
  } catch {
    return { configured: true, ready: false }
  }
}

export async function closeRedisClient() {
  if (client?.isOpen) await client.quit().catch(() => {})
  client = null
  connecting = null
}

