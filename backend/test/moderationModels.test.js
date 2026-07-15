import test from 'node:test'
import assert from 'node:assert/strict'
import UserBlock from '../src/models/UserBlock.js'
import ModerationReport from '../src/models/ModerationReport.js'

test('blocks are unique per blocking relationship', () => {
  assert.ok(UserBlock.schema.indexes().some(([fields, options]) => fields.blockerId === 1 && fields.blockedId === 1 && options.unique === true))
})

test('reports constrain moderation context types', () => {
  assert.deepEqual(ModerationReport.schema.path('contextType').enumValues, ['user', 'conversation', 'project'])
})
