import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Conversation } from '../models/Conversation.js'
import { Message } from '../models/Message.js'

export async function listConversations(request: Request, response: Response) {
  const items = await Conversation.find({ userId: request.userId })
    .select('title updatedAt')
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean()
  response.json({
    conversations: items.map(({ _id, title, updatedAt }) => ({
      id: _id.toString(),
      title,
      updatedAt,
    })),
  })
}

export async function getConversation(request: Request, response: Response) {
  const { id } = request.params
  if (!mongoose.isValidObjectId(id)) {
    response.status(400).json({ error: 'Invalid conversation id.' })
    return
  }

  const conversation = await Conversation.findOne({ _id: id, userId: request.userId }).lean()
  if (!conversation) {
    response.status(404).json({ error: 'Conversation not found.' })
    return
  }

  const history = await Message.find({ userId: request.userId, conversationId: conversation._id })
    .sort({ createdAt: 1, _id: 1 })
    .lean()
  response.json({
    conversation: {
      id: conversation._id.toString(),
      title: conversation.title,
      messages: history.map(({ _id, role, content, createdAt }) => ({
        id: _id.toString(),
        sender: role,
        text: content,
        createdAt,
      })),
    },
  })
}
