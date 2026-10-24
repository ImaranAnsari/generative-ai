import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import OpenAI from 'openai'
import { z } from 'zod'
import { Conversation } from '../models/Conversation.js'
import { Message } from '../models/Message.js'

const requestSchema = z.object({
  conversationId: z.string().refine(mongoose.isValidObjectId).optional(),
  message: z.string().trim().min(1).max(12_000),
})

export async function sendMessage(request: Request, response: Response) {
  const parsed = requestSchema.safeParse(request.body)
  if (!parsed.success) {
    response.status(400).json({ error: 'Invalid chat request. Send one non-empty message.' })
    return
  }

  const { message, conversationId } = parsed.data
  const userId = new mongoose.Types.ObjectId(request.userId)
  let conversation
  if (conversationId) {
    conversation = await Conversation.findOne({ _id: conversationId, userId })
    if (!conversation) {
      response.status(404).json({ error: 'Conversation not found.' })
      return
    }
    conversation.updatedAt = new Date()
    await conversation.save()
  } else {
    conversation = await Conversation.create({
      userId,
      title: message.slice(0, 80),
    })
  }

  await Message.create({
    userId,
    conversationId: conversation._id,
    role: 'user',
    content: message,
  })
  const context = await Message.find({ userId, conversationId: conversation._id })
    .sort({ createdAt: -1, _id: -1 })
    .limit(30)
    .lean()

  response.status(200)
  response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  response.setHeader('Cache-Control', 'no-cache, no-transform')
  response.setHeader('Connection', 'keep-alive')
  response.flushHeaders()
  const sendEvent = (event: object) => response.write(`data: ${JSON.stringify(event)}\n\n`)
  sendEvent({ conversationId: conversation.id, type: 'start' })

  let reply = ''
  const streamController = new AbortController()
  response.on('close', () => streamController.abort())
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(process.env.OPENAI_BASE_URL
        ? { baseURL: process.env.OPENAI_BASE_URL }
        : {}),
    })
    const stream = await openai.responses.create(
      {
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        instructions: 'You are a helpful assistant. Answer clearly and concisely.',
        input: context.reverse().map(({ role, content }) => ({ role, content })),
        stream: true,
      },
      { signal: streamController.signal },
    )

    for await (const event of stream) {
      if (response.destroyed) return
      if (event.type === 'response.output_text.delta') {
        reply += event.delta
        sendEvent({ type: 'delta', text: event.delta })
      } else if (event.type === 'response.failed') {
        throw new Error('The AI response failed.')
      }
    }

    if (!reply.trim()) throw new Error('The AI service returned an empty response.')
    await Message.create({
      userId,
      conversationId: conversation._id,
      role: 'assistant',
      content: reply,
    })
    conversation.updatedAt = new Date()
    await conversation.save()
    sendEvent({ type: 'done' })
    response.end()
  } catch (error) {
    const apiError =
      error && typeof error === 'object'
        ? error as { name?: string; status?: number; code?: string }
        : undefined
    console.error('Chat request failed:', {
      name: apiError?.name ?? 'Unknown error',
      status: apiError?.status,
      code: apiError?.code,
    })
    if (response.destroyed) return
    const errorMessage =
      apiError?.code === 'credit_balance_exhausted'
        ? 'The AI provider has no remaining credits. Add credits or configure a provider with an available balance.'
        : 'The AI service could not complete the request. Please try again.'
    response.write(
      `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`,
    )
    response.end()
  }
}
