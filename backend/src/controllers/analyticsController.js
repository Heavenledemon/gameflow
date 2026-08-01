import crypto from 'node:crypto'
import mongoose from 'mongoose'
import asyncHandler from '../middlewares/asyncHandler.js'
import AnalyticsEvent, { ANALYTICS_EVENT_TYPES, ANALYTICS_SOURCES } from '../models/AnalyticsEvent.js'
import PostComment from '../models/PostComment.js'
import PostEngagement from '../models/PostEngagement.js'
import ProfileFootprint from '../models/ProfileFootprint.js'
import Project from '../models/Project.js'

const PERIOD_DAYS = { '7d': 7, '30d': 30, '90d': 90 }
const CONTENT_SORTS = new Set(['views', 'reach', 'interactions', 'likes', 'comments', 'saves', 'shares', 'newest'])
const PUBLIC_EVENT_TYPES = new Set(['content_impression', 'content_view', 'profile_visit', 'game_launch', 'game_load_success', 'game_session_end', 'video_play', 'video_progress', 'video_complete', 'asset_preview', 'external_link_click'])

function error(statusCode, message) { const value = new Error(message); value.statusCode = statusCode; return value }
function periodRange(value) {
  const period = PERIOD_DAYS[value] ? value : '30d'
  const days = PERIOD_DAYS[period]
  const end = new Date()
  const start = new Date(end.getTime() - days * 86400000)
  const previousStart = new Date(start.getTime() - days * 86400000)
  return { period, days, start, end, previousStart }
}
function hash(value) { return value ? crypto.createHash('sha256').update(String(value)).digest('hex') : '' }
function percentChange(value, previous) { return previous ? ((value - previous) / previous) * 100 : null }
function metric(value, previous = 0) { return { value, previous, change: percentChange(value, previous) } }
function contentType(project) {
  if (project.type === 'game') return 'game'
  if (project.type === 'video') return 'video'
  if (project.type === '3d' || project.type === '2d') return 'asset'
  return 'project'
}
function safeMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const allowed = ['progress', 'completed', 'loadState']
  return Object.fromEntries(allowed.filter((key) => ['string', 'number', 'boolean'].includes(typeof value[key])).map((key) => [key, value[key]]))
}

