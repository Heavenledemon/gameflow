import mongoose from 'mongoose'

const conversationSchema = new mongoose.Schema({
  kind: { type: String, enum: ['direct', 'collaboration_request', 'project'], required: true, index: true },
  participantIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
  collaborationRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CollaborationRequest', default: null, unique: true, sparse: true },
  lastMessageAt: { type: Date, default: Date.now, index: true },
  lastMessagePreview: { type: String, default: '', trim: true, maxlength: 2000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false })

conversationSchema.index({ lastMessageAt: -1 })

export default mongoose.model('Conversation', conversationSchema)
