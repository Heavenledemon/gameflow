import { useEffect, useRef, useState } from 'react'

export const COMPANION_OPTIONS = [
  { id: 'none', label: 'None', description: 'Keep your profile clean and minimal.' },
  { id: 'cosmic', label: 'Cosmic spirit', description: 'A curious star-born companion.' },
  { id: 'mood', label: 'Mood blob', description: 'A cheerful emoji that reacts to taps.' },
  { id: 'white-cat', label: 'Moonlight cat', description: 'A soft white cat made for dark themes.' },
  { id: 'pixel-cat', label: 'Pixel cat', description: 'A tiny cat that watches over your links.' },
  { id: 'aurora', label: 'Aurora flow', description: 'A calm, abstract ribbon of color.' },
]

function CosmicSpirit() {
  return <svg viewBox="0 0 140 170" aria-hidden="true">
    <defs><linearGradient id="cosmic-body" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8b5cf6"/><stop offset=".52" stopColor="#ec4899"/><stop offset="1" stopColor="#38bdf8"/></linearGradient><filter id="cosmic-glow"><feGaussianBlur stdDeviation="5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <g className="profile-companion__float"><path className="profile-companion__orbit" d="M18 92c20-31 79-46 108-18 20 20-15 56-60 56-38 0-59-17-48-38Z" fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="4 7"/><path d="M50 57c7-27 35-36 53-17 18 20 11 63-9 79-12 10-27 2-35-12-10-18-15-35-9-50Z" fill="url(#cosmic-body)" filter="url(#cosmic-glow)"/><path d="M63 45c-13-16-2-27 7-15M97 45c11-18 23-7 10 6" fill="none" stroke="#8b5cf6" strokeWidth="6" strokeLinecap="round"/>
      <g className="profile-companion__eyes"><ellipse cx="70" cy="69" rx="5" ry="7" fill="#15112b"/><ellipse cx="94" cy="68" rx="5" ry="7" fill="#15112b"/><g className="profile-companion__pupils"><circle cx="72" cy="66" r="1.7" fill="white"/><circle cx="96" cy="65" r="1.7" fill="white"/></g></g>
      <path className="profile-companion__mouth" d="M77 83c4 4 9 4 13-1" fill="none" stroke="#15112b" strokeWidth="2.5" strokeLinecap="round"/><g className="profile-companion__blush"><circle cx="61" cy="84" r="5" fill="#f9a8d4"/><circle cx="103" cy="82" r="5" fill="#f9a8d4"/></g><path d="m116 29 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#facc15"/><circle cx="31" cy="65" r="4" fill="#38bdf8"/><circle cx="118" cy="107" r="3" fill="#f472b6"/></g>
  </svg>
}

function MoodBlob() {
  return <svg viewBox="0 0 140 170" aria-hidden="true"><g className="profile-companion__squish"><ellipse cx="75" cy="139" rx="42" ry="8" fill="rgba(25,18,45,.12)"/><path d="M33 95c0-35 16-58 43-58 28 0 47 25 47 59 0 29-20 43-47 43-25 0-43-15-43-44Z" fill="#fb7185"/><path d="M43 77c11-27 33-35 55-26" fill="none" stroke="#fda4af" strokeWidth="9" strokeLinecap="round" opacity=".8"/>
    <g className="profile-companion__eyes"><ellipse cx="61" cy="91" rx="6" ry="8" fill="#2c1834"/><ellipse cx="94" cy="91" rx="6" ry="8" fill="#2c1834"/><g className="profile-companion__pupils"><circle cx="63" cy="88" r="2" fill="white"/><circle cx="96" cy="88" r="2" fill="white"/></g></g><path className="profile-companion__mouth" d="M65 108c7 8 18 8 25 0" fill="none" stroke="#2c1834" strokeWidth="3" strokeLinecap="round"/><g className="profile-companion__blush"><circle cx="48" cy="106" r="7" fill="#f43f5e"/><circle cx="106" cy="106" r="7" fill="#f43f5e"/></g></g></svg>
}

