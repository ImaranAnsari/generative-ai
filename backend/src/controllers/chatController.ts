import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import OpenAI from 'openai'
import { z } from 'zod'
import { Conversation } from '../models/Conversation.js'
import { Message } from '../models/Message.js'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

const requestSchema = z.object({
  conversationId: z.string().refine(mongoose.isValidObjectId).optional(),
  message: z.string().trim().min(1).max(12_000),
})

async function streamOpenAi(
  input: ChatMessage[],
  signal: AbortSignal,
  onDelta: (text: string) => void,
) {
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
      input,
      stream: true,
    },
    { signal },
  )

  let reply = ''
  for await (const event of stream) {
    if (signal.aborted) throw new Error('The client disconnected.')
    if (event.type === 'response.output_text.delta') {
      reply += event.delta
      onDelta(event.delta)
    } else if (event.type === 'response.failed') {
      throw new Error('The OpenAI response failed.')
    }
  }
  if (!reply.trim()) throw new Error('The OpenAI service returned an empty response.')
  return reply
}

async function streamGroq(
  input: ChatMessage[],
  signal: AbortSignal,
  onDelta: (text: string) => void,
) {
  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1',
  })
  const stream = await groq.chat.completions.create(
    {
      model: process.env.GROQ_MODEL ?? 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Answer clearly and concisely.',
        },
        ...input,
      ],
      stream: true,
    },
    { signal },
  )

  let reply = ''
  for await (const chunk of stream) {
    if (signal.aborted) throw new Error('The client disconnected.')
    const delta = chunk.choices[0]?.delta.content
    if (typeof delta === 'string' && delta.length > 0) {
      reply += delta
      onDelta(delta)
    }
  }
  if (!reply.trim()) throw new Error('Groq returned an empty response.')
  return reply
}

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
  const input = context.reverse().map(({ role, content }) => ({ role, content }))
  const emitDelta = (text: string) => {
    reply += text
    sendEvent({ type: 'delta', text })
  }
  try {
    let openAiError: unknown
    if (process.env.OPENAI_API_KEY) {
      sendEvent({ type: 'provider', name: 'openai' })
      try {
        await streamOpenAi(input, streamController.signal, emitDelta)
      } catch (error) {
        if (streamController.signal.aborted || response.destroyed) return
        openAiError = error
        const apiError =
          error && typeof error === 'object'
            ? error as { name?: string; status?: number; code?: string }
            : undefined
        console.warn('OpenAI failed; trying Groq fallback:', {
          name: apiError?.name ?? 'Unknown error',
          status: apiError?.status,
          code: apiError?.code,
        })
        if (!process.env.GROQ_API_KEY) throw error
        if (reply) {
          reply = ''
          sendEvent({ type: 'reset' })
        }
      }
    }

    if (!reply.trim()) {
      if (!process.env.GROQ_API_KEY) {
        throw openAiError ?? new Error('No AI provider is configured.')
      }
      sendEvent({ type: 'provider', name: 'groq' })
      await streamGroq(input, streamController.signal, emitDelta)
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
        ? 'Both configured AI service attempts failed because of provider credits. Check the provider balances and try again.'
        : 'The AI service could not complete the request. Please try again.'
    response.write(
      `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`,
    )
    response.end()
  }
}
