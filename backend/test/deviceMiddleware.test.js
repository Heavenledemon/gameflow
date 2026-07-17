import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveDeviceClass } from '../src/middlewares/deviceMiddleware.js'

test('mobile user agents resolve to the mobile shell', () => {
  assert.equal(
    resolveDeviceClass('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'),
    'mobile',
  )
  assert.equal(
    resolveDeviceClass('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36'),
    'mobile',
  )
})

test('desktop and unknown user agents resolve to the web shell', () => {
  assert.equal(resolveDeviceClass('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0'), 'desktop')
  assert.equal(resolveDeviceClass(''), 'desktop')
  assert.equal(resolveDeviceClass(undefined), 'desktop')
})
