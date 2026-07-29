import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ProjectTile from '../../project/components/ProjectTile'
import './ProjectPreviewModal.css'

export default function ProjectPreviewModal({ project, originRect, actions, onClose, onOpen }) {
  const dialogRef = useRef(null)
  const closeTimerRef = useRef(null)
  const closingRef = useRef(false)
  const [closing, setClosing] = useState(false)

  const requestClose = useCallback(() => {
    if (closingRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      return
    }
    closingRef.current = true
    setClosing(true)
    closeTimerRef.current = window.setTimeout(onClose, 280)
  }, [onClose])

  const originStyle = useMemo(() => {
    if (!originRect || typeof window === 'undefined') return undefined
    const targetWidth = Math.min(window.innerWidth * 0.92, 430)
    const originCenterX = originRect.left + originRect.width / 2
    const originCenterY = originRect.top + originRect.height / 2
    return {
      '--preview-origin-x': `${originCenterX - window.innerWidth / 2}px`,
      '--preview-origin-y': `${originCenterY - window.innerHeight / 2}px`,
      '--preview-origin-scale': Math.max(0.2, Math.min(0.96, originRect.width / targetWidth)),
      '--preview-origin-radius': '16px',
    }
  }, [originRect])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const handleKeyDown = (event) => { if (event.key === 'Escape') requestClose() }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
      window.clearTimeout(closeTimerRef.current)
    }
  }, [requestClose])

  return createPortal(
    <div className={`project-preview ${closing ? 'project-preview--closing' : ''}`} role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) requestClose() }}>
      <section ref={dialogRef} className="project-preview__dialog" style={originStyle} role="dialog" aria-modal="true" aria-label={`Preview of ${project.title}`} tabIndex={-1}>
        <button type="button" className="project-preview__close" onClick={requestClose} aria-label="Close preview">&times;</button>
        <ProjectTile project={project} actions={actions} actionsPlacement="below" variant="preview" />
        {onOpen ? <button type="button" className="project-preview__open" onClick={onOpen}>View full project</button> : null}
      </section>
    </div>,
    document.body,
  )
}
