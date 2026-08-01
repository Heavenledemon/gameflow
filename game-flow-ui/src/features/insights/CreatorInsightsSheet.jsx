import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Sheet } from '../../components/ui/Overlay'
import Avatar from '../../components/ui/Avatar'
import { INSIGHTS_PERIODS, fetchAnalyticsContent, fetchAnalyticsFootprints, fetchAnalyticsOverview } from '../../lib/analytics'
import { FOOTPRINT_REACTIONS } from '../../lib/footprints'
import './insights.css'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'content', label: 'Content' },
  { id: 'footprints', label: 'Footprints' },
]

const METRIC_LABELS = { views: 'Views', reach: 'Accounts reached', impressions: 'Impressions', interactions: 'Interactions', engagementRate: 'Engagement rate', profileVisits: 'Profile visits' }
const reactionLabel = (id) => FOOTPRINT_REACTIONS.find((item) => item.id === id)?.label || id.replaceAll('_', ' ')
const format = (value, percent = false) => value == null ? '—' : percent ? `${Number(value).toFixed(1)}%` : Number(value).toLocaleString()

function MetricCard({ name, metric }) {
  const percent = name === 'engagementRate'
  return <article className="insights-metric"><span>{METRIC_LABELS[name]}</span><strong>{format(metric?.value, percent)}</strong>{metric?.change == null ? <small>Collecting comparison data</small> : <small className={metric.change >= 0 ? 'is-positive' : 'is-negative'}>{metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}% vs previous period</small>}</article>
}

function MiniTrend({ items = [] }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  if (!items.length) return <div className="insights-empty"><strong>No trend data yet</strong><p>Views will appear here as people discover your work.</p></div>
  return <div className="insights-trend" aria-label="Views over time">{items.map((item) => <div key={item.date} title={`${item.date}: ${item.value} views`}><span style={{ height: `${Math.max(8, item.value / max * 100)}%` }} /><small>{item.date.slice(5)}</small></div>)}</div>
}

