import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import ProjectTile from '../../project/components/ProjectTile'
import './ProjectPreviewModal.css'

export default function ProjectPreviewModal({ project, actions, onClose, onOpen }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const handleKeyDown = (event) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return createPortal(
    <div className="project-preview" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={dialogRef} className="project-preview__dialog" role="dialog" aria-modal="true" aria-label={`Preview of ${project.title}`} tabIndex={-1}>
        <button type="button" className="project-preview__close" onClick={onClose} aria-label="Close preview">&times;</button>
        <ProjectTile project={project} actions={actions} actionsPlacement="below" variant="preview" />
        {onOpen ? <button type="button" className="project-preview__open" onClick={onOpen}>View full project</button> : null}
      </section>
    </div>,
    document.body,
  )
}
