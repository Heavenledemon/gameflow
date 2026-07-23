import { useCallback, useEffect, useState } from 'react'
import './InstagramStories.css'

const FALLBACK_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Ccircle cx="32" cy="32" r="32" fill="%23d9dce5"/%3E%3Ccircle cx="32" cy="25" r="12" fill="%23777d8c"/%3E%3Cpath d="M10 61c3-15 12-22 22-22s19 7 22 22" fill="%23777d8c"/%3E%3C/svg%3E'

function relativeTime(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h`
}

export default function StoryViewer({ stories = [], onClose }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeStory = stories[activeIndex]
  const close = useCallback(() => onClose?.(), [onClose])
  const previous = useCallback(() => setActiveIndex((current) => Math.max(0, current - 1)), [])
  const next = useCallback(() => {
    if (activeIndex >= stories.length - 1) close()
    else setActiveIndex((current) => current + 1)
  }, [activeIndex, close, stories.length])

  useEffect(() => {
    if (!activeStory) return undefined
    const timer = activeStory.mediaType === 'video' ? null : window.setTimeout(next, 5000)
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowLeft') previous()
      if (event.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => { if (timer) window.clearTimeout(timer); window.removeEventListener('keydown', handleKeyDown) }
  }, [activeStory, close, next, previous])

  if (!activeStory) return null
  return <div className="story-viewer" role="dialog" aria-modal="true" aria-label={`${activeStory.creator.username}'s story`}>
    <div className="story-viewer__progress" aria-hidden="true"><span key={activeStory.id} className={activeStory.mediaType === 'video' ? 'story-viewer__progress--video' : ''} /></div>
    <header className="story-viewer__header"><img src={activeStory.creator.avatarUrl || FALLBACK_AVATAR} alt="" /><strong>{activeStory.creator.username}</strong><span>{relativeTime(activeStory.createdAt)}</span><button type="button" onClick={close} aria-label="Close story">×</button></header>
    {activeStory.mediaType === 'video' ? <video className="story-viewer__image" src={activeStory.mediaUrl} autoPlay playsInline controls onEnded={next} /> : <img className="story-viewer__image" src={activeStory.mediaUrl} alt={`${activeStory.creator.username}'s story`} />}
    {activeStory.caption ? <p className="story-viewer__caption">{activeStory.caption}</p> : null}
    <button className="story-viewer__tap story-viewer__tap--previous" type="button" onClick={previous} disabled={activeIndex === 0} aria-label="Previous story" />
    <button className="story-viewer__tap story-viewer__tap--next" type="button" onClick={next} aria-label="Next story" />
    <form className="story-viewer__reply" onSubmit={(event) => event.preventDefault()}><input aria-label="Reply to story" placeholder="Send message" /><button type="submit" aria-label="Send reply">➤</button></form>
  </div>
}
