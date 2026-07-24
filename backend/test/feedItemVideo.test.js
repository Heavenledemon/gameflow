import test from 'node:test'
import assert from 'node:assert/strict'
import FeedItem from '../src/models/FeedItem.js'

test('feed items retain projected video URLs', () => {
  assert.ok(FeedItem.schema.path('media.videoUrl'))
  const item = new FeedItem({
    feedId: 'project:video-test',
    contentType: 'project',
    contentId: 'video-test',
    publishedAt: new Date(),
    title: 'Video test',
    media: { kind: 'video', videoUrl: '/api/uploads/projects/test/clip.mp4' },
  })
  assert.equal(item.media.videoUrl, '/api/uploads/projects/test/clip.mp4')
})