function WhiteCat() {
  return <svg viewBox="0 0 140 170" aria-hidden="true">
    <defs>
      <radialGradient id="white-cat-fur" cx="34%" cy="21%" r="86%"><stop stopColor="#fff"/><stop offset=".52" stopColor="#f5faff"/><stop offset=".82" stopColor="#dcecff"/><stop offset="1" stopColor="#9ab8db"/></radialGradient>
      <linearGradient id="white-cat-shadow" x1=".2" y1="0" x2=".8" y2="1"><stop stopColor="#f7fbff"/><stop offset=".55" stopColor="#cbdff5"/><stop offset="1" stopColor="#6f91b9"/></linearGradient>
      <linearGradient id="white-cat-eye" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#c9fff9"/><stop offset=".38" stopColor="#54e8ef"/><stop offset="1" stopColor="#159ebd"/></linearGradient>
      <linearGradient id="white-cat-collar" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#22d3ee"/><stop offset=".5" stopColor="#60a5fa"/><stop offset="1" stopColor="#8b5cf6"/></linearGradient>
      <filter id="white-cat-glow"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#38bdf8" floodOpacity=".3"/></filter>
    </defs>
    <ellipse cx="75" cy="147" rx="45" ry="7" fill="#03172f" opacity=".3"/>
    <g className="profile-companion__white-cat" filter="url(#white-cat-glow)">
      <path className="profile-companion__tail" d="M101 119c18 5 28-5 23-18-4-10-2-20 5-22 10-2 15 17 10 32-5 17-18 29-38 28-8 0-11-7-7-13Z" fill="url(#white-cat-shadow)" stroke="#3c628a" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M45 111c1-24 14-37 34-37 21 0 34 15 35 40l-1 20c-13 13-56 14-72 0Z" fill="url(#white-cat-fur)" stroke="#486d94" strokeWidth="1.5"/>
      <path d="M54 104c-7 12-6 24 3 38M104 104c8 12 7 25-1 38" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".56"/>
      <path d="M61 105c3 9 10 15 19 18 9-4 16-10 20-19-3 17-4 30-20 38-16-8-17-20-19-37Z" fill="#fff" opacity=".8"/>
      <path className="profile-companion__ears" d="M42 55 47 20c1-5 5-6 9-2l16 17c6-2 14-2 20 0l15-17c4-4 8-2 9 3l3 36Z" fill="url(#white-cat-fur)" stroke="#486d94" strokeWidth="1.65" strokeLinejoin="round"/>
      <path d="m50 47 3-20 13 14ZM98 41l12-14 2 21Z" fill="#f5b6c6" opacity=".82"/>
      <path d="M42 61c2-18 16-31 34-33l4-7 5 7 7-5 1 8c17 5 27 20 26 40-1 25-17 39-39 39-25 0-41-16-40-39 0-4 1-7 2-10Z" fill="url(#white-cat-fur)" stroke="#486d94" strokeWidth="1.65" strokeLinejoin="round"/>
      <path d="M50 57c7-14 19-21 34-21-13 5-20 13-24 25Z" fill="#fff" opacity=".88"/>
      <path d="M77 29 81 21l4 8" fill="#fff" stroke="#9fc4e5" strokeWidth="1" strokeLinejoin="round"/>
      <path d="m80 45 2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" fill="#c4f7ff" opacity=".92"/>
      <g className="profile-companion__eyes"><path d="M51 66c6-9 17-9 24 0-5 11-18 11-24 0Z" fill="url(#white-cat-eye)" stroke="#315777" strokeWidth="1.35"/><path d="M87 66c6-9 17-9 24 0-5 11-18 11-24 0Z" fill="url(#white-cat-eye)" stroke="#315777" strokeWidth="1.35"/><g className="profile-companion__pupils"><ellipse cx="63" cy="66" rx="2.2" ry="5.8" fill="#071f39"/><ellipse cx="99" cy="66" rx="2.2" ry="5.8" fill="#071f39"/><circle cx="64.5" cy="63.5" r="1.3" fill="#fff"/><circle cx="100.5" cy="63.5" r="1.3" fill="#fff"/></g></g>
      <path d="m76 80 5-3 5 3c-1 4-9 4-10 0Z" fill="#ef9eb1" stroke="#694f65" strokeWidth=".9"/>
      <g className="profile-companion__mouth"><path d="M81 83c-2 6-8 8-12 4M81 83c2 6 8 8 12 4" fill="none" stroke="#435d77" strokeWidth="1.7" strokeLinecap="round"/></g>
      <path d="M48 81 27 77M48 85l-23 3M112 81l21-5M112 85l23 3" fill="none" stroke="#a9c7e2" strokeWidth="1.2" strokeLinecap="round" opacity=".85"/>
      <g className="profile-companion__blush"><ellipse cx="51" cy="85" rx="8" ry="3.5" fill="#f4a8bc"/><ellipse cx="111" cy="85" rx="8" ry="3.5" fill="#f4a8bc"/></g>
      <path d="M52 130c1-12 11-18 18-10l2 22H49ZM89 142l2-22c7-8 17-2 18 10l3 12Z" fill="#fbfdff" stroke="#486d94" strokeWidth="1.35"/>
      <path d="M49 141c7-4 15-4 23 1M89 142c8-5 16-5 23 0" fill="none" stroke="#b7d0e8" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M63 102c8 5 28 5 36-1" fill="none" stroke="url(#white-cat-collar)" strokeWidth="3.5" strokeLinecap="round"/><circle cx="81" cy="105" r="4.5" fill="#fbd65b" stroke="#8c6c18" strokeWidth="1"/><path d="m81 102 1 3-1 2-1-2Z" fill="#fff7b2"/>
    </g>
  </svg>
}

function PixelCat() {
  return <svg className="profile-companion__pixel" viewBox="0 0 140 170" aria-hidden="true" shapeRendering="crispEdges"><g className="profile-companion__cat"><rect x="29" y="139" width="86" height="7" fill="rgba(25,18,45,.12)"/><path d="M45 64V39h14v11h35V39h14v27h8v54h-8v15H43v-15H34V66Z" fill="#4b4265"/><path className="profile-companion__ears" d="M49 49h8v13h-8ZM96 49h8v13h-8Z" fill="#f9a8d4"/><g className="profile-companion__eyes"><rect x="51" y="75" width="11" height="11" fill="#fef08a"/><rect x="92" y="75" width="11" height="11" fill="#fef08a"/><g className="profile-companion__pupils"><rect x="55" y="78" width="4" height="8" fill="#171326"/><rect x="96" y="78" width="4" height="8" fill="#171326"/></g></g><rect x="73" y="92" width="10" height="7" fill="#f9a8d4"/><g className="profile-companion__mouth"><rect x="65" y="105" width="9" height="4" fill="#e9d5ff"/><rect x="82" y="105" width="9" height="4" fill="#e9d5ff"/></g><path className="profile-companion__tail" d="M107 110h20v-11h7v26h-20v-7h-7Z" fill="#4b4265"/></g></svg>
}

function AuroraFlow() {
  return <svg viewBox="0 0 140 170" aria-hidden="true"><defs><linearGradient id="aurora" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#22d3ee"/><stop offset=".5" stopColor="#a78bfa"/><stop offset="1" stopColor="#fb7185"/></linearGradient><filter id="aurora-blur"><feGaussianBlur stdDeviation="7"/></filter></defs><g className="profile-companion__aurora"><path d="M20 132C6 84 52 24 119 41 70 54 54 82 45 133Z" fill="url(#aurora)" opacity=".3" filter="url(#aurora-blur)"/><path d="M23 129C38 89 32 56 119 41 79 64 77 100 45 135" fill="none" stroke="url(#aurora)" strokeWidth="10" strokeLinecap="round"/><path d="M39 138C51 99 51 69 113 52" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".72"/><circle cx="105" cy="42" r="3" fill="#fef08a"/><circle cx="32" cy="102" r="2" fill="#fff"/></g></svg>
}

const ART = { cosmic: CosmicSpirit, mood: MoodBlob, 'white-cat': WhiteCat, 'pixel-cat': PixelCat, aurora: AuroraFlow }
const BUBBLE_MESSAGES = {
  greeting: 'Hey there! 👋',
  building: 'Building something ✨',
  work: 'Open to work 💼',
}

export default function ProfileCompanion({ type = 'none', motion = 'subtle', emotion = 'natural', bubble = 'off', bubbleText = '', bubbleBehavior = 'once', preview = false }) {
  const [expression, setExpression] = useState('idle')
  const [bubbleVisible, setBubbleVisible] = useState(() => bubble !== 'off' && bubbleBehavior !== 'tap')
  const emotionTimer = useRef()
  const bubbleTimer = useRef()
  const Art = ART[type]

  useEffect(() => {
    window.clearTimeout(bubbleTimer.current)
    if (bubbleVisible && bubbleBehavior === 'once') bubbleTimer.current = window.setTimeout(() => setBubbleVisible(false), 4200)
    return () => window.clearTimeout(bubbleTimer.current)
  }, [bubbleBehavior, bubbleVisible])
  useEffect(() => () => window.clearTimeout(emotionTimer.current), [])
  if (!Art) return null

  const message = bubble === 'custom' ? String(bubbleText || '').trim().slice(0, 35) : BUBBLE_MESSAGES[bubble]
  const content = <>{message ? <span className={`profile-companion__bubble${bubbleVisible || preview ? ' is-visible' : ''}`}>{message}</span> : null}<Art/><span className="profile-companion__spark" aria-hidden="true">✦</span><span className="profile-companion__heart" aria-hidden="true">♥</span></>
  const classes = `profile-companion profile-companion--${type} profile-companion--${motion} profile-companion--emotion-${emotion} is-${expression}`
  if (preview) return <span className={`${classes} profile-companion--preview`}>{content}</span>

  const react = () => {
    if (message) {
      window.clearTimeout(bubbleTimer.current)
      setBubbleVisible(true)
      if (bubbleBehavior !== 'always') bubbleTimer.current = window.setTimeout(() => setBubbleVisible(false), 3600)
    }
    if (emotion === 'off') return
    window.clearTimeout(emotionTimer.current)
    setExpression('surprised')
    emotionTimer.current = window.setTimeout(() => {
      setExpression(emotion === 'expressive' ? 'delighted' : 'happy')
      emotionTimer.current = window.setTimeout(() => setExpression('idle'), emotion === 'expressive' ? 1500 : 850)
    }, 360)
  }
  const trackFace = (event) => {
    if (emotion === 'off') return
    const bounds = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--look-x', ((event.clientX - bounds.left) / bounds.width - .5).toFixed(2))
    event.currentTarget.style.setProperty('--look-y', ((event.clientY - bounds.top) / bounds.height - .5).toFixed(2))
  }
  const resetFace = (event) => { event.currentTarget.style.setProperty('--look-x', 0); event.currentTarget.style.setProperty('--look-y', 0) }

  return <button type="button" className={classes} aria-label={`Play with ${COMPANION_OPTIONS.find((item) => item.id === type)?.label || 'profile companion'}`} onClick={react} onPointerMove={trackFace} onPointerLeave={resetFace}>{content}</button>
}
