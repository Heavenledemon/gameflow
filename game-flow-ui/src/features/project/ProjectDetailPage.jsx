import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useProjectRealtime } from '../../hooks/useProjectRealtime'
import { useProjectMembers } from '../../hooks/useProjectMembers'
import { useConversations } from '../../hooks/useConversations'
import { useInbox } from '../../hooks/useInbox'
import { useMessagingRealtime } from '../../hooks/useMessagingRealtime'
import {
  createCommentReply,
  createPostComment,
  fetchPostComments,
  fetchProject,
  toggleCommentReaction,
  togglePostLike,
  togglePostSave,
  updateContentEngagement,
  deleteProject,
  updateProject,
  createCollaborationRequest,
  fetchCollaborationCandidates,
  toggleUserFollow,
} from '../../lib/content'
import { removeProjectMember, updateProjectMember } from '../../lib/collaboration'
import { fromProject } from './model/projectCardModel'
import ProjectMedia from './components/ProjectMedia'
import ProjectIdentity from './components/ProjectIdentity'
import ProjectMeta from './components/ProjectMeta'
import ProjectActions from './components/ProjectActions'
import CollaborationPanel from './components/CollaborationPanel'
import ProjectWorkspace from './components/ProjectWorkspace'
import ProjectComments from './components/ProjectComments'
import GuestBanner from '../../components/layout/GuestBanner'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Surface'
import { ErrorState, Skeleton } from '../../components/ui/Feedback'
import { Sheet, ConfirmDialog } from '../../components/ui/Overlay'
import './ProjectDetailPage.css'

