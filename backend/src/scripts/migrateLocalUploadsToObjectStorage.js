import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import Project from '../models/Project.js'
import ProjectFile from '../models/ProjectFile.js'
import Story from '../models/Story.js'
import Upload from '../models/Upload.js'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { upsertFeedProjection } from '../services/feedProjection.js'
import { createPresignedPutUrl, objectStorageReady, publicObjectUrl } from '../services/objectStorage.js'

const applyChanges = process.argv.includes('--apply')
const skipUpload = process.argv.includes('--skip-upload')
const uploadsRoot = path.resolve('uploads')
const runtimeRoot = path.resolve('runtime')
const mediaFields = ['previewUrl', 'gameUrl', 'modelUrl', 'imageUrl', 'videoUrl', 'gameplayGifUrl']

function normalizeKey(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\/+/, '')
}

function keyFromLegacyUrl(value) {
  const match = String(value || '').match(/(?:^https?:\/\/[^/]+)?\/api\/uploads\/(.+)$/i)
  return match ? normalizeKey(decodeURIComponent(match[1])) : ''
}

function migrateUrl(value) {
  const key = keyFromLegacyUrl(value)
  return key ? publicObjectUrl(key) : String(value || '')
}

function contentMetadata(filePath) {
  const normalized = filePath.toLowerCase()
  const uncompressed = normalized.replace(/\.(br|gz|unityweb)$/, '')
  let contentType = 'application/octet-stream'
  if (uncompressed.endsWith('.html')) contentType = 'text/html; charset=utf-8'
  else if (uncompressed.endsWith('.js') || uncompressed.endsWith('.mjs')) contentType = 'application/javascript; charset=utf-8'
  else if (uncompressed.endsWith('.css')) contentType = 'text/css; charset=utf-8'
  else if (uncompressed.endsWith('.json')) contentType = 'application/json; charset=utf-8'
  else if (uncompressed.endsWith('.wasm')) contentType = 'application/wasm'
  else if (uncompressed.endsWith('.png')) contentType = 'image/png'
  else if (uncompressed.endsWith('.jpg') || uncompressed.endsWith('.jpeg')) contentType = 'image/jpeg'
  else if (uncompressed.endsWith('.webp')) contentType = 'image/webp'
  else if (uncompressed.endsWith('.gif')) contentType = 'image/gif'
  else if (uncompressed.endsWith('.svg')) contentType = 'image/svg+xml'
  else if (uncompressed.endsWith('.mp4')) contentType = 'video/mp4'
  else if (uncompressed.endsWith('.webm')) contentType = 'video/webm'
  else if (uncompressed.endsWith('.glb')) contentType = 'model/gltf-binary'
  else if (uncompressed.endsWith('.gltf')) contentType = 'model/gltf+json'
  else if (uncompressed.endsWith('.txt')) contentType = 'text/plain; charset=utf-8'

  const contentEncoding = normalized.endsWith('.br')
    ? 'br'
    : normalized.endsWith('.gz') || normalized.endsWith('.unityweb')
      ? 'gzip'
      : ''
  return { contentType, contentEncoding }
}

async function listFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const rows = []
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) rows.push(...await listFiles(absolutePath))
    else if (entry.isFile()) rows.push(absolutePath)
  }
  return rows
}

async function latestDemoBackup() {
  const names = (await fs.readdir(runtimeRoot)).filter((name) => /^demo-media-backup-.*\.json$/.test(name)).sort().reverse()
  if (!names.length) throw new Error('No demo-media backup was found in backend/runtime.')
  return path.join(runtimeRoot, names[0])
}

async function uploadFile(filePath) {
  const key = normalizeKey(path.relative(uploadsRoot, filePath))
  const body = await fs.readFile(filePath)
  const { contentType, contentEncoding } = contentMetadata(filePath)
  const response = await fetch(createPresignedPutUrl(key), {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      ...(contentEncoding ? { 'Content-Encoding': contentEncoding } : {}),
    },
    body,
  })
  if (!response.ok) throw new Error(`Upload failed (${response.status}) for ${key}: ${await response.text()}`)
  return { key, size: body.length, checksum: crypto.createHash('sha256').update(body).digest('hex') }
}

