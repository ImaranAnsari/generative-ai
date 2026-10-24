import { compare, hash } from 'bcryptjs'
import type { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { User } from '../models/User.js'

const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform((email) => email.toLowerCase()),
  password: z.string().min(8).refine((password) => Buffer.byteLength(password, 'utf8') <= 72),
})

function createToken(userId: string) {
  return jwt.sign({}, process.env.JWT_SECRET!, { subject: userId, expiresIn: '7d' })
}

function parseCredentials(request: Request, response: Response) {
  const parsed = credentialsSchema.safeParse(request.body)
  if (!parsed.success) {
    response.status(400).json({
      error: 'Enter a valid email and a password of at least 8 characters (72 bytes maximum).',
    })
    return null
  }
  return parsed.data
}

export async function register(request: Request, response: Response) {
  const credentials = parseCredentials(request, response)
  if (!credentials) return

  try {
    const user = await User.create({
      email: credentials.email,
      passwordHash: await hash(credentials.password, 12),
    })
    response.status(201).json({
      token: createToken(user.id),
      user: { email: user.email },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      response.status(409).json({ error: 'An account with this email already exists.' })
      return
    }
    throw error
  }
}

export async function login(request: Request, response: Response) {
  const credentials = parseCredentials(request, response)
  if (!credentials) return

  const user = await User.findOne({ email: credentials.email })
  if (!user || !(await compare(credentials.password, user.passwordHash))) {
    response.status(401).json({ error: 'Email or password is incorrect.' })
    return
  }
  response.json({
    token: createToken(user.id),
    user: { email: user.email },
  })
}

export async function getCurrentUser(request: Request, response: Response) {
  const user = await User.findById(request.userId).select('email').lean()
  if (!user) {
    response.status(401).json({ error: 'Your account could not be found. Please sign in again.' })
    return
  }
  response.json({ user: { email: user.email } })
}
