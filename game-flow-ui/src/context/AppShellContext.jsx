import { createContext, useContext, useMemo, useState } from 'react'

const AppShellContext = createContext(null)

export function AppShellProvider({ children }) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [activeSheet, setActiveSheet] = useState(null)
  const value = useMemo(() => ({ mobileNavigationOpen, setMobileNavigationOpen, activeSheet, openSheet: setActiveSheet, closeSheet: () => setActiveSheet(null) }), [mobileNavigationOpen, activeSheet])
  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAppShell = () => useContext(AppShellContext)
