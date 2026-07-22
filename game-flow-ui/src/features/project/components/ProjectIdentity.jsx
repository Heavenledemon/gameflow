import { Button, IconButton } from '../../../components/ui/Button'
import { Avatar, Badge } from '../../../components/ui/Surface'
import { ChevronLeftIcon, DotsIcon, VerifiedIcon } from '../../../components/icons/Icons'

export default function ProjectIdentity({ model, creatorRole, isOwner, viewer, isFollowing, onBack, onCreator, onFollow, onManage }) {
  const creatorName = model.creator.username || model.creator.name || 'creator'
  const creatorAvatar = isOwner && viewer?.avatar ? viewer.avatar : model.creator.avatarUrl

  return (
    <header className="project-detail__identity">
      <IconButton label="Go back" variant="soft" onClick={onBack}><ChevronLeftIcon size={20} /></IconButton>
      <button type="button" className="project-detail__creator" onClick={onCreator} aria-label={`View ${creatorName}'s profile`}>
        <Avatar src={creatorAvatar} alt="" name={creatorName} size="small" />
        <span className="project-detail__creator-copy">
          <strong>{creatorName} {(model.creator.verified || viewer?.isVerified) ? <VerifiedIcon size={12} /> : null}</strong>
          <span>{creatorRole}</span>
        </span>
      </button>
      <Badge className="project-detail__type-badge">{model.projectType || model.category || 'Project'}</Badge>
      {isOwner ? (
        <IconButton label="Manage project" variant="soft" onClick={onManage}><DotsIcon size={20} /></IconButton>
      ) : model.creator.id ? (
        <Button className="project-detail__follow" variant={isFollowing ? 'secondary' : 'primary'} onClick={onFollow}>
          {isFollowing ? 'Following' : 'Follow'}
        </Button>
      ) : null}
    </header>
  )
}
