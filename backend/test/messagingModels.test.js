import test from 'node:test'
import assert from 'node:assert/strict'
import Message from '../src/models/Message.js'
import ConversationParticipant from '../src/models/ConversationParticipant.js'

test('messages have an idempotency index per conversation', () => {
  assert.ok(Message.schema.indexes().some(([fields, options]) => fields.conversationId === 1 && fields.clientMessageId === 1 && options.unique === true))
})

test('conversation participants are unique per user and conversation', () => {
  assert.ok(ConversationParticipant.schema.indexes().some(([fields, options]) => fields.conversationId === 1 && fields.userId === 1 && options.unique === true))
})
