import express, { Router } from 'express'
import {
  createCommentReply,
  createPostComment,
  createProject,
  getContent,
  getHealth,
  getPostEngagement,
  getProjectById,
  getPublishedAssets,
  getPublishedGames,
  getPublishedProjects,
  publishProject,
  togglePostLike,
  togglePostSave,
  uploadProjectFile,
  updateProject,
  updateContentEngagement,
  deleteProject,
} from '../controllers/contentController.js'
import { optionalProtect, protect } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/health', getHealth)
router.get('/content', optionalProtect, getContent)
router.get('/games', optionalProtect, getPublishedGames)
router.get('/assets', optionalProtect, getPublishedAssets)
router.get('/projects', optionalProtect, getPublishedProjects)
router.get('/projects/:projectId', optionalProtect, getProjectById)
router.get('/posts/:postId/engagement', protect, getPostEngagement)
router.post('/projects', protect, createProject)
router.patch('/projects/:projectId', protect, updateProject)
router.delete('/projects/:projectId', protect, deleteProject)
router.post('/posts/:postId/like', protect, togglePostLike)
router.post('/posts/:postId/save', protect, togglePostSave)
router.post('/posts/:postId/comments', protect, createPostComment)
router.post('/comments/:commentId/replies', protect, createCommentReply)
router.post('/content/:contentType/:contentId/engagement', protect, updateContentEngagement)
router.put(
  '/projects/:projectId/files',
  protect,
  express.raw({ type: 'application/octet-stream', limit: '150mb' }),
  uploadProjectFile,
)
router.post('/projects/:projectId/publish', protect, publishProject)

export default router
