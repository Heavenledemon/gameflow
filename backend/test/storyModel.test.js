import test from 'node:test'
import assert from 'node:assert/strict'
import Story from '../src/models/Story.js'

test('stories expire and constrain supported media types', () => {
  const expiresIndex = Story.schema.indexes().find(([fields]) => fields.expiresAt === 1)
  assert.ok(expiresIndex)
  assert.equal(Story.schema.path('mediaType').enumValues.includes('image'), true)
  assert.equal(Story.schema.path('mediaType').enumValues.includes('video'), true)
  assert.equal(Story.schema.path('caption').options.maxlength, 280)
})
