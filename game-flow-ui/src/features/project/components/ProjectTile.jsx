import Avatar from '../../../components/ui/Avatar'
import MediaFrame from '../../../components/ui/MediaFrame'
import './ProjectTile.css'

export default function ProjectTile({ project, onOpen, selected = false }) {
  const creatorName = project.creator?.name || project.creator?.handle || project.creator?.username || 'Creator'
  const creatorHandle = project.creator?.handle || project.creator?.username || creatorName
  const projectTypeLabel = (project.projectType || 'Project').toUpperCase()
  const routeTarget = project.canonicalRoute || project.routeTarget

  const handleClick = () => {
    if (onOpen) onOpen(project)
  }

  return (
    <article
      className={`project-tile ${selected ? 'project-tile--selected' : ''}`}
      role="listitem"
    >
      <div className="project-tile__media">
        <MediaFrame
          aspectRatio="1/1"
          poster={project.posterUrl || project.media?.posterUrl}
          alt={project.title}
          mediaKind={project.mediaKind || project.media?.kind}
          badge={<span className="project-tile__badge">{projectTypeLabel}</span>}
        />
      </div>

      <div className="project-tile__copy">
        <h3 className="project-tile__title">{project.title}</h3>
        <div className="project-tile__creator">
          <Avatar src={project.creator?.avatarUrl} alt="" name={creatorName} size="xs" />
          <span className="project-tile__creator-name">@{creatorHandle}</span>
        </div>
      </div>

      {routeTarget && (
        <button
          type="button"
          className="project-tile__open"
          aria-label={`View project details for ${project.title} by ${creatorName}`}
          onClick={handleClick}
        />
      )}
    </article>
  )
}
