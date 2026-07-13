import crypto from 'node:crypto'
import RealtimeOutbox from '../models/RealtimeOutbox.js'

let ioInstance = null
let workerTimer = null

export function attachEventPublisher(io) {
  ioInstance = io
}

export async function publishProjectEngagement(projectId, engagement) {
  const event = {
    eventId: crypto.randomUUID(),
    eventType: 'project.engagement.updated',
    schemaVersion: 1,
    aggregateId: String(projectId),
    aggregateVersion: Date.now(),
    occurredAt: new Date().toISOString(),
    engagement: {
      likesCount: Number(engagement?.likesCount || 0),
      commentsCount: Number(engagement?.commentsCount || 0),
      savesCount: Number(engagement?.savesCount || 0),
      sharesCount: Number(engagement?.sharesCount || 0),
    },
  }
  await RealtimeOutbox.create({ eventId: event.eventId, eventType: event.eventType, aggregateId: event.aggregateId, payload: event })
  await deliverOutboxEvent(event)
}

async function deliverOutboxEvent(event) {
  if (ioInstance) ioInstance.to(`project:${event.aggregateId}`).emit(event.eventType, event)
  await RealtimeOutbox.updateOne({ eventId: event.eventId }, { $set: { publishedAt: new Date() }, $inc: { attempts: 1 } })
}

export function startOutboxWorker() {
  workerTimer = setInterval(async () => {
    const pending = await RealtimeOutbox.find({ publishedAt: null, attempts: { $lt: 10 } }).sort({ createdAt: 1 }).limit(50).lean().catch(() => [])
    for (const entry of pending) {
      try { await deliverOutboxEvent(entry.payload) } catch (error) {
        await RealtimeOutbox.updateOne({ eventId: entry.eventId }, { $inc: { attempts: 1 }, $set: { lastError: error.message } }).catch(() => {})
      }
    }
  }, 5000)
  workerTimer.unref()
}

export function stopOutboxWorker() {
  if (workerTimer) clearInterval(workerTimer)
  workerTimer = null
}
