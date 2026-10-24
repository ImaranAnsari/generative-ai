import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import type { ErrorRequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import authRouter from './routes/auth.js'
import chatRouter from './routes/chat.js'
import conversationsRouter from './routes/conversations.js'
import { connectToDatabase } from './services/database.js'

const openAiApiKey =
  process.env.OPEN_AI_API_KEY?.trim() || process.env.OPEN_AI_API_KEY?.trim()
const groqApiKey = process.env.GROQ_API_KEY?.trim()
if (!openAiApiKey && !groqApiKey) {
  throw new Error(
    'Configure OPEN_AI_API_KEY or GROQ_API_KEY in backend/.env before starting the API.',
  )
}
if (openAiApiKey) process.env.OPEN_AI_API_KEY = openAiApiKey
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters.')
}

const app = express()
const port = Number(process.env.PORT ?? 3001)

app.set('trust proxy', 1)
app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  }),
)
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' })
})

app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many authentication requests. Please try again later.' },
  }),
  authRouter,
)

app.use('/api/conversations', conversationsRouter)
app.use(
  '/api/chat',
  rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many chat requests. Please try again shortly.' },
  }),
  chatRouter,
)

const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  console.error('API request failed:', error instanceof Error ? error.name : 'Unknown error')
  if (response.headersSent) {
    next(error)
    return
  }
  response.status(500).json({ error: 'The server could not complete the request.' })
}
app.use(errorHandler)

await connectToDatabase()
app.listen(port, () => console.log(`Chat API listening on port ${port}`))
