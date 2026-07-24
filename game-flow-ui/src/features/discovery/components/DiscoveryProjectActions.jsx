import { useState } from 'react'
import { BookmarkIcon, CommentIcon, HeartIcon, ShareIcon } from '../../../components/icons/Icons'
import { useAuth } from '../../../context/AuthContext'
import { togglePostLike, togglePostSave, updateContentEngagement } from '../../../lib/content'

export default function DiscoveryProjectActions({ project, onComment }) {
  const { token, isGuest } = useAuth()
  const [liked, setLiked] = useState(Boolean(project.viewerState?.liked))
  const [saved, setSaved] = useState(Boolean(project.viewerState?.saved))
  const [likes, setLikes] = useState(project.engagementCounts?.likes || 0)
  const comments = project.engagementCounts?.comments || 0
  const [busy, setBusy] = useState('')

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

  return <div className="project-tile__engagement" aria-label={`Actions for ${project.title}`}>
    <button type="button" className={liked ? 'is-active' : ''} disabled={Boolean(busy)} onClick={() => mutate('react')} aria-label={liked ? 'Unlike project' : 'Like project'}><HeartIcon filled={liked} size={19} /><span>{likes}</span></button>
    <button type="button" onClick={onComment} aria-label="View comments"><CommentIcon size={19} /><span>{comments}</span></button>
    <button type="button" className={saved ? 'is-saved' : ''} disabled={Boolean(busy)} onClick={() => mutate('save')} aria-label={saved ? 'Remove saved project' : 'Save project'}><BookmarkIcon filled={saved} size={19} /></button>
    <button type="button" onClick={share} aria-label="Share project"><ShareIcon size={19} /></button>
  </div>
}
