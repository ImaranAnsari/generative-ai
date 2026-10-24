import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

declare global {
  namespace Express {
    interface Request {
      userId: string
    }
  }
}

export function authenticate(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1]
  if (!token) {
    response.status(401).json({ error: 'Sign in to continue.' })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!)
    if (typeof payload === 'string' || typeof payload.sub !== 'string') {
      response.status(401).json({ error: 'Your session is invalid. Please sign in again.' })
      return
    }
    request.userId = payload.sub
    next()
  } catch {
    response.status(401).json({ error: 'Your session has expired. Please sign in again.' })
  }
}
