import { requestId, logger } from '../utils/logger.js'

const metrics = { requests: 0, errors: 0, uploads: 0, sockets: 0 }

export function getMetrics() {
  return { ...metrics, uptimeSeconds: Math.round(process.uptime()) }
}

export function observabilityMiddleware(request, response, next) {
  const id = requestId(request)
  const startedAt = Date.now()
  request.requestId = id
  response.setHeader('X-Request-Id', id)
  metrics.requests += 1

  response.on('finish', () => {
    if (response.statusCode >= 400) metrics.errors += 1
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
export function recordSocketMetric() { metrics.sockets += 1 }
