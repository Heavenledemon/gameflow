import cors from 'cors'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './routes/authRoutes.js'
import env from './config/env.js'
import contentRoutes from './routes/contentRoutes.js'
import socialRoutes from './routes/socialRoutes.js'
import messagingRoutes from './routes/messagingRoutes.js'
import { errorHandler, notFound } from './middlewares/errorMiddleware.js'
import { getMetrics, observabilityMiddleware } from './middlewares/observabilityMiddleware.js'
import { protect } from './middlewares/authMiddleware.js'
import { requestTimeoutMiddleware } from './middlewares/requestTimeoutMiddleware.js'
import { deviceResolver } from './middlewares/deviceMiddleware.js'

const app = express()
const uploadsRoot = path.join(process.cwd(), 'uploads')
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const mobileBuildRoot = path.join(repositoryRoot, 'game-flow-ui', 'dist')
const webBuildRoot = path.join(repositoryRoot, 'game-flow-web', 'dist')
app.use(observabilityMiddleware)
app.use(requestTimeoutMiddleware(env.requestTimeoutMs))

function getUncompressedAssetPath(filePath) {
  const normalizedPath = String(filePath || '').replace(/\\/g, '/').toLowerCase()

  if (normalizedPath.endsWith('.br')) {
    return normalizedPath.slice(0, -3)
  }

  if (normalizedPath.endsWith('.gz')) {
    return normalizedPath.slice(0, -3)
  }

  if (normalizedPath.endsWith('.unityweb')) {
    return normalizedPath.slice(0, -9)
  }

  return normalizedPath
}

function getContentType(filePath) {
  const basePath = getUncompressedAssetPath(filePath)

  if (basePath.endsWith('.html')) return 'text/html; charset=utf-8'
  if (basePath.endsWith('.js')) return 'application/javascript; charset=utf-8'
  if (basePath.endsWith('.mjs')) return 'application/javascript; charset=utf-8'
  if (basePath.endsWith('.css')) return 'text/css; charset=utf-8'
  if (basePath.endsWith('.json')) return 'application/json; charset=utf-8'
  if (basePath.endsWith('.wasm')) return 'application/wasm'
  if (basePath.endsWith('.txt')) return 'text/plain; charset=utf-8'
  if (basePath.endsWith('.svg')) return 'image/svg+xml'
  if (basePath.endsWith('.png')) return 'image/png'
  if (basePath.endsWith('.jpg') || basePath.endsWith('.jpeg')) return 'image/jpeg'
  if (basePath.endsWith('.webp')) return 'image/webp'
  if (basePath.endsWith('.gif')) return 'image/gif'
  if (basePath.endsWith('.avif')) return 'image/avif'
  if (basePath.endsWith('.ico')) return 'image/x-icon'

  return 'application/octet-stream'
}

function setUploadHeaders(response, filePath) {
  const normalizedPath = String(filePath || '').replace(/\\/g, '/').toLowerCase()

  if (normalizedPath.endsWith('.br')) {
    response.setHeader('Content-Encoding', 'br')
  } else if (normalizedPath.endsWith('.gz') || normalizedPath.endsWith('.unityweb')) {
    response.setHeader('Content-Encoding', 'gzip')
  }

  response.setHeader('Content-Type', getContentType(filePath))
  response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
}

app.use(
  cors({
    origin: env.clientOrigin,
  }),
)
// Keep JSON bounded; binary project uploads use the dedicated raw route.
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: false, limit: '2mb' }))

app.get('/api/metrics', protect, (_request, response) => response.json(getMetrics()))

app.use(
  '/api/uploads',
  express.static(uploadsRoot, {
    setHeaders: setUploadHeaders,
  }),
)

app.use('/api/auth', authRoutes)
app.use('/api', contentRoutes)
app.use('/api', socialRoutes)
app.use('/api', messagingRoutes)

function setFrontendAssetHeaders(response, filePath) {
  const isHtml = filePath.endsWith('.html')
  const isHashedAsset = /[\\/]assets[\\/].*-[a-zA-Z0-9_-]{8,}\./.test(filePath)

  response.setHeader(
    'Cache-Control',
    isHtml ? 'no-cache' : isHashedAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
  )
}

function mountFrontend(prefix, buildRoot) {
  app.use(prefix, express.static(buildRoot, { index: false, setHeaders: setFrontendAssetHeaders }))
  app.use(prefix, (_request, response) => {
    response.setHeader('Cache-Control', 'no-cache')
    response.sendFile(path.join(buildRoot, 'index.html'))
  })
}

mountFrontend('/m', mobileBuildRoot)
mountFrontend('/web', webBuildRoot)

app.get('/', deviceResolver, (request, response) => {
  const destination = request.deviceClass === 'mobile' ? '/m' : '/web'
  response.setHeader('Vary', 'User-Agent')
  response.setHeader('Cache-Control', 'no-store')
  response.redirect(302, destination)
})

app.use(notFound)
app.use(errorHandler)

export default app
