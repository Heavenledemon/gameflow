import app from './app.js'
import { connectDatabase, disconnectDatabase } from './config/database.js'
import env from './config/env.js'
import http from 'node:http'
import { attachSocketServer } from './realtime/socketServer.js'
import { seedDatabase } from './controllers/contentController.js'
import { logger } from './utils/logger.js'
import { startOutboxWorker, stopOutboxWorker } from './realtime/eventPublisher.js'

let server
let closeSocketServer = async () => {}

async function startServer() {
  await connectDatabase()

  if (env.seedOnStart) {
    await seedDatabase()
  }

  const httpServer = http.createServer(app)
  const socketServer = attachSocketServer(httpServer)
  closeSocketServer = socketServer.close
  startOutboxWorker()
  server = httpServer.listen(env.port, () => {
    logger.info('server_started', { port: env.port, environment: env.nodeEnv })
  })
}

async function shutdown(signal) {
  logger.info('server_shutdown_started', { signal })

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

  await closeSocketServer()
  stopOutboxWorker()

  await disconnectDatabase()
}

process.on('SIGINT', async () => {
  await shutdown('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await shutdown('SIGTERM')
  process.exit(0)
})

startServer().catch(async (error) => {
  logger.error('server_start_failed', { error: error.message, stack: error.stack })
  await disconnectDatabase().catch(() => {})
  process.exit(1)
})
