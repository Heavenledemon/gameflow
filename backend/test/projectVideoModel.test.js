import test from 'node:test'
import assert from 'node:assert/strict'
import Project from '../src/models/Project.js'

test('Project supports video projects and stores their media URL', () => {
  assert.equal(Project.schema.path('type').enumValues.includes('video'), true)
  assert.ok(Project.schema.path('videoUrl'))
  assert.equal(Project.schema.path('videoUrl').defaultValue, '')
})
