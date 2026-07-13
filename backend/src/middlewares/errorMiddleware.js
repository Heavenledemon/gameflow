export function notFound(request, _response, next) {
  const error = new Error(`Route not found: ${request.originalUrl}`)
  error.statusCode = 404
  next(error)
}

import { logger } from '../utils/logger.js'

export function errorHandler(error, request, response, _next) {
  const statusCode = error.statusCode || 500
  const message =
    statusCode === 500
      ? 'Something went wrong while handling the request.'
      : error.message

  if (statusCode === 500) {
    logger.error('request_error', { requestId: request.requestId, error: error.message, stack: error.stack })
  }

  response.status(statusCode).json({ message })
}
