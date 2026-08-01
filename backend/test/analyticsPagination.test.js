import test from 'node:test'
import assert from 'node:assert/strict'
import { decodeContentCursor, paginateAnalyticsContent } from '../src/controllers/analyticsController.js'

const items = [
  { id: '1', title: 'One', views: 8, interactions: 2, publishedAt: '2026-07-01T00:00:00.000Z' },
  { id: '2', title: 'Two', views: 20, interactions: 1, publishedAt: '2026-07-02T00:00:00.000Z' },
  { id: '3', title: 'Three', views: 8, interactions: 9, publishedAt: '2026-07-03T00:00:00.000Z' },
]

test('analytics content pagination uses stable metric ordering', () => {
  const first = paginateAnalyticsContent(items, { period: '30d', sort: 'views', limit: 2 })
  assert.deepEqual(first.items.map((item) => item.id), ['2', '3'])
  assert.equal(first.hasMore, true)
  const cursor = decodeContentCursor(first.nextCursor)
  const second = paginateAnalyticsContent(items, { period: '30d', sort: 'views', limit: 2, cursor })
  assert.deepEqual(second.items.map((item) => item.id), ['1'])
  assert.equal(second.nextCursor, null)
})

test('analytics content pagination supports newest ordering', () => {
  const page = paginateAnalyticsContent(items, { period: '7d', sort: 'newest', limit: 3 })
  assert.deepEqual(page.items.map((item) => item.id), ['3', '2', '1'])
})

test('invalid analytics cursors are rejected by the decoder', () => {
  assert.equal(decodeContentCursor('not-a-cursor'), null)
  assert.equal(decodeContentCursor(''), null)
})
