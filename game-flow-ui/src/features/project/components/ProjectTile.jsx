import { Badge } from '../../../components/ui/Surface'
import ProjectMedia from './ProjectMedia'
import './ProjectTile.css'

const TYPE_LABELS = {
  project: 'Project',
  game: 'Game',
  asset: '3D asset',
  post: 'Post',
  demo: 'Demo',
  webgl: 'Playable game',
  gltf: '3D asset',
  '3d': '3D asset',
  image: 'Visual project',
  video: 'Video project',
  unknown: 'Project',
}

function TileContents({ project }) {
  const creator = project.creator.username || project.creator.name
  const projectTypeKey = String(project.projectType || '').toLocaleLowerCase()
  const typeLabel = TYPE_LABELS[projectTypeKey] || project.projectType || TYPE_LABELS[project.contentType] || TYPE_LABELS.unknown

  return (
    <>
      <div className="project-tile__media">
        <ProjectMedia
          media={project.media}
          title={project.title}
          active={false}
          interactive={false}
          posterOnly
          className="project-media--tile"
          overlay={<Badge className="project-tile__badge">{typeLabel}</Badge>}
        />
      </div>
      <div className="project-tile__copy">
        <h3>{project.title}</h3>
        {creator ? <span>@{creator}</span> : <span>Creator unavailable</span>}
      </div>
    </>
  )
}

export default function ProjectTile({ project, onOpen, actions = null, selected = false }) {
  return (
    <article className={`project-tile ${selected ? 'project-tile--selected' : ''}`} role="listitem">
      <TileContents project={project} />
      {onOpen ? <button type="button" className="project-tile__open" aria-label={`View ${project.title}`} onClick={onOpen} /> : (
        <span className="project-tile__route-status">Project page unavailable</span>
      )}
      {actions ? <div className="project-tile__actions">{actions}</div> : null}
    </article>
  )
}
