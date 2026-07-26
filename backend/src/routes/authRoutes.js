import { Router } from 'express'
import {
  getCurrentUser,
  signinUser,
  signinWithGoogle,
  signupUser,
  updateCurrentUserProfile,
} from '../controllers/authController.js'
import { getCollaborationCandidates, toggleFollow } from '../controllers/socialController.js'
import { createReport, toggleBlock } from '../controllers/moderationController.js'
import { protect } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/signup', signupUser)
router.post('/signin', signinUser)
router.post('/google', signinWithGoogle)
router.get('/me', protect, getCurrentUser)
router.put('/profile', protect, updateCurrentUserProfile)
router.get('/social/collaboration-candidates', protect, getCollaborationCandidates)
router.post('/social/users/:userId/follow', protect, toggleFollow)
router.post('/social/users/:userId/block', protect, toggleBlock)
router.post('/social/reports', protect, createReport)

export default router
