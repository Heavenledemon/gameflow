import test from 'node:test'
import assert from 'node:assert/strict'
import { clampFeedLimit, decodeFeedCursor, encodeFeedCursor } from '../src/utils/feedCursor.js'

const id = '6a42748aec0bf3ccee3837bd'

test('feed cursor round-trips stable sort keys', () => {
  const cursor = encodeFeedCursor({ _id: id, publishedAt: new Date('2026-07-14T10:00:00.000Z') })
  const decoded = decodeFeedCursor(cursor)
  assert.equal(decoded.id, id)
  assert.equal(decoded.publishedAt.toISOString(), '2026-07-14T10:00:00.000Z')
})

test('feed cursor rejects malformed values', () => {
  assert.throws(() => decodeFeedCursor('not-a-cursor'), { message: 'Invalid feed cursor.' })
})

test('feed limit is bounded', () => {
  assert.equal(clampFeedLimit(undefined), 12)
  assert.equal(clampFeedLimit('0'), 1)
  assert.equal(clampFeedLimit('99'), 20)
  assert.equal(clampFeedLimit('7'), 7)
})
