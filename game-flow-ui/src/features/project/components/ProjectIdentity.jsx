import IconButton from '../../../components/ui/IconButton'
import Avatar from '../../../components/ui/Avatar'
import { ChevronLeftIcon, DotsIcon, VerifiedIcon } from '../../../components/icons/Icons'

export default function ProjectIdentity({
  model,
  creatorRole,
  isOwner,
  viewer,
  isFollowing,
  onBack,
  onCreator,
  onFollow,
  onManage,
}) {
  const creatorName = model.creator?.name || model.creator?.username || 'Creator'
  const creatorHandle = model.creator?.handle || model.creator?.username || creatorName
  const creatorAvatar = isOwner && viewer?.avatar ? viewer.avatar : model.creator?.avatarUrl
  const projectTypeLabel = (model.projectType || model.category || 'Project').toUpperCase()

  return (
    <header className="project-detail__identity">
      <IconButton label="Go back" variant="light" onClick={onBack}>
        <ChevronLeftIcon size={20} />
      </IconButton>

      <button
        type="button"
        className="project-detail__creator"
        onClick={onCreator}
        aria-label={`View ${creatorName}'s profile (@${creatorHandle})`}
      >
        <Avatar src={creatorAvatar} alt={creatorName} size="sm" />
        <span className="project-detail__creator-copy">
          <strong>
            {creatorName}{' '}
            {(model.creator?.verified || viewer?.isVerified) ? <VerifiedIcon size={12} /> : null}
          </strong>
          <span>@{creatorHandle} {creatorRole ? `· ${creatorRole}` : ''}</span>
        </span>
      </button>

      <span className="project-detail__type-badge">{projectTypeLabel}</span>

      {isOwner ? (
        <IconButton label="Manage project" variant="light" onClick={onManage}>
          <DotsIcon size={20} />
        </IconButton>
      ) : model.creator?.id ? (
        <button
          type="button"
          className={`project-detail__follow-btn ${isFollowing ? 'following' : ''}`}
          onClick={onFollow}
          aria-label={isFollowing ? `Unfollow ${creatorName}` : `Follow ${creatorName}`}
        >
          {isFollowing ? 'Following' : 'Follow'}
        </button>
      ) : null}
    </header>
  )
}
