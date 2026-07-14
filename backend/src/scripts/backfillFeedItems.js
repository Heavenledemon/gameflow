import Game from '../models/Game.js'
import Asset from '../models/Asset.js'
import Project from '../models/Project.js'
import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { upsertFeedProjection } from '../services/feedProjection.js'

const BATCH_SIZE = 100

async function backfill(Model, contentType) {
  let lastId = null
  let processed = 0
  while (true) {
    const query = lastId ? { _id: { $gt: lastId } } : {}
    const rows = await Model.find(query).sort({ _id: 1 }).limit(BATCH_SIZE)
    if (rows.length === 0) break
    for (const row of rows) await upsertFeedProjection(contentType, row)
    processed += rows.length
    lastId = rows.at(-1)._id
    console.log(`Backfilled ${processed} ${contentType} records.`)
  }
}

try {
  await connectDatabase()
  await backfill(Game, 'game')
  await backfill(Asset, 'asset')
  await backfill(Project, 'project')
  console.log('Feed-item backfill completed successfully.')
} catch (error) {
  console.error('Feed-item backfill failed:', error)
  process.exitCode = 1
} finally {
  await disconnectDatabase().catch(() => {})
}

