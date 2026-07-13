import mongoose from 'mongoose'

const realtimeOutboxSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true },
    aggregateId: { type: String, required: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    publishedAt: { type: Date, default: null, index: true },
    attempts: { type: Number, default: 0 },
    lastError: { type: String, default: '' },
  },
  { timestamps: true, versionKey: false },
)

export default mongoose.model('RealtimeOutbox', realtimeOutboxSchema)