export default function ProjectDetailPage() {
  const navigate = useNavigate()
  const { projectId } = useParams()
  const { isGuest, user, token } = useAuth()
  const { success: showSuccess, error: showError, info: showInfo } = useToast()
  const [project, setProject] = useState(null)
  const [loadState, setLoadState] = useState({ status: 'loading', error: '' })
  const [resolvedProjectId, setResolvedProjectId] = useState('')
  const [commentText, setCommentText] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentsStatus, setCommentsStatus] = useState('idle')
  const [commentError, setCommentError] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const [showOwnerSheet, setShowOwnerSheet] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [metadataExpanded, setMetadataExpanded] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [showCollaborationSheet, setShowCollaborationSheet] = useState(false)
  const [collaborationCandidates, setCollaborationCandidates] = useState([])
  const [selectedCollaborator, setSelectedCollaborator] = useState(null)
  const [collaborationMessage, setCollaborationMessage] = useState('')
  const [collaborationError, setCollaborationError] = useState('')
  const [isLoadingCollaborators, setIsLoadingCollaborators] = useState(false)
  const [isSendingCollaborationRequest, setIsSendingCollaborationRequest] = useState(false)
  const [showGuestAuthSheet, setShowGuestAuthSheet] = useState(false)
  const [showMembersSheet, setShowMembersSheet] = useState(false)
  const [pendingRoleChange, setPendingRoleChange] = useState(null)
  const [pendingRemoval, setPendingRemoval] = useState(null)
  const [memberActionId, setMemberActionId] = useState('')
  const [isOpeningWorkspace, setIsOpeningWorkspace] = useState(false)
  const [localProjectRequest, setLocalProjectRequest] = useState(null)
  const [mediaActivationRequested, setMediaActivationRequested] = useState(false)
  const mediaRegionRef = useRef(null)
  const localIdRef = useRef(0)
  const clearMediaActivation = useCallback(() => setMediaActivationRequested(false), [])

  const syncProject = useCallback((updatedContent) => {
    if (!updatedContent) return
    setProject((previous) => previous ? {
      ...previous,
      ...updatedContent,
      engagement: { ...(previous.engagement || {}), ...(updatedContent.engagement || {}) },
    } : updatedContent)
  }, [])

  const loadProject = useCallback(async () => {
    setLoadState({ status: 'loading', error: '' })
    try {
      const data = await fetchProject(projectId, token)
      if (data?.project) {
        setProject(data.project)
        setIsFollowing(Boolean(data.project.viewerIsFollowing))
        setLoadState({ status: 'ready', error: '' })
      } else {
        setProject(null)
        setLoadState({ status: 'not-found', error: '' })
      }
      setResolvedProjectId(projectId)
    } catch (error) {
      setLoadState({ status: 'error', error: error.message || 'Failed to load project details.' })
      setResolvedProjectId(projectId)
    }
  }, [projectId, token])

  useEffect(() => {
    let current = true
    fetchProject(projectId, token).then((data) => {
      if (!current) return
      if (data?.project) {
        setProject(data.project)
        setIsFollowing(Boolean(data.project.viewerIsFollowing))
        setLoadState({ status: 'ready', error: '' })
      } else {
        setProject(null)
        setLoadState({ status: 'not-found', error: '' })
      }
      setResolvedProjectId(projectId)
    }).catch((error) => {
      if (!current) return
      setLoadState({ status: 'error', error: error.message || 'Failed to load project details.' })
      setResolvedProjectId(projectId)
    })
    return () => { current = false }
  }, [projectId, token])

  const normalizedOwner = String(project?.ownerUsername || '').trim().toLowerCase()
  const normalizedViewer = String(user?.username || '').trim().toLowerCase()
  const viewerId = user?.id || user?._id
  const isOwner = Boolean(project && user && ((project.ownerId && String(project.ownerId) === String(viewerId)) || (normalizedOwner && normalizedOwner === normalizedViewer)))
  const viewerRole = project?.viewerRole || (isOwner ? 'owner' : '')
  const isActiveMember = Boolean(viewerRole)

  useEffect(() => {
    const syncFollow = (event) => {
      if (String(event.detail?.userId || '') === String(project?.ownerId || '')) setIsFollowing(Boolean(event.detail?.following))
    }
    window.addEventListener('gameflow:follow-changed', syncFollow)
    return () => window.removeEventListener('gameflow:follow-changed', syncFollow)
  }, [project?.ownerId])
  const canManageMembers = isOwner || ['owner', 'editor'].includes(viewerRole)
  const members = useProjectMembers(token, projectId, { enabled: Boolean(token && isActiveMember) })
  const conversations = useConversations(token, { enabled: Boolean(token && isActiveMember) })
  const outgoingRequests = useInbox(token, 'outgoing')

  const reloadProjectAccess = useCallback(async () => {
    try {
      const data = await fetchProject(projectId, token)
      if (data?.project) syncProject(data.project)
    } catch {
      // The next protected request remains authoritative after access changes.
    }
  }, [projectId, syncProject, token])

  const handleEngagementUpdate = useCallback((data) => data?.engagement && syncProject({ engagement: data.engagement }), [syncProject])
  useProjectRealtime(projectId, token, { onEngagementUpdated: handleEngagementUpdate, onReconnected: reloadProjectAccess })

  const reloadMembers = members.reload
  const reloadConversations = conversations.reload
  const handleMessagingEvent = useCallback((eventName, event) => {
    if (!eventName.startsWith('project.member.') || String(event?.projectId) !== String(projectId)) return
    reloadMembers()
    reloadConversations()
    reloadProjectAccess()
  }, [projectId, reloadConversations, reloadMembers, reloadProjectAccess])
  useMessagingRealtime(token, { onEvent: handleMessagingEvent, onReady: reloadProjectAccess })

  const guard = (action) => (...args) => {
    if (isGuest) setShowGuestAuthSheet(true)
    else action(...args)
  }

  const engagement = project?.engagement || {}
  const comments = Array.isArray(engagement.comments) ? engagement.comments : []
  const liked = Boolean(engagement.viewerHasLiked ?? engagement.isLiked)
  const saved = Boolean(engagement.viewerHasSaved ?? engagement.isSaved)

  const mutateEngagement = async (action, payload = {}) => {
    if (isGuest) { setShowGuestAuthSheet(true); return }
    if (action === 'react' || action === 'save') {
      const previous = engagement
      const isLike = action === 'react'
      syncProject({ engagement: {
        ...engagement,
        ...(isLike ? { viewerHasLiked: !liked, isLiked: !liked, likesCount: Math.max(0, Number(engagement.likesCount || 0) + (liked ? -1 : 1)) } : { viewerHasSaved: !saved, isSaved: !saved, savesCount: Math.max(0, Number(engagement.savesCount || 0) + (saved ? -1 : 1)) }),
      } })
      try {
        const result = isLike ? await togglePostLike(token, projectId) : await togglePostSave(token, projectId)
        syncProject({ engagement: result.engagement })
      } catch (error) {
        syncProject({ engagement: previous })
        showError(error.message || `Unable to ${isLike ? 'like' : 'save'} this project.`)
      }
      return
    }
    const result = await updateContentEngagement(token, 'project', projectId, { action, ...payload })
    syncProject(result.content)
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); showSuccess('Project link copied.') }
      else window.prompt('Copy this link', url)
    } catch { window.prompt('Copy this link', url) }
    if (!isGuest) {
      try { await mutateEngagement('share') } catch { /* Sharing the URL already succeeded. */ }
    }
  }

  const beginCollaborationRequest = () => {
    if (isSendingCollaborationRequest) return false
    setIsSendingCollaborationRequest(true)
    return true
  }
  const finishCollaborationRequest = () => {
    setIsSendingCollaborationRequest(false)
  }

  const openCollaborationPicker = async () => {
    setShowCollaborationSheet(true)
    setCollaborationError('')
    setIsLoadingCollaborators(true)
    try {
      const data = await fetchCollaborationCandidates(token)
      setCollaborationCandidates(Array.isArray(data?.candidates) ? data.candidates : [])
    } catch (error) { setCollaborationError(error.message || 'Unable to load your connections.') }
    finally { setIsLoadingCollaborators(false) }
  }

  const sendCollaborationRequest = async () => {
    if (!selectedCollaborator || !beginCollaborationRequest()) return
    setCollaborationError('')
    try {
      const result = await createCollaborationRequest(token, projectId, { recipientId: selectedCollaborator.id, message: collaborationMessage.trim() })
      setLocalProjectRequest(result.request || null)
      showSuccess(`Invitation sent to @${selectedCollaborator.username}.`)
      setShowCollaborationSheet(false)
      setSelectedCollaborator(null)
      setCollaborationMessage('')
    } catch (error) { setCollaborationError(error.message || 'Unable to send the collaboration request.') }
    finally { finishCollaborationRequest() }
  }

  const requestToCollaborate = async () => {
    if (!beginCollaborationRequest()) return
    try {
      const result = await createCollaborationRequest(token, projectId, { proposedRole: 'contributor', message: '' })
      setLocalProjectRequest(result.request || null)
      showSuccess('Collaboration request sent. You can track it in Inbox.')
    } catch (error) { showError(error.message || 'Unable to send collaboration request.') }
    finally { finishCollaborationRequest() }
  }

  const toggleFollowing = async () => {
    if (!project?.ownerId) return
    const previous = isFollowing
    setIsFollowing(!previous)
    try { const result = await toggleUserFollow(token, project.ownerId); setIsFollowing(Boolean(result.following)) }
    catch (error) { setIsFollowing(previous); showError(error.message || 'Unable to update follow status.') }
  }

  const projectRequest = localProjectRequest || outgoingRequests.items.find((request) => String(request.projectId) === String(projectId))
  const workspaceConversation = conversations.items.find((conversation) => conversation.kind === 'project' && String(conversation.projectId) === String(projectId))
  const openRequest = () => projectRequest?.conversationId && navigate(`/app/inbox/${projectRequest.conversationId}`, { state: { conversation: { id: projectRequest.conversationId, kind: 'collaboration_request', projectId, collaborationRequestId: projectRequest.id }, request: projectRequest } })

  const openWorkspace = async () => {
    if (!isActiveMember || isOpeningWorkspace) return
    setIsOpeningWorkspace(true)
    try {
      const conversation = workspaceConversation || await conversations.findProjectConversation(projectId)
      if (!conversation) { showInfo('Your workspace is still being prepared. You can find it in Inbox when it is ready.'); return }
      navigate(`/app/inbox/${conversation.id}`, { state: { conversation } })
    } catch (error) { showError(error.message || 'Unable to open the project workspace.') }
    finally { setIsOpeningWorkspace(false) }
  }

  const applyRoleChange = async () => {
    const change = pendingRoleChange
    if (!change) return
    setMemberActionId(change.member.userId)
    try {
      const result = await updateProjectMember(token, projectId, change.member.userId, change.role)
      members.setItems((items) => items.map((member) => member.userId === change.member.userId ? result.member : member))
      showSuccess(`@${change.member.username || 'member'} is now a ${change.role}.`)
    } catch (error) { showError(error.message || 'Unable to update this member role.') }
    finally { setMemberActionId(''); setPendingRoleChange(null) }
  }

  const removeMember = async () => {
    const member = pendingRemoval
    if (!member) return
    setMemberActionId(member.userId)
    try {
      await removeProjectMember(token, projectId, member.userId)
      members.setItems((items) => items.filter((item) => item.userId !== member.userId))
      showSuccess(`@${member.username || 'member'} was removed from this project.`)
    } catch (error) { showError(error.message || 'Unable to remove this member.') }
    finally { setMemberActionId(''); setPendingRemoval(null) }
  }

  const handleCommentSubmit = async (event) => {
    event.preventDefault()
    if (isGuest) { setShowGuestAuthSheet(true); return }
    if (!commentText.trim() || isSubmittingComment) return
    setIsSubmittingComment(true)
    setCommentError('')
    const previous = engagement
    const submittedText = commentText.trim()
    if (replyTarget) {
      try {
        const replyId = replyTarget.commentId || replyTarget._id
        const result = await createCommentReply(token, replyId, { text: submittedText })
        const confirmedReply = { commentId: `reply-${++localIdRef.current}`, userId: viewerId || 'me', username: user?.username || 'me', name: user?.name || 'Me', avatar: user?.avatar, text: submittedText, createdAt: new Date().toISOString(), replies: [] }
        const appendReply = (items) => items.map((item) => String(item.commentId || item._id) === String(replyId)
          ? { ...item, replies: [...(item.replies || []), confirmedReply] }
          : { ...item, replies: appendReply(item.replies || []) })
        syncProject({ engagement: { ...engagement, ...result.engagement, comments: appendReply(comments) } })
        setCommentText('')
        setReplyTarget(null)
      } catch (error) { setCommentError(error.message || 'Could not post your reply. Please try again.') }
      finally { setIsSubmittingComment(false) }
      return
    }
    localIdRef.current += 1
    const optimisticComment = { commentId: `optimistic-${localIdRef.current}`, userId: viewerId || 'me', username: user?.username || 'me', name: user?.name || 'Me', avatar: user?.avatar, text: submittedText, createdAt: new Date().toISOString(), replies: [] }
    syncProject({ engagement: { ...engagement, commentsCount: Number(engagement.commentsCount || 0) + 1, comments: [optimisticComment, ...comments] } })
    try {
      const result = await createPostComment(token, projectId, { text: submittedText })
      syncProject({ engagement: { ...result.engagement, comments: [optimisticComment, ...comments] } })
      setCommentText('')
    } catch (error) { syncProject({ engagement: previous }); setCommentError(error.message || 'Could not post your comment. Your text is still here - try again.') }
    finally { setIsSubmittingComment(false) }
  }

  const loadComments = useCallback(async () => {
    setCommentsStatus('loading')
    setCommentError('')
    try {
      const result = await fetchPostComments(token, projectId)
      syncProject({ engagement: { comments: result.items || [] } })
      setCommentsStatus('ready')
    } catch (error) {
      setCommentError(error.message || 'Failed to load comments.')
      setCommentsStatus('error')
    }
  }, [projectId, syncProject, token])

  const openComments = () => {
    setShowComments(true)
    setReplyTarget(null)
    loadComments()
  }

  const handleCommentReaction = async (comment, emoji) => {
    if (isGuest) { setShowGuestAuthSheet(true); return }
    const commentId = comment.commentId || comment._id
    setCommentError('')
    try {
      const result = await toggleCommentReaction(token, commentId, emoji)
      const updateTree = (items) => items.map((item) => String(item.commentId || item._id) === String(commentId)
        ? { ...item, reactions: result.reactions, viewerReaction: result.viewerReaction }
        : { ...item, replies: updateTree(item.replies || []) })
      syncProject({ engagement: { ...engagement, comments: updateTree(comments) } })
    } catch (error) { setCommentError(error.message || 'Could not add a reaction.') }
  }

  const handleDeleteConfirm = async () => {
    try { await deleteProject(token, projectId); showSuccess('Project deleted successfully.'); navigate('/app/profile') }
    catch (error) { showError(error.message || 'Failed to delete project.') }
  }

  const toggleVisibility = async () => {
    try {
      const updated = await updateProject(token, projectId, { visibility: project.visibility === 'public' ? 'private' : 'public' })
      syncProject(updated.project)
      showSuccess(`Project is now ${updated.project.visibility}.`)
    } catch (error) { showError(error.message || 'Failed to update visibility.') }
  }

  if (resolvedProjectId !== projectId || loadState.status === 'loading') return <main className="project-detail project-detail--state"><Skeleton className="project-detail__media-skeleton" /><Skeleton height="28px" width="70%" /><Skeleton height="92px" /></main>
  if (loadState.status !== 'ready' || !project) return <main className="project-detail project-detail--state"><ErrorState title={loadState.status === 'not-found' ? 'Project not found' : 'Project unavailable'} description={loadState.error || 'This project could not be found.'} onRetry={loadState.status === 'error' ? loadProject : undefined} actionLabel="Go back" /><Button variant="secondary" onClick={() => navigate(-1)}>Go back</Button></main>

  const model = fromProject(project)
  const creatorRole = project.type === 'game' ? 'Game Developer' : project.type === '3d' ? '3D Artist' : '2D Artist'
  const creatorTarget = () => isOwner ? navigate('/app/profile') : navigate(`/app/creator/${project.ownerUsername || 'creator'}`)
  const primaryMediaAction = () => {
    mediaRegionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    if (['webgl', 'gltf'].includes(model.media.kind)) setMediaActivationRequested(true)
    else window.requestAnimationFrame(() => mediaRegionRef.current?.querySelector('video, button, [tabindex]')?.focus())
  }
  const collaborationLabel = isActiveMember ? 'Open workspace' : isOwner ? 'Invite collaborator' : projectRequest ? 'Request sent' : 'Collaborate'
  const collaborationAllowed = isActiveMember || isOwner || Boolean(projectRequest) || model.collaboration.open === true
  const collaborationAction = isActiveMember ? openWorkspace : isOwner ? openCollaborationPicker : projectRequest ? openRequest : requestToCollaborate

  return (
    <main className={`project-detail ${showComments ? 'project-detail--comments-open' : ''}`}>
      {isGuest ? <GuestBanner onSignIn={() => navigate('/signin')} /> : null}
      <div className="project-detail__layout">
        <div className="project-detail__main">
          <section id="project-media" ref={mediaRegionRef} className="project-detail__media" aria-label="Project preview">
            <ProjectMedia media={model.media} title={model.title} active interactive activationRequested={mediaActivationRequested} onDeactivate={clearMediaActivation} />
            <span className="project-detail__media-badge">{model.projectType || model.category || 'Project'}</span>
          </section>
          <ProjectIdentity model={model} creatorRole={creatorRole} isOwner={isOwner} viewer={user} isFollowing={isFollowing} onBack={() => navigate(-1)} onCreator={creatorTarget} onFollow={guard(toggleFollowing)} onManage={() => setShowOwnerSheet(true)} />
          <div className="project-detail__content">
            <ProjectMeta model={model} project={project} expanded={metadataExpanded} onToggle={() => setMetadataExpanded((value) => !value)} />
            <ProjectActions
              model={model}
              liked={liked}
              saved={saved}
              canViewFiles={isOwner || isActiveMember}
              onViewFiles={isOwner || isActiveMember ? openWorkspace : undefined}
              collaborationLabel={collaborationLabel}
              collaborationAllowed={collaborationAllowed}
              collaborationBusy={isSendingCollaborationRequest || isOpeningWorkspace}
              onPrimary={primaryMediaAction}
              onLike={() => mutateEngagement('react')}
              onComments={openComments}
              onSave={() => mutateEngagement('save')}
              onCollaboration={guard(collaborationAction)}
              onShare={handleShare}
            />
            <ProjectWorkspace
              open={showMembersSheet}
              viewerRole={viewerRole}
              members={members}
              canManageMembers={canManageMembers}
              viewerId={viewerId}
              isOwner={isOwner}
              memberActionId={memberActionId}
              openingWorkspace={isOpeningWorkspace}
              onOpen={() => setShowMembersSheet(true)}
              onClose={() => setShowMembersSheet(false)}
              onOpenWorkspace={openWorkspace}
              onRoleChange={(member, role) => setPendingRoleChange({ member, role })}
              onRemove={setPendingRemoval}
            />
            <CollaborationPanel
              isOwner={isOwner}
              collaborationOpen={model.collaboration.open === true}
              request={projectRequest}
              busy={isSendingCollaborationRequest}
              members={members.items}
              openRoles={project.roles || []}
              onInvite={guard(openCollaborationPicker)}
              onRequest={guard(requestToCollaborate)}
              onOpenRequest={openRequest}
            />
            {typeof project.viewsCount === 'number' ? <p className="project-detail__views">{project.viewsCount.toLocaleString()} views</p> : null}
          </div>
        </div>
        <ProjectComments open={showComments} title={model.title} comments={comments} status={commentsStatus} error={commentError} viewer={user} isGuest={isGuest} draft={commentText} replyTarget={replyTarget} submitting={isSubmittingComment} onClose={() => setShowComments(false)} onRetry={loadComments} onDraftChange={setCommentText} onSubmit={handleCommentSubmit} onReply={setReplyTarget} onCancelReply={() => setReplyTarget(null)} onReact={handleCommentReaction} />
      </div>

      <Sheet open={showCollaborationSheet} title="Invite a collaborator" description={model.title} onClose={() => !isSendingCollaborationRequest && setShowCollaborationSheet(false)}>
        <div className="collaboration-picker">
          {collaborationError ? <p role="alert">{collaborationError}</p> : null}
          {isLoadingCollaborators ? <p role="status">Loading your connections…</p> : null}
          {!isLoadingCollaborators && !collaborationError && !collaborationCandidates.length ? <p>No eligible collaborators yet. Follow creators, or wait for someone to follow you, then invite them here.</p> : null}
          {collaborationCandidates.map((candidate) => <button type="button" key={candidate.id} aria-pressed={selectedCollaborator?.id === candidate.id} onClick={() => setSelectedCollaborator(candidate)}><Avatar src={candidate.avatar} alt="" name={candidate.name || candidate.username} size="medium" /><span><strong>{candidate.name || candidate.username}</strong><small>@{candidate.username} · {candidate.relationship}</small></span></button>)}
          {selectedCollaborator ? <><label>Add a note (optional)<textarea value={collaborationMessage} maxLength={500} onChange={(event) => setCollaborationMessage(event.target.value)} /></label><Button loading={isSendingCollaborationRequest} disabled={isSendingCollaborationRequest} onClick={sendCollaborationRequest}>Invite @{selectedCollaborator.username}</Button></> : null}
        </div>
      </Sheet>

      <Sheet open={showGuestAuthSheet} title="Sign in required" description="This action is available to signed-in members." onClose={() => setShowGuestAuthSheet(false)}><div className="project-detail__sheet-actions"><Button onClick={() => navigate('/signin')}>Sign in</Button><Button variant="secondary" onClick={() => setShowGuestAuthSheet(false)}>Cancel</Button></div></Sheet>
      <Sheet open={showOwnerSheet} title="Manage project" onClose={() => setShowOwnerSheet(false)}><div className="project-detail__sheet-stack"><Button variant="secondary" onClick={() => navigate(`/app/upload?edit=${projectId}`)}>Edit project metadata</Button><Button variant="secondary" onClick={() => { setShowOwnerSheet(false); toggleVisibility() }}>Make {project.visibility === 'public' ? 'private' : 'public'}</Button><Button variant="danger" onClick={() => { setShowOwnerSheet(false); setShowDeleteDialog(true) }}>Delete project</Button></div></Sheet>

      <ConfirmDialog open={Boolean(pendingRoleChange)} title="Change member role?" confirmLabel="Change role" onConfirm={applyRoleChange} onClose={() => setPendingRoleChange(null)} message={pendingRoleChange ? `Make @${pendingRoleChange.member.username || 'this member'} a ${pendingRoleChange.role}?` : ''} />
      <ConfirmDialog open={Boolean(pendingRemoval)} title="Remove collaborator?" confirmLabel="Remove member" onConfirm={removeMember} onClose={() => setPendingRemoval(null)} message={pendingRemoval ? `Remove @${pendingRemoval.username || 'this member'} from this project and its private workspace?` : ''} />
      <ConfirmDialog open={showDeleteDialog} title="Delete project?" confirmLabel="Delete" onConfirm={handleDeleteConfirm} onClose={() => setShowDeleteDialog(false)} message={`Are you sure you want to delete “${project.title}”?`} />
    </main>
  )
}
