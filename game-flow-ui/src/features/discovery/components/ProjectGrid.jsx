import Skeleton from '../../../components/ui/Skeleton'
import ProjectTile from '../../project/components/ProjectTile'
import './ProjectGrid.css'

function ProjectGridSkeleton() {
  return (
    <div className="project-grid-shell">
      <div className="project-grid project-grid--loading" role="status" aria-label="Loading projects">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="project-grid__skeleton" key={index}>
            <Skeleton variant="media" width="100%" height="100%" />
            <Skeleton variant="text" width="78%" />
            <Skeleton variant="text" width="52%" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProjectGrid({
  items,
  projects, // Backward compatibility alias
  loading = false,
  onOpenProject,
  renderActions,
  actionsPlacement = 'overlay',
}) {
  const projectList = items || projects || []

  if (loading) return <ProjectGridSkeleton />

  return (
    <div className="project-grid-shell">
      <div className="project-grid" role="list">
        {projectList.map((project, index) => (
          <ProjectTile
            key={`${project.contentType || 'project'}:${project.contentId ?? project.id}`}
            project={project}
            onOpen={onOpenProject ? () => onOpenProject(project) : undefined}
            actions={renderActions?.(project) || null}
            actionsPlacement={actionsPlacement}
            variant="masonry"
            fallbackAspectRatio={['3 / 4', '1 / 1', '4 / 5', '2 / 3'][index % 4]}
          />
        ))}
      </div>
    </div>
  )
}
