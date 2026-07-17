import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const removeToast = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), [])
  const pushToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, message, type }])
    if (duration > 0) window.setTimeout(() => removeToast(id), duration)
    return id
  }, [removeToast])
  const value = useMemo(() => ({ toasts, removeToast, pushToast, success: (message) => pushToast(message, 'success'), error: (message) => pushToast(message, 'error'), info: (message) => pushToast(message, 'info') }), [toasts, removeToast, pushToast])
  return <ToastContext.Provider value={value}>{children}<ToastViewport /></ToastContext.Provider>
}

function ToastViewport() {
  const context = useContext(ToastContext)
  return <div className="toast-viewport" aria-live="polite">{context.toasts.map((toast) => <button className={`toast toast-${toast.type}`} key={toast.id} onClick={() => context.removeToast(toast.id)}>{toast.message}</button>)}</div>
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
