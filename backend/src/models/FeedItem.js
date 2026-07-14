import mongoose from 'mongoose'

const feedItemSchema = new mongoose.Schema(
  {
    feedId: { type: String, required: true, unique: true, index: true },
    contentType: { type: String, enum: ['game', 'asset', 'project'], required: true, index: true },
    contentId: { type: String, required: true, index: true },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, required: true },
    rank: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    creator: {
      id: { type: String, default: '' },
      username: { type: String, default: '' },
      name: { type: String, default: '' },
      avatarUrl: { type: String, default: '' },
    },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    tags: { type: [String], default: [] },
    software: { type: [String], default: [] },
    mode: { type: String, default: 'landscape' },
    media: {
      kind: { type: String, required: true },
      posterUrl: { type: String, default: '' },
      manifestUrl: { type: String, default: '' },
      modelUrl: { type: String, default: '' },
      imageUrl: { type: String, default: '' },
      background: { type: String, default: '' },
    },
    engagement: {
      likesCount: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
      savesCount: { type: Number, default: 0 },
      sharesCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true, versionKey: false },
)

feedItemSchema.index({ visibility: 1, isPublished: 1, publishedAt: -1, _id: -1 })
feedItemSchema.index({ visibility: 1, isPublished: 1, rank: -1, publishedAt: -1, _id: -1 })

export default mongoose.model('FeedItem', feedItemSchema)

