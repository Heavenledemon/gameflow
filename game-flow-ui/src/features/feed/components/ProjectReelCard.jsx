import { useEffect, useRef, useState } from 'react'
import { DotsIcon } from '../../../components/icons/Icons'
import Avatar from '../../../components/ui/Avatar'
import MediaFrame from '../../../components/ui/MediaFrame'
import ProjectMedia from '../../project/components/ProjectMedia'
import ProjectActionBar from './ProjectActionBar'

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
  const lastTapRef = useRef({ time: 0, x: 0, y: 0 })
  const touchLikeAtRef = useRef(0)
  const [heartBurst, setHeartBurst] = useState(0)
  const [runnerGifReady, setRunnerGifReady] = useState(false)
  const creatorName = project.creator?.name || project.creator?.username || 'Creator'
  const creatorHandle = project.creator?.handle || project.creator?.username || 'creator'
  const isCurrentUser = Boolean(currentUser && (creatorHandle === currentUser.username || creatorName === currentUser.name))
  const avatarUrl = isCurrentUser && currentUser?.avatar ? currentUser.avatar : project.creator?.avatarUrl
  const isFollowing = Boolean(project.viewerState?.following)

  const isLightweight = project.mediaKind === 'image' || project.mediaKind === 'video' || project.media?.kind === 'image' || project.media?.kind === 'video'
  const mediaKind = project.mediaKind || project.media?.kind || 'unknown'
  const uploadedGameplayGif = project.media?.gameplayGifUrl || project.gameplayGifUrl || ''
  const isRunnerGame = mediaKind === 'webgl' && String(project.title || '').trim().toLowerCase() === 'runner'
  const gameplayPreviewUrl = uploadedGameplayGif || (isRunnerGame ? '/portrait_smooth.gif' : '')
  const runnerPreviewUrl = gameplayPreviewUrl && runnerGifReady ? gameplayPreviewUrl : ''
  const reelPosterUrl = runnerPreviewUrl || project.posterUrl || project.media?.posterUrl
  const reelMedia = runnerPreviewUrl ? { ...project.media, posterUrl: runnerPreviewUrl } : project.media

  useEffect(() => {
    let timer
    const frame = window.requestAnimationFrame(() => {
      setRunnerGifReady(false)
      if (gameplayPreviewUrl && active && !mediaActivationRequested) timer = window.setTimeout(() => setRunnerGifReady(true), 2200)
    })
    return () => { window.cancelAnimationFrame(frame); if (timer) window.clearTimeout(timer) }
  }, [active, gameplayPreviewUrl, mediaActivationRequested, project.id])

  const handleTap = () => {
    onProject?.()
  }

  const isMediaLikeTarget = (target) => !target.closest('button, a, input, textarea, select, [role="button"]')

  const registerDoubleLike = () => {
    setHeartBurst((value) => value + 1)
    onDoubleTapLike?.()
  }

  const handleMediaDoubleClick = (event) => {
    if (!isLightweight || !isMediaLikeTarget(event.target) || Date.now() - touchLikeAtRef.current < 600) return
    registerDoubleLike()
  }

  const handleMediaPointerUp = (event) => {
    if (!isLightweight || !['touch', 'pen'].includes(event.pointerType) || !isMediaLikeTarget(event.target)) return
    const now = Date.now()
    const previous = lastTapRef.current
    const closeEnough = Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 48
    if (now - previous.time > 40 && now - previous.time < 350 && closeEnough) {
      event.preventDefault()
      lastTapRef.current = { time: 0, x: 0, y: 0 }
      touchLikeAtRef.current = now
      registerDoubleLike()
      return
    }
    lastTapRef.current = { time: now, x: event.clientX, y: event.clientY }
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
      {/* Full-screen media container */}
      <div className={`project-reel-card__media project-reel-card__media--${mediaKind}`} onDoubleClick={isLightweight ? handleMediaDoubleClick : undefined} onPointerUp={isLightweight ? handleMediaPointerUp : undefined}>
        <MediaFrame
          aspectRatio="auto"
          poster={reelPosterUrl}
          alt={project.title}
          mediaKind={mediaKind}
          fit={mediaKind === 'image' ? 'contain' : 'cover'}
          onActivate={onMediaActivate}
        >
          {active ? (
            <ProjectMedia
              media={reelMedia}
              title={project.title}
              active={active}
              interactive={active}
              activationRequested={mediaActivationRequested}
              allowAutoPreview={project.mediaKind === 'video' || project.media?.kind === 'video'}
              className="project-media--feed project-media--reel"
              onActivate={onMediaActivate}
              onDeactivate={onMediaDeactivate}
            />
          ) : null}
        </MediaFrame>

        {heartBurst ? <span key={heartBurst} className="project-reel-card__heart-burst" aria-hidden="true">♥</span> : null}

        {/* Instagram Reels-style vertical action rail */}
        <ProjectActionBar
          engagement={project.engagement || project.engagementCounts}
          viewerState={project.viewerState}
          likeBurstSignal={heartBurst}
          onLike={onLike}
          onComments={onComments}
          onSave={onSave}
          onShare={onShare}
        />

        {/* Bottom overlay with gradient + creator + title */}
        <div className="project-reel-card__bottom-overlay">
          <div className="project-reel-card__creator-row">
            <button type="button" className="project-reel-card__creator" onClick={onCreator}>
              <Avatar src={avatarUrl} alt={creatorName} size="lg" />
              <strong className="project-reel-card__creator-name">{creatorName}</strong>
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

            <button type="button" className="project-reel-card__more-btn" onClick={onQuickActions} aria-label={`More actions for ${project.title}`}>
              <DotsIcon size={22} />
            </button>
          </div>

          <div className="project-reel-card__copy">
            <h2 id={`feed-project-${project.id}`} onClick={handleTap}>{project.title}</h2>
            {project.summary ? <p>{project.summary}</p> : null}
          </div>
        </div>
      </div>
    </article>
  )
}