async function writeRestoreBackup(payload) {
  await fs.mkdir(runtimeRoot, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(runtimeRoot, `object-storage-restore-backup-${timestamp}.json`)
  await fs.writeFile(backupPath, `${JSON.stringify(payload, null, 2)}\n`, { flag: 'wx' })
  return backupPath
}

try {
  if (!objectStorageReady()) throw new Error('Object storage environment variables are incomplete.')
  const backupPath = await latestDemoBackup()
  const originalProjects = JSON.parse(await fs.readFile(backupPath, 'utf8'))
  const localFiles = await listFiles(uploadsRoot)
  const totalBytes = (await Promise.all(localFiles.map((file) => fs.stat(file)))).reduce((sum, stat) => sum + stat.size, 0)

  await connectDatabase()
  const projectIds = originalProjects.map((row) => row.projectId)
  const projects = await Project.find({ _id: { $in: projectIds } })
  const stories = await Story.find({ mediaUrl: /\/api\/uploads\//i })
  const projectFiles = await ProjectFile.find({ url: /\/api\/uploads\//i })
  const uploads = await Upload.find({ storageKey: /.+/ })

  console.log(`${applyChanges ? 'Applying' : 'Dry run:'} ${localFiles.length} file(s), ${(totalBytes / 1024 / 1024).toFixed(2)} MB.`)
  console.log(`Will restore ${projects.length} project(s), ${stories.length} active story record(s), and ${projectFiles.length} project-file record(s).`)

  if (!applyChanges) {
    console.log('No files uploaded and no database changes made. Run with --apply to continue.')
  } else {
    const uploaded = []
    if (skipUpload) {
      console.log('Skipping file uploads; updating database delivery URLs only.')
    } else {
      for (let index = 0; index < localFiles.length; index += 1) {
        const result = await uploadFile(localFiles[index])
        uploaded.push(result)
        console.log(`[${index + 1}/${localFiles.length}] Uploaded ${result.key}`)
      }
    }

    const restoreBackupPath = await writeRestoreBackup({
      sourceDemoBackup: backupPath,
      projects: projects.map((project) => ({ projectId: String(project._id), media: Object.fromEntries(mediaFields.map((field) => [field, project[field] || ''])) })),
      stories: stories.map((story) => ({ storyId: String(story._id), mediaUrl: story.mediaUrl })),
      projectFiles: projectFiles.map((file) => ({ projectFileId: String(file._id), url: file.url, storageKey: file.storageKey })),
    })
    console.log(`Pre-restore database backup written to ${restoreBackupPath}`)

    const originalsById = new Map(originalProjects.map((row) => [String(row.projectId), row]))
    for (const project of projects) {
      const original = originalsById.get(String(project._id))
      for (const field of mediaFields) project[field] = migrateUrl(original.media[field])
      await project.save()
      await upsertFeedProjection('project', project)
      console.log(`Restored ${project.title}.`)
    }

    for (const story of stories) {
      story.mediaUrl = migrateUrl(story.mediaUrl)
      await story.save()
    }

    for (const file of projectFiles) {
      const key = keyFromLegacyUrl(file.url) || normalizeKey(file.storageKey)
      file.storageKey = key
      file.url = publicObjectUrl(key)
      file.status = 'ready'
      await file.save()
    }

    const uploadedByKey = new Map(uploaded.map((row) => [row.key, row]))
    for (const upload of uploads) {
      const key = normalizeKey(upload.storageKey)
      const migrated = uploadedByKey.get(key)
      if (!migrated) continue
      upload.provider = 's3'
      upload.status = 'ready'
      upload.size = migrated.size
      upload.checksum = migrated.checksum
      upload.expiresAt = null
      await upload.save()
    }

    console.log(`Object-storage restoration completed. Uploaded ${uploaded.length} file(s) and restored ${projects.length} project(s).`)
  }
} catch (error) {
  console.error('Object-storage restoration failed:', error)
  process.exitCode = 1
} finally {
  await disconnectDatabase().catch(() => {})
}
