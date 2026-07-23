import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoImg from '../../assets/logo.jpg'
import IconButton from '../../components/ui/IconButton'
import EmptyState, { ErrorState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/Feedback'
import Skeleton from '../../components/ui/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { toProjectCardModel } from '../project/model/projectCardModel'
import { useReelFeed } from '../../hooks/useReelFeed'
import {
  createCommentReply,
  createPostComment,
  fetchPostComments,
  fetchPostEngagement,
  toggleCommentReaction,
  togglePostLike,
  togglePostSave,
  updateContentEngagement,
} from '../../lib/content'
import CommentsSheet from './components/CommentsSheet'
import ProjectQuickActionsSheet from './components/ProjectQuickActionsSheet'
import ProjectReelCard from './components/ProjectReelCard'
import './FeedPage.css'

function SearchIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function getProjectKey(project) {
  return project.rawIds.feedId ?? project.id
}

function getEngagement(project) {
  const engagement = project.engagement || {}
  return {
    likesCount: engagement.likesCount ?? 0,
    commentsCount: engagement.commentsCount ?? 0,
    savesCount: engagement.savesCount ?? 0,
    sharesCount: engagement.sharesCount ?? 0,
    viewerHasLiked: Boolean(engagement.viewerHasLiked),
    viewerHasSaved: Boolean(engagement.viewerHasSaved),
    comments: Array.isArray(engagement.comments) ? engagement.comments : [],
  }
}

function applyLocalEngagement(project, action, extra = {}) {
  const current = getEngagement(project)
  const next = { ...current }

  if (action === 'react') {
    next.viewerHasLiked = !current.viewerHasLiked
    next.likesCount = Math.max(0, current.likesCount + (current.viewerHasLiked ? -1 : 1))
  }
  if (action === 'save') {
    next.viewerHasSaved = !current.viewerHasSaved
    next.savesCount = Math.max(0, current.savesCount + (current.viewerHasSaved ? -1 : 1))
  }
  if (action === 'comment' && extra.comment) {
    next.commentsCount = current.commentsCount + 1
    next.comments = [extra.comment, ...current.comments]
  }
  if (action === 'share') next.sharesCount = current.sharesCount + 1

  return { ...project, engagement: next }
}

function FeedSkeleton() {
  return (
    <div className="feed-skeleton" role="status" aria-label="Loading projects">
      <div className="feed-skeleton__creator"><Skeleton circle width={44} height={44} /><Skeleton width="42%" height={16} /></div>
      <Skeleton className="feed-skeleton__media" width="100%" height="100%" />
      <div className="feed-skeleton__copy"><Skeleton width="72%" height={20} /><Skeleton width="92%" height={14} /><Skeleton width="64%" height={44} /></div>
    </div>
  )
}

export default function FeedPage() {
  const navigate = useNavigate()
  const { isGuest, user, token } = useAuth()
  const { items: feedItems, status: feedStatus, error: feedError, loadNext, retry } = useReelFeed(token)
  const [projects, setProjects] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [interactiveProjectId, setInteractiveProjectId] = useState(null)
  const [commentTarget, setCommentTarget] = useState(null)
  const [commentsStatus, setCommentsStatus] = useState('idle')
  const [commentDraft, setCommentDraft] = useState('')
  const [commentError, setCommentError] = useState('')
  const [replyTarget, setReplyTarget] = useState(null)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [quickSheet, setQuickSheet] = useState(null)
  const feedRef = useRef(null)
  const cardNodesRef = useRef(new Map())
  const observerRef = useRef(null)
  const activeIndexRef = useRef(0)
  const localIdRef = useRef(0)
  const pendingEngagementRef = useRef(new Set())

  const nextLocalId = () => {
    localIdRef.current += 1
    return `local-${localIdRef.current}`
  }

  useEffect(() => {
    if (!feedItems.length) {
      // This state is the mutable engagement layer over the paged feed source.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (feedStatus === 'ready') setProjects([])
      return
    }

    // Preserve local optimistic engagement while appending normalized pages.
    setProjects((current) => {
      const currentByKey = new Map(current.map((project) => [getProjectKey(project), project]))
      return feedItems.map((item) => {
        const mapped = toProjectCardModel(item, { feedId: item?.feedId })
        const existing = currentByKey.get(getProjectKey(mapped))
        return existing ? { ...mapped, engagement: existing.engagement } : mapped
      })
    })
  }, [feedItems, feedStatus])

  useEffect(() => {
    const root = feedRef.current
    if (!root || !('IntersectionObserver' in window)) return undefined

    observerRef.current = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0]
      const nextIndex = Number(visible?.target.dataset.reelIndex)
      if (Number.isInteger(nextIndex) && nextIndex !== activeIndexRef.current) {
        activeIndexRef.current = nextIndex
        setActiveIndex(nextIndex)
        setInteractiveProjectId(null)
      }
    }, { root, threshold: [0.45, 0.7] })

    cardNodesRef.current.forEach((node) => observerRef.current.observe(node))
    return () => observerRef.current?.disconnect()
  }, [projects.length])

  useEffect(() => {
    if (activeIndex >= projects.length - 4 && feedStatus === 'ready') loadNext()
  }, [activeIndex, projects.length, feedStatus, loadNext])

  const setCardNode = useCallback((index, node) => {
    const previous = cardNodesRef.current.get(index)
    if (previous) observerRef.current?.unobserve(previous)
    if (node) {
      cardNodesRef.current.set(index, node)
      observerRef.current?.observe(node)
    } else {
      cardNodesRef.current.delete(index)
    }
  }, [])

  const updateProject = useCallback((target, updater) => {
    const matches = (project) => (
      getProjectKey(project) === target
      || project.id === target
      || project.contentId === target
      || (project.contentType === 'project' && `project:${project.contentId}` === target)
    )

    setProjects((current) => current.map((project) => matches(project) ? updater(project) : project))
    setCommentTarget((current) => current && matches(current) ? updater(current) : current)
    setQuickSheet((current) => current && matches(current.project) ? { ...current, project: updater(current.project) } : current)
  }, [])

  const syncProjectEngagement = useCallback((postId, engagement) => {
    if (!postId || !engagement) return
    updateProject(`project:${postId}`, (project) => ({
      ...project,
      engagement: { ...project.engagement, ...engagement },
    }))
  }, [updateProject])

  const mutateProjectToggle = async (project, action, requestFn) => {
    const target = getProjectKey(project)
    const previous = getEngagement(project)
    updateProject(target, (item) => applyLocalEngagement(item, action))

    try {
      const result = await requestFn()
      syncProjectEngagement(project.contentId, result.engagement)
    } catch (error) {
      updateProject(target, (item) => ({ ...item, engagement: previous }))
      throw error
    }
  }

  const mutateEngagement = async (project, action, payload = {}) => {
    const mutationKey = `${project.contentType}:${project.contentId}:${action}`
    if (pendingEngagementRef.current.has(mutationKey)) return null
    pendingEngagementRef.current.add(mutationKey)

    try {
      if (project.contentType === 'project' && action === 'react') {
        await mutateProjectToggle(project, action, () => togglePostLike(token, project.contentId))
        return null
      }
      if (project.contentType === 'project' && action === 'save') {
        await mutateProjectToggle(project, action, () => togglePostSave(token, project.contentId))
        return null
      }

      const result = await updateContentEngagement(token, project.contentType, project.contentId, {
        action,
        ...payload,
      })
      if (result?.engagement) {
        updateProject(`${result.contentType}:${result.contentId}`, (item) => ({
          ...item,
          engagement: { ...item.engagement, ...result.engagement },
        }))
      }
      return result
    } finally {
      pendingEngagementRef.current.delete(mutationKey)
    }
  }

  const handleLike = async (project) => {
    if (isGuest) {
      window.alert('Sign in to react to posts.')
      return
    }
    try {
      await mutateEngagement(project, 'react')
    } catch (error) {
      window.alert(error.message || 'Failed to update like.')
    }
  }

  const handleDoubleTapLike = async (project) => {
    if (isGuest || getEngagement(project).viewerHasLiked) return
    try {
      await mutateEngagement(project, 'react')
    } catch (error) {
      window.alert(error.message || 'Failed to like post.')
    }
  }

  const handleSave = async (project) => {
    if (isGuest) {
      window.alert('Sign in to save posts.')
      return
    }
    try {
      await mutateEngagement(project, 'save')
    } catch (error) {
      window.alert(error.message || 'Failed to update save.')
    }
  }

  const handleShare = async (project, platform = '') => {
    const shareUrl = project.routeTarget ? `${window.location.origin}${project.routeTarget}` : window.location.href
    const shareText = `${project.title || 'GameFlow project'} on GameFlow`

    try {
      if (platform === 'copy' && navigator.clipboard?.writeText) await navigator.clipboard.writeText(shareUrl)
      else if (!platform && navigator.share) await navigator.share({ title: project.title, text: shareText, url: shareUrl })
      else if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank', 'noopener,noreferrer')
      else if (platform === 'x') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')
      else if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')
      else if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer')
      else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(shareUrl)
      else window.prompt('Copy this link', shareUrl)
      setQuickSheet(null)
    } catch (error) {
      if (error?.name !== 'AbortError') window.prompt('Copy this link', shareUrl)
    }

    if (!isGuest) {
      try {
        await mutateEngagement(project, 'share')
      } catch (error) {
        window.alert(error.message || 'Failed to update share count.')
      }
    }
  }

  const handleFollow = (project) => {
    if (isGuest) {
      window.alert('Sign in to follow creators.')
      return
    }
    const targetKey = getProjectKey(project)
    updateProject(targetKey, (item) => {
      const isFollowing = Boolean(item.viewerState?.following)
      return {
        ...item,
        viewerState: { ...item.viewerState, following: !isFollowing },
      }
    })
  }

  const loadComments = useCallback(async (project) => {
    setCommentsStatus('loading')
    setCommentError('')
    try {
      if (project.contentType === 'project') {
        const [engagementResult, commentsResult] = await Promise.all([
          fetchPostEngagement(token, project.contentId),
          fetchPostComments(token, project.contentId),
        ])
        const engagement = { ...engagementResult.engagement, comments: commentsResult.items ?? [] }
        syncProjectEngagement(project.contentId, engagement)
      }
      setCommentsStatus('ready')
    } catch (error) {
      setCommentError(error.message || 'Failed to load comments.')
      setCommentsStatus('error')
    }
  }, [syncProjectEngagement, token])

  const openComments = (project) => {
    if (isGuest) {
      window.alert('Sign in to comment on posts.')
      return
    }
    setInteractiveProjectId(null)
    setCommentTarget(project)
    setCommentDraft('')
    setCommentError('')
    setReplyTarget(null)
    loadComments(project)
  }

  const closeComments = () => {
    setCommentTarget(null)
    setCommentsStatus('idle')
    setReplyTarget(null)
    setCommentError('')
  }

  const submitComment = async (event) => {
    event.preventDefault()
    if (!commentTarget || !commentDraft.trim()) return
    setIsSubmittingComment(true)
    setCommentError('')

    try {
      if (replyTarget) {
        const replyId = replyTarget.commentId || replyTarget._id
        const result = await createCommentReply(token, replyId, { text: commentDraft.trim() })
        const confirmedReply = {
          commentId: `reply-${nextLocalId()}`,
          userId: user?.id || user?._id || 'me',
          username: user?.username || 'me',
          name: user?.name || 'Me',
          avatar: user?.avatar,
          text: commentDraft.trim(),
          createdAt: new Date().toISOString(),
          replies: [],
        }
        const appendReply = (comments) => comments.map((comment) => {
          if (comment.commentId === replyId || String(comment._id) === String(replyId)) {
            return { ...comment, replies: [...(comment.replies || []), confirmedReply] }
          }
          return { ...comment, replies: appendReply(comment.replies || []) }
        })
        updateProject(getProjectKey(commentTarget), (project) => ({
          ...project,
          engagement: {
            ...project.engagement,
            ...result.engagement,
            comments: appendReply(project.engagement.comments || []),
          },
        }))
        setCommentDraft('')
        setReplyTarget(null)
        return
      }

      if (commentTarget.contentType === 'project') {
        const optimisticComment = {
          commentId: `optimistic-${nextLocalId()}`,
          userId: user?.id || user?._id || 'me',
          username: user?.username || 'me',
          name: user?.name || 'Me',
          avatar: user?.avatar,
          text: commentDraft.trim(),
          createdAt: new Date().toISOString(),
          replies: [],
        }
        const previous = getEngagement(commentTarget)
        updateProject(getProjectKey(commentTarget), (project) => applyLocalEngagement(project, 'comment', { comment: optimisticComment }))
        try {
          const result = await createPostComment(token, commentTarget.contentId, { text: commentDraft.trim() })
          updateProject(getProjectKey(commentTarget), (project) => ({
            ...project,
            engagement: { ...result.engagement, comments: project.engagement.comments || [] },
          }))
        } catch (error) {
          updateProject(getProjectKey(commentTarget), (project) => ({ ...project, engagement: previous }))
          throw error
        }
      } else {
        const result = await updateContentEngagement(token, commentTarget.contentType, commentTarget.contentId, {
          action: 'comment',
          commentText: commentDraft.trim(),
        })
        if (result?.engagement) {
          updateProject(getProjectKey(commentTarget), (project) => ({
            ...project,
            engagement: { ...project.engagement, ...result.engagement },
          }))
        }
      }
      setCommentDraft('')
    } catch (error) {
      setCommentError(error.message || 'Could not post your comment. Your text is still here - try again.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const handleCommentReaction = async (comment, emoji) => {
    if (isGuest) {
      setCommentError('Sign in to react to comments.')
      return
    }
    const commentId = comment.commentId || comment._id
    try {
      const result = await toggleCommentReaction(token, commentId, emoji)
      const updateTree = (items) => items.map((item) => {
        if ((item.commentId || item._id) === commentId) {
          return { ...item, reactions: result.reactions, viewerReaction: result.viewerReaction }
        }
        return { ...item, replies: updateTree(item.replies || []) }
      })
      updateProject(getProjectKey(commentTarget), (project) => ({
        ...project,
        engagement: { ...project.engagement, comments: updateTree(project.engagement.comments || []) },
      }))
    } catch (error) {
      setCommentError(error.message || 'Could not add a reaction.')
    }
  }

  const openProject = (project) => {
    if (project.routeTarget) navigate(project.routeTarget)
  }

  const openCollaboration = (project) => {
    if (isGuest) {
      window.alert('Sign in to collaborate!')
      navigate('/signin')
      return
    }
    openProject(project)
  }

  const openCreator = (project) => {
    const username = project.creator.username || project.creator.name
    if (user && username === user.username) navigate('/app/profile')
    else if (username) navigate(`/app/creator/${encodeURIComponent(username)}`)
  }

  const safeActiveIndex = Math.min(activeIndex, Math.max(projects.length - 1, 0))
  const nextProject = projects[safeActiveIndex + 1]
  const nextPosterUrl = nextProject?.media.kind === 'image'
    ? nextProject.media.imageUrl || nextProject.media.posterUrl
    : nextProject?.media.kind === 'video'
      ? nextProject.media.posterUrl
      : null
  const showInitialLoading = feedStatus === 'loading' && projects.length === 0
  const showInitialError = feedStatus === 'error' && projects.length === 0
  const showEmpty = feedStatus === 'ready' && projects.length === 0

  useEffect(() => {
    if (!nextPosterUrl) return undefined
    const poster = new Image()
    poster.decoding = 'async'
    poster.src = nextPosterUrl
    return () => { poster.src = '' }
  }, [nextPosterUrl])

  return (
    <main className={`feed-page ${interactiveProjectId ? 'feed-page--interactive' : ''}`}>
      <header className="feed-page__header">
        <div className="feed-page__brand">
          <img src={logoImg} alt="" />
          <div><strong>GameFlow</strong><span>Play feed</span></div>
        </div>
        <IconButton label="Search projects" variant="light" onClick={() => navigate('/app/explore')}>
          <SearchIcon />
        </IconButton>
      </header>

      <div ref={feedRef} className="feed-page__stream">
        {showInitialLoading ? <><FeedSkeleton /><FeedSkeleton /></> : null}
        {showInitialError ? (
          <div className="feed-page__state">
            <ErrorState title="The play feed could not load" description={feedError} onRetry={retry} />
          </div>
        ) : null}
        {showEmpty ? (
          <div className="feed-page__state">
            <EmptyState title="No projects in the feed yet" description="Published projects will appear here when they are available." />
          </div>
        ) : null}

        {projects.map((project, index) => {
          return (
            <ProjectReelCard
              key={project.id}
              project={project}
              index={index}
              active={index === safeActiveIndex && !commentTarget && !quickSheet}
              mediaActivationRequested={interactiveProjectId === project.id}
              currentUser={user}
              setNode={setCardNode}
              onCreator={() => openCreator(project)}
              onProject={() => openProject(project)}
              onFollow={() => handleFollow(project)}
              onLike={() => handleLike(project)}
              onComments={() => openComments(project)}
              onSave={() => handleSave(project)}
              onShare={() => {
                if (navigator.share) handleShare(project)
                else {
                  setInteractiveProjectId(null)
                  setQuickSheet({ project, shareFirst: true })
                }
              }}
              onQuickActions={() => {
                setInteractiveProjectId(null)
                setQuickSheet({ project, shareFirst: false })
              }}
              onMediaActivate={() => setInteractiveProjectId(project.id)}
              onMediaDeactivate={() => setInteractiveProjectId((current) => current === project.id ? null : current)}
              onDoubleTapLike={() => handleDoubleTapLike(project)}
            />
          )
        })}

        {projects.length && feedStatus === 'loading-more' ? (
          <div className="feed-page__pagination"><LoadingState label="Loading more projects" /></div>
        ) : null}
        {projects.length && feedStatus === 'error-more' ? (
          <div className="feed-page__pagination">
            <ErrorState title="More projects did not load" description={feedError} onRetry={retry} headingLevel={3} />
          </div>
        ) : null}
      </div>

      <CommentsSheet
        open={Boolean(commentTarget)}
        project={commentTarget}
        status={commentsStatus}
        error={commentError}
        viewer={user}
        draft={commentDraft}
        replyTarget={replyTarget}
        submitting={isSubmittingComment}
        onClose={closeComments}
        onRetry={() => loadComments(commentTarget)}
        onDraftChange={setCommentDraft}
        onSubmit={submitComment}
        onReply={(comment) => { setReplyTarget(comment); setCommentError('') }}
        onCancelReply={() => setReplyTarget(null)}
        onReact={handleCommentReaction}
        onOpenProject={() => openProject(commentTarget)}
      />

      <ProjectQuickActionsSheet
        open={Boolean(quickSheet)}
        project={quickSheet?.project}
        shareFirst={quickSheet?.shareFirst}
        onClose={() => setQuickSheet(null)}
        onOpenProject={() => openProject(quickSheet.project)}
        onCollaborate={() => openCollaboration(quickSheet.project)}
        onShare={(platform) => handleShare(quickSheet.project, platform)}
      />
    </main>
  )
}
