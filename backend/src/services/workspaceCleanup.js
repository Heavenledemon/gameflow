import ProjectFile from '../models/ProjectFile.js'
import Upload from '../models/Upload.js'
import { createPresignedDeleteUrl, objectStorageReady } from './objectStorage.js'
import { logger } from '../utils/logger.js'

async function deleteUnreferencedObject(storageKey, excludingFileId = null) {
  if (!storageKey || !objectStorageReady()) return false
  const referenced = await ProjectFile.exists({ storageKey, status: { $ne: 'deleted' }, ...(excludingFileId ? { _id: { $ne: excludingFileId } } : {}) })
  if (referenced) return false
  const result = await fetch(createPresignedDeleteUrl(storageKey), { method: 'DELETE' })
  if (!result.ok && result.status !== 404) throw new Error(`Object deletion returned ${result.status}.`)
  return true
}

export async function purgeExpiredWorkspaceData(now = new Date()) {
  const expiredFiles = await ProjectFile.find({ status: 'deleted', purgeAfter: { $lte: now } }).limit(100)
  let filesPurged = 0
  for (const file of expiredFiles) {
    try {
      await deleteUnreferencedObject(file.storageKey, file._id)
      await ProjectFile.deleteOne({ _id: file._id, status: 'deleted' })
      filesPurged += 1
    } catch (error) { logger.error('workspace_asset_purge_failed', { assetId: String(file._id), message: error.message }) }
  }

  const expiredUploads = await Upload.find({ status: { $in: ['pending', 'rejected'] }, expiresAt: { $lte: now } }).limit(100)
  let uploadsPurged = 0
  for (const upload of expiredUploads) {
    try {
      await deleteUnreferencedObject(upload.storageKey)
      upload.status = 'deleted'; upload.error = upload.error || 'Expired upload cleaned up.'; await upload.save()
      uploadsPurged += 1
    } catch (error) { logger.error('workspace_upload_purge_failed', { uploadId: upload.uploadId, message: error.message }) }
  }
  return { filesPurged, uploadsPurged }
}
