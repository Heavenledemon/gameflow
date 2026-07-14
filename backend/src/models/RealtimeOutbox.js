import mongoose from 'mongoose'

const realtimeOutboxSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true },
    aggregateId: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    publishedAt: { type: Date, default: null, index: true },
    status: { type: String, enum: ['pending', 'processing', 'published', 'dead'], default: 'pending', index: true },
    leaseOwner: { type: String, default: '', index: true },
    leaseExpiresAt: { type: Date, default: null, index: true },
    availableAt: { type: Date, default: Date.now, index: true },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
)

realtimeOutboxSchema.index({ status: 1, availableAt: 1, createdAt: 1 })

export default mongoose.model('RealtimeOutbox', realtimeOutboxSchema)
