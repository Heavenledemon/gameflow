import mongoose from 'mongoose'
import engagementSchema from './engagementSchema.js'

const uploadedFileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    relativePath: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      default: '',
      trim: true,
    },
    size: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
)

const projectSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerUsername: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    ownerAvatar: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['game', '3d', '2d'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    software: {
      type: [String],
      default: [],
    },
    mode: {
      type: String,
      enum: ['portrait', 'landscape'],
      default: 'landscape',
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    previewUrl: {
      type: String,
      default: '',
      trim: true,
    },
    gameUrl: {
      type: String,
      default: '',
      trim: true,
    },
    modelUrl: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    engagement: {
      type: engagementSchema,
      default: () => ({}),
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

const Project = mongoose.model('Project', projectSchema)

export default Project
