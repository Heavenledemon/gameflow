import { useEffect, useRef, useState } from 'react'

export const DESIGN_OPTIONS = [
  { id: 'bauhaus', label: 'Bauhaus balance', description: 'Crisp circles, arches, and blocks.' },
  { id: 'waves', label: 'Flowing waves', description: 'Layered flat curves with graphic rhythm.' },
  { id: 'doodles', label: 'Creative doodles', description: 'Handmade symbols for creator profiles.' },
  { id: 'botanicals', label: 'Moonlit botanicals', description: 'Elegant leaves, flowers, and stars.' },
]

export const DESIGN_PALETTES = {
  midnight: { label: 'Midnight Paper', colors: ['#f8fafc', '#22d3ee', '#a78bfa', '#0b2550'] },
  coral: { label: 'Coral Cream', colors: ['#fff7e8', '#fb6f5d', '#f5a3b7', '#51312d'] },
  electric: { label: 'Electric Poster', colors: ['#ffd60a', '#3b82f6', '#ef4444', '#111827'] },
  sakura: { label: 'Sakura Ink', colors: ['#fff7fb', '#f9a8d4', '#c4b5fd', '#4c1d95'] },
  botanical: { label: 'Botanical Night', colors: ['#f8fafc', '#6ee7b7', '#7dd3fc', '#0b2747'] },
  monochrome: { label: 'Monochrome', colors: ['#ffffff', '#cbd5e1', '#64748b', '#111827'] },
}

export const DOODLE_THEMES = ['Developer', 'Gamer', 'Artist', 'Music', 'General']
const STATUS_MESSAGES = { greeting: 'Hey there! 👋', building: 'Building something ✨', work: 'Open to work 💼' }

function Bauhaus({ alternate }) {
  return <svg viewBox="0 0 140 170" aria-hidden="true"><g className={`flat-design__art flat-design__bauhaus${alternate ? ' is-alternate' : ''}`}><rect x="28" y="65" width="48" height="48" rx="2" fill="var(--flat-paper)"/><path d="M77 65h35v35H77Z" fill="var(--flat-accent)"/><path d="M77 102a35 35 0 0 1 35 35H77Z" fill="var(--flat-secondary)"/><circle cx="52" cy="89" r="15" fill="var(--flat-primary)"/><path d="M28 115h47v22H28Z" fill="var(--flat-depth)"/><path className="flat-design__detail-secondary" d="M112 48v15H97a15 15 0 0 1 15-15Z" fill="var(--flat-primary)"/><circle className="flat-design__detail-secondary" cx="36" cy="52" r="7" fill="var(--flat-secondary)"/><path className="flat-design__detail-full" d="M87 45h8v8h-8ZM19 87h7v25h-7Z" fill="var(--flat-accent)"/><path className="flat-design__detail-full" d="M113 112h11v11h-11Z" fill="var(--flat-paper)"/></g></svg>
}

function Waves({ alternate }) {
  return <svg viewBox="0 0 140 170" aria-hidden="true"><g className={`flat-design__art flat-design__waves${alternate ? ' is-alternate' : ''}`}><path d="M15 139V97c18-14 30-15 48-1 21 16 36 16 62-5v48Z" fill="var(--flat-depth)"/><path d="M15 119V79c18-14 32-13 49 2 19 18 36 18 61-4v42c-25 22-42 22-61 4-17-15-31-16-49-4Z" fill="var(--flat-secondary)"/><path d="M15 94V57c19-12 33-10 49 5 19 17 37 18 61-5v37c-24 23-42 22-61 5-16-15-30-17-49-5Z" fill="var(--flat-primary)"/><path className="flat-design__detail-secondary" d="M15 69V43c17-8 34-4 49 9 19 16 38 18 61-4v22c-23 22-42 20-61 4-15-13-32-17-49-5Z" fill="var(--flat-paper)"/><path className="flat-design__detail-full" d="M24 48c8-7 17-7 25 0M91 37c7 7 14 7 23-1" fill="none" stroke="var(--flat-accent)" strokeWidth="4" strokeLinecap="round"/></g></svg>
}

function DoodleIcon({ theme }) {
  if (theme === 'Gamer') return <><path d="M47 79c5-19 45-19 50 0l6 24c2 8-7 13-13 7L78 99H66l-13 11c-7 6-15 0-13-7Z"/><path d="M52 86h13M58 80v13M84 84v1M92 91v1"/></>
  if (theme === 'Artist') return <><path d="M71 62c24 0 35 19 24 30-6 6-13-1-19 5-5 5-3 12-11 12-17 0-28-12-27-24 1-13 14-23 33-23Z"/><circle cx="57" cy="78" r="2"/><circle cx="69" cy="72" r="2"/><circle cx="82" cy="76" r="2"/></>
  if (theme === 'Music') return <><path d="M61 69v38M61 75l31-8v34M61 75l31-8"/><ellipse cx="53" cy="108" rx="9" ry="6"/><ellipse cx="84" cy="102" rx="9" ry="6"/></>
  if (theme === 'General') return <><path d="m71 59 7 17 18 2-14 12 4 18-15-9-16 9 5-18-14-12 18-2Z"/></>
  return <><path d="m60 70-17 17 17 17M83 70l17 17-17 17M77 64l-12 47"/></>
}

