import { useCallback, useEffect, useState } from 'react'
import Skeleton from '../../../components/ui/Skeleton'
import ProjectTile from '../../project/components/ProjectTile'
import ProjectPreviewModal from './ProjectPreviewModal'
import './ProjectGrid.css'

const LONG_PRESS_HINT_KEY = 'gameflow.project-preview-hint-seen-v2'

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
  const [previewProject, setPreviewProject] = useState(null)
  const [showLongPressHint, setShowLongPressHint] = useState(() => {
    if (typeof window === 'undefined') return false
    try { return !window.localStorage.getItem(LONG_PRESS_HINT_KEY) } catch { return true }
  })
  const closePreview = useCallback(() => setPreviewProject(null), [])
  const dismissLongPressHint = useCallback(() => {
    setShowLongPressHint(false)
    try { window.localStorage.setItem(LONG_PRESS_HINT_KEY, 'true') } catch { /* Storage may be unavailable. */ }
  }, [])

  useEffect(() => {
    if (!showLongPressHint) return undefined
    const timer = window.setTimeout(() => setShowLongPressHint(false), 12000)
    return () => window.clearTimeout(timer)
  }, [showLongPressHint])

  if (loading) return <ProjectGridSkeleton />

  return (
    <div className="project-grid-shell">
      <div className="project-grid" role="list">
        {projectList.map((project, index) => (
          <ProjectTile
            key={`${project.contentType || 'project'}:${project.contentId ?? project.id}`}
            project={project}
            onOpen={onOpenProject ? () => onOpenProject(project) : undefined}
            onPreview={setPreviewProject}
            onLongPress={setPreviewProject}
            showLongPressHint={showLongPressHint && index === 0}
            onLongPressHintDismiss={dismissLongPressHint}
            actions={renderActions?.(project) || null}
            actionsPlacement={actionsPlacement}
            variant="masonry"
            fallbackAspectRatio={['3 / 4', '1 / 1', '4 / 5', '2 / 3'][index % 4]}
          />
        ))}
      </div>
      {previewProject ? (
        <ProjectPreviewModal
          project={previewProject}
          actions={renderActions?.(previewProject) || null}
          onClose={closePreview}
          onOpen={onOpenProject ? () => { closePreview(); onOpenProject(previewProject) } : undefined}
        />
      ) : null}
    </div>
  )
}
