import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'gameflow-theme-preferences'

export const backgroundOptions = [
  { color: '#fefae0', text: '#171827' },
  { color: '#ffc8dd', text: '#2b1218' },
  { color: '#bde0fe', text: '#102a43' },
  { color: '#e9edc9', text: '#283618' },
  { color: '#003566', text: '#ffffff' },
  { color: '#2a9d8f', text: '#071e1b' },
  { color: '#7b2cbf', text: '#ffffff' },
  { color: '#936639', text: '#ffffff' },
  { color: '#edede9', text: '#252422' },
]

export const navbarOptions = [
  { color: '#fdf0d5', text: '#171827' },
  { color: '#ffafcc', text: '#2b1218' },
  { color: '#a2d2ff', text: '#102a43' },
  { color: '#ccd5ae', text: '#283618' },
  { color: '#001d3d', text: '#ffffff' },
  { color: '#264653', text: '#ffffff' },
  { color: '#5a189a', text: '#ffffff' },
  { color: '#7f4f24', text: '#ffffff' },
  { color: '#d6ccc2', text: '#252422' },
]

const ThemeContext = createContext(null)

function readPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      background: backgroundOptions.some(({ color }) => color === saved.background) ? saved.background : backgroundOptions[0].color,
      navbar: navbarOptions.some(({ color }) => color === saved.navbar) ? saved.navbar : navbarOptions[0].color,
    }
  } catch {
    return { background: backgroundOptions[0].color, navbar: navbarOptions[0].color }
  }
}

export function ThemeProvider({ children }) {
  const [preferences, setPreferences] = useState(readPreferences)

  useEffect(() => {
    const root = document.documentElement
    const background = backgroundOptions.find(({ color }) => color === preferences.background) || backgroundOptions[0]
    const navbar = navbarOptions.find(({ color }) => color === preferences.navbar) || navbarOptions[0]

    root.dataset.backgroundTheme = background.color
    const darkBackground = background.text === '#ffffff'
    root.dataset.colorScheme = darkBackground ? 'dark' : 'light'
    root.style.colorScheme = darkBackground ? 'dark' : 'light'
    root.style.setProperty('--gf-bg', background.color)
    root.style.setProperty('--gf-shell-surface', background.color)
    root.style.setProperty('--gf-shell-outer-surface', background.color)
    root.style.setProperty('--gf-shell-top-bar-surface', `color-mix(in srgb, ${background.color} 96%, transparent)`)
    root.style.setProperty('--gf-background-text', background.text)
    root.style.setProperty('--gf-text', background.text)
    root.style.setProperty('--gf-text-muted', `color-mix(in srgb, ${background.text} 72%, ${background.color})`)
    root.style.setProperty('--gf-text-primary', background.text)
    root.style.setProperty('--gf-text-secondary', `color-mix(in srgb, ${background.text} 72%, ${background.color})`)
    root.style.setProperty('--gf-text-tertiary', `color-mix(in srgb, ${background.text} 55%, ${background.color})`)
    root.style.setProperty('--gf-shell-text', background.text)
    root.style.setProperty('--gf-shell-navigation-surface', navbar.color)
    root.style.setProperty('--gf-shell-navigation-text', navbar.text)
    root.style.setProperty('--gf-navbar-text', navbar.text)
    if (darkBackground) {
      root.style.setProperty('--gf-surface', `color-mix(in srgb, ${background.color} 82%, black)`)
      root.style.setProperty('--gf-surface-raised', `color-mix(in srgb, ${background.color} 70%, black)`)
      root.style.setProperty('--gf-control', `color-mix(in srgb, ${background.color} 72%, white)`)
      root.style.setProperty('--gf-control-hover', `color-mix(in srgb, ${background.color} 62%, white)`)
      root.style.setProperty('--gf-control-active', `color-mix(in srgb, ${background.color} 54%, white)`)
      root.style.setProperty('--gf-border', 'rgb(255 255 255 / 26%)')
      root.style.setProperty('--gf-glass-surface', 'rgb(0 0 0 / 24%)')
      root.style.setProperty('--gf-glass-surface-strong', 'rgb(0 0 0 / 38%)')
      root.style.setProperty('--gf-glass-border', 'rgb(255 255 255 / 22%)')
      root.style.setProperty('--gf-glass-highlight', 'rgb(255 255 255 / 12%)')
    } else {
      root.style.setProperty('--gf-surface', '#ffffff')
      root.style.setProperty('--gf-surface-raised', '#ffffff')
      root.style.setProperty('--gf-control', '#f0f1f6')
      root.style.setProperty('--gf-control-hover', '#e7e8f0')
      root.style.setProperty('--gf-border', '#e8e8f0')
      root.style.setProperty('--gf-control-active', '#dedfe9')
      root.style.setProperty('--gf-glass-surface', 'rgb(255 255 255 / 58%)')
      root.style.setProperty('--gf-glass-surface-strong', 'rgb(255 255 255 / 78%)')
      root.style.setProperty('--gf-glass-border', 'rgb(255 255 255 / 72%)')
      root.style.setProperty('--gf-glass-highlight', 'rgb(255 255 255 / 62%)')
    }
    root.style.setProperty('--gf-page-bg', background.color)
    root.style.setProperty('--color-bg-page', background.color)
    root.style.setProperty('--color-bg-card', 'var(--gf-surface)')
    root.style.setProperty('--color-bg-muted', 'var(--gf-control)')
    root.style.setProperty('--color-border', 'var(--gf-border)')
    root.style.setProperty('--color-text-dark', background.text)
    root.style.setProperty('--color-text-mid', 'var(--gf-text-secondary)')
    root.style.setProperty('--color-text-light', 'var(--gf-text-tertiary)')
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
  }, [preferences])

  const setBackground = useCallback((background) => {
    if (backgroundOptions.some(({ color }) => color === background)) {
      setPreferences((current) => ({ ...current, background }))
    }
  }, [])

  const setNavbar = useCallback((navbar) => {
    if (navbarOptions.some(({ color }) => color === navbar)) {
      setPreferences((current) => ({ ...current, navbar }))
    }
  }, [])

  const value = useMemo(() => ({ ...preferences, setBackground, setNavbar }), [preferences, setBackground, setNavbar])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
