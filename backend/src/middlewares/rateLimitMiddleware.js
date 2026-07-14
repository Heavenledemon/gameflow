import env from '../config/env.js'
import { getRedisClient } from '../config/redis.js'
import { recordRateLimitMetric } from './observabilityMiddleware.js'

export function redisRateLimit({ bucket, limit, windowSeconds }) {
  return async (request, response, next) => {
    const userId = request.user?._id ? String(request.user._id) : ''
    if (!userId) return next()

    let redis
    try {
      redis = await getRedisClient()
    } catch (error) {
      if (env.nodeEnv === 'production') {
        recordRateLimitMetric(bucket, 'unavailable')
        return response.status(503).json({ message: 'Rate limiting is temporarily unavailable. Please retry shortly.' })
      }
      return next()
    }

    if (!redis) return next()

    try {
      const key = `rate-limit:${bucket}:${userId}`
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, windowSeconds)
      const retryAfter = Math.max(1, await redis.ttl(key))

      if (count > limit) {
        recordRateLimitMetric(bucket, 'blocked')
        response.setHeader('Retry-After', String(retryAfter))
        return response.status(429).json({ message: 'Too many requests. Please retry later.', retryAfter })
      }

      recordRateLimitMetric(bucket, 'allowed')
      return next()
    } catch (error) {
      if (env.nodeEnv === 'production') {
        recordRateLimitMetric(bucket, 'unavailable')
        return response.status(503).json({ message: 'Rate limiting is temporarily unavailable. Please retry shortly.' })
      }
      return next()
    }
  }
}

