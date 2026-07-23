import { useRef } from 'react'
import { DotsIcon } from '../../../components/icons/Icons'
import Avatar from '../../../components/ui/Avatar'
import Chip from '../../../components/ui/Chip'
import MediaFrame from '../../../components/ui/MediaFrame'
import { Button, IconButton } from '../../../components/ui/Button'
import ProjectMedia from '../../project/components/ProjectMedia'
import ProjectActionBar from './ProjectActionBar'

function getPrimaryAction(project) {
  if (project.mediaKind === 'webgl' || project.media?.kind === 'webgl') {
    return { kind: 'play', label: '▶ Play' }
  }
  if (project.mediaKind === 'gltf' || project.media?.kind === 'gltf') {
    return { kind: 'preview3d', label: '▶ Preview 3D' }
  }
  if (project.canonicalRoute || project.routeTarget) {
    return { kind: 'route', label: 'View Project' }
  }
  return { kind: 'route', label: 'View Project' }
}

export default function ProjectReelCard({
  project,
  index,
  active,
  mediaActivationRequested = false,
  currentUser,
  setNode,
  onCreator,
  onProject,
  onFollow,
  onLike,
  onComments,
  onSave,
  onShare,
  onQuickActions,
  onMediaActivate,
  onMediaDeactivate,
  onDoubleTapLike,
}) {
  const cardRef = useRef(null)
  const creatorName = project.creator?.name || project.creator?.username || 'Creator'
  const creatorHandle = project.creator?.handle || project.creator?.username || 'creator'
  const isCurrentUser = Boolean(currentUser && (creatorHandle === currentUser.username || creatorName === currentUser.name))
  const avatarUrl = isCurrentUser && currentUser?.avatar ? currentUser.avatar : project.creator?.avatarUrl
  const isFollowing = Boolean(project.viewerState?.following)

  const projectTypeLabel = (project.projectType || 'Project').toUpperCase()
  const metadata = [...(project.tools || []), ...(project.tags || [])].slice(0, 5)
  const primaryAction = getPrimaryAction(project)
  const isLightweight = project.mediaKind === 'image' || project.mediaKind === 'video' || project.media?.kind === 'image' || project.media?.kind === 'video'

  const handlePrimaryAction = () => {
    if (primaryAction.kind === 'route') {
      onProject?.()
      return
    }
    // If playable, trigger activation
    onMediaActivate?.()
  }

  const handleMediaDoubleClick = (event) => {
    if (!isLightweight || event.target.closest('button, a, input, textarea, select, [role="button"], video')) return
    onDoubleTapLike?.()
  }

  return (
    <article
      ref={(node) => {
        cardRef.current = node
        setNode?.(index, node)
      }}
      data-reel-index={index}
      className={`project-reel-card ${isLightweight ? 'project-reel-card--teaser' : 'project-reel-card--interactive'}`}
      aria-labelledby={`feed-project-${project.id}`}
    >
      {/* 1. Creator Row */}
      <div className="project-reel-card__creator-row">
        <button type="button" className="project-reel-card__creator" onClick={onCreator}>
          <Avatar src={avatarUrl} alt={creatorName} size="sm" />
          <span className="project-reel-card__creator-copy">
            <strong>{creatorName}</strong>
            <span>@{creatorHandle}</span>
          </span>
        </button>

        {!isCurrentUser && onFollow && (
          <button
            type="button"
            className={`project-reel-card__follow-btn ${isFollowing ? 'following' : ''}`}
            onClick={onFollow}
            aria-label={isFollowing ? `Unfollow ${creatorName}` : `Follow ${creatorName}`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}

        <IconButton label={`More actions for ${project.title}`} variant="light" onClick={onQuickActions}>
          <DotsIcon size={20} />
        </IconButton>
      </div>

      {/* 2. Media Preview Frame (4:5) */}
      <div className="project-reel-card__media">
        <MediaFrame
          aspectRatio="4/5"
          poster={project.posterUrl || project.media?.posterUrl}
          alt={project.title}
          mediaKind={project.mediaKind || project.media?.kind}
          onActivate={onMediaActivate}
          badge={<span className="project-reel-card__type-badge">{projectTypeLabel}</span>}
        >
          {active && (project.mediaKind === 'webgl' || project.mediaKind === 'gltf' || project.media?.kind === 'webgl' || project.media?.kind === 'gltf') ? (
            <ProjectMedia
              media={project.media}
              title={project.title}
              active={active}
              interactive={active}
              activationRequested={mediaActivationRequested}
              allowAutoPreview={false}
              className="project-media--feed"
              onActivate={onMediaActivate}
              onDeactivate={onMediaDeactivate}
              onDoubleClick={isLightweight ? handleMediaDoubleClick : undefined}
            />
          ) : null}
        </MediaFrame>

        {/* Gradient Overlay for Identity & Title */}
        <div className="project-reel-card__overlay-gradient" onClick={isLightweight ? handleMediaDoubleClick : undefined}>
          <h2 id={`feed-project-${project.id}`}>{project.title}</h2>
          {project.summary ? <p>{project.summary}</p> : null}
        </div>
      </div>

      {/* 3. Engine / Tool Chips */}
      <div className="project-reel-card__metadata" aria-label="Tools and tags">
        {metadata.map((item) => (
          <Chip key={item}>{item}</Chip>
        ))}
      </div>

      {/* 4. Primary Play / Collaborate Action */}
      <div className="project-reel-card__primary-actions">
        <Button
          className="project-reel-card__cta-btn gradient-brand"
          onClick={handlePrimaryAction}
        >
          {primaryAction.label}
        </Button>
      </div>

      {/* 5. Action Rail (Social Actions) */}
      <ProjectActionBar
        engagement={project.engagementCounts || project.engagement}
        viewerState={project.viewerState}
        onLike={onLike}
        onComments={onComments}
        onSave={onSave}
        onShare={onShare}
      />
    </article>
  )
}
