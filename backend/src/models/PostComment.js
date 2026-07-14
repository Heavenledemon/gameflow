import mongoose from 'mongoose'

const postCommentSchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      index: true,
    },
    contentType: { type: String, enum: ['game', 'asset', 'project'], required: true, index: true },
    contentId: { type: String, required: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PostComment',
      default: null,
      index: true,
    },
    username: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: '',
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    idempotencyKey: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  },
)

postCommentSchema.index({ contentType: 1, contentId: 1, parentCommentId: 1, createdAt: -1, _id: -1 })
postCommentSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } })

const PostComment = mongoose.model('PostComment', postCommentSchema)

export default PostComment
