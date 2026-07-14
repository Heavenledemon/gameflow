import mongoose from 'mongoose'

const commentReactionSchema = new mongoose.Schema({
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'PostComment', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  emoji: { type: String, enum: ['heart', 'laugh', 'wow', 'sad', 'fire'], required: true },
}, { timestamps: true, versionKey: false })

commentReactionSchema.index({ commentId: 1, userId: 1 }, { unique: true })
commentReactionSchema.index({ commentId: 1, emoji: 1 })

export default mongoose.model('CommentReaction', commentReactionSchema)
