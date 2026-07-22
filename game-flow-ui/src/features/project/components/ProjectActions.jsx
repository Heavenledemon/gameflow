import { Button, IconButton } from '../../../components/ui/Button'
import { BookmarkIcon, CommentIcon, HeartIcon, ShareIcon } from '../../../components/icons/Icons'

const formatCount = (value = 0) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)

export function primaryActionLabel(model) {
  if (model.media.kind === 'webgl') return 'Open playable preview'
  if (model.media.kind === 'gltf') return 'Open 3D preview'
  if (model.media.kind === 'video') return 'Open video preview'
  return 'View project media'
}

export default function ProjectActions({ model, liked, saved, collaborationLabel, collaborationAllowed, collaborationBusy, onPrimary, onLike, onComments, onSave, onCollaboration, onShare }) {
  const engagement = model.engagement
  return (
    <section className="project-actions" aria-label="Project actions">
      <div className="project-actions__primary">
        <Button onClick={onPrimary}>{primaryActionLabel(model)}</Button>
        {collaborationAllowed ? <Button variant="secondary" loading={collaborationBusy} disabled={collaborationBusy} onClick={onCollaboration}>{collaborationLabel}</Button> : null}
      </div>
      <div className="project-actions__social" aria-label="Social actions">
        <div><IconButton label={liked ? 'Unlike project' : 'Like project'} aria-pressed={liked} onClick={onLike}><HeartIcon filled={liked} size={22} /></IconButton><span>{formatCount(engagement.likesCount)}</span></div>
        <div><IconButton label="Open comments" onClick={onComments}><CommentIcon size={22} /></IconButton><span>{formatCount(engagement.commentsCount)}</span></div>
        <div><IconButton label={saved ? 'Remove saved project' : 'Save project'} aria-pressed={saved} onClick={onSave}><BookmarkIcon filled={saved} size={22} /></IconButton><span>{formatCount(engagement.savesCount)}</span></div>
        <div><IconButton label="Share project" onClick={onShare}><ShareIcon size={22} /></IconButton><span>Share</span></div>
      </div>
    </section>
  )
}
