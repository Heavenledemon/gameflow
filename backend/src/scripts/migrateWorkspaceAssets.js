import { connectDatabase, disconnectDatabase } from '../config/database.js'
import ProjectFile from '../models/ProjectFile.js'
import Upload from '../models/Upload.js'
import Conversation from '../models/Conversation.js'

await connectDatabase()
try {
  const backfilledFiles = await ProjectFile.updateMany(
    { uploadedById: null },
    [{ $set: { uploadedById: '$ownerId', visibility: { $ifNull: ['$visibility', 'workspace-private'] } } }],
    { updatePipeline: true },
  )
  const backfilledUploads = await Upload.updateMany(
    { billingOwnerId: null },
    [{ $set: { billingOwnerId: '$ownerId' } }],
    { updatePipeline: true },
  )
  await ProjectFile.syncIndexes()
  await Conversation.syncIndexes()
  console.log(JSON.stringify({ filesMatched: backfilledFiles.matchedCount, uploadsMatched: backfilledUploads.matchedCount, indexesSynchronized: true }, null, 2))
} finally { await disconnectDatabase() }
