import mongoose from 'mongoose'
import { Conversation } from '../models/Conversation.js'
import { Message } from '../models/Message.js'
import { User } from '../models/User.js'

const uri = process.env.MONGODB_URI?.trim() ?? ''
if (!uri) {
  throw new Error('MONGODB_URI is required. Add it to backend/.env.')
}

export async function connectToDatabase() {
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DATABASE ?? 'generative_ai',
  })
  await Promise.all([User.init(), Conversation.init(), Message.init()])
  console.log('Connected to MongoDB with Mongoose')
}
