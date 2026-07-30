import test from 'node:test'
import assert from 'node:assert/strict'
import ProfileFootprint, { FOOTPRINT_LIFETIME_MS, FOOTPRINT_REACTIONS } from '../src/models/ProfileFootprint.js'

test('profile footprints are unique per owner and visitor', () => {
  const indexes = ProfileFootprint.schema.indexes()
  assert.ok(indexes.some(([fields, options]) => fields.ownerId === 1 && fields.visitorId === 1 && options.unique === true))
})

test('profile footprints constrain visitor reactions', async () => {
  assert.deepEqual(FOOTPRINT_REACTIONS, ['stopped_by', 'loved_work', 'inspired', 'following_progress', 'collaboration_interest'])
  const footprint = new ProfileFootprint({ ownerId: '507f191e810c19729de860ea', visitorId: '507f191e810c19729de860eb', reaction: 'free_form_message' })
  await assert.rejects(footprint.validate(), /reaction/)
})

test('profile footprints expire after seven days', () => {
  assert.equal(FOOTPRINT_LIFETIME_MS, 7 * 24 * 60 * 60 * 1000)
  const expiresAt = ProfileFootprint.schema.path('expiresAt')
  assert.equal(expiresAt.options.expires, 0)
  const footprint = new ProfileFootprint({ ownerId: '507f191e810c19729de860ea', visitorId: '507f191e810c19729de860eb', reaction: 'stopped_by' })
  const remaining = footprint.expiresAt.getTime() - Date.now()
  assert.ok(remaining > FOOTPRINT_LIFETIME_MS - 1000 && remaining <= FOOTPRINT_LIFETIME_MS)
})
