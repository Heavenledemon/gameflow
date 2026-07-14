import { connectDatabase, disconnectDatabase } from '../config/database.js'
import PostEngagement from '../models/PostEngagement.js'
import PostComment from '../models/PostComment.js'
import Game from '../models/Game.js'
import Asset from '../models/Asset.js'

async function dropLegacyIndexes() {
  for (const [collection, names] of [[PostEngagement.collection, ['postId_1_userId_1', 'postId_1_liked_1', 'postId_1_saved_1']], [PostComment.collection, ['postId_1_createdAt_-1', 'postId_1_parentCommentId_1_createdAt_1']]]) {
    for (const name of names) await collection.dropIndex(name).catch(() => {})
  }
}

async function migrateProjects() {
  await PostEngagement.updateMany({ contentType: { $exists: false }, postId: { $exists: true } }, [{ $set: { contentType: 'project', contentId: { $toString: '$postId' } } }], { updatePipeline: true })
  await PostComment.updateMany({ contentType: { $exists: false }, postId: { $exists: true } }, [{ $set: { contentType: 'project', contentId: { $toString: '$postId' } } }], { updatePipeline: true })
}

async function migrateLegacyDocument(Model, contentType) {
  let lastId = null
  while (true) {
    const rows = await Model.find(lastId ? { _id: { $gt: lastId } } : {}).sort({ _id: 1 }).limit(100)
    if (!rows.length) break
    for (const row of rows) {
      const engagement = row.engagement || {}
      for (const reaction of engagement.reactions || []) {
        if (!reaction.userId) continue
        await PostEngagement.updateOne({ contentType, contentId: String(row._id), userId: reaction.userId }, { $setOnInsert: { contentType, contentId: String(row._id), userId: reaction.userId, liked: true, saved: false } }, { upsert: true })
      }
      for (const saved of engagement.savedBy || []) {
        if (!saved.userId) continue
        await PostEngagement.updateOne({ contentType, contentId: String(row._id), userId: saved.userId }, { $set: { saved: true }, $setOnInsert: { contentType, contentId: String(row._id), userId: saved.userId, liked: false } }, { upsert: true })
      }
      for (const comment of engagement.comments || []) {
        if (!comment.userId || !comment.text) continue
        await PostComment.updateOne({ contentType, contentId: String(row._id), idempotencyKey: `legacy:${comment.commentId}` }, { $setOnInsert: { contentType, contentId: String(row._id), userId: comment.userId, username: comment.username || '', name: comment.name || '', avatar: comment.avatar || '', text: comment.text, createdAt: comment.createdAt || new Date(), idempotencyKey: `legacy:${comment.commentId}` } }, { upsert: true })
      }
      await Model.updateOne({ _id: row._id }, { $set: { 'engagement.likesCount': Number(engagement.likesCount || (engagement.reactions || []).length), 'engagement.savesCount': Number(engagement.savesCount || (engagement.savedBy || []).length), 'engagement.commentsCount': Number(engagement.commentsCount || (engagement.comments || []).length) } })
    }
    lastId = rows.at(-1)._id
  }
}

try {
  await connectDatabase()
  await dropLegacyIndexes()
  await migrateProjects()
  await migrateLegacyDocument(Game, 'game')
  await migrateLegacyDocument(Asset, 'asset')
  await PostEngagement.syncIndexes()
  await PostComment.syncIndexes()
  console.log('Generalized engagement migration completed.')
} catch (error) {
  console.error('Generalized engagement migration failed:', error)
  process.exitCode = 1
} finally {
  await disconnectDatabase().catch(() => {})
}
