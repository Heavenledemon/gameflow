import test from 'node:test'
import assert from 'node:assert/strict'
import ProjectMember from '../src/models/ProjectMember.js'

test('project members enforce one membership per project/user pair', () => {
  const indexes = ProjectMember.schema.indexes()
  assert.ok(indexes.some(([fields, options]) => fields.projectId === 1 && fields.userId === 1 && options.unique === true))
})

test('project member roles and statuses are constrained', () => {
  assert.deepEqual(ProjectMember.schema.path('role').enumValues, ['owner', 'editor', 'contributor', 'viewer'])
  assert.deepEqual(ProjectMember.schema.path('status').enumValues, ['active', 'removed'])
})
