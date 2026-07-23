import express, { Router } from 'express'
import { createStory, deleteStory, getStories } from '../controllers/storyController.js'
import { optionalProtect, protect } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/stories', optionalProtect, getStories)
router.post('/stories', protect, express.raw({ type: 'application/octet-stream', limit: '20mb' }), createStory)
router.delete('/stories/:storyId', protect, deleteStory)

export default router
