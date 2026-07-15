import mongoose from 'mongoose'

const conversationParticipantSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  lastReadMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  lastReadAt: { type: Date, default: null },
  mutedUntil: { type: Date, default: null },
  hiddenAt: { type: Date, default: null, index: true },
}, { timestamps: true, versionKey: false })

conversationParticipantSchema.index({ conversationId: 1, userId: 1 }, { unique: true })
conversationParticipantSchema.index({ userId: 1, hiddenAt: 1, updatedAt: -1 })

export default mongoose.model('ConversationParticipant', conversationParticipantSchema)
