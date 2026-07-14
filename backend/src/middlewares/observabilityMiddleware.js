import { requestId, logger } from '../utils/logger.js'

const metrics = {
  requests: 0,
  errors: 0,
  uploads: 0,
  sockets: 0,
  feed: { requests: 0, errors: 0, bytes: 0, durationsMs: [] },
  mongo: { queries: 0, durationsMs: [] },
  rateLimits: {},
  outbox: { pending: 0, oldestPendingAgeMs: 0 },
}

const MAX_SAMPLES = 512
const addSample = (samples, value) => {
  samples.push(value)
  if (samples.length > MAX_SAMPLES) samples.shift()
}
const percentile = (samples, value) => {
  if (!samples.length) return 0
  const sorted = [...samples].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.ceil((value / 100) * sorted.length) - 1)]
}

export function getMetrics() {
  return {
    ...metrics,
    feed: { ...metrics.feed, p50Ms: percentile(metrics.feed.durationsMs, 50), p95Ms: percentile(metrics.feed.durationsMs, 95), p99Ms: percentile(metrics.feed.durationsMs, 99) },
    mongo: { ...metrics.mongo, p50Ms: percentile(metrics.mongo.durationsMs, 50), p95Ms: percentile(metrics.mongo.durationsMs, 95), p99Ms: percentile(metrics.mongo.durationsMs, 99) },
    uptimeSeconds: Math.round(process.uptime()),
  }
}

export function observabilityMiddleware(request, response, next) {
  const id = requestId(request)
  const startedAt = Date.now()
  request.requestId = id
  response.setHeader('X-Request-Id', id)
  metrics.requests += 1

  response.on('finish', () => {
    if (response.statusCode >= 400) metrics.errors += 1
    if (request.path === '/api/content' || request.path === '/content') {
      const durationMs = Date.now() - startedAt
      metrics.feed.requests += 1
      if (response.statusCode >= 400) metrics.feed.errors += 1
      metrics.feed.bytes += Number(response.getHeader('Content-Length') || 0)
      addSample(metrics.feed.durationsMs, durationMs)
    }
    logger.info('http_request', {
      requestId: id,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
      userId: request.user?._id ? String(request.user._id) : undefined,
    })
  })
  next()
}

export function recordUploadMetric() { metrics.uploads += 1 }
export function recordSocketMetric(delta = 1) { metrics.sockets = Math.max(0, metrics.sockets + delta) }
export function recordMongoMetric(durationMs) { metrics.mongo.queries += 1; addSample(metrics.mongo.durationsMs, durationMs) }
export function recordRateLimitMetric(bucket, outcome) {
  metrics.rateLimits[bucket] ??= { allowed: 0, blocked: 0, unavailable: 0 }
  metrics.rateLimits[bucket][outcome] += 1
}
export function recordOutboxMetric(pending, oldestPendingAgeMs) {
  metrics.outbox.pending = pending
  metrics.outbox.oldestPendingAgeMs = oldestPendingAgeMs
}
