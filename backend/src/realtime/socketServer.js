import { Server } from 'socket.io'
import Project from '../models/Project.js'
import User from '../models/User.js'
import env from '../config/env.js'
import { verifyToken } from '../utils/generateToken.js'
import { REALTIME_STREAM, attachEventPublisher } from './eventPublisher.js'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import { recordSocketMetric } from '../middlewares/observabilityMiddleware.js'

let redisClients = []
let streamConsumer = null
let streamConsumerRunning = false
const consumedEventIds = new Set()

function getToken(socket) {
  const authToken = socket.handshake.auth?.token
  if (authToken) return authToken
  const header = socket.handshake.headers.authorization || ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

export function attachSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin },
    maxHttpBufferSize: 64 * 1024,
    pingInterval: 25000,
    pingTimeout: 20000,
  })

  if (env.redisUrl) {
    const pubClient = createClient({ url: env.redisUrl })
    const subClient = pubClient.duplicate()
    redisClients = [pubClient, subClient]
    Promise.all([pubClient.connect(), subClient.connect()]).then(() => io.adapter(createAdapter(pubClient, subClient))).catch((error) => console.error('Redis adapter unavailable:', error))
  }

  if (env.redisUrl) startRealtimeStreamConsumer(io).catch((error) => console.error('Realtime stream consumer unavailable:', error))

  io.use(async (socket, next) => {
    try {
      const decoded = verifyToken(getToken(socket))
      if (!decoded) return next(new Error('Authentication required.'))
      const user = await User.findById(decoded.sub).select('-password').lean()
      if (!user) return next(new Error('User account no longer exists.'))
      socket.user = user
      next()
    } catch {
      next(new Error('Socket authentication failed.'))
    }
  })

  io.on('connection', (socket) => {
    recordSocketMetric(1)
    socket.once('disconnect', () => recordSocketMetric(-1))
    socket.emit('realtime.ready', { resyncRequired: true, reason: 'connection' })
    socket.on('join_project', async (payload, acknowledge) => {
      const done = typeof acknowledge === 'function' ? acknowledge : () => {}
      const projectId = typeof payload?.projectId === 'string' ? payload.projectId.trim() : ''
      const now = Date.now()
      const rate = socket.data.joinRate || { startedAt: now, count: 0 }
      if (now - rate.startedAt > 60000) { rate.startedAt = now; rate.count = 0 }
      rate.count += 1
      socket.data.joinRate = rate
      if (rate.count > 30) return done({ ok: false, error: 'Too many room requests.' })
      if (!projectId || projectId.length > 100) return done({ ok: false, error: 'Invalid project ID.' })
      const project = await Project.findOne({ $or: [{ _id: projectId }, { slug: projectId.toLowerCase() }] }).select('ownerId visibility isPublished').lean().catch(() => null)
      const canView = project && ((project.visibility === 'public' && project.isPublished) || String(project.ownerId) === String(socket.user._id))
      if (!canView) return done({ ok: false, error: 'Project access denied.' })
      const room = `project:${String(project._id)}`
      await socket.join(room)
      done({ ok: true, room })
    })

    socket.on('leave_project', async (payload, acknowledge) => {
      const done = typeof acknowledge === 'function' ? acknowledge : () => {}
      const projectId = typeof payload?.projectId === 'string' ? payload.projectId.trim() : ''
      const project = projectId ? await Project.findOne({ $or: [{ _id: projectId }, { slug: projectId.toLowerCase() }] }).select('_id').lean().catch(() => null) : null
      if (project) await socket.leave(`project:${String(project._id)}`)
      done({ ok: true })
    })
  })

  attachEventPublisher(io)
  return {
    io,
    close: async () => {
      await Promise.all(redisClients.map((client) => client.quit().catch(() => {})))
      if (streamConsumer?.isOpen) await streamConsumer.quit().catch(() => {})
      streamConsumer = null
      await new Promise((resolve) => io.close(resolve))
    },
  }
}

async function startRealtimeStreamConsumer(io) {
  streamConsumer = createClient({ url: env.redisUrl })
  await streamConsumer.connect()
  const group = 'gameflow-gateways'
  const consumer = `gateway:${process.pid}`
  await streamConsumer.xGroupCreate(REALTIME_STREAM, group, '$', { MKSTREAM: true }).catch((error) => {
    if (!String(error?.message).includes('BUSYGROUP')) throw error
  })
  if (streamConsumerRunning) return
  streamConsumerRunning = true
  while (streamConsumer?.isOpen) {
    const batches = await streamConsumer.xReadGroup(group, consumer, [{ key: REALTIME_STREAM, id: '>' }], { COUNT: 50, BLOCK: 1000 }).catch(() => null)
    for (const batch of batches || []) {
      for (const message of batch.messages || []) {
        const eventId = message.message.eventId
        if (eventId && !consumedEventIds.has(eventId)) {
          consumedEventIds.add(eventId)
          if (consumedEventIds.size > 10000) consumedEventIds.delete(consumedEventIds.values().next().value)
          try {
            const event = JSON.parse(message.message.event)
            io.to(`project:${event.aggregateId}`).emit(event.eventType, event)
          } catch { /* malformed events are acknowledged and audited by the producer */ }
        }
        await streamConsumer.xAck(REALTIME_STREAM, group, message.id)
      }
    }
  }
  streamConsumerRunning = false
}
