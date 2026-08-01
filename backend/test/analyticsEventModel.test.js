import test from 'node:test'
import assert from 'node:assert/strict'
import AnalyticsEvent, { ANALYTICS_EVENT_TYPES, ANALYTICS_SOURCES } from '../src/models/AnalyticsEvent.js'

test('analytics events constrain event types and sources', async () => {
  assert.ok(ANALYTICS_EVENT_TYPES.includes('content_view'))
  assert.ok(ANALYTICS_SOURCES.includes('feed'))
  const event = new AnalyticsEvent({ creatorId: '507f191e810c19729de860ea', contentType: 'project', eventType: 'viewer_identity_exposed', source: 'private_ip' })
  await assert.rejects(event.validate(), /eventType|source/)
})

test('analytics events have creator and content time-series indexes', () => {
  const indexes = AnalyticsEvent.schema.indexes()
  assert.ok(indexes.some(([fields]) => fields.creatorId === 1 && fields.occurredAt === -1))
  assert.ok(indexes.some(([fields]) => fields.creatorId === 1 && fields.contentId === 1 && fields.occurredAt === -1))
})

test('analytics events cap recorded durations', async () => {
  const event = new AnalyticsEvent({ creatorId: '507f191e810c19729de860ea', contentType: 'game', eventType: 'game_session_end', durationMs: 90000000 })
  await assert.rejects(event.validate(), /durationMs/)
})
