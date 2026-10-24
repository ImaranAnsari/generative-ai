import { Schema, model } from 'mongoose'

const conversationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 80 },
  },
  { timestamps: true },
)

conversationSchema.index({ userId: 1, updatedAt: -1 })

export const Conversation = model('Conversation', conversationSchema)
