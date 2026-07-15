import mongoose from 'mongoose'
const moderationReportSchema = new mongoose.Schema({
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  contextType: { type: String, enum: ['user', 'conversation', 'project'], default: 'user' },
  contextId: { type: String, default: '', trim: true, maxlength: 128 },
  status: { type: String, enum: ['open', 'reviewed', 'closed'], default: 'open', index: true },
}, { timestamps: true, versionKey: false })
export default mongoose.model('ModerationReport', moderationReportSchema)