function Doodles({ theme, alternate }) {
  return <svg viewBox="0 0 140 170" aria-hidden="true"><g className={`flat-design__art flat-design__doodles${alternate ? ' is-alternate' : ''}`} fill="none" stroke="var(--flat-paper)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><DoodleIcon theme={theme}/><path d="m25 61 3 7 7 3-7 3-3 7-3-7-7-3 7-3ZM112 111l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="var(--flat-primary)" stroke="none"/><path className="flat-design__detail-secondary" d="M103 48c9-7 18 3 10 10M31 118c-9 8 3 17 11 9" stroke="var(--flat-secondary)"/><path className="flat-design__detail-full" d="M22 94h12M105 72h14M43 45l5 8M94 130l5 8" stroke="var(--flat-accent)"/><circle className="flat-design__detail-full" cx="119" cy="88" r="4" fill="var(--flat-secondary)" stroke="none"/></g></svg>
}

function Botanicals({ alternate }) {
  return <svg viewBox="0 0 140 170" aria-hidden="true"><g className={`flat-design__art flat-design__botanicals${alternate ? ' is-alternate' : ''}`} fill="none" stroke="var(--flat-paper)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M36 143c4-52 23-79 66-102M53 126c17-8 28-20 32-38M66 106c-9-9-13-19-12-31M84 88c13-4 23-13 29-26"/><path d="M47 127c-15-2-23-11-25-25 14 1 23 10 25 25ZM61 111c-2-14 4-24 17-31 3 14-3 24-17 31ZM55 85c-12-5-18-14-17-27 12 4 18 13 17 27ZM84 88c0-14 7-23 20-28 0 13-7 23-20 28Z" fill="var(--flat-secondary)" stroke="none"/><path className="flat-design__detail-secondary" d="M74 65c-3-11 1-20 12-26 4 11 0 20-12 26ZM98 56c1-10 7-17 17-19-1 10-6 16-17 19Z" fill="var(--flat-primary)" stroke="none"/><g className="flat-design__flower"><circle cx="105" cy="107" r="5" fill="var(--flat-accent)" stroke="none"/><path d="M105 98v18M96 107h18" stroke="var(--flat-primary)"/></g><path className="flat-design__detail-full" d="m30 71 3 7 7 3-7 3-3 7-3-7-7-3 7-3ZM113 130l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="var(--flat-paper)" stroke="none"/></g></svg>
}

export default function AbstractProfileDesign({ type = 'bauhaus', palette = 'midnight', density = 'balanced', lineStyle = 'clean', motion = 'subtle', interaction = 'rearrange', doodleTheme = 'Developer', status = 'off', statusText = '', statusBehavior = 'once', preview = false }) {
  const [alternate, setAlternate] = useState(false)
  const [statusVisible, setStatusVisible] = useState(() => status !== 'off' && statusBehavior !== 'tap')
  const timer = useRef()
  const paletteData = DESIGN_PALETTES[palette] || DESIGN_PALETTES.midnight
  const message = status === 'custom' ? String(statusText || '').trim().slice(0, 35) : STATUS_MESSAGES[status]
  const normalizedType = DESIGN_OPTIONS.some((item) => item.id === type) ? type : 'bauhaus'
  const colors = alternate && interaction === 'colors' ? [paletteData.colors[0], paletteData.colors[2], paletteData.colors[1], paletteData.colors[3]] : paletteData.colors
  const style = { '--flat-paper': colors[0], '--flat-primary': colors[1], '--flat-secondary': colors[2], '--flat-depth': colors[3], '--flat-accent': colors[1] }

  useEffect(() => { if (statusVisible && statusBehavior === 'once') timer.current = window.setTimeout(() => setStatusVisible(false), 4200); return () => window.clearTimeout(timer.current) }, [statusBehavior, statusVisible])
  const interact = () => {
    if (interaction !== 'none') setAlternate((value) => !value)
    if (message) { setStatusVisible(true); window.clearTimeout(timer.current); if (statusBehavior !== 'always') timer.current = window.setTimeout(() => setStatusVisible(false), 3600) }
  }
  const Design = normalizedType === 'waves' ? <Waves alternate={alternate}/> : normalizedType === 'doodles' ? <Doodles theme={doodleTheme} alternate={alternate}/> : normalizedType === 'botanicals' ? <Botanicals alternate={alternate}/> : <Bauhaus alternate={alternate}/>
  const content = <>{message ? <span className={`abstract-design__status${statusVisible || preview ? ' is-visible' : ''}`}>{message}</span> : null}{Design}</>
  const classes = `abstract-design flat-design--${normalizedType} flat-design--density-${density} flat-design--line-${lineStyle} flat-design--motion-${motion} flat-design--interaction-${interaction}${alternate ? ' is-alternate' : ''}`
  if (preview) return <span className={`${classes} abstract-design--preview`} style={style}>{content}</span>
  return <button type="button" className={classes} style={style} onClick={interact} aria-label={`${DESIGN_OPTIONS.find((item) => item.id === normalizedType)?.label} 2D profile design`}>{content}</button>
}
