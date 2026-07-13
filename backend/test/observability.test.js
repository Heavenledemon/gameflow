import test from 'node:test'
import assert from 'node:assert/strict'
import { requestId } from '../src/utils/logger.js'

test('request IDs accept safe supplied values', () => {
  assert.equal(requestId({ headers: { 'x-request-id': 'safe-request-1' } }), 'safe-request-1')
})

test('request IDs replace unsafe supplied values', () => {
  const id = requestId({ headers: { 'x-request-id': 'bad value;secret' } })
  assert.match(id, /^[0-9a-f-]{36}$/)
})
