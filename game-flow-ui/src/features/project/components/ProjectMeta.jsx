import Chip from '../../../components/ui/Chip'

function MetadataRow({ label, children }) {
  if (!children) return null
  return (
    <div className="project-meta__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function displayValue(value) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === 'string' || typeof item === 'number').join(', ')
  return typeof value === 'string' || typeof value === 'number' ? value : null
}

export default function ProjectMeta({ model, project, expanded, onToggle }) {
  const createdLabel = project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'Recently'
  const roles = Array.isArray(project.roles) ? project.roles : []
  const platform = project.platform || project.platforms
  const collaborators = Array.isArray(project.collaborators) ? project.collaborators : []
  const collaboratorSummary = collaborators
    .map((member) => {
      const name = member.name || member.username
      return name ? `${name}${member.role ? ` (${member.role})` : ''}` : null
    })
    .filter(Boolean)
    .join(', ')

  const hasDetails = Boolean(
    model.summary ||
    model.tools.length ||
    model.tags.length ||
    platform ||
    project.status ||
    roles.length ||
    collaboratorSummary
  )

  return (
    <section className="project-meta" aria-labelledby="project-meta-title">
      <div className="project-meta__heading">
        <div>
          <h1 id="project-meta-title">{model.title}</h1>
          <p>
            {model.category || model.projectType || 'Project'}{' '}
            <span aria-hidden="true">·</span> {createdLabel}
          </p>
        </div>
        {hasDetails && (
          <button
            type="button"
            className="project-meta__toggle-btn"
            aria-expanded={expanded}
            aria-controls="project-metadata-details"
            onClick={onToggle}
          >
            {expanded ? 'Hide project details' : 'About this project'}
          </button>
        )}
      </div>

      <div id="project-metadata-details" hidden={!expanded} className="project-meta__details">
        {model.summary ? (
          <p className="project-meta__summary">{model.summary}</p>
        ) : (
          <p className="project-meta__summary">No description provided for this project.</p>
        )}

        <dl>
          <MetadataRow label="Type">{model.projectType || model.category}</MetadataRow>
          <MetadataRow label="Platform">{displayValue(platform)}</MetadataRow>
          <MetadataRow label="Status">{displayValue(project.status)}</MetadataRow>
          <MetadataRow label="Roles">{displayValue(roles)}</MetadataRow>
          <MetadataRow label="Team">{collaboratorSummary}</MetadataRow>
        </dl>

        {model.tools.length ? (
          <div className="project-meta__chips" aria-label="Tools used">
            {model.tools.map((tool) => (
              <Chip key={tool}>{tool}</Chip>
            ))}
          </div>
        ) : null}

        {model.tags.length ? (
          <div className="project-meta__chips" aria-label="Project tags">
            {model.tags.map((tag) => (
              <Chip key={tag}>#{tag}</Chip>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
