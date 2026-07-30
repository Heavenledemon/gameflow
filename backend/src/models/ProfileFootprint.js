import mongoose from 'mongoose'

export const FOOTPRINT_REACTIONS = ['stopped_by', 'loved_work', 'inspired', 'following_progress', 'collaboration_interest']
export const FOOTPRINT_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000

const profileFootprintSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reaction: { type: String, enum: FOOTPRINT_REACTIONS, required: true },
  isActive: { type: Boolean, default: true, index: true },
  hiddenByOwner: { type: Boolean, default: false },
  expiresAt: { type: Date, default: () => new Date(Date.now() + FOOTPRINT_LIFETIME_MS), expires: 0 },
}, { timestamps: true, versionKey: false })

profileFootprintSchema.index({ ownerId: 1, visitorId: 1 }, { unique: true })
profileFootprintSchema.index({ ownerId: 1, isActive: 1, hiddenByOwner: 1, updatedAt: -1 })

export default mongoose.model('ProfileFootprint', profileFootprintSchema)