export function encodeContentCursor(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

export function decodeContentCursor(value) {
  if (!value) return null
  try {
    const parsed = JSON.parse(Buffer.from(String(value), 'base64url').toString('utf8'))
    if (!parsed || typeof parsed !== 'object' || !parsed.id || !parsed.sort || !parsed.period) return null
    return parsed
  } catch { return null }
}

function contentSortValue(item, sort) {
  if (sort === 'newest') return new Date(item.publishedAt || 0).getTime()
  return Number(item[sort] || 0)
}

function compareContent(a, b, sort) {
  const valueDifference = contentSortValue(b, sort) - contentSortValue(a, sort)
  if (valueDifference) return valueDifference
  const dateDifference = new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
  if (dateDifference) return dateDifference
  return String(b.id).localeCompare(String(a.id))
}

export function paginateAnalyticsContent(items, { period = '30d', sort = 'views', limit = 12, cursor = null } = {}) {
  const ordered = [...items].sort((a, b) => compareContent(a, b, sort))
  let startIndex = 0
  if (cursor) {
    const cursorIndex = ordered.findIndex((item) => String(item.id) === String(cursor.id))
    if (cursorIndex >= 0) startIndex = cursorIndex + 1
  }
  const page = ordered.slice(startIndex, startIndex + limit)
  const hasMore = startIndex + page.length < ordered.length
  const last = page.at(-1)
  return {
    items: page,
    hasMore,
    nextCursor: hasMore && last ? encodeContentCursor({ period, sort, value: contentSortValue(last, sort), publishedAt: last.publishedAt || null, id: last.id }) : null,
  }
}

export const ingestAnalyticsEvents = asyncHandler(async (request, response) => {
  const events = Array.isArray(request.body?.events) ? request.body.events : []
  if (!events.length || events.length > 20) throw error(400, 'Send between 1 and 20 analytics events.')
  const contentIds = [...new Set(events.map((item) => String(item.contentId || '')).filter(mongoose.isValidObjectId))]
  const projects = await Project.find({ _id: { $in: contentIds }, isPublished: true, visibility: 'public' }).select('ownerId type').lean()
  const projectMap = new Map(projects.map((project) => [String(project._id), project]))
  const now = Date.now()
  const rows = []
  for (const item of events) {
    const eventType = String(item.eventType || '')
    if (!PUBLIC_EVENT_TYPES.has(eventType) || !ANALYTICS_EVENT_TYPES.includes(eventType)) continue
    const project = projectMap.get(String(item.contentId || ''))
    if (!project || String(project.ownerId) === String(request.user?._id || '')) continue
    const occurredAt = new Date(item.occurredAt || now)
    if (!Number.isFinite(occurredAt.getTime()) || Math.abs(now - occurredAt.getTime()) > 10 * 60 * 1000) continue
    const anonymousToken = String(item.anonymousId || '').slice(0, 160)
    const sessionToken = String(item.sessionId || '').slice(0, 160)
    if (!request.user && !anonymousToken) continue
    rows.push({
      creatorId: project.ownerId,
      contentType: contentType(project),
      contentId: project._id,
      eventType,
      viewerId: request.user?._id || null,
      anonymousIdHash: request.user ? '' : hash(anonymousToken),
      sessionIdHash: hash(sessionToken || anonymousToken),
      source: ANALYTICS_SOURCES.includes(item.source) ? item.source : 'unknown',
      occurredAt,
      durationMs: Number.isFinite(Number(item.durationMs)) ? Math.max(0, Math.min(86400000, Number(item.durationMs))) : null,
      value: Number.isFinite(Number(item.value)) ? Number(item.value) : null,
      idempotencyKey: item.idempotencyKey ? hash(`${project._id}:${String(item.idempotencyKey).slice(0, 160)}`) : null,
      metadata: safeMetadata(item.metadata),
    })
  }
  if (rows.length) {
    try { await AnalyticsEvent.insertMany(rows, { ordered: false }) }
    catch (insertError) { if (insertError?.code !== 11000 && !insertError?.writeErrors?.every((entry) => entry.code === 11000)) throw insertError }
  }
  response.status(202).json({ accepted: rows.length })
})

async function eventSummary(creatorId, start, end) {
  const rows = await AnalyticsEvent.aggregate([
    { $match: { creatorId: new mongoose.Types.ObjectId(String(creatorId)), occurredAt: { $gte: start, $lt: end } } },
    { $group: { _id: '$eventType', count: { $sum: 1 }, viewers: { $addToSet: { $ifNull: ['$viewerId', '$anonymousIdHash'] } } } },
  ])
  const map = new Map(rows.map((row) => [row._id, { count: row.count, reach: row.viewers.filter(Boolean).length }]))
  return { views: map.get('content_view')?.count || 0, reach: map.get('content_view')?.reach || 0, impressions: map.get('content_impression')?.count || 0, profileVisits: map.get('profile_visit')?.count || 0, footprints: (map.get('footprint_created')?.count || 0) + (map.get('footprint_updated')?.count || 0) }
}

async function currentEngagement(ownerId) {
  const projects = await Project.find({ ownerId, isPublished: true, visibility: 'public' }).select('_id engagement title type imageUrl previewUrl videoUrl publishedAt').sort({ publishedAt: -1, createdAt: -1 }).lean()
  const ids = projects.map((project) => String(project._id))
  const [engagementRows, commentRows] = await Promise.all([
    PostEngagement.aggregate([{ $match: { contentType: 'project', contentId: { $in: ids } } }, { $group: { _id: '$contentId', likes: { $sum: { $cond: ['$liked', 1, 0] } }, saves: { $sum: { $cond: ['$saved', 1, 0] } } } }]),
    PostComment.aggregate([{ $match: { contentType: 'project', contentId: { $in: ids } } }, { $group: { _id: '$contentId', comments: { $sum: 1 } } }]),
  ])
  const engagementMap = new Map(engagementRows.map((row) => [String(row._id), row]))
  const commentMap = new Map(commentRows.map((row) => [String(row._id), row.comments]))
  return projects.map((project) => { const row = engagementMap.get(String(project._id)) || {}; const likes = row.likes || 0; const saves = row.saves || 0; const comments = commentMap.get(String(project._id)) || 0; const shares = Number(project.engagement?.sharesCount || 0); return { id: String(project._id), title: project.title, type: contentType(project), thumbnail: project.imageUrl || project.previewUrl || project.videoUrl || '', publishedAt: project.publishedAt, likes, comments, saves, shares, interactions: likes + comments + saves + shares } })
}

export const getAnalyticsOverview = asyncHandler(async (request, response) => {
  const range = periodRange(request.query.period)
  const [current, previous, content, trend] = await Promise.all([
    eventSummary(request.user._id, range.start, range.end),
    eventSummary(request.user._id, range.previousStart, range.start),
    currentEngagement(request.user._id),
    AnalyticsEvent.aggregate([{ $match: { creatorId: request.user._id, eventType: 'content_view', occurredAt: { $gte: range.start, $lt: range.end } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt' } }, value: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
  ])
  const interactions = content.reduce((sum, item) => sum + item.interactions, 0)
  response.json({ period: range.period, collectionStartedAt: null, metrics: { views: metric(current.views, previous.views), reach: metric(current.reach, previous.reach), impressions: metric(current.impressions, previous.impressions), profileVisits: metric(current.profileVisits, previous.profileVisits), footprints: metric(current.footprints, previous.footprints), interactions: metric(interactions, 0), engagementRate: { value: current.reach ? interactions / current.reach * 100 : null, previous: null, change: null } }, trend: trend.map((item) => ({ date: item._id, value: item.value })), topContent: content.sort((a, b) => b.interactions - a.interactions).slice(0, 5) })
})

export const getAnalyticsContent = asyncHandler(async (request, response) => {
  const range = periodRange(request.query.period)
  const sort = CONTENT_SORTS.has(request.query.sort) ? request.query.sort : 'views'
  const limit = Math.max(1, Math.min(30, Number.parseInt(request.query.limit, 10) || 12))
  const cursor = decodeContentCursor(request.query.cursor)
  if (request.query.cursor && (!cursor || cursor.period !== range.period || cursor.sort !== sort)) throw error(400, 'Invalid analytics content cursor.')
  const content = await currentEngagement(request.user._id)
  const eventRows = await AnalyticsEvent.aggregate([{ $match: { creatorId: request.user._id, contentId: { $ne: null }, occurredAt: { $gte: range.start, $lt: range.end } } }, { $group: { _id: { contentId: '$contentId', eventType: '$eventType' }, count: { $sum: 1 }, viewers: { $addToSet: { $ifNull: ['$viewerId', '$anonymousIdHash'] } } } }])
  const eventMap = new Map(eventRows.map((row) => [`${row._id.contentId}:${row._id.eventType}`, row]))
  const items = content.map((item) => { const view = eventMap.get(`${item.id}:content_view`); const impression = eventMap.get(`${item.id}:content_impression`); return { ...item, views: view?.count || 0, reach: view?.viewers.filter(Boolean).length || 0, impressions: impression?.count || 0, engagementRate: view?.viewers.filter(Boolean).length ? item.interactions / view.viewers.filter(Boolean).length * 100 : null } })
  const page = paginateAnalyticsContent(items, { period: range.period, sort, limit, cursor })
  response.json({ period: range.period, sort, ...page })
})

export const getAnalyticsFootprints = asyncHandler(async (request, response) => {
  const range = periodRange(request.query.period)
  const [events, active] = await Promise.all([
    AnalyticsEvent.aggregate([{ $match: { creatorId: request.user._id, eventType: { $in: ['footprint_created', 'footprint_updated'] }, occurredAt: { $gte: range.start, $lt: range.end } } }, { $group: { _id: { reaction: '$metadata.reaction', date: { $dateToString: { format: '%Y-%m-%d', date: '$occurredAt' } } }, count: { $sum: 1 } } }, { $sort: { '_id.date': 1 } }]),
    ProfileFootprint.find({ ownerId: request.user._id, isActive: true, hiddenByOwner: false, expiresAt: { $gt: new Date() } }).countDocuments(),
  ])
  const reactions = {}; const trend = {}
  for (const row of events) { const reaction = row._id.reaction || 'unknown'; reactions[reaction] = (reactions[reaction] || 0) + row.count; trend[row._id.date] = (trend[row._id.date] || 0) + row.count }
  response.json({ period: range.period, total: events.reduce((sum, row) => sum + row.count, 0), active, collaborationInterest: reactions.collaboration_interest || 0, reactions, trend: Object.entries(trend).map(([date, value]) => ({ date, value })) })
})

export async function recordAnalyticsEvent(event) {
  try { await AnalyticsEvent.create({ occurredAt: new Date(), ...event }) } catch { /* Analytics must not block product actions. */ }
}
