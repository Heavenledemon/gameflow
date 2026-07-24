import { useRef } from 'react'
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
  const creatorName = project.creator?.name || project.creator?.username || 'Creator'
  const creatorHandle = project.creator?.handle || project.creator?.username || 'creator'
  const isCurrentUser = Boolean(currentUser && (creatorHandle === currentUser.username || creatorName === currentUser.name))
  const avatarUrl = isCurrentUser && currentUser?.avatar ? currentUser.avatar : project.creator?.avatarUrl
  const isFollowing = Boolean(project.viewerState?.following)

  const isLightweight = project.mediaKind === 'image' || project.mediaKind === 'video' || project.media?.kind === 'image' || project.media?.kind === 'video'

  const handleTap = () => {
    onProject?.()
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
      {/* Full-screen media container */}
      <div className="project-reel-card__media" onClick={isLightweight ? handleMediaDoubleClick : undefined}>
        <MediaFrame
          aspectRatio="auto"
          poster={project.posterUrl || project.media?.posterUrl}
          alt={project.title}
          mediaKind={project.mediaKind || project.media?.kind}
          onActivate={onMediaActivate}
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

        {/* Instagram Reels-style vertical action rail */}
        <ProjectActionBar
          engagement={project.engagement || project.engagementCounts}
          viewerState={project.viewerState}
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
