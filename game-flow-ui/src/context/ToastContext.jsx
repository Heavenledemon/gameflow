import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const removeToast = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), [])
  const pushToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((current) => [...current, { id, message, type }])
    if (duration > 0) window.setTimeout(() => removeToast(id), duration)
    return id
  }, [removeToast])
  const value = useMemo(() => ({ toasts, pushToast, removeToast, success: (m) => pushToast(m, 'success'), error: (m) => pushToast(m, 'error'), info: (m) => pushToast(m, 'info') }), [toasts, pushToast, removeToast])
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
