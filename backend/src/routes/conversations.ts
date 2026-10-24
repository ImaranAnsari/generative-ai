import { Router } from 'express'
import { getConversation, listConversations } from '../controllers/conversationsController.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()

router.use(authenticate)
router.get('/', listConversations)
router.get('/:id', getConversation)

export default router
