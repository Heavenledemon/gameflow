import mongoose from 'mongoose'

const projectMemberSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, enum: ['owner', 'editor', 'contributor', 'viewer'], default: 'viewer', required: true },
    status: { type: String, enum: ['active', 'removed'], default: 'active', required: true, index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now, required: true },
    removedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
)

projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true })
projectMemberSchema.index({ userId: 1, status: 1, updatedAt: -1 })

export default mongoose.model('ProjectMember', projectMemberSchema)
