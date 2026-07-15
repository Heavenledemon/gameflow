import { Router } from 'express'
import { createDirectConversation, getConversationMessages, listConversations, markConversationRead, sendConversationMessage } from '../controllers/messagingController.js'
import { protect } from '../middlewares/authMiddleware.js'
import { redisRateLimit } from '../middlewares/rateLimitMiddleware.js'

const router = Router()
const messageRateLimit = redisRateLimit({ bucket: 'conversation-message', limit: 30, windowSeconds: 60 })
router.get('/conversations', protect, listConversations)
router.post('/conversations/direct', protect, messageRateLimit, createDirectConversation)
router.get('/conversations/:conversationId/messages', protect, getConversationMessages)
router.post('/conversations/:conversationId/messages', protect, messageRateLimit, sendConversationMessage)
router.post('/conversations/:conversationId/read', protect, markConversationRead)
export default router
