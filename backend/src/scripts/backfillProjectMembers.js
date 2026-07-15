import { connectDatabase, disconnectDatabase } from '../config/database.js'
import Project from '../models/Project.js'
import ProjectMember from '../models/ProjectMember.js'

async function backfill() {
  let lastId = null
  let processed = 0
  while (true) {
    const query = lastId ? { _id: { $gt: lastId } } : {}
    const projects = await Project.find(query).sort({ _id: 1 }).limit(200).select('_id ownerId').lean()
    if (!projects.length) break
    await Promise.all(projects.map((project) => ProjectMember.updateOne(
      { projectId: project._id, userId: project.ownerId },
      { $setOnInsert: { role: 'owner', status: 'active', invitedBy: project.ownerId, joinedAt: new Date() } },
      { upsert: true },
    )))
    processed += projects.length
    lastId = projects.at(-1)._id
  }
  await ProjectMember.syncIndexes()
  console.log(`Project member backfill completed for ${processed} projects.`)
}

try {
  await connectDatabase()
  await backfill()
} catch (error) {
  console.error('Project member backfill failed:', error)
  process.exitCode = 1
} finally {
  await disconnectDatabase().catch(() => {})
}
