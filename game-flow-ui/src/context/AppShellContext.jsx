import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AppShellContext = createContext(null)

export function AppShellProvider({ children }) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false)
  const [activeSheet, setActiveSheet] = useState(null)
  const [topBar, setTopBar] = useState(null)
  const [immersiveMode, setImmersiveMode] = useState(false)

  const closeSheet = useCallback(() => setActiveSheet(null), [])
  const clearTopBar = useCallback(() => setTopBar(null), [])
  const enterImmersiveMode = useCallback(() => setImmersiveMode(true), [])
  const exitImmersiveMode = useCallback(() => setImmersiveMode(false), [])

  const value = useMemo(() => ({
    mobileNavigationOpen,
    setMobileNavigationOpen,
    activeSheet,
    openSheet: setActiveSheet,
    closeSheet,
    topBar,
    setTopBar,
    clearTopBar,
    immersiveMode,
    enterImmersiveMode,
    exitImmersiveMode,
  }), [
    mobileNavigationOpen,
    activeSheet,
    closeSheet,
    topBar,
    clearTopBar,
    immersiveMode,
    enterImmersiveMode,
    exitImmersiveMode,
  ])
  return <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAppShell = () => useContext(AppShellContext)
