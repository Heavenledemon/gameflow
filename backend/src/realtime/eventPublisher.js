import crypto from 'node:crypto'
import RealtimeOutbox from '../models/RealtimeOutbox.js'
import FeedItem from '../models/FeedItem.js'
import { recordOutboxMetric } from '../middlewares/observabilityMiddleware.js'
import { getRedisClient } from '../config/redis.js'
import env from '../config/env.js'

export const REALTIME_STREAM = 'gameflow:realtime:events'
const LEASE_MS = 30000
let workerTimer = null
let ioInstance = null
let workerRunning = false
const workerOwner = `worker:${process.pid}:${crypto.randomUUID()}`

export function attachEventPublisher(io) { ioInstance = io }

export async function publishProjectEngagement(projectId, engagement) {
  const event = {
    eventId: crypto.randomUUID(), eventType: 'project.engagement.updated', schemaVersion: 1,
    aggregateId: String(projectId), aggregateVersion: Date.now(), occurredAt: new Date().toISOString(),
    engagement: {
      likesCount: Number(engagement?.likesCount || 0), commentsCount: Number(engagement?.commentsCount || 0),
      savesCount: Number(engagement?.savesCount || 0), sharesCount: Number(engagement?.sharesCount || 0),
    },
  }
  await FeedItem.updateOne({ feedId: `project:${String(projectId)}` }, { $set: {
    'engagement.likesCount': event.engagement.likesCount, 'engagement.commentsCount': event.engagement.commentsCount,
    'engagement.savesCount': event.engagement.savesCount, 'engagement.sharesCount': event.engagement.sharesCount,
  }, $inc: { version: 1 } })
  await RealtimeOutbox.create({ eventId: event.eventId, eventType: event.eventType, aggregateId: event.aggregateId, payload: event })
  if (!env.redisUrl && ioInstance) {
    ioInstance.to(`project:${event.aggregateId}`).emit(event.eventType, event)
    await RealtimeOutbox.updateOne({ eventId: event.eventId }, { $set: { status: 'published', publishedAt: new Date() }, $inc: { attempts: 1 } })
  }
}

async function claimOutboxEntry() {
  const now = new Date()
  return RealtimeOutbox.findOneAndUpdate(
    { $or: [
      { status: 'pending', availableAt: { $lte: now } },
      { status: 'processing', leaseExpiresAt: { $lte: now } },
    ], attempts: { $lt: 10 } },
    { $set: { status: 'processing', leaseOwner: workerOwner, leaseExpiresAt: new Date(Date.now() + LEASE_MS) }, $inc: { attempts: 1 } },
    { sort: { createdAt: 1 }, returnDocument: 'after' },
  ).lean()
}

async function processOne(redis) {
  const entry = await claimOutboxEntry()
  if (!entry) return false
  try {
    await redis.xAdd(REALTIME_STREAM, '*', { eventId: entry.eventId, event: JSON.stringify(entry.payload) })
    await RealtimeOutbox.updateOne({ eventId: entry.eventId, leaseOwner: workerOwner }, { $set: { status: 'published', publishedAt: new Date(), leaseExpiresAt: null } })
  } catch (error) {
    const dead = entry.attempts >= 10
    await RealtimeOutbox.updateOne({ eventId: entry.eventId, leaseOwner: workerOwner }, { $set: { status: dead ? 'dead' : 'pending', availableAt: new Date(Date.now() + Math.min(60000, 1000 * 2 ** entry.attempts)), leaseExpiresAt: null, lastError: error.message } })
  }
  return true
}

async function workerTick() {
  if (workerRunning) return
  workerRunning = true
  try {
    const redis = await getRedisClient()
    if (!redis) return
    for (let i = 0; i < 50; i += 1) if (!await processOne(redis)) break
    const pending = await RealtimeOutbox.find({ status: { $in: ['pending', 'processing'] } }).sort({ createdAt: 1 }).limit(50).select('createdAt').lean()
    recordOutboxMetric(pending.length, pending[0]?.createdAt ? Date.now() - new Date(pending[0].createdAt).getTime() : 0)
  } finally { workerRunning = false }
}

export function startOutboxWorker() {
  if (workerTimer) return
  workerTimer = setInterval(() => workerTick().catch(() => {}), 1000)
  workerTimer.unref()
}

export function stopOutboxWorker() {
  if (workerTimer) clearInterval(workerTimer)
  workerTimer = null
}
