import { Router } from 'express'
import {
  getCurrentUser,
  signinUser,
  signupUser,
  updateCurrentUserProfile,
} from '../controllers/authController.js'
import { getCollaborationCandidates, toggleFollow } from '../controllers/socialController.js'
import { protect } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/signup', signupUser)
router.post('/signin', signinUser)
router.get('/me', protect, getCurrentUser)
router.put('/profile', protect, updateCurrentUserProfile)
router.get('/social/collaboration-candidates', protect, getCollaborationCandidates)
router.post('/social/users/:userId/follow', protect, toggleFollow)

export default router
