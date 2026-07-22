import { Skeleton } from '../../../components/ui/Feedback'
import ProjectTile from '../../project/components/ProjectTile'
import './ProjectGrid.css'

function ProjectGridSkeleton() {
  return (
    <div className="project-grid-shell">
      <div className="project-grid project-grid--loading" role="status" aria-label="Loading projects">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="project-grid__skeleton" key={index}>
            <Skeleton className="project-grid__skeleton-media" width="100%" height="100%" />
            <Skeleton width="78%" height={16} />
            <Skeleton width="52%" height={12} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProjectGrid({ projects, loading = false, onOpenProject, renderActions }) {
  if (loading) return <ProjectGridSkeleton />

  return (
    <div className="project-grid-shell">
      <div className="project-grid" role="list">
        {projects.map((project) => (
          <ProjectTile
            key={`${project.contentType}:${project.contentId ?? project.id}`}
            project={project}
            onOpen={project.routeTarget && onOpenProject ? () => onOpenProject(project) : undefined}
            actions={renderActions?.(project) || null}
          />
        ))}
      </div>
    </div>
  )
}
