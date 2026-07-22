import { useRef } from 'react'
import { DotsIcon } from '../../../components/icons/Icons'
import { Avatar, Badge, Chip } from '../../../components/ui/Surface'
import { Button, IconButton } from '../../../components/ui/Button'
import ProjectMedia from '../../project/components/ProjectMedia'
import ProjectActionBar from './ProjectActionBar'

const MEDIA_LABELS = {
  image: 'Visual project',
  video: 'Video project',
  webgl: 'Playable game',
  gltf: '3D asset',
  unknown: 'Project',
}

function getPrimaryAction(project) {
  if (project.media.kind === 'webgl' && project.media.gameUrl) return { kind: 'preview', label: 'Play' }
  if (project.media.kind === 'gltf' && project.media.modelUrl) return { kind: 'preview', label: 'Open 3D preview' }
  if (project.routeTarget) return { kind: 'route', label: 'View project' }
  return null
}

export default function ProjectReelCard({
  project,
  index,
  active,
  currentUser,
  setNode,
  onCreator,
  onProject,
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
  const creatorName = project.creator.username || project.creator.name || 'GameFlow creator'
  const isCurrentUser = Boolean(currentUser && creatorName === currentUser.username)
  const displayName = isCurrentUser ? currentUser.username : creatorName
  const avatarUrl = isCurrentUser && currentUser.avatar ? currentUser.avatar : project.creator.avatarUrl
  const projectType = project.projectType || MEDIA_LABELS[project.media.kind] || MEDIA_LABELS.unknown
  const metadata = [...project.tools, ...project.tags].slice(0, 4)
  const primaryAction = getPrimaryAction(project)
  const isLightweight = project.media.kind === 'image' || project.media.kind === 'video'

  const handlePrimaryAction = () => {
    if (primaryAction?.kind === 'route') {
      onProject()
      return
    }

    const activationControl = cardRef.current?.querySelector(
      '.webgl-game-player__fullscreen-toggle, .project-media__poster-action button',
    )
    activationControl?.click()
  }

  const handleMediaDoubleClick = (event) => {
    if (!isLightweight || event.target.closest('button, a, input, textarea, select, [role="button"], video')) return
    onDoubleTapLike()
  }

  return (
    <article
      ref={(node) => {
        cardRef.current = node
        setNode(index, node)
      }}
      data-reel-index={index}
      className={`project-reel-card ${isLightweight ? 'project-reel-card--teaser' : 'project-reel-card--interactive'}`}
      aria-labelledby={`feed-project-${project.id}`}
    >
      <div className="project-reel-card__creator-row">
        <button type="button" className="project-reel-card__creator" onClick={onCreator}>
          <Avatar src={avatarUrl} alt="" name={displayName} size="medium" />
          <span className="project-reel-card__creator-copy">
            <strong>{displayName}</strong>
            <span>{project.contentType === 'project' ? 'Project creator' : `${project.contentType} creator`}</span>
          </span>
        </button>
        <IconButton label={`More actions for ${project.title}`} variant="light" onClick={onQuickActions}>
          <DotsIcon size={22} />
        </IconButton>
      </div>

      <div className="project-reel-card__media">
        <ProjectMedia
          media={project.media}
          title={project.title}
          active={active}
          interactive={active}
          allowAutoPreview={project.media.kind === 'video'}
          className="project-media--feed"
          onActivate={onMediaActivate}
          onDeactivate={onMediaDeactivate}
          onDoubleClick={isLightweight ? handleMediaDoubleClick : undefined}
          overlay={<Badge className="project-reel-card__type-badge">{projectType}</Badge>}
        />
      </div>

      <div className="project-reel-card__body">
        <div className="project-reel-card__copy">
          <h2 id={`feed-project-${project.id}`}>{project.title}</h2>
          {project.summary ? <p>{project.summary}</p> : <p>Explore this creator project on GameFlow.</p>}
        </div>

        <div className="project-reel-card__metadata" aria-label="Project tools and tags">
          <Chip className="project-reel-card__project-type">{projectType}</Chip>
          {metadata.map((item) => <Chip key={item}>{item}</Chip>)}
        </div>

        <div className="project-reel-card__primary-actions">
          {primaryAction ? <Button onClick={handlePrimaryAction}>{primaryAction.label}</Button> : null}
          {project.routeTarget && primaryAction?.kind === 'preview' ? (
            <Button variant="secondary" onClick={onProject}>View full project</Button>
          ) : null}
        </div>

        <ProjectActionBar
          engagement={project.engagement}
          onLike={onLike}
          onComments={onComments}
          onSave={onSave}
          onShare={onShare}
        />
      </div>
    </article>
  )
}
