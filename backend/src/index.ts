import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import chatRouter from './routes/chat.js'

const apiKey = process.env.OPENAI_API_KEY?.trim()
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required. Add it to backend/.env.')
}

const app = express()
const port = Number(process.env.PORT ?? 3001)

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

app.listen(port, () => {
  console.log(`Chat API listening on http://localhost:${port}`)
})
