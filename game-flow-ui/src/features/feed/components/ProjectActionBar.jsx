import { useState } from 'react'
import {
  BookmarkIcon,
  CommentIcon,
  HeartIcon,
  ShareIcon,
} from '../../../components/icons/Icons'

function normalizeCount(primary, fallback) {
  const value = primary ?? fallback
  if (Array.isArray(value)) return value.length
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0
}

function formatCount(value = 0) {
  const count = normalizeCount(value, 0)
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}m`
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`
  return String(count)
}

function ActionButton({ label, count, pressed, className = '', onClick, onCountClick, children }) {
  const countLabel = `${count ?? 0}`
  return (
    <button
      type="button"
      className={`feed-action ${className}`.trim()}
      aria-label={`${label}, ${countLabel}`}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
      <span
        className={`feed-action__count ${onCountClick ? 'feed-action__count--interactive' : ''}`.trim()}
        role={onCountClick ? 'button' : undefined}
        tabIndex={onCountClick ? 0 : undefined}
        aria-label={onCountClick ? `View ${countLabel} likes` : undefined}
        aria-hidden={onCountClick ? undefined : 'true'}
        onClick={onCountClick ? (event) => { event.stopPropagation(); onCountClick() } : undefined}
        onKeyDown={onCountClick ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); onCountClick() } } : undefined}
      >{formatCount(count)}</span>
    </button>
  )
}

export default function ProjectActionBar({ engagement, viewerState, onLike, onViewLikes, onComments, onSave, onShare }) {
  const [animateLike, setAnimateLike] = useState(false)

  const isLiked = engagement?.viewerHasLiked ?? viewerState?.liked
  const isSaved = engagement?.viewerHasSaved ?? viewerState?.saved
  const likesCount = normalizeCount(engagement?.likesCount, engagement?.likes)
  const commentsCount = normalizeCount(engagement?.commentsCount, engagement?.comments)
  const savesCount = normalizeCount(engagement?.savesCount, engagement?.saves)
  const sharesCount = normalizeCount(engagement?.sharesCount, engagement?.shares)

  const handleLikeClick = (e) => {
    setAnimateLike(true)
    setTimeout(() => setAnimateLike(false), 300)
    onLike?.(e)
  }

  return (
    <div className="project-action-bar" role="group" aria-label="Project engagement actions">
      <ActionButton
        label={isLiked ? 'Unlike project' : 'Like project'}
        count={likesCount}
        pressed={isLiked}
        className={`feed-action--like ${isLiked ? 'feed-action--active' : ''} ${animateLike ? 'feed-action--animate' : ''}`}
        onClick={handleLikeClick}
        onCountClick={onViewLikes}
      >
        <HeartIcon filled={isLiked} size={30} />
      </ActionButton>

      <ActionButton label="View comments" count={commentsCount} className="feed-action--comment" onClick={onComments}>
        <CommentIcon size={30} />
      </ActionButton>

      <ActionButton
        label={isSaved ? 'Remove saved project' : 'Save project'}
        count={savesCount}
        pressed={isSaved}
        className={`feed-action--bookmark ${isSaved ? 'feed-action--active' : ''}`}
        onClick={onSave}
      >
        <BookmarkIcon filled={isSaved} size={30} />
      </ActionButton>

      <ActionButton label="Share project" count={sharesCount} className="feed-action--share" onClick={onShare}>
        <ShareIcon size={30} />
      </ActionButton>
    </div>
  )
}
