import { useRef, useState } from 'react'
import Avatar from '../../../components/ui/Avatar'
import MediaFrame from '../../../components/ui/MediaFrame'
import './ProjectTile.css'

function formatProjectType(project, mediaKind) {
  if (mediaKind === 'video') return 'VIDEO'
  if (mediaKind === 'webgl') return 'GAME'
  if (mediaKind === 'gltf') return '3D ART'
  const value = String(project.projectType || 'Project').toLowerCase()
  const labels = { '2d-art': '2D ART', image: '2D ART', artwork: '2D ART', '3d-art': '3D ART', '3d-asset': '3D ART', asset: '3D ART' }
  return labels[value] || value.replace(/[-_]+/g, ' ').toUpperCase()
}

export default function ProjectTile({ project, onOpen, onPreview, onLongPress, showLongPressHint = false, onLongPressHintDismiss, actions, actionsPlacement = 'overlay', selected = false, variant = 'card', fallbackAspectRatio = '1 / 1' }) {
  const holdTimerRef = useRef(null)
  const holdTriggeredRef = useRef(false)
  const [isHolding, setIsHolding] = useState(false)
  const creatorName = project.creator?.name || project.creator?.handle || project.creator?.username || 'Creator'
  const creatorHandle = project.creator?.handle || project.creator?.username || creatorName
  const routeTarget = project.canonicalRoute || project.routeTarget
  const mediaKind = project.mediaKind || project.media?.kind
  const projectTypeLabel = formatProjectType(project, mediaKind)
  const videoUrl = project.media?.videoUrl || (mediaKind === 'video' ? project.playableUrl : null)
  const mediaAspectRatio = project.media?.aspectRatio
    || (project.media?.mode === 'portrait' ? '3 / 4' : project.media?.mode === 'landscape' ? '4 / 3' : fallbackAspectRatio)

  const handleClick = () => {
    if (holdTriggeredRef.current) {
      holdTriggeredRef.current = false
      return
    }
    if (onOpen) onOpen(project)
  }

  const cancelHold = () => {
    if (holdTimerRef.current) window.clearTimeout(holdTimerRef.current)
    holdTimerRef.current = null
    setIsHolding(false)
  }

  const startHold = (event) => {
    if (!onLongPress || (event.pointerType === 'mouse' && event.button !== 0)) return
    holdTriggeredRef.current = false
    cancelHold()
    setIsHolding(true)
    holdTimerRef.current = window.setTimeout(() => {
      holdTriggeredRef.current = true
      setIsHolding(false)
      onLongPressHintDismiss?.()
      onLongPress(project)
      if (navigator.vibrate) navigator.vibrate(18)
    }, 500)
  }

  const openPreview = (event) => {
    event.stopPropagation()
    onPreview?.(project)
  }

  return (
    <article
      className={`project-tile project-tile--${variant} ${selected ? 'project-tile--selected' : ''} ${isHolding ? 'project-tile--holding' : ''}`}
      role="listitem"
    >
      <div className="project-tile__media" style={{ '--project-tile-aspect-ratio': mediaAspectRatio }}>
        <MediaFrame
          aspectRatio={mediaAspectRatio}
          poster={mediaKind === 'video' ? undefined : (project.posterUrl || project.media?.posterUrl)}
          alt={project.title}
          mediaKind={mediaKind}
          badge={onPreview ? (
            <button
              type="button"
              className="project-tile__badge project-tile__preview"
              aria-label={`Preview ${project.title}`}
              onClick={openPreview}
            >
              <span aria-hidden="true">&#9654;</span>
              <span>{projectTypeLabel} · Preview</span>
            </button>
          ) : <span className="project-tile__badge">{projectTypeLabel}</span>}
        >
          {mediaKind === 'video' && videoUrl ? <video className="project-tile__video" src={videoUrl} muted loop autoPlay playsInline preload="metadata" aria-label={`${project.title} video`} /> : null}
        </MediaFrame>
      </div>

      <div className="project-tile__copy">
        <h3 className="project-tile__title">{project.title}</h3>
        <div className="project-tile__creator">
          <Avatar src={project.creator?.avatarUrl} alt="" name={creatorName} size="xs" />
          <span className="project-tile__creator-name">@{creatorHandle}</span>
        </div>
      </div>

      {variant === 'masonry' ? <span className="project-tile__more" aria-hidden="true">•••</span> : null}

      {showLongPressHint ? (
        <aside className="project-tile__hold-hint" aria-label="Project preview tip">
          <button type="button" onClick={onLongPressHintDismiss} aria-label="Dismiss preview tip">&times;</button>
          <strong>Quick preview</strong>
          <span>Press and hold this card to preview it.</span>
        </aside>
      ) : null}

      {isHolding ? (
        <div className="project-tile__hold-feedback" aria-live="polite">
          <span className="project-tile__hold-ring" aria-hidden="true" />
          <strong>Hold to preview</strong>
        </div>
      ) : null}

      {actions ? <div className={`project-tile__actions project-tile__actions--${actionsPlacement}`}>{actions}</div> : null}

      {routeTarget && (
        <button
          type="button"
          className="project-tile__open"
          aria-label={`View project details for ${project.title} by ${creatorName}`}
          onClick={handleClick}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerCancel={cancelHold}
          onPointerLeave={cancelHold}
          onContextMenu={(event) => { if (onLongPress) event.preventDefault() }}
        />
      )}
    </article>
  )
}
