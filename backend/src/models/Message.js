import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, default: '', trim: true, maxlength: 2000 },
  attachments: [{
    type: { type: String, enum: ['project_asset'], required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectFile', required: true },
    name: { type: String, default: '', trim: true, maxlength: 255 },
    mimeType: { type: String, default: '', trim: true, maxlength: 255 },
    size: { type: Number, default: 0, min: 0 },
  }],
  type: { type: String, enum: ['text', 'system'], default: 'text', required: true },
  clientMessageId: { type: String, required: true, trim: true, maxlength: 128 },
  editedAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false })

messageSchema.index({ conversationId: 1, createdAt: -1, _id: -1 })
messageSchema.index({ conversationId: 1, clientMessageId: 1 }, { unique: true })

export default mongoose.model('Message', messageSchema)
