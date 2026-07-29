import { useEffect, useState } from 'react'
import { BookmarkIcon, CommentIcon, HeartIcon, ShareIcon } from '../../../components/icons/Icons'
import { useAuth } from '../../../context/AuthContext'
import { createPostComment, fetchContentComments, fetchPostComments, fetchPostEngagement, togglePostLike, togglePostSave, updateContentEngagement } from '../../../lib/content'
import CommentsSheet from '../../feed/components/CommentsSheet'

export default function DiscoveryProjectActions({ project }) {
  const { token, isGuest, user } = useAuth()
  const [liked, setLiked] = useState(Boolean(project.viewerState?.liked))
  const [saved, setSaved] = useState(Boolean(project.viewerState?.saved))
  const [likes, setLikes] = useState(project.engagementCounts?.likes || 0)
  const [commentsCount, setCommentsCount] = useState(project.engagementCounts?.comments || 0)
  const [busy, setBusy] = useState('')
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentsStatus, setCommentsStatus] = useState('idle')
  const [commentItems, setCommentItems] = useState([])
  const [commentError, setCommentError] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  useEffect(() => {
    const syncComments = (event) => {
      if (String(event.detail?.contentId) !== String(project.contentId)) return
      if (Array.isArray(event.detail?.comments)) setCommentItems(event.detail.comments)
      if (Number.isFinite(event.detail?.commentsCount)) setCommentsCount(event.detail.commentsCount)
    }
    window.addEventListener('gameflow:comments-changed', syncComments)
    return () => window.removeEventListener('gameflow:comments-changed', syncComments)
  }, [project.contentId])

  const syncComments = (items, count) => {
    setCommentItems(items)
    setCommentsCount(count)
    window.dispatchEvent(new CustomEvent('gameflow:comments-changed', {
      detail: { contentId: project.contentId, comments: items, commentsCount: count },
    }))
  }

  const mutate = async (action) => {
    if (isGuest) { window.alert('Sign in to interact with projects.'); return }
    if (busy) return
    const isLike = action === 'react'
    const previous = isLike ? liked : saved
    if (isLike) { setLiked(!previous); setLikes((count) => Math.max(0, count + (previous ? -1 : 1))) }
    else setSaved(!previous)
    setBusy(action)
    try {
      if (project.contentType === 'project') await (isLike ? togglePostLike(token, project.contentId) : togglePostSave(token, project.contentId))
      else await updateContentEngagement(token, project.contentType, project.contentId, { action })
    } catch (error) {
      if (isLike) { setLiked(previous); setLikes((count) => Math.max(0, count + (previous ? 1 : -1))) }
      else setSaved(previous)
      window.alert(error.message || 'Unable to update this project.')
    } finally { setBusy('') }
  }

  const share = async () => {
    const url = project.routeTarget ? `${window.location.origin}${project.routeTarget}` : window.location.href
    try {
      if (navigator.share) await navigator.share({ title: project.title, url })
      else { await navigator.clipboard.writeText(url); window.alert('Project link copied.') }
      if (!isGuest) await updateContentEngagement(token, project.contentType, project.contentId, { action: 'share' }).catch(() => {})
    } catch (error) { if (error?.name !== 'AbortError') window.prompt('Copy this project link', url) }
  }

  const loadComments = async () => {
    setCommentsStatus('loading')
    setCommentError('')
    try {
      if (project.contentType === 'project') {
        const [commentsResult, engagementResult] = await Promise.all([
          fetchPostComments(token, project.contentId),
          fetchPostEngagement(token, project.contentId),
        ])
        const items = commentsResult.items || []
        const count = Number(engagementResult.engagement?.commentsCount ?? items.length)
        syncComments(items, count)
      } else {
        const result = await fetchContentComments(token, project.contentType, project.contentId)
        const items = result.items || []
        syncComments(items, Number(result.commentsCount ?? items.length))
      }
      setCommentsStatus('ready')
    } catch (error) {
      setCommentError(error.message || 'Could not load comments.')
      setCommentsStatus('error')
    }
  }

  const openComments = (event) => {
    event.stopPropagation()
    setCommentsOpen(true)
    setCommentDraft('')
    loadComments()
  }

  const submitComment = async (event) => {
    event.preventDefault()
    if (!commentDraft.trim() || commentSubmitting) return
    if (isGuest || !token) {
      setCommentError('Sign in to post a comment.')
      return
    }
    setCommentSubmitting(true)
    setCommentError('')
    try {
      const result = project.contentType === 'project'
        ? await createPostComment(token, project.contentId, { text: commentDraft.trim() })
        : await updateContentEngagement(token, project.contentType, project.contentId, {
            action: 'comment',
            commentText: commentDraft.trim(),
          })
      if (Number.isFinite(result.engagement?.commentsCount)) {
        setCommentsCount(result.engagement.commentsCount)
      }
      setCommentDraft('')
      await loadComments()
    } catch (error) {
      setCommentError(error.message || 'Could not post your comment.')
    } finally {
      setCommentSubmitting(false)
    }
  }

  const commentsProject = {
    ...project,
    contentType: 'discovery-project',
    engagement: { ...(project.engagement || {}), comments: commentItems },
  }

  return <>
    <div className="project-tile__engagement" aria-label={`Actions for ${project.title}`}>
      <button type="button" className={liked ? 'is-active' : ''} disabled={Boolean(busy)} onClick={() => mutate('react')} aria-label={liked ? 'Unlike project' : 'Like project'}><HeartIcon filled={liked} size={19} /><span>{likes}</span></button>
      <button type="button" onClick={openComments} aria-label="View comments"><CommentIcon size={19} /><span>{commentsCount}</span></button>
      <button type="button" className={saved ? 'is-saved' : ''} disabled={Boolean(busy)} onClick={() => mutate('save')} aria-label={saved ? 'Remove saved project' : 'Save project'}><BookmarkIcon filled={saved} size={19} /></button>
      <button type="button" onClick={share} aria-label="Share project"><ShareIcon size={19} /></button>
    </div>
    <CommentsSheet
      open={commentsOpen}
      project={commentsProject}
      status={commentsStatus}
      error={commentError}
      viewer={user}
      draft={commentDraft}
      replyTarget={null}
      submitting={commentSubmitting}
      onClose={() => setCommentsOpen(false)}
      onRetry={loadComments}
      onDraftChange={setCommentDraft}
      onSubmit={submitComment}
      onReply={() => {}}
      onCancelReply={() => {}}
      onReact={() => setCommentError('Open the full project to react to comments.')}
    />
  </>
}
