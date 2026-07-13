import mongoose from 'mongoose'

const projectFileSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    relativePath: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    storageKey: { type: String, required: true, trim: true },
    mimeType: { type: String, default: '', trim: true },
    size: { type: Number, required: true, min: 0 },
    checksum: { type: String, required: true, trim: true },
    version: { type: Number, required: true, default: 1, min: 1 },
    status: { type: String, enum: ['pending', 'ready', 'deleted'], default: 'ready', index: true },
  },
  { timestamps: true, versionKey: false },
)

projectFileSchema.index({ projectId: 1, relativePath: 1 }, { unique: true })
projectFileSchema.index({ projectId: 1, status: 1 })

export default mongoose.model('ProjectFile', projectFileSchema)
