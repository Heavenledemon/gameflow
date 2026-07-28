import test from 'node:test'
import assert from 'node:assert/strict'
import Message from '../src/models/Message.js'
import ProjectFile from '../src/models/ProjectFile.js'

test('workspace assets support private visibility, uploader attribution, and soft deletion', () => {
  assert.deepEqual(ProjectFile.schema.path('visibility').enumValues, ['workspace-private', 'published'])
  assert.ok(ProjectFile.schema.path('uploadedById'))
  assert.ok(ProjectFile.schema.path('deletedAt'))
  assert.ok(ProjectFile.schema.path('purgeAfter'))
  assert.ok(ProjectFile.schema.indexes().some(([fields, options]) => fields.projectId === 1 && fields.relativePath === 1 && options.unique === true && options.partialFilterExpression?.status === 'ready'))
})

test('messages accept typed project asset references', () => {
  assert.deepEqual(Message.schema.path('attachments').schema.path('type').enumValues, ['project_asset'])
  assert.ok(Message.schema.path('attachments').schema.path('assetId'))
  assert.ok(Message.schema.path('attachments').schema.path('projectId'))
})
