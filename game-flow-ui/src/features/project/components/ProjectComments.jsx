import { useEffect, useRef, useState } from 'react'
import { Avatar } from '../../../components/ui/Surface'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/Feedback'
import { Sheet } from '../../../components/ui/Overlay'

function useDesktopComments() {
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)')
    const update = (event) => setDesktop(event.matches)
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])
  return desktop
}

function CommentsContent({ comments, isGuest, draft, submitting, onDraftChange, onSubmit, onReply }) {
  return <div className="project-comments__content">
    <div className="project-comments__list" aria-live="polite">
      {comments.length ? <ul>{comments.map((comment) => <li key={comment.commentId || comment._id}><Avatar src={comment.avatar} alt="" name={comment.username || comment.name || 'member'} size="small" /><div><p><strong>{comment.username || comment.name || 'member'}</strong> {comment.text}</p><span>{comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}</span><button type="button" onClick={() => onReply(comment.commentId || comment._id)}>Reply</button></div></li>)}</ul> : <EmptyState title="No responses yet" description="Start the conversation." headingLevel={3} />}
    </div>
    <form className="project-comments__composer" onSubmit={onSubmit}>
      <label><span className="gf-sr-only">Add a response</span><textarea value={draft} maxLength={200} disabled={isGuest || submitting} placeholder={isGuest ? 'Sign in to add a response' : 'What are your thoughts?'} onChange={(event) => onDraftChange(event.target.value)} /></label>
      <div><span>{draft.length}/200</span><Button type="submit" loading={submitting} disabled={isGuest || !draft.trim()}>Post response</Button></div>
    </form>
  </div>
}

export default function ProjectComments(props) {
  const desktop = useDesktopComments()
  const closeButtonRef = useRef(null)
  const onCloseRef = useRef(props.onClose)
  useEffect(() => { onCloseRef.current = props.onClose }, [props.onClose])
  useEffect(() => {
    if (!desktop || !props.open) return undefined
    const previousFocus = document.activeElement
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus()
    }
  }, [desktop, props.open])
  const content = <CommentsContent {...props} />
  if (desktop) return props.open ? <aside className="project-comments" aria-labelledby="project-comments-title"><header><div><h2 id="project-comments-title">Responses</h2><p>{props.comments.length} total</p></div><Button ref={closeButtonRef} variant="ghost" onClick={props.onClose}>Close</Button></header>{content}</aside> : null
  return <Sheet open={props.open} title={`Responses (${props.comments.length})`} description={props.title} onClose={props.onClose} contentClassName="project-comments">{content}</Sheet>
}
