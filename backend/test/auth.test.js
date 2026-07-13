import test from 'node:test'
import assert from 'node:assert/strict'
import { generateToken, verifyToken } from '../src/utils/generateToken.js'

test('generated tokens verify successfully', () => {
  const token = generateToken({ sub: 'test-user', exp: Date.now() + 60_000 })
  assert.equal(verifyToken(token).sub, 'test-user')
})

test('expired and malformed tokens are rejected', () => {
  assert.equal(verifyToken('not-a-token'), null)
  const token = generateToken({ sub: 'test-user', exp: Date.now() - 1 })
  assert.equal(verifyToken(token), null)
})
