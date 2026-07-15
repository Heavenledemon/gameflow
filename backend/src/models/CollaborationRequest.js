import mongoose from 'mongoose'

const collaborationRequestSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    initiatedBy: { type: String, enum: ['owner_invite', 'creator_request'], required: true, default: 'owner_invite', index: true },
    proposedRole: { type: String, enum: ['editor', 'contributor', 'viewer'], default: 'contributor', required: true },
    message: { type: String, default: '', trim: true, maxlength: 500 },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled', 'expired'], default: 'pending', index: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    resolutionEvent: { type: String, default: '', trim: true },
  },
  { timestamps: true, versionKey: false },
)

collaborationRequestSchema.index({ projectId: 1, requesterId: 1, recipientId: 1 }, { unique: true })
collaborationRequestSchema.index({ recipientId: 1, status: 1, createdAt: -1 })
collaborationRequestSchema.index({ requesterId: 1, status: 1, createdAt: -1 })

const CollaborationRequest = mongoose.model('CollaborationRequest', collaborationRequestSchema)

export default CollaborationRequest
