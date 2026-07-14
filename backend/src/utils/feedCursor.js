const CURSOR_VERSION = 1

export function encodeFeedCursor(item) {
  const value = {
    v: CURSOR_VERSION,
    publishedAt: new Date(item.publishedAt).toISOString(),
    id: String(item._id),
  }
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

export function decodeFeedCursor(cursor) {
  if (!cursor) return null
  try {
    const value = JSON.parse(Buffer.from(String(cursor), 'base64url').toString('utf8'))
    const publishedAt = new Date(value?.publishedAt)
    if (value?.v !== CURSOR_VERSION || Number.isNaN(publishedAt.getTime()) || !/^[a-f\d]{24}$/i.test(String(value?.id))) {
      throw new Error('invalid')
    }
    return { publishedAt, id: String(value.id) }
  } catch {
    const error = new Error('Invalid feed cursor.')
    error.statusCode = 400
    throw error
  }
}

export function clampFeedLimit(value) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) return 12
  return Math.min(20, Math.max(1, parsed))
}

