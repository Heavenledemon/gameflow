import { Button } from './Button'
import './EmptyState.css'

export default function EmptyState({
  variant = 'empty',
  icon,
  title = 'No content available',
  description,
  action,
  retryAction,
  className = '',
  headingLevel = 2,
  ...props
}) {
  const Heading = `h${Math.min(6, Math.max(1, headingLevel))}`

  const resolvedAction = variant === 'error' && retryAction ? retryAction : action

  const fallbackIcon = variant === 'error' ? (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ) : (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
    </svg>
  )

  return (
    <div
      className={`gf-empty-state gf-empty-state--${variant} ${className}`.trim()}
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      {...props}
    >
      <div className="gf-empty-state__icon" aria-hidden="true">
        {icon || fallbackIcon}
      </div>
      <Heading className="gf-empty-state__title">{title}</Heading>
      {description && (
        <p className="gf-empty-state__description">{description}</p>
      )}
      {resolvedAction && (
        <div className="gf-empty-state__actions">
          <Button
            variant={variant === 'error' ? 'secondary' : 'primary'}
            onClick={resolvedAction.onClick}
          >
            {resolvedAction.label}
          </Button>
        </div>
      )}
    </div>
  )
}

// Backward compatibility wrapper for ErrorState
export function ErrorState({
  title = 'Something went wrong',
  description,
  message,
  icon,
  onRetry,
  retryLabel = 'Try again',
  retrying = false,
  headingLevel = 2,
  ...props
}) {
  return (
    <EmptyState
      variant="error"
      icon={icon}
      title={title}
      description={description || message}
      headingLevel={headingLevel}
      retryAction={onRetry ? { label: retryLabel, onClick: onRetry } : undefined}
      {...props}
    />
  )
}
