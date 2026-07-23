import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { fetchStories, getViewedStoryIds, markStoryViewed, uploadStory } from '../../../lib/stories'
import './InstagramStories.css'

const FALLBACK_AVATAR = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Ccircle cx="32" cy="32" r="32" fill="%23d9dce5"/%3E%3Ccircle cx="32" cy="25" r="12" fill="%23777d8c"/%3E%3Cpath d="M10 61c3-15 12-22 22-22s19 7 22 22" fill="%23777d8c"/%3E%3C/svg%3E'

function relativeTime(value) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h`
}

function StoryUploadModal({ busy, error, canUpload, onClose, onSubmit }) {
  const [file, setFile] = useState(null)
  const [caption, setCaption] = useState('')
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : '', [file])

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])
  return (
    <div className="story-upload" role="dialog" aria-modal="true" aria-labelledby="story-upload-title">
      <button className="story-upload__backdrop" type="button" aria-label="Close story upload" onClick={busy ? undefined : onClose} />
      <form className="story-upload__card" onSubmit={(event) => { event.preventDefault(); if (file) onSubmit(file, caption) }}>
        <header><div><h2 id="story-upload-title">Add to your story</h2><p>Visible to GameFlow creators for 24 hours.</p></div><button type="button" onClick={onClose} disabled={busy} aria-label="Close">×</button></header>
        <label className={`story-upload__picker${previewUrl ? ' story-upload__picker--selected' : ''}`}>
          {previewUrl ? (file.type.startsWith('video/') ? <video src={previewUrl} muted playsInline /> : <img src={previewUrl} alt="Story preview" />) : <><span aria-hidden="true">＋</span><strong>Choose photo or video</strong><small>JPG, PNG, WebP, GIF, AVIF, MP4, WebM or MOV · max 20 MB</small></>}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <label className="story-upload__caption"><span>Caption <small>{caption.length}/280</small></span><textarea value={caption} maxLength={280} placeholder="Say something about this story…" onChange={(event) => setCaption(event.target.value)} /></label>
        {error ? <p className="story-upload__error" role="alert">{error}</p> : null}
        <button className="story-upload__share" type="submit" disabled={!file || busy || !canUpload}>{busy ? 'Sharing…' : 'Share story'}</button>
      </form>
    </div>
  )
}

export default function InstagramStories() {
  const { token, user, isGuest } = useAuth()
  const [stories, setStories] = useState([])
  const [activeStack, setActiveStack] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [viewedStoryIds, setViewedStoryIds] = useState(getViewedStoryIds)
  const activeStory = activeStack[activeIndex] || null
  const userId = String(user?.id || user?._id || '')
  const storyGroups = useMemo(() => {
    const groups = new Map()
    stories.forEach((story) => {
      const key = String(story.creator?.id || story.creator?.username || '')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(story)
    })
    return [...groups.entries()].map(([key, items]) => ({ key, stories: items, latest: items[0] }))
  }, [stories])
  const ownGroup = storyGroups.find((group) => group.key === userId)
  const otherGroups = storyGroups.filter((group) => group.key !== userId)

  useEffect(() => {
    const controller = new AbortController()
    fetchStories(token, { signal: controller.signal }).then((data) => setStories(data.items || [])).catch((fetchError) => {
      if (fetchError.name !== 'AbortError') setError(fetchError.message)
    })
    return () => controller.abort()
  }, [token])

  const closeStory = useCallback(() => { setActiveStack([]); setActiveIndex(0) }, [])
  const showPrevious = useCallback(() => setActiveIndex((current) => Math.max(0, current - 1)), [])
  const showNext = useCallback(() => {
    if (activeIndex >= activeStack.length - 1) closeStory()
    else setActiveIndex((current) => current + 1)
  }, [activeIndex, activeStack.length, closeStory])

  useEffect(() => {
    if (!activeStory) return undefined
    const timer = activeStory.mediaType === 'video' ? null : window.setTimeout(showNext, 5000)
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeStory()
      if (event.key === 'ArrowLeft') showPrevious()
      if (event.key === 'ArrowRight') showNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => { if (timer) window.clearTimeout(timer); window.removeEventListener('keydown', handleKeyDown) }
  }, [activeStory, closeStory, showNext, showPrevious])

  const openUpload = () => {
    setError(isGuest || !token ? 'Sign in to share a story.' : '')
    setUploadOpen(true)
  }
  const openStoryGroup = (group) => {
    if (!group?.stories?.length) return
    let nextViewed = getViewedStoryIds()
    group.stories.forEach((story) => { nextViewed = markStoryViewed(story.id) })
    setViewedStoryIds(nextViewed)
    setActiveStack(group.stories)
    setActiveIndex(0)
  }
  const shareStory = async (file, caption) => {
    if (file.size > 20 * 1024 * 1024) { setError('Choose a file smaller than 20 MB.'); return }
    setUploading(true); setError('')
    try {
      const data = await uploadStory(token, file, caption)
      setStories((current) => [data.story, ...current])
      setUploadOpen(false)
    } catch (uploadError) {
      setError(uploadError.message || 'Story upload failed.')
    } finally { setUploading(false) }
  }

  return (
    <section className="instagram-stories" aria-label="Creator stories">
      <div className="instagram-stories__scroller">
        <div className="instagram-story instagram-story--owner">
          <button type="button" className="instagram-story__main" onClick={() => ownGroup ? openStoryGroup(ownGroup) : openUpload()} aria-label={ownGroup ? 'View your story' : 'Add to your story'}>
            <span className={`instagram-story__ring instagram-story__ring--user${ownGroup && !ownGroup.stories.every((story) => viewedStoryIds.has(story.id)) ? ' instagram-story__ring--unviewed' : ''}`}><img src={user?.avatar || FALLBACK_AVATAR} alt="" /></span>
            <span className="instagram-story__username">Your Story</span>
          </button>
          <button type="button" className="instagram-story__add" onClick={openUpload} aria-label="Add another story">+</button>
        </div>
        {otherGroups.map((group) => (
          <button type="button" className="instagram-story" key={group.key} onClick={() => openStoryGroup(group)} aria-label={`View ${group.latest.creator.username}'s stories`}>
            <span className={`instagram-story__ring${group.stories.every((story) => viewedStoryIds.has(story.id)) ? ' instagram-story__ring--viewed' : ''}`}><img src={group.latest.creator.avatarUrl || FALLBACK_AVATAR} alt="" /></span>
            <span className="instagram-story__username">{group.latest.creator.username}</span>
          </button>
        ))}
      </div>

      {uploadOpen ? <StoryUploadModal busy={uploading} error={error} canUpload={Boolean(token && !isGuest)} onClose={() => setUploadOpen(false)} onSubmit={shareStory} /> : null}

      {activeStory ? <div className="story-viewer" role="dialog" aria-modal="true" aria-label={`${activeStory.creator.username}'s story`}>
        <div className="story-viewer__progress" aria-hidden="true"><span key={activeStory.id} className={activeStory.mediaType === 'video' ? 'story-viewer__progress--video' : ''} /></div>
        <header className="story-viewer__header"><img src={activeStory.creator.avatarUrl || FALLBACK_AVATAR} alt="" /><strong>{activeStory.creator.username}</strong><span>{relativeTime(activeStory.createdAt)}</span><button type="button" onClick={closeStory} aria-label="Close story">×</button></header>
        {activeStory.mediaType === 'video' ? <video className="story-viewer__image" src={activeStory.mediaUrl} autoPlay playsInline controls onEnded={showNext} /> : <img className="story-viewer__image" src={activeStory.mediaUrl} alt={`${activeStory.creator.username}'s story`} />}
        {activeStory.caption ? <p className="story-viewer__caption">{activeStory.caption}</p> : null}
        <button className="story-viewer__tap story-viewer__tap--previous" type="button" onClick={showPrevious} disabled={activeIndex === 0} aria-label="Previous story" /><button className="story-viewer__tap story-viewer__tap--next" type="button" onClick={showNext} aria-label="Next story" />
        <form className="story-viewer__reply" onSubmit={(event) => event.preventDefault()}><input aria-label="Reply to story" placeholder="Send message" /><button type="submit" aria-label="Send reply">➤</button></form>
      </div> : null}
    </section>
  )
}
