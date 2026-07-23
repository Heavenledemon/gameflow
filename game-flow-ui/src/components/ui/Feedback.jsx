
export { default as Skeleton } from './Skeleton'

export function LoadingState({ label = 'Loading' }) {
  return <div className="gf-feedback" role="status"><span aria-hidden="true" className="gf-spinner" /><span>{label}</span></div>
}

export { default as EmptyState, ErrorState } from './EmptyState'

export function ToastViewport({ toasts = [], onDismiss }) {
  return <div className="gf-toast-viewport" aria-live="polite">{toasts.map((toast) => <div className={`gf-toast gf-toast--${toast.type || 'info'}`} key={toast.id}><span>{toast.message}</span><button type="button" aria-label="Dismiss notification" onClick={() => onDismiss?.(toast.id)}>&times;</button></div>)}</div>
}
