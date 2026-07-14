import mongoose from 'mongoose'
import FeedItem from '../models/FeedItem.js'
import Project from '../models/Project.js'
import PostEngagement from '../models/PostEngagement.js'
import PostComment from '../models/PostComment.js'
import CommentReaction from '../models/CommentReaction.js'
import asyncHandler from '../middlewares/asyncHandler.js'
import { clampFeedLimit, decodeFeedCursor, encodeFeedCursor } from '../utils/feedCursor.js'

function createError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

async function viewerState(items, viewerId) {
  const state = new Map(items.map((item) => [item.feedId, { viewerHasLiked: false, viewerHasSaved: false }]))
  if (!viewerId) return state

  const projectIds = items.filter((item) => item.contentType === 'project').map((item) => item.contentId)
  const gameIds = items.filter((item) => item.contentType === 'game').map((item) => item.contentId)
  const assetIds = items.filter((item) => item.contentType === 'asset').map((item) => item.contentId)
  const rows = await PostEngagement.find({ userId: viewerId, $or: [
    ...(projectIds.length ? [{ contentType: 'project', contentId: { $in: projectIds } }] : []),
    ...(gameIds.length ? [{ contentType: 'game', contentId: { $in: gameIds } }] : []),
    ...(assetIds.length ? [{ contentType: 'asset', contentId: { $in: assetIds } }] : []),
  ] }).select('contentType contentId liked saved').lean()
  for (const row of rows) state.set(`${row.contentType}:${row.contentId}`, { viewerHasLiked: Boolean(row.liked), viewerHasSaved: Boolean(row.saved) })
  return state
}

function toFeedDto(item, state) {
  return {
    feedId: item.feedId, type: item.contentType, createdAt: item.publishedAt, rank: item.rank,
    creator: item.creator,
    title: item.title, description: item.description, tags: item.tags, software: item.software, mode: item.mode,
    media: item.media,
    engagement: { ...(item.engagement || {}), ...(state.get(item.feedId) || {}) },
    version: item.version,
  }
}

export const getFeed = asyncHandler(async (request, response) => {
  const limit = clampFeedLimit(request.query.limit)
  const cursor = decodeFeedCursor(request.query.cursor)
  const query = { visibility: 'public', isPublished: true }
  if (cursor) {
    query.$or = [
      { publishedAt: { $lt: cursor.publishedAt } },
      { publishedAt: cursor.publishedAt, _id: { $lt: new mongoose.Types.ObjectId(cursor.id) } },
    ]
  }
  const rows = await FeedItem.find(query).sort({ publishedAt: -1, _id: -1 }).limit(limit + 1).lean()
  const hasMore = rows.length > limit
  const items = rows.slice(0, limit)
  const state = await viewerState(items, request.user?._id ? String(request.user._id) : '')
  response.json({
    items: items.map((item) => toFeedDto(item, state)),
    nextCursor: hasMore ? encodeFeedCursor(items.at(-1)) : null,
    serverTime: new Date().toISOString(),
  })
})

export const getPost = asyncHandler(async (request, response) => {
  const post = await Project.findById(request.params.postId).lean()
  if (!post || (!post.isPublished && String(post.ownerId) !== String(request.user?._id || ''))) throw createError(404, 'Post not found.')
  response.json({ post })
})

export const getPostComments = asyncHandler(async (request, response) => {
  const postId = request.params.postId
  if (!mongoose.isValidObjectId(postId)) throw createError(400, 'Invalid post ID.')
  const limit = Math.min(30, Math.max(1, Number.parseInt(request.query.limit, 10) || 30))
  const cursor = decodeFeedCursor(request.query.cursor)
  const query = { contentType: 'project', contentId: String(postId), parentCommentId: null }
  if (cursor) query.$or = [{ createdAt: { $lt: cursor.publishedAt } }, { createdAt: cursor.publishedAt, _id: { $lt: new mongoose.Types.ObjectId(cursor.id) } }]
  const rows = await PostComment.find(query).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean()
  const comments = rows.slice(0, limit)
  const replies = comments.length
    ? await PostComment.find({ contentType: 'project', contentId: String(postId), parentCommentId: { $ne: null } }).sort({ createdAt: 1, _id: 1 }).lean()
    : []
  const repliesByParent = new Map()
  for (const reply of replies) {
    const parentId = String(reply.parentCommentId)
    repliesByParent.set(parentId, [...(repliesByParent.get(parentId) || []), { ...reply, commentId: String(reply._id) }])
  }
  const allCommentIds = [...comments, ...replies].map((comment) => comment._id)
  const reactionRows = allCommentIds.length ? await CommentReaction.aggregate([{ $match: { commentId: { $in: allCommentIds } } }, { $group: { _id: { commentId: '$commentId', emoji: '$emoji' }, count: { $sum: 1 } } }]) : []
  const reactionsByComment = new Map()
  for (const row of reactionRows) {
    const key = String(row._id.commentId)
    reactionsByComment.set(key, { ...(reactionsByComment.get(key) || {}), [row._id.emoji]: row.count })
  }
  const viewerRows = request.user?._id && allCommentIds.length ? await CommentReaction.find({ commentId: { $in: allCommentIds }, userId: request.user._id }).lean() : []
  const viewerByComment = new Map(viewerRows.map((row) => [String(row.commentId), row.emoji]))
  const withReplies = (comment) => ({
    ...comment,
    commentId: String(comment._id),
    reactions: reactionsByComment.get(String(comment._id)) || {},
    viewerReaction: viewerByComment.get(String(comment._id)) || null,
    replies: (repliesByParent.get(String(comment._id)) || []).map(withReplies),
  })
  response.json({
    items: comments.map(withReplies),
    nextCursor: rows.length > limit ? encodeFeedCursor({ publishedAt: comments.at(-1).createdAt, _id: comments.at(-1)._id }) : null,
  })
})
