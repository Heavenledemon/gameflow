import mongoose from 'mongoose'

const storySchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    mediaUrl: { type: String, required: true, trim: true },
    mediaType: { type: String, enum: ['image', 'video'], required: true },
    mimeType: { type: String, required: true },
    caption: { type: String, default: '', trim: true, maxlength: 280 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true, versionKey: false },
)

storySchema.index({ expiresAt: 1, createdAt: -1 })

export default mongoose.model('Story', storySchema)
