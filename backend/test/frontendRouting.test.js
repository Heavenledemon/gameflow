import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import test from 'node:test'
import app from '../src/app.js'

const repositoryRoot = path.resolve(process.cwd(), '..')
const mobileIndex = path.join(repositoryRoot, 'game-flow-ui', 'dist', 'index.html')
const webIndex = path.join(repositoryRoot, 'game-flow-web', 'dist', 'index.html')
const buildsAvailable = existsSync(mobileIndex) && existsSync(webIndex)

async function withServer(run) {
  const server = http.createServer(app)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  try {
    return await run(`http://127.0.0.1:${server.address().port}`)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

test('device-aware frontend routing serves the selected shell and preserves API responses', { skip: !buildsAvailable && 'Run npm run build:clients before frontend route tests.' }, async () => {
  await withServer(async (origin) => {
    const mobileRoot = await fetch(`${origin}/`, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile' } })
    const desktopRoot = await fetch(`${origin}/`, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
    const unknownRoot = await fetch(`${origin}/`, { redirect: 'manual', headers: { 'User-Agent': 'GameFlowTestBot/1.0' } })
    assert.equal(mobileRoot.status, 302)
    assert.equal(mobileRoot.headers.get('location'), '/m')
    assert.match(mobileRoot.headers.get('vary') ?? '', /User-Agent/i)
    assert.match(mobileRoot.headers.get('cache-control') ?? '', /no-store/)
    assert.equal(desktopRoot.headers.get('location'), '/web')
    assert.equal(unknownRoot.headers.get('location'), '/web')

    const mobileDeepLink = await fetch(`${origin}/m/app/project/any-project`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } })
    const webDeepLink = await fetch(`${origin}/web/app/project/any-project`, { headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile' } })
    assert.equal(mobileDeepLink.status, 200)
    assert.equal(webDeepLink.status, 200)
    assert.match(mobileDeepLink.headers.get('content-type') ?? '', /text\/html/)
    assert.match(webDeepLink.headers.get('content-type') ?? '', /text\/html/)
    assert.match(await mobileDeepLink.text(), /<div id="root"><\/div>/)
    assert.match(await webDeepLink.text(), /<div id="root"><\/div>/)

    const webHtml = readFileSync(webIndex, 'utf8')
    const assetPath = webHtml.match(/(?:src|href)="(\/web\/assets\/[^\"]+)"/)?.[1]
    assert.ok(assetPath, 'web build should contain a hashed asset path')
    const asset = await fetch(`${origin}${assetPath}`)
    assert.equal(asset.status, 200)
    assert.match(asset.headers.get('cache-control') ?? '', /immutable/)

    const unityBuild = await fetch(`${origin}/m/games/Money%20Ladder/Build/New%20WebGL%20Build.framework.js.br`)
    assert.equal(unityBuild.status, 200)
    assert.equal(unityBuild.headers.get('content-encoding'), 'br')
    assert.match(unityBuild.headers.get('content-type') ?? '', /javascript/)

    const api = await fetch(`${origin}/api/health`)
    assert.equal(api.status, 200)
    assert.match(api.headers.get('content-type') ?? '', /application\/json/)
    assert.doesNotMatch(await api.text(), /<div id="root">/)
  })
})
