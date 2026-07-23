import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { fetchContent, toggleUserFollow } from '../../lib/content'
import { createDirectConversation } from '../../lib/messaging'
import { createModerationReport, toggleUserBlock } from '../../lib/moderation'
import GuestToast from '../../components/layout/GuestToast'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog, Sheet } from '../../components/ui/Overlay'
import { EmptyState, ErrorState } from '../../components/ui/Feedback'
import ProjectGrid from '../discovery/components/ProjectGrid'
import CreatorHeader from './components/CreatorHeader'
import PortfolioTabs from './components/PortfolioTabs'
import { ProfileActions } from './components/ProfileActions'
import { contentCollections, creatorFromPortfolio, mapPortfolioItems, matchesCreator } from './profileAdapters'
import './ProfilePage.css'

export default function CreatorProfilePage() {
  const navigate = useNavigate()
  const { creatorId } = useParams()
  const { isGuest, token } = useAuth()
  const { success, error: showError } = useToast()
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [portfolioEntries, setPortfolioEntries] = useState([])
  const [activeTab, setActiveTab] = useState('projects')
  const [following, setFollowing] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)
  const [guestAction, setGuestAction] = useState('')
  const [safetyOpen, setSafetyOpen] = useState(false)
  const [blockConfirm, setBlockConfirm] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const loadPortfolio = useCallback(async () => {
    try {
      const data = contentCollections(await fetchContent(token))
      setPortfolioEntries([
        ...data.projects.filter((item) => matchesCreator(item, creatorId)).map((raw) => ({ raw, kind: 'project' })),
        ...data.games.filter((item) => matchesCreator(item, creatorId)).map((raw) => ({ raw, kind: 'game' })),
        ...data.assets.filter((item) => matchesCreator(item, creatorId)).map((raw) => ({ raw, kind: 'asset' })),
      ])
      setStatus('ready')
    } catch (error) {
      setLoadError(error.message || 'Unable to load this creator portfolio.')
      setStatus('error')
    }
  }, [creatorId, token])
  useEffect(() => {
    const controller = new AbortController()
    fetchContent(token, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return
      const collections = contentCollections(data)
      setPortfolioEntries([
        ...collections.projects.filter((item) => matchesCreator(item, creatorId)).map((raw) => ({ raw, kind: 'project' })),
        ...collections.games.filter((item) => matchesCreator(item, creatorId)).map((raw) => ({ raw, kind: 'game' })),
        ...collections.assets.filter((item) => matchesCreator(item, creatorId)).map((raw) => ({ raw, kind: 'asset' })),
      ])
      setStatus('ready')
    }).catch((error) => {
      if (error?.name === 'AbortError') return
      setLoadError(error.message || 'Unable to load this creator portfolio.')
      setStatus('error')
    })
    return () => controller.abort()
  }, [creatorId, token])

  const mappedEntries = useMemo(() => portfolioEntries.map(({ raw, kind }) => ({ raw, kind, model: mapPortfolioItems([raw], kind)[0] })), [portfolioEntries])
  const projects = mappedEntries.filter((entry) => entry.kind === 'project').map((entry) => entry.model)
  const games = mappedEntries.filter((entry) => entry.kind === 'game' || entry.model.media.kind === 'webgl').map((entry) => entry.model)
  const assets = mappedEntries.filter((entry) => entry.kind === 'asset' || entry.model.media.kind === 'gltf').map((entry) => entry.model)
  const creatorBase = creatorFromPortfolio(mappedEntries[0]?.raw, mappedEntries[0]?.model, creatorId)
  const creator = { ...creatorBase, tools: [...new Set([...(creatorBase.tools || []), ...mappedEntries.flatMap((entry) => entry.model.tools)])] }
  const tabs = [
    ...(projects.length || (!games.length && !assets.length) ? [{ id: 'projects', label: 'Projects', count: projects.length, projects }] : []),
    ...(games.length ? [{ id: 'games', label: 'Games', count: games.length, projects: games }] : []),
    ...(assets.length ? [{ id: 'assets', label: 'Assets', count: assets.length, projects: assets }] : []),
  ]
  const selectedTab = tabs.find((tab) => tab.id === activeTab) || tabs[0]
  const targetId = creator.id || (/^[a-f\d]{24}$/i.test(String(creatorId || '')) ? creatorId : null)
  const stats = [{ label: 'Portfolio', value: mappedEntries.length }, { label: 'Followers', value: creator.followersCount }, { label: 'Following', value: creator.followingCount }, { label: 'Views', value: creator.viewsCount }]

  const guestGate = (action, callback) => {
    if (isGuest) { setGuestAction(action); return }
    callback()
  }
  const followCreator = () => guestGate('follow creators', async () => {
    if (!targetId || actionBusy) return
    const previous = following
    setFollowing(!previous)
    setActionBusy(true)
    try { const result = await toggleUserFollow(token, targetId); setFollowing(Boolean(result.following)) }
    catch (error) { setFollowing(previous); showError(error.message || 'Unable to update follow status.') }
    finally { setActionBusy(false) }
  })
  const messageCreator = () => guestGate('message creators', async () => {
    if (blocked || actionBusy) return
    setActionBusy(true)
    try {
      const result = await createDirectConversation(token, targetId || creator.username || creatorId)
      navigate(`/app/inbox/${result.conversation.id}`, { state: { conversation: result.conversation, moderationTarget: result.conversation.recipient } })
    } catch (error) { showError(error.message || 'Unable to open a conversation.') }
    finally { setActionBusy(false) }
  })
  const shareProfile = async () => {
    try { await navigator.clipboard.writeText(window.location.href); success('Profile link copied.') }
    catch { window.prompt('Copy this profile link', window.location.href) }
  }
  const retryPortfolio = () => { setStatus('loading'); setLoadError(''); loadPortfolio() }
  const toggleBlock = async () => {
    if (!targetId || actionBusy) return
    setActionBusy(true)
    try { const result = await toggleUserBlock(token, targetId); setBlocked(Boolean(result.blocked)); setSafetyOpen(false); success(result.blocked ? 'Creator blocked.' : 'Creator unblocked.') }
    catch (error) { showError(error.message || 'Unable to update this block.') }
    finally { setActionBusy(false) }
  }
  const reportCreator = async () => {
    if (!targetId || !reportReason.trim() || actionBusy) return
    setActionBusy(true)
    try { await createModerationReport(token, { targetUserId: targetId, reason: reportReason.trim(), contextType: 'user', contextId: targetId }); setReportReason(''); setSafetyOpen(false); success('Report submitted.') }
    catch (error) { showError(error.message || 'Unable to submit this report.') }
    finally { setActionBusy(false) }
  }

  if (status === 'error') return <main className="profile-page profile-page--state"><ErrorState title="Creator unavailable" description={loadError} onRetry={retryPortfolio} /><Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button></main>

  return <main className="profile-page">
    <CreatorHeader
      creator={creator}
      stats={stats}
      capability="public"
      onBack={() => navigate(-1)}
      onShare={shareProfile}
      onMore={() => guestGate('manage safety settings', () => setSafetyOpen(true))}
      moreLabel="Creator safety options"
      actions={<ProfileActions capability="public" following={following} blocked={blocked} busy={actionBusy} onFollow={targetId ? followCreator : undefined} onMessage={messageCreator} />}
    />
    <section className="portfolio" aria-labelledby="portfolio-heading">
      <h2 id="portfolio-heading" className="gf-sr-only">Creator portfolio</h2>
      <PortfolioTabs tabs={tabs} selected={selectedTab.id} onSelect={setActiveTab} panelId="creator-portfolio-panel" />
      <div id="creator-portfolio-panel" role="tabpanel" aria-label={`${selectedTab.label} portfolio`} className="portfolio__panel">
        {status === 'loading' ? <ProjectGrid projects={[]} loading /> : null}
        {status === 'ready' && selectedTab.projects.length ? <ProjectGrid projects={selectedTab.projects} onOpenProject={(project) => navigate(project.routeTarget)} /> : null}
        {status === 'ready' && !selectedTab.projects.length ? <EmptyState title="No public projects found" description="This route has no public portfolio items in the current content collection." /> : null}
      </div>
    </section>
    {guestAction ? <GuestToast message={`Sign in to ${guestAction}.`} onSignIn={() => navigate('/signin')} onDismiss={() => setGuestAction('')} /> : null}
    <Sheet open={safetyOpen} title="Safety options" description={creator.username ? `@${creator.username}` : 'Creator'} onClose={() => !actionBusy && setSafetyOpen(false)}>
      {!targetId ? <p className="profile-safety__notice">Safety actions require a creator account ID. The current content only supplies a username, so no request can be sent.</p> : <div className="profile-safety"><Button variant="danger" disabled={actionBusy} onClick={() => setBlockConfirm(true)}>{blocked ? 'Unblock creator' : 'Block creator'}</Button><label>Report concern<textarea className="gf-input gf-textarea" maxLength={500} value={reportReason} onChange={(event) => setReportReason(event.target.value)} /></label><Button loading={actionBusy} disabled={!reportReason.trim()} onClick={reportCreator}>Submit report</Button></div>}
    </Sheet>
    <ConfirmDialog open={blockConfirm} title={blocked ? 'Unblock creator?' : 'Block creator?'} message={blocked ? 'You will be able to message this creator again.' : 'Blocking prevents new direct conversations with this creator.'} confirmLabel={blocked ? 'Unblock' : 'Block'} confirmLoading={actionBusy} onConfirm={toggleBlock} onClose={() => !actionBusy && setBlockConfirm(false)} />
  </main>
}
