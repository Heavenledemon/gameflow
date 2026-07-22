import { Button } from '../../../components/ui/Button'
import { Sheet } from '../../../components/ui/Overlay'
import { Chip } from '../../../components/ui/Surface'

const SHARE_OPTIONS = [
  ['copy', 'Copy link'],
  ['whatsapp', 'WhatsApp'],
  ['x', 'X'],
  ['facebook', 'Facebook'],
  ['linkedin', 'LinkedIn'],
]

export default function ProjectQuickActionsSheet({ open, project, shareFirst = false, onClose, onOpenProject, onCollaborate, onShare }) {
  if (!project) return null

  return (
    <Sheet
      open={open}
      title={shareFirst ? `Share ${project.title}` : project.title}
      description={shareFirst ? 'Choose where to share this project.' : 'Project details and quick actions'}
      onClose={onClose}
    >
      {!shareFirst ? (
        <>
          {project.summary ? <p className="project-quick-sheet__summary">{project.summary}</p> : null}
          <div className="project-quick-sheet__metadata">
            {project.projectType ? <Chip>{project.projectType}</Chip> : null}
            {[...project.tools, ...project.tags].map((item) => <Chip key={item}>{item}</Chip>)}
          </div>
          {project.collaboration.open === true && project.routeTarget ? (
            <p className="project-quick-sheet__collaboration">This project accepts collaboration requests. Open the project to review the real request options.</p>
          ) : null}
        </>
      ) : null}

      <div className="project-quick-sheet__actions">
        {project.routeTarget ? <Button onClick={onOpenProject}>View full project</Button> : null}
        {!shareFirst && project.collaboration.open === true && project.routeTarget ? (
          <Button variant="secondary" onClick={onCollaborate}>Collaborate on project</Button>
        ) : null}
        {!shareFirst ? <Button variant="secondary" onClick={() => onShare('copy')}>Copy link</Button> : null}
        {shareFirst ? SHARE_OPTIONS.map(([key, label]) => (
          <Button key={key} variant="secondary" onClick={() => onShare(key)}>{label}</Button>
        )) : null}
      </div>
    </Sheet>
  )
}
