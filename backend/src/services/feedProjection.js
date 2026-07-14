import crypto from 'node:crypto'
import FeedItem from '../models/FeedItem.js'
import RealtimeOutbox from '../models/RealtimeOutbox.js'

function legacyEngagement(engagement = {}) {
  return {
    likesCount: Number(engagement.likesCount || 0),
    commentsCount: Number(engagement.commentsCount || 0),
    savesCount: Number(engagement.savesCount || 0),
    sharesCount: Number(engagement.sharesCount || 0),
  }
}

function projectDocument(project) {
  return {
    feedId: `project:${project._id}`,
    contentType: 'project', contentId: String(project._id),
    visibility: project.visibility, isPublished: project.isPublished,
    publishedAt: project.publishedAt || project.createdAt || new Date(), rank: 0,
    creator: { id: String(project.ownerId), username: project.ownerUsername || '', name: project.ownerName || '', avatarUrl: project.ownerAvatar || '' },
    title: project.title, description: project.description || '', tags: project.tags || [], software: project.software || [], mode: project.mode || 'landscape',
    media: { kind: project.type, posterUrl: project.previewUrl || '', manifestUrl: project.gameUrl || '', modelUrl: project.modelUrl || '', imageUrl: project.imageUrl || '', background: '' },
    engagement: legacyEngagement(project.engagement),
  }
}

function gameDocument(game) {
  return {
    feedId: `game:${game._id}`, contentType: 'game', contentId: String(game._id), visibility: 'public', isPublished: game.isPublished,
    publishedAt: game.publishedAt || game.createdAt || new Date(), rank: Number(game.displayOrder || 0),
    creator: { id: '', username: '', name: '', avatarUrl: '' }, title: game.title, description: game.description || '', tags: [], software: [], mode: game.mode || 'landscape',
    media: { kind: 'game', posterUrl: game.loadingScreenUrl || '', manifestUrl: game.gameUrl || '', modelUrl: '', imageUrl: '', background: '' }, engagement: legacyEngagement(game.engagement),
  }
}

function assetDocument(asset) {
  return {
    feedId: `asset:${asset._id}`, contentType: 'asset', contentId: String(asset._id), visibility: 'public', isPublished: asset.isPublished,
    publishedAt: asset.publishedAt || asset.createdAt || new Date(), rank: Number(asset.displayOrder || 0),
    creator: { id: '', username: '', name: '', avatarUrl: '' }, title: asset.title, description: asset.description || '', tags: [], software: [], mode: asset.mode || 'landscape',
    media: { kind: '3d', posterUrl: '', manifestUrl: '', modelUrl: asset.modelUrl || '', imageUrl: '', background: asset.background || '' }, engagement: legacyEngagement(asset.engagement),
  }
}

export async function upsertFeedProjection(contentType, document) {
  const projection = contentType === 'project' ? projectDocument(document) : contentType === 'game' ? gameDocument(document) : assetDocument(document)
  const existing = await FeedItem.findOne({ feedId: projection.feedId }).select('version').lean()
  projection.version = Number(existing?.version || 0) + 1
  await FeedItem.findOneAndUpdate({ feedId: projection.feedId }, { $set: projection }, { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true })
  await RealtimeOutbox.create({ eventId: crypto.randomUUID(), eventType: 'feed.projection.upserted', aggregateId: projection.feedId, payload: { feedId: projection.feedId, contentType, contentId: projection.contentId, version: projection.version } })
}

export async function removeFeedProjection(contentType, contentId) {
  const feedId = `${contentType}:${contentId}`
  await FeedItem.deleteOne({ feedId })
  await RealtimeOutbox.create({ eventId: crypto.randomUUID(), eventType: 'feed.projection.deleted', aggregateId: feedId, payload: { feedId, contentType, contentId: String(contentId) } })
}
