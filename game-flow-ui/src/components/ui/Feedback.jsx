import { Button } from './Button'

export function Skeleton({ className = '', width, height, radius, borderRadius, circle = false, style: customStyle, ...props }) {
  const style = {
    ...(width ? { '--gf-skeleton-width': typeof width === 'number' ? `${width}px` : width } : {}),
    ...(height ? { '--gf-skeleton-height': typeof height === 'number' ? `${height}px` : height } : {}),
    ...(radius || borderRadius ? { '--gf-skeleton-radius': radius || borderRadius } : {}),
    ...customStyle
  }
  return <span aria-hidden="true" className={`gf-skeleton ${circle ? 'gf-skeleton--circle' : ''} ${className}`.trim()} style={style} {...props} />
}

export function LoadingState({ label = 'Loading' }) {
  return <div className="gf-feedback" role="status"><span aria-hidden="true" className="gf-spinner" /><span>{label}</span></div>
}

export function EmptyState({ title = 'Nothing here yet', description, icon, action, actionLabel, actionText, onAction, headingLevel = 2 }) {
  const Heading = `h${Math.min(6, Math.max(1, headingLevel))}`
  const resolvedActionLabel = actionLabel || actionText
  return <div className="gf-feedback">
    {icon ? <div className="gf-feedback__icon" aria-hidden="true">{icon}</div> : null}
    <Heading className="gf-feedback__title">{title}</Heading>
    {description ? <p className="gf-feedback__description">{description}</p> : null}
    {action || (resolvedActionLabel && onAction) ? <div className="gf-feedback__actions">{action || <Button variant="secondary" onClick={onAction}>{resolvedActionLabel}</Button>}</div> : null}
  </div>
}

export function ErrorState({ title = 'Something went wrong', description, message, icon, onRetry, retryLabel = 'Try again', retrying = false, headingLevel = 2 }) {
  const Heading = `h${Math.min(6, Math.max(1, headingLevel))}`
  const resolvedDescription = description || message
  return <div className="gf-feedback gf-feedback--error" role="alert">
    {icon ? <div className="gf-feedback__icon" aria-hidden="true">{icon}</div> : null}
    <Heading className="gf-feedback__title">{title}</Heading>
    {resolvedDescription ? <p className="gf-feedback__description">{resolvedDescription}</p> : null}
    {onRetry ? <div className="gf-feedback__actions"><Button variant="secondary" loading={retrying} onClick={onRetry}>{retryLabel}</Button></div> : null}
  </div>
}

export function ToastViewport({ toasts = [], onDismiss }) {
  return <div className="gf-toast-viewport" aria-live="polite">{toasts.map((toast) => <div className={`gf-toast gf-toast--${toast.type || 'info'}`} key={toast.id}><span>{toast.message}</span><button type="button" aria-label="Dismiss notification" onClick={() => onDismiss?.(toast.id)}>&times;</button></div>)}</div>
}
