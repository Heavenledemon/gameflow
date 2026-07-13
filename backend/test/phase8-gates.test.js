import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('runtime log artifacts are not tracked by project rules', () => {
  const ignore = fs.readFileSync(path.join(process.cwd(), '..', '.gitignore'), 'utf8')
  assert.match(ignore, /\*\.log/)
  assert.match(ignore, /uploads\//)
})

test('production configuration does not use the development auth secret', () => {
  const env = fs.readFileSync(path.join(process.cwd(), 'src/config/env.js'), 'utf8')
  assert.match(env, /AUTH_TOKEN_SECRET/)
})
