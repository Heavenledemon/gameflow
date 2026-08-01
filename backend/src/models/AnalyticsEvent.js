import mongoose from 'mongoose'

export const ANALYTICS_EVENT_TYPES = [
  'content_impression',
  'content_view',
  'profile_visit',
  'game_launch',
  'game_load_success',
  'game_session_end',
  'video_play',
  'video_progress',
  'video_complete',
  'asset_preview',
  'asset_download',
  'external_link_click',
  'follow_created',
  'footprint_created',
  'footprint_updated',
  'footprint_removed',
  'collaboration_requested',
]

export const ANALYTICS_SOURCES = ['feed', 'discover', 'profile', 'direct', 'share', 'search', 'unknown']

const analyticsEventSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contentType: { type: String, enum: ['project', 'game', 'asset', 'video', 'profile'], required: true, index: true },
  contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
  eventType: { type: String, enum: ANALYTICS_EVENT_TYPES, required: true, index: true },
  viewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  anonymousIdHash: { type: String, default: '', maxlength: 128, select: false },
  sessionIdHash: { type: String, default: '', maxlength: 128, select: false },
  source: { type: String, enum: ANALYTICS_SOURCES, default: 'unknown' },
  sourceContentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  occurredAt: { type: Date, required: true, default: Date.now, index: true },
  durationMs: { type: Number, default: null, min: 0, max: 24 * 60 * 60 * 1000 },
  value: { type: Number, default: null },
  idempotencyKey: { type: String, default: null, maxlength: 160 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: undefined },
}, { timestamps: true, versionKey: false })

analyticsEventSchema.index({ creatorId: 1, occurredAt: -1 })
analyticsEventSchema.index({ creatorId: 1, contentId: 1, occurredAt: -1 })
analyticsEventSchema.index({ creatorId: 1, eventType: 1, occurredAt: -1 })
analyticsEventSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
)

export default mongoose.model('AnalyticsEvent', analyticsEventSchema)
