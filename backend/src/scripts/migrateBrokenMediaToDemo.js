import fs from 'node:fs/promises'
import path from 'node:path'
import Project from '../models/Project.js'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { upsertFeedProjection } from '../services/feedProjection.js'

const applyChanges = process.argv.includes('--apply')
const MEDIA_FIELDS = ['previewUrl', 'gameUrl', 'modelUrl', 'imageUrl', 'videoUrl', 'gameplayGifUrl']

const demoMediaByType = {
  game: {
    previewUrl: '/games/Money%20Ladder/loading_screen.png',
    gameUrl: '/games/Money%20Ladder/index.html',
    modelUrl: '', imageUrl: '', videoUrl: '', gameplayGifUrl: '',
  },
  '3d': {
    previewUrl: '/onboarding_bg.png',
    gameUrl: '', modelUrl: '/3dAssets/hammer.glb', imageUrl: '', videoUrl: '', gameplayGifUrl: '',
  },
  '2d': {
    previewUrl: '/onboarding_bg.png',
    gameUrl: '', modelUrl: '', imageUrl: '/onboarding_bg.png', videoUrl: '', gameplayGifUrl: '',
  },
  video: {
    previewUrl: '/portrait_smooth.gif',
    gameUrl: '', modelUrl: '', imageUrl: '/portrait_smooth.gif', videoUrl: '', gameplayGifUrl: '/portrait_smooth.gif',
  },
}

function isBrokenUploadUrl(value) {
  return typeof value === 'string' && /(?:^|\/)(?:api\/)?uploads\//i.test(value)
}

function hasBrokenMedia(project) {
  return MEDIA_FIELDS.some((field) => isBrokenUploadUrl(project[field]))
}

function mediaSnapshot(project) {
  return Object.fromEntries(MEDIA_FIELDS.map((field) => [field, project[field] || '']))
}

async function writeBackup(rows) {
  const runtimeDirectory = path.resolve('runtime')
  await fs.mkdir(runtimeDirectory, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(runtimeDirectory, `demo-media-backup-${timestamp}.json`)
  await fs.writeFile(backupPath, `${JSON.stringify(rows, null, 2)}\n`, { flag: 'wx' })
  return backupPath
}

try {
  await connectDatabase()
  const projects = await Project.find({}).sort({ createdAt: 1 })
  const targets = projects.filter(hasBrokenMedia)

  console.log(`${applyChanges ? 'Applying' : 'Dry run:'} ${targets.length} project(s) have local upload URLs.`)
  for (const project of targets) {
    console.log(`- ${project.title} (${project.type}, ${project._id})`)
  }

  if (!applyChanges) {
    console.log('No database changes made. Run with --apply to migrate these records.')
  } else if (targets.length > 0) {
    const backupRows = targets.map((project) => ({
      projectId: String(project._id),
      title: project.title,
      type: project.type,
      media: mediaSnapshot(project),
    }))
    const backupPath = await writeBackup(backupRows)
    console.log(`Backup written to ${backupPath}`)

    for (const project of targets) {
      Object.assign(project, demoMediaByType[project.type] || demoMediaByType['2d'])
      await project.save()
      await upsertFeedProjection('project', project)
      console.log(`Migrated ${project.title}.`)
    }

    console.log(`Demo-media migration completed for ${targets.length} project(s).`)
  }
} catch (error) {
  console.error('Demo-media migration failed:', error)
  process.exitCode = 1
} finally {
  await disconnectDatabase().catch(() => {})
}
