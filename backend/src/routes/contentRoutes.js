import express, { Router } from 'express'
import {
  createCommentReply,
  toggleCommentReaction,
  createPostComment,
  createProject,
  getContent,
  getContentComments,
  getHealth,
  getReadiness,
  getPostEngagement,
  getProjectLikes,
  getProjectById,
  getPublishedAssets,
  getPublishedGames,
  getPublishedProjects,
  publishProject,
  togglePostLike,
  togglePostSave,
  uploadProjectFile,
  initiateProjectUpload,
  completeProjectUpload,
  updateProject,
  updateContentEngagement,
  deleteProject,
} from '../controllers/contentController.js'
import { createCollaborationRequest, getPublicUser, listUserFollows, searchUsers } from '../controllers/socialController.js'
import { optionalProtect, protect } from '../middlewares/authMiddleware.js'
import { redisRateLimit } from '../middlewares/rateLimitMiddleware.js'
import { getFeed, getPost, getPostComments } from '../controllers/feedController.js'
import { deleteWorkspaceAsset, getAssetDownloadUrl, getWorkspace, listWorkspaceAssets, restoreWorkspaceAsset } from '../controllers/workspaceController.js'

const router = Router()

router.get('/health', getHealth)
router.get('/ready', getReadiness)
router.get('/content', optionalProtect, getContent)
router.get('/content/:contentType/:contentId/comments', optionalProtect, getContentComments)
router.get('/feed', optionalProtect, getFeed)
router.get('/games', optionalProtect, getPublishedGames)
router.get('/assets', optionalProtect, getPublishedAssets)
router.get('/users/search', optionalProtect, searchUsers)
router.get('/users/:identity', optionalProtect, getPublicUser)
router.get('/users/:userId/:kind', optionalProtect, listUserFollows)
router.get('/projects', optionalProtect, getPublishedProjects)
router.get('/projects/:projectId', optionalProtect, getProjectById)
router.get('/projects/:projectId/workspace', protect, getWorkspace)
router.get('/projects/:projectId/assets', protect, listWorkspaceAssets)
router.post('/projects/:projectId/assets/:assetId/download-url', protect, getAssetDownloadUrl)
router.delete('/projects/:projectId/assets/:assetId', protect, deleteWorkspaceAsset)
router.post('/projects/:projectId/assets/:assetId/restore', protect, restoreWorkspaceAsset)
router.get('/posts/:postId/engagement', protect, getPostEngagement)
router.get('/posts/:postId/likes', protect, getProjectLikes)
router.get('/posts/:postId/comments', optionalProtect, getPostComments)
router.get('/posts/:postId', optionalProtect, getPost)
router.post('/projects', protect, createProject)
router.patch('/projects/:projectId', protect, updateProject)
router.delete('/projects/:projectId', protect, deleteProject)
const engagementRateLimit = redisRateLimit({ bucket: 'engagement', limit: 60, windowSeconds: 60 })
const commentRateLimit = redisRateLimit({ bucket: 'comment', limit: 15, windowSeconds: 60 })

router.post('/posts/:postId/like', protect, engagementRateLimit, togglePostLike)
router.post('/posts/:postId/save', protect, engagementRateLimit, togglePostSave)
router.post('/posts/:postId/comments', protect, commentRateLimit, createPostComment)
router.post('/comments/:commentId/replies', protect, commentRateLimit, createCommentReply)
router.post('/comments/:commentId/reactions', protect, engagementRateLimit, toggleCommentReaction)
router.post('/content/:contentType/:contentId/engagement', protect, engagementRateLimit, updateContentEngagement)
router.put(
  '/projects/:projectId/files',
  protect,
  express.raw({ type: 'application/octet-stream', limit: '150mb' }),
  uploadProjectFile,
)
router.post('/projects/:projectId/uploads/initiate', protect, initiateProjectUpload)
router.post('/uploads/:uploadId/complete', protect, completeProjectUpload)
router.post('/projects/:projectId/publish', protect, publishProject)
router.post('/projects/:projectId/collaboration-requests', protect, engagementRateLimit, createCollaborationRequest)

export default router
