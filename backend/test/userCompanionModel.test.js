import test from 'node:test'
import assert from 'node:assert/strict'
import User from '../src/models/User.js'

test('user profiles accept every companion exposed by the frontend', async () => {
  const companionTypes = User.schema.path('companionType').enumValues

  assert.ok(companionTypes.includes('moonlight-owl'))

  const user = new User({
    email: 'owl@example.com',
    username: 'moonlight-owl-user',
    name: 'Moonlight Owl User',
    password: 'not-used-by-validation',
    companionType: 'moonlight-owl',
  })

  await user.validate()
})
