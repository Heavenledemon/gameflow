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

export default function ProjectActionBar({ engagement, onLike, onComments, onSave, onShare }) {
  return (
    <div className="project-action-bar" role="group" aria-label="Project engagement actions">
      <ActionButton
        label={engagement.viewerHasLiked ? 'Unlike project' : 'Like project'}
        count={engagement.likesCount}
        pressed={engagement.viewerHasLiked}
        className={engagement.viewerHasLiked ? 'feed-action--active' : ''}
        onClick={onLike}
      >
        <HeartIcon filled={engagement.viewerHasLiked} size={20} />
      </ActionButton>
      <ActionButton label="View comments" count={engagement.commentsCount} onClick={onComments}>
        <CommentIcon size={20} />
      </ActionButton>
      <ActionButton
        label={engagement.viewerHasSaved ? 'Remove saved project' : 'Save project'}
        count={engagement.savesCount}
        pressed={engagement.viewerHasSaved}
        className={engagement.viewerHasSaved ? 'feed-action--active' : ''}
        onClick={onSave}
      >
        <BookmarkIcon filled={engagement.viewerHasSaved} size={20} />
      </ActionButton>
      <ActionButton label="Share project" count={engagement.sharesCount} onClick={onShare}>
        <ShareIcon size={20} />
      </ActionButton>
    </div>
  )
}
