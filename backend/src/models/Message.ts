import { Schema, model } from 'mongoose'

const messageSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 12_000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

messageSchema.index({ userId: 1, conversationId: 1, createdAt: 1 })

export const Message = model('Message', messageSchema)
