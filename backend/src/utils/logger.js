import crypto from 'node:crypto'

function write(level, message, fields = {}) {
  const safeFields = { ...fields }
  delete safeFields.token
  delete safeFields.authorization
  delete safeFields.password
  delete safeFields.fileContents
  process.stdout.write(`${JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...safeFields })}\n`)
}

export function requestId(request) {
  const supplied = String(request.headers['x-request-id'] || '').trim()
  return supplied && /^[A-Za-z0-9._-]{1,100}$/.test(supplied) ? supplied : crypto.randomUUID()
}

export const logger = {
  info: (message, fields) => write('info', message, fields),
  warn: (message, fields) => write('warn', message, fields),
  error: (message, fields) => write('error', message, fields),
}
