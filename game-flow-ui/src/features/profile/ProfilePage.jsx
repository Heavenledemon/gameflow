import { useCallback, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { fetchContent, togglePostLike, updateContentEngagement, updateProject, deleteProject, uploadProjectFile } from '../../lib/content'
import { fetchMyCollaborations } from '../../lib/collaboration'
import { fetchStories, getViewedStoryIds, markStoryViewed } from '../../lib/stories'
import { useMessagingRealtime } from '../../hooks/useMessagingRealtime'
import GuestBanner from '../../components/layout/GuestBanner'
import GuestToast from '../../components/layout/GuestToast'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/Overlay'
import { EmptyState, ErrorState } from '../../components/ui/Feedback'
import ProjectGrid from '../discovery/components/ProjectGrid'
import CreatorHeader from './components/CreatorHeader'
import StoryViewer from '../discovery/components/StoryViewer'
import PortfolioTabs from './components/PortfolioTabs'
import { ProfileActions, ProjectManagementMenu } from './components/ProfileActions'
import EditProfileForm from './components/EditProfileForm'
import ProjectManagementSheet from './components/ProjectManagementSheet'
import { contentCollections, mapPortfolioItems } from './profileAdapters'
import './ProfilePage.css'

function engagement(item) {
  return item?.engagement || {}
}

function commentedBy(item, username) {
  const check = (comment) => String(comment.username || '').toLowerCase() === String(username || '').toLowerCase() || (comment.replies || []).some(check)
  return Boolean(username && (engagement(item).comments || []).some(check))
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { isGuest, logout, user, updateProfile, token } = useAuth()
  const userId = user?.id || user?._id
  const { success, error: showError } = useToast()
  const [collection, setCollection] = useState(() => contentCollections())
  const [collaborations, setCollaborations] = useState([])
  const [status, setStatus] = useState(isGuest ? 'ready' : 'loading')
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState('projects')
  const [guestAction, setGuestAction] = useState('')
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [savingProject, setSavingProject] = useState(false)
  const [deletingProject, setDeletingProject] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [activeStories, setActiveStories] = useState([])
  const [storyOpen, setStoryOpen] = useState(false)
  const [viewedStoryIds, setViewedStoryIds] = useState(getViewedStoryIds)
  const activeStory = activeStories[0] || null

  const loadContent = useCallback(async () => {
    if (isGuest || !user) return
    try {
      const data = await fetchContent(token)
      setCollection(contentCollections(data))
      setStatus('ready')
    } catch (error) {
      setLoadError(error.message || 'Unable to load your portfolio.')
      setStatus('error')
    }
  }, [isGuest, token, user])

  const loadCollaborations = useCallback(async () => {
    if (isGuest || !token) return
    try { const data = await fetchMyCollaborations(token); setCollaborations(data.items || []) }
    catch { setCollaborations([]) }
  }, [isGuest, token])

  useEffect(() => {
    if (isGuest || !user) return undefined
    const controller = new AbortController()
    fetchContent(token, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return
      setCollection(contentCollections(data))
      setStatus('ready')
    }).catch((error) => {
      if (error?.name === 'AbortError') return
      setLoadError(error.message || 'Unable to load your portfolio.')
      setStatus('error')
    })
    fetchMyCollaborations(token, { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted) setCollaborations(data.items || [])
    }).catch(() => {})
    return () => controller.abort()
  }, [isGuest, token, user])

  useEffect(() => {
    if (isGuest || !userId) return undefined
    const controller = new AbortController()
    fetchStories(token, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return
      setActiveStories((data.items || []).filter((story) => String(story.creator?.id) === String(userId)))
    }).catch(() => { if (!controller.signal.aborted) setActiveStories([]) })
    return () => controller.abort()
  }, [isGuest, token, userId])
  const handleRealtime = useCallback((eventName) => { if (eventName.startsWith('project.member.')) loadCollaborations() }, [loadCollaborations])
  useMessagingRealtime(token, { onEvent: handleRealtime, onReady: loadCollaborations })

  const ownedRaw = useMemo(() => collection.projects.filter((project) => String(project.ownerId) === String(userId)), [collection.projects, userId])
  const projects = useMemo(() => mapPortfolioItems(ownedRaw), [ownedRaw])
  const games = useMemo(() => projects.filter((project) => project.media.kind === 'webgl' || String(project.projectType).toLowerCase() === 'game'), [projects])
  const assets = useMemo(() => projects.filter((project) => project.media.kind === 'gltf' || ['3d', 'asset'].includes(String(project.projectType).toLowerCase())), [projects])
  const allContent = useMemo(() => [
    ...collection.projects.map((item) => ({ raw: item, kind: 'project' })),
    ...collection.games.map((item) => ({ raw: item, kind: 'game' })),
    ...collection.assets.map((item) => ({ raw: item, kind: 'asset' })),
  ], [collection])
  const mapEntries = (entries) => entries.map(({ raw, kind }) => mapPortfolioItems([raw], kind)[0])
  const liked = useMemo(() => mapEntries(allContent.filter(({ raw }) => engagement(raw).viewerHasLiked || engagement(raw).isLiked)), [allContent])
  const saved = useMemo(() => mapEntries(allContent.filter(({ raw }) => engagement(raw).viewerHasSaved || engagement(raw).isSaved)), [allContent])
  const commented = useMemo(() => mapEntries(allContent.filter(({ raw }) => commentedBy(raw, user?.username))), [allContent, user?.username])
  const collaborationProjects = useMemo(() => collaborations.map((entry) => ({ ...entry.project, id: entry.projectId })), [collaborations])
  const collaborationModels = useMemo(() => mapPortfolioItems(collaborationProjects), [collaborationProjects])

  const tabs = [
    { id: 'projects', label: 'Projects', count: projects.length, projects },
    ...(games.length ? [{ id: 'games', label: 'Games', count: games.length, projects: games }] : []),
    ...(assets.length ? [{ id: 'assets', label: 'Assets', count: assets.length, projects: assets }] : []),
    ...(collaborationModels.length ? [{ id: 'collaborations', label: 'Collaborations', count: collaborationModels.length, projects: collaborationModels }] : []),
    ...(saved.length ? [{ id: 'saved', label: 'Saved', count: saved.length, projects: saved }] : []),
    ...(liked.length ? [{ id: 'liked', label: 'Liked', count: liked.length, projects: liked }] : []),
    ...(commented.length ? [{ id: 'comments', label: 'Comments', count: commented.length, projects: commented }] : []),
  ]
  const selectedTab = tabs.find((tab) => tab.id === activeTab) || tabs[0]

  const creator = {
    id: userId, name: user?.name || (isGuest ? 'Guest' : null), username: user?.username, avatar: user?.avatar,
    banner: user?.banner, verified: Boolean(user?.isVerified), role: user?.creatorType, headline: user?.headline,
    location: user?.location, bio: user?.bio, description: user?.description, website: user?.website, skills: user?.skills || [],
    tools: [...new Set([...(user?.tools || []), ...projects.flatMap((project) => project.tools)])], platforms: user?.platforms || [], collaborationOpen: typeof user?.collaborationOpen === 'boolean' ? user.collaborationOpen : null,
    socialLinks: [
      ['GitHub', user?.github], ['Itch.io', user?.itchio], ['Behance', user?.behance], ['ArtStation', user?.artstation], ['Instagram', user?.instagram], ['LinkedIn', user?.linkedin],
    ].filter(([, url]) => url).map(([label, url]) => ({ label, url })),
  }
  const stats = [
    { label: 'Projects', value: projects.length },
    { label: 'Followers', value: user?.followersCount ?? 0 },
    { label: 'Following', value: user?.followingCount ?? 0 },
  ]

  const shareProfile = async () => {
    try { await navigator.clipboard.writeText(window.location.href); success('Profile link copied.') }
    catch { window.prompt('Copy this profile link', window.location.href) }
  }
  const openActiveStory = () => {
    if (!activeStory) return
    setViewedStoryIds((current) => {
      if (current.has(activeStory.id)) return current
      return markStoryViewed(activeStory.id)
    })
    setStoryOpen(true)
  }
  const retryContent = () => { setStatus('loading'); setLoadError(''); loadContent() }
  const openEdit = () => isGuest ? setGuestAction('edit your profile') : setEditingProfile(true)
  const saveProfile = async (payload) => {
    setSavingProfile(true)
    try { await updateProfile(payload); setEditingProfile(false); success('Profile updated successfully.') }
    catch (error) { showError(error.message || 'Failed to update profile.') }
    finally { setSavingProfile(false) }
  }
  const originalProject = (model) => ownedRaw.find((project) => String(project.id || project._id) === String(model.rawIds.sourceId || model.projectId))
  const saveProject = async (payload, previewFile) => {
    const projectId = editingProject.id || editingProject._id
    setSavingProject(true)
    try {
      if (previewFile) await uploadProjectFile(token, projectId, { name: previewFile.name, relativePath: `cover/${previewFile.name}`, mimeType: previewFile.type || '' }, previewFile)
      await updateProject(token, projectId, payload)
      setEditingProject(null)
      await loadContent()
      success('Project updated successfully.')
    } catch (error) { showError(error.message || 'Failed to update project.') }
    finally { setSavingProject(false) }
  }
  const deleteOwnedProject = async () => {
    if (!deletingProject || deleting) return
    setDeleting(true)
    try { await deleteProject(token, deletingProject.id || deletingProject._id); setDeletingProject(null); await loadContent(); success('Project deleted successfully.') }
    catch (error) { showError(error.message || 'Failed to delete project.') }
    finally { setDeleting(false) }
  }
  const clearLiked = async () => {
    if (!liked.length || !window.confirm('Remove all liked items from your profile?')) return
    try {
      await Promise.all(allContent.filter(({ raw }) => engagement(raw).viewerHasLiked || engagement(raw).isLiked).map(({ raw, kind }) => {
        const id = raw._id || raw.id || raw.contentId
        return kind === 'project' ? togglePostLike(token, id) : updateContentEngagement(token, kind, id, { action: 'react' })
      }))
      setActiveTab('projects')
      await loadContent()
    } catch (error) { showError(error.message || 'Unable to remove liked items.') }
  }

  return <main className="profile-page">
    {isGuest ? <GuestBanner onSignIn={() => navigate('/signin')} /> : null}
    <CreatorHeader
      creator={creator}
      stats={stats}
      capability="self"
      hasActiveStory={Boolean(activeStory)}
      storyViewed={Boolean(activeStory && viewedStoryIds.has(activeStory.id))}
      onStoryOpen={activeStory ? openActiveStory : undefined}
      onBack={() => navigate('/app/home')}
      onShare={shareProfile}
      onMore={() => setLogoutOpen(true)}
      moreLabel="Log out"
      actions={<ProfileActions capability="self" onEdit={openEdit} />}
    />
    {storyOpen && activeStories.length ? <StoryViewer stories={activeStories} onClose={() => setStoryOpen(false)} /> : null}
    <section className="portfolio" aria-labelledby="portfolio-heading">
      <h2 id="portfolio-heading" className="gf-sr-only">Creator portfolio</h2>
      <PortfolioTabs tabs={tabs} selected={selectedTab.id} onSelect={setActiveTab} panelId="profile-portfolio-panel" />
      <div id="profile-portfolio-panel" role="tabpanel" aria-label={`${selectedTab.label} portfolio`} className="portfolio__panel">
        {selectedTab.id === 'liked' && liked.length ? <Button className="portfolio__clear" variant="secondary" onClick={clearLiked}>Clear liked items</Button> : null}
        {status === 'error' ? <ErrorState title="Portfolio unavailable" description={loadError} onRetry={retryContent} /> : null}
        {status === 'ready' && selectedTab.projects.length === 0 ? <EmptyState title="No projects published yet" description={isGuest ? 'Sign in to manage your creator portfolio.' : 'Publish a game, asset, or artwork to start your portfolio.'} actionLabel={isGuest ? undefined : 'Publish first project'} onAction={isGuest ? undefined : () => navigate('/app/upload')} /> : null}
        {status !== 'error' && selectedTab.projects.length ? <ProjectGrid projects={selectedTab.projects} loading={status === 'loading'} onOpenProject={(project) => navigate(project.routeTarget)} renderActions={(model) => {
          const raw = originalProject(model)
          return raw ? <ProjectManagementMenu projectTitle={model.title} onEdit={() => setEditingProject(raw)} onDelete={() => setDeletingProject(raw)} /> : null
        }} /> : status === 'loading' ? <ProjectGrid projects={[]} loading /> : null}
      </div>
    </section>
    {guestAction ? <GuestToast message={`Sign in to ${guestAction}.`} onSignIn={() => navigate('/signin')} onDismiss={() => setGuestAction('')} /> : null}
    {editingProfile ? <EditProfileForm open user={user} saving={savingProfile} onClose={() => setEditingProfile(false)} onSave={saveProfile} /> : null}
    {editingProject ? <ProjectManagementSheet project={editingProject} saving={savingProject} onClose={() => setEditingProject(null)} onSave={saveProject} /> : null}
    <ConfirmDialog open={Boolean(deletingProject)} title="Delete project?" description={deletingProject?.title} message="This permanently deletes the project and cannot be undone." confirmLabel="Delete project" confirmLoading={deleting} onConfirm={deleteOwnedProject} onClose={() => !deleting && setDeletingProject(null)} />
    <ConfirmDialog open={logoutOpen} title="Log out?" message="You will need to sign in again to manage your portfolio." confirmLabel="Log out" confirmVariant="danger" onConfirm={() => { logout(); navigate('/signin') }} onClose={() => setLogoutOpen(false)} />
  </main>
}
