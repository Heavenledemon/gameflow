import { Router } from 'express'
import { getAnalyticsContent, getAnalyticsFootprints, getAnalyticsOverview, ingestAnalyticsEvents } from '../controllers/analyticsController.js'
import { optionalProtect, protect } from '../middlewares/authMiddleware.js'
import { redisRateLimit } from '../middlewares/rateLimitMiddleware.js'

const router = Router()
const ingestLimit = redisRateLimit({ bucket: 'analytics-ingest', limit: 120, windowSeconds: 60 })

router.post('/analytics/events', optionalProtect, ingestLimit, ingestAnalyticsEvents)
router.get('/analytics/overview', protect, getAnalyticsOverview)
router.get('/analytics/content', protect, getAnalyticsContent)
router.get('/analytics/footprints', protect, getAnalyticsFootprints)

export default router
