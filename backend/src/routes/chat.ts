import { Router } from 'express'
import { sendMessage } from '../controllers/chatController.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.post('/', authenticate, sendMessage)

export default router
