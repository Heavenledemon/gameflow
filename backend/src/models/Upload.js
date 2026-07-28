import mongoose from 'mongoose'

const uploadSchema = new mongoose.Schema(
  {
    uploadId: { type: String, required: true, unique: true, index: true },
    idempotencyKey: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    billingOwnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    storageKey: { type: String, required: true, unique: true },
    relativePath: { type: String, required: true },
    detectedType: { type: String, required: true },
    mimeType: { type: String, default: '' },
    size: { type: Number, required: true },
    checksum: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'scanning', 'ready', 'rejected', 'deleted'],
      default: 'pending',
      index: true,
    },
    error: { type: String, default: '' },
    provider: { type: String, enum: ['local', 's3'], default: 'local' },
    etag: { type: String, default: '' },
    expiresAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, versionKey: false },
)

uploadSchema.index({ projectId: 1, relativePath: 1 }, { unique: true })
uploadSchema.index({ ownerId: 1, idempotencyKey: 1 }, { unique: true })

export default mongoose.model('Upload', uploadSchema)
