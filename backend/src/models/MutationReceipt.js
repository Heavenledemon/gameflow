import mongoose from 'mongoose'

const mutationReceiptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  idempotencyKey: { type: String, required: true },
  action: { type: String, required: true },
  contentType: { type: String, required: true },
  contentId: { type: String, required: true },
  result: { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true, versionKey: false })

mutationReceiptSchema.index({ userId: 1, idempotencyKey: 1 }, { unique: true })

export default mongoose.model('MutationReceipt', mutationReceiptSchema)
