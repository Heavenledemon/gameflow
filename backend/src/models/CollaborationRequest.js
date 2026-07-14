import mongoose from 'mongoose'

const collaborationRequestSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    message: { type: String, default: '', trim: true, maxlength: 500 },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled'], default: 'pending', index: true },
  },
  { timestamps: true, versionKey: false },
)

collaborationRequestSchema.index({ projectId: 1, requesterId: 1, recipientId: 1 }, { unique: true })

const CollaborationRequest = mongoose.model('CollaborationRequest', collaborationRequestSchema)

export default CollaborationRequest
