import { useState } from 'react'
import { Button, IconButton } from '../../../components/ui/Button'
import { BookmarkIcon, CommentIcon, HeartIcon, ShareIcon, FolderIcon, WorkspaceIcon } from '../../../components/icons/Icons'

function formatCount(value = 0) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}

export function primaryActionLabel(model) {
  if (model.media?.kind === 'webgl' || model.mediaKind === 'webgl') return '▶ Play'
  if (model.media?.kind === 'gltf' || model.mediaKind === 'gltf') return '▶ Open 3D Preview'
  if (model.media?.kind === 'video' || model.mediaKind === 'video') return '▶ Watch Video'
  return 'View Project Media'
}

export default function ProjectActions({
  model,
  liked,
  saved,
  canViewFiles = false,
  onViewFiles,
  collaborationLabel,
  collaborationAllowed,
  collaborationBusy,
  onPrimary,
  onLike,
  onComments,
  onSave,
  onCollaboration,
  onShare,
}) {
  const [animateLike, setAnimateLike] = useState(false)
  const engagement = model.engagementCounts || model.engagement || {}

  const handleLikeClick = (e) => {
    setAnimateLike(true)
    setTimeout(() => setAnimateLike(false), 300)
    onLike?.(e)
  }

  return (
    <section className="project-actions" aria-label="Project actions">
      {/* 1. Project Actions Hierarchy: Play CTA -> View Files -> Collaborate */}
      <div className="project-actions__primary">
        <Button className="project-actions__cta-btn" onClick={onPrimary}>
          {primaryActionLabel(model)}
        </Button>

        {canViewFiles && onViewFiles ? (
          <Button variant="secondary" onClick={onViewFiles}>
            <FolderIcon size={16} />
            <span>View Files</span>
          </Button>
        ) : null}

        {collaborationAllowed ? (
          <Button
            variant="secondary"
            loading={collaborationBusy}
            disabled={collaborationBusy}
            onClick={onCollaboration}
          >
            <WorkspaceIcon size={16} />
            <span>{collaborationLabel}</span>
          </Button>
        ) : null}
      </div>

      {/* 2. Social Actions Rail (Strictly BELOW Project Actions) */}
      <div className="project-actions__social" role="group" aria-label="Social actions">
        <div className="project-actions__social-item">
          <IconButton
            label={liked ? 'Unlike project' : 'Like project'}
            aria-pressed={liked}
            className={`feed-action--like ${liked ? 'feed-action--active' : ''} ${animateLike ? 'feed-action--animate' : ''}`}
            onClick={handleLikeClick}
          >
            <HeartIcon filled={liked} size={22} />
          </IconButton>
          <span>{formatCount(engagement.likesCount || engagement.likes)}</span>
        </div>

        <div className="project-actions__social-item">
          <IconButton label="Open comments" onClick={onComments}>
            <CommentIcon size={22} />
          </IconButton>
          <span>{formatCount(engagement.commentsCount || engagement.comments)}</span>
        </div>

        <div className="project-actions__social-item">
          <IconButton
            label={saved ? 'Remove saved project' : 'Save project'}
            aria-pressed={saved}
            className={saved ? 'feed-action--active' : ''}
            onClick={onSave}
          >
            <BookmarkIcon filled={saved} size={22} />
          </IconButton>
          <span>{formatCount(engagement.savesCount || engagement.saves)}</span>
        </div>

        <div className="project-actions__social-item">
          <IconButton label="Share project" onClick={onShare}>
            <ShareIcon size={22} />
          </IconButton>
          <span>Share</span>
        </div>
      </div>
    </section>
  )
}
