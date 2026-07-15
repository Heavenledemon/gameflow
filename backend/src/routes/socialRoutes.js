import { Router } from 'express'
import {
  acceptCollaborationRequest,
  cancelCollaborationRequest,
  createCollaborationRequest,
  declineCollaborationRequest,
  getCollaborationRequest,
  listCollaborationRequests,
} from '../controllers/socialController.js'
import { listMyCollaborations, listProjectMembers, removeProjectMember, updateProjectMember } from '../controllers/projectMemberController.js'
import { protect } from '../middlewares/authMiddleware.js'
import { redisRateLimit } from '../middlewares/rateLimitMiddleware.js'

const router = Router()
const requestRateLimit = redisRateLimit({ bucket: 'collaboration-request', limit: 20, windowSeconds: 60 })

router.get('/collaboration/requests', protect, listCollaborationRequests)
router.get('/collaboration/projects', protect, listMyCollaborations)
router.get('/collaboration/requests/:requestId', protect, getCollaborationRequest)
router.post('/collaboration/requests/:requestId/accept', protect, requestRateLimit, acceptCollaborationRequest)
router.post('/collaboration/requests/:requestId/decline', protect, requestRateLimit, declineCollaborationRequest)
router.post('/collaboration/requests/:requestId/cancel', protect, requestRateLimit, cancelCollaborationRequest)
router.post('/projects/:projectId/collaboration-requests', protect, requestRateLimit, createCollaborationRequest)
router.get('/projects/:projectId/members', protect, listProjectMembers)
router.patch('/projects/:projectId/members/:userId', protect, requestRateLimit, updateProjectMember)
router.delete('/projects/:projectId/members/:userId', protect, requestRateLimit, removeProjectMember)

export default router