function ContentList({ items, onOpen, hasMore = false, loadingMore = false, loadMoreError = '', onLoadMore }) {
  const sentinelRef = useRef(null)
  useEffect(() => {
    const target = sentinelRef.current
    if (!target || !hasMore || loadingMore || loadMoreError) return undefined
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onLoadMore?.()
    }, { rootMargin: '180px 0px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [hasMore, loadMoreError, loadingMore, onLoadMore])
  if (!items?.length && loadMoreError) return <div className="insights-empty" role="alert"><strong>Published content unavailable</strong><p>{loadMoreError}</p><button type="button" className="insights-retry-button" onClick={onLoadMore}>Try again</button></div>
  if (!items?.length) return <div className="insights-empty"><strong>No published content yet</strong><p>Publish a project to begin measuring performance.</p></div>
  return <div className="insights-content-list">{items.map((item) => <button type="button" key={item.id} onClick={() => onOpen?.(item)}><span className="insights-content-list__thumb">{item.thumbnail ? <img src={item.thumbnail} alt="" /> : <i aria-hidden="true">◇</i>}</span><span className="insights-content-list__title"><strong>{item.title}</strong><small>{item.type} · {item.views || 0} views · {item.interactions} interactions</small></span><span aria-hidden="true">›</span></button>)}<div ref={sentinelRef} className="insights-content-list__sentinel" aria-hidden="true" />{loadingMore ? <div className="insights-content-list__loading" aria-live="polite"><span className="gf-spinner" aria-hidden="true" /> Loading more content…</div> : null}{loadMoreError ? <div className="insights-content-list__retry" role="alert"><span>{loadMoreError}</span><button type="button" onClick={onLoadMore}>Try again</button></div> : null}{!hasMore && items.length ? <p className="insights-content-list__end">You’ve reached the end.</p> : null}</div>
}

function PostInsights({ item, onBack }) {
  return <section className="insights-post"><button type="button" className="insights-back" onClick={onBack}>← All content</button><div className="insights-post__heading">{item.thumbnail ? <img src={item.thumbnail} alt="" /> : null}<div><small>{item.type}</small><h3>{item.title}</h3></div></div><div className="insights-metrics"><article className="insights-metric"><span>Views</span><strong>{format(item.views)}</strong></article><article className="insights-metric"><span>Accounts reached</span><strong>{format(item.reach)}</strong></article><article className="insights-metric"><span>Interactions</span><strong>{format(item.interactions)}</strong></article><article className="insights-metric"><span>Engagement rate</span><strong>{format(item.engagementRate, true)}</strong></article></div><div className="insights-breakdown"><h3>Interactions</h3>{[['Likes', item.likes], ['Comments', item.comments], ['Saves', item.saves], ['Shares', item.shares]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{format(value)}</strong></div>)}</div><p className="insights-note">Reach and view history starts when Creator Insights tracking is enabled. Current engagement totals remain all-time.</p></section>
}

export default function CreatorInsightsSheet({ open, initialTab = 'overview', token, footprints = [], footprintsLoading = false, onClose, onFootprintsViewed, onOpenVisitor }) {
  const [tab, setTab] = useState(initialTab)
  const [period, setPeriod] = useState('30d')
  const [status, setStatus] = useState('idle')
  const [data, setData] = useState({ overview: null, content: null, footprints: null })
  const [selectedContent, setSelectedContent] = useState(null)
  const [error, setError] = useState('')
  const [contentSort, setContentSort] = useState('views')
  const [contentItems, setContentItems] = useState([])
  const [contentCursor, setContentCursor] = useState('')
  const [contentHasMore, setContentHasMore] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)
  const [contentLoadMoreError, setContentLoadMoreError] = useState('')

  useEffect(() => { if (open && tab === 'footprints') onFootprintsViewed?.() }, [open, tab, onFootprintsViewed])
  useEffect(() => {
    if (!open || !token) return undefined
    const controller = new AbortController()
    if (tab === 'content') return () => controller.abort()
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) { setStatus('loading'); setError('') }
    })
    const loader = tab === 'footprints' ? fetchAnalyticsFootprints(token, period, { signal: controller.signal }) : fetchAnalyticsOverview(token, period, { signal: controller.signal })
    loader.then((result) => { if (!controller.signal.aborted) { setData((current) => ({ ...current, [tab]: result })); setStatus('ready') } }).catch((requestError) => { if (requestError?.name !== 'AbortError' && !controller.signal.aborted) { setError(requestError.message || 'Unable to load insights.'); setStatus('error') } })
    return () => controller.abort()
  }, [open, period, tab, token])

  const loadContentPage = useCallback(async ({ reset = false, signal } = {}) => {
    if (!open || !token || contentLoading || (!reset && !contentHasMore)) return
    setContentLoading(true); setContentLoadMoreError('')
    try {
      const result = await fetchAnalyticsContent(token, { period, sort: contentSort, limit: 12, cursor: reset ? '' : contentCursor }, signal ? { signal } : {})
      if (signal?.aborted) return
      setContentItems((current) => {
        const combined = reset ? result.items || [] : [...current, ...(result.items || [])]
        return [...new Map(combined.map((item) => [String(item.id), item])).values()]
      })
      setContentCursor(result.nextCursor || '')
      setContentHasMore(Boolean(result.hasMore))
    } catch (requestError) {
      if (requestError?.name !== 'AbortError' && !signal?.aborted) setContentLoadMoreError(requestError.message || 'Unable to load more content.')
    } finally { if (!signal?.aborted) setContentLoading(false) }
  }, [contentCursor, contentHasMore, contentLoading, contentSort, open, period, token])

  useEffect(() => {
    if (!open || tab !== 'content') return undefined
    const controller = new AbortController()
    Promise.resolve().then(() => {
      if (!controller.signal.aborted) {
        setContentItems([]); setContentCursor(''); setContentHasMore(true); setContentLoadMoreError('')
        setContentLoading(true)
        fetchAnalyticsContent(token, { period, sort: contentSort, limit: 12 }, { signal: controller.signal }).then((result) => {
          if (controller.signal.aborted) return
          setContentItems(result.items || [])
          setContentCursor(result.nextCursor || '')
          setContentHasMore(Boolean(result.hasMore))
        }).catch((requestError) => {
          if (requestError?.name !== 'AbortError' && !controller.signal.aborted) setContentLoadMoreError(requestError.message || 'Unable to load published content.')
        }).finally(() => { if (!controller.signal.aborted) setContentLoading(false) })
      }
    })
    return () => controller.abort()
  }, [contentSort, open, period, tab, token])

  const reactionRows = useMemo(() => Object.entries(data.footprints?.reactions || {}).sort((a, b) => b[1] - a[1]), [data.footprints])
  return <Sheet open={open} title="Creator Insights" description="Understand how people discover and engage with your work." onClose={onClose} className="creator-insights-sheet" contentClassName="creator-insights">
    <nav className="insights-tabs" aria-label="Insights sections">
      <div
        className="insights-tabs__indicator"
        style={{
          transform: `translateX(${TABS.findIndex((item) => item.id === tab) * 100}%)`,
        }}
      />
      {TABS.map((item) => <button type="button" key={item.id} className={tab === item.id ? 'is-active' : ''} aria-current={tab === item.id ? 'page' : undefined} onClick={() => { setTab(item.id); setSelectedContent(null) }}>{item.label}{item.id === 'footprints' && footprints.some((entry) => entry.unread) ? <i aria-label="New footprints" /> : null}</button>)}
    </nav>
    <div className="insights-toolbar"><label><span>Time period</span><select value={period} onChange={(event) => setPeriod(event.target.value)}>{INSIGHTS_PERIODS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
    {status === 'loading' ? <p className="insights-state">Loading insights…</p> : null}
    {status === 'error' ? <div className="insights-empty"><strong>Insights unavailable</strong><p>{error}</p></div> : null}
    {status !== 'error' && tab === 'overview' && data.overview ? <section><div className="insights-metrics">{Object.keys(METRIC_LABELS).map((name) => <MetricCard key={name} name={name} metric={data.overview.metrics?.[name]} />)}</div><div className="insights-panel"><h3>Views over time</h3><MiniTrend items={data.overview.trend} /></div><div className="insights-panel"><h3>Top content</h3><ContentList items={data.overview.topContent} onOpen={(item) => { setData((current) => ({ ...current, content: { items: [item] } })); setSelectedContent(item); setTab('content') }} /></div><p className="insights-note">Time-based analytics begin when tracking is enabled. Engagement totals are all-time.</p></section> : null}
    {tab === 'content' ? selectedContent ? <PostInsights item={selectedContent} onBack={() => setSelectedContent(null)} /> : <section><div className="insights-content-controls"><label><span>Sort published content</span><select value={contentSort} onChange={(event) => setContentSort(event.target.value)}><option value="views">Most viewed</option><option value="reach">Most reached</option><option value="interactions">Most engaging</option><option value="likes">Most liked</option><option value="saves">Most saved</option><option value="shares">Most shared</option><option value="newest">Newest</option></select></label></div><div className="insights-panel insights-panel--flush"><h3>Published content</h3>{contentLoading && !contentItems.length ? <p className="insights-state">Loading published content…</p> : <ContentList items={contentItems} onOpen={setSelectedContent} hasMore={contentHasMore} loadingMore={contentLoading} loadMoreError={contentLoadMoreError} onLoadMore={() => loadContentPage()} />}</div></section> : null}
    {status !== 'error' && tab === 'footprints' ? <section><div className="insights-metrics"><article className="insights-metric"><span>Period footprints</span><strong>{format(data.footprints?.total || 0)}</strong></article><article className="insights-metric"><span>Currently visible</span><strong>{format(data.footprints?.active || footprints.length)}</strong></article><article className="insights-metric"><span>Collaboration interest</span><strong>{format(data.footprints?.collaborationInterest || 0)}</strong></article></div>{reactionRows.length ? <div className="insights-breakdown"><h3>Reactions</h3>{reactionRows.map(([reaction, count]) => <div key={reaction}><span>{reactionLabel(reaction)}</span><strong>{count}</strong></div>)}</div> : null}<div className="insights-panel"><h3>Recent footprints</h3>{footprintsLoading ? <p className="insights-state">Checking for footprints…</p> : !footprints.length ? <div className="insights-empty"><strong>No footprints yet</strong><p>Only visitors who deliberately choose to be seen appear here.</p></div> : <div className="insights-visitors">{footprints.map((item) => <button type="button" key={item.id} onClick={() => onOpenVisitor?.(item.visitor)}><Avatar src={item.visitor.avatar} name={item.visitor.name || item.visitor.username} alt="" size="sm"/><span><strong>{item.visitor.name || item.visitor.username}</strong><small>@{item.visitor.username} · {reactionLabel(item.reaction)}</small></span>{item.unread ? <i>New</i> : null}</button>)}</div>}</div><p className="insights-note">Historical footprint charts are aggregate. Visitor identities disappear when active footprints expire.</p></section> : null}
  </Sheet>
}
