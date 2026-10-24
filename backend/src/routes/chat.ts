import { Router } from 'express'
import OpenAI from 'openai'
import { z } from 'zod'

const router = Router()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(12_000),
      }),
    )
    .min(1)
    .max(30)
    .refine((messages) => messages.at(-1)?.role === 'user', {
      message: 'The last message must be from the user.',
    }),
})

router.post('/', async (request, response) => {
  const parsed = requestSchema.safeParse(request.body)

  if (!parsed.success) {
    response.status(400).json({
      error: 'Invalid chat request. Send up to 30 non-empty user/assistant messages.',
    })
    return
  }

  try {
    const result = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      instructions: 'You are a helpful assistant. Answer clearly and concisely.',
      input: parsed.data.messages,
    })

    response.json({ reply: result.output_text })
  } catch (error) {
    console.error(
      'OpenAI chat request failed:',
      error instanceof Error ? error.name : 'Unknown error',
    )
    response.status(502).json({
      error: 'The AI service could not complete the request. Please try again.',
    })
  }
})

export default router
