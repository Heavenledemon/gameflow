import { Server } from 'socket.io'
import Project from '../models/Project.js'
import User from '../models/User.js'
import env from '../config/env.js'
import { verifyToken } from '../utils/generateToken.js'
import { attachEventPublisher } from './eventPublisher.js'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'

let redisClients = []

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

  const eventRate = new Map()

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
    socket.emit('realtime.ready', { resyncRequired: true, reason: 'connection' })
    socket.on('join_project', async (payload, acknowledge) => {
      const done = typeof acknowledge === 'function' ? acknowledge : () => {}
      const projectId = typeof payload?.projectId === 'string' ? payload.projectId.trim() : ''
      const now = Date.now()
      const rate = eventRate.get(String(socket.user._id)) || { startedAt: now, count: 0 }
      if (now - rate.startedAt > 60000) { rate.startedAt = now; rate.count = 0 }
      rate.count += 1
      eventRate.set(String(socket.user._id), rate)
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
      await new Promise((resolve) => io.close(resolve))
    },
  }
}
