import { useState } from 'react'
import {
  BookmarkIcon,
  CommentIcon,
  HeartIcon,
  ShareIcon,
} from '../../../components/icons/Icons'

function formatCount(value = 0) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}

function ActionButton({ label, count, pressed, className = '', onClick, children }) {
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
      <span className="feed-action__count" aria-hidden="true">{formatCount(count)}</span>
    </button>
  )
}

export default function ProjectActionBar({ engagement, viewerState, onLike, onComments, onSave, onShare }) {
  const [animateLike, setAnimateLike] = useState(false)

  const isLiked = viewerState?.liked ?? engagement?.viewerHasLiked
  const isSaved = viewerState?.saved ?? engagement?.viewerHasSaved
  const likesCount = engagement?.likes ?? engagement?.likesCount ?? 0
  const commentsCount = engagement?.comments ?? engagement?.commentsCount ?? 0
  const savesCount = engagement?.saves ?? engagement?.savesCount ?? 0
  const sharesCount = engagement?.shares ?? engagement?.sharesCount ?? 0

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
      >
        <HeartIcon filled={isLiked} size={20} />
      </ActionButton>

      <ActionButton label="View comments" count={commentsCount} onClick={onComments}>
        <CommentIcon size={20} />
      </ActionButton>

      <ActionButton
        label={isSaved ? 'Remove saved project' : 'Save project'}
        count={savesCount}
        pressed={isSaved}
        className={isSaved ? 'feed-action--active' : ''}
        onClick={onSave}
      >
        <BookmarkIcon filled={isSaved} size={20} />
      </ActionButton>

      <ActionButton label="Share project" count={sharesCount} onClick={onShare}>
        <ShareIcon size={20} />
      </ActionButton>
    </div>
  )
}
