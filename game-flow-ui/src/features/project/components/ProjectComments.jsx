import { useEffect, useRef, useState } from 'react'
import { Button } from '../../../components/ui/Button'
import Avatar from '../../../components/ui/Avatar'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/Feedback'
import { Sheet } from '../../../components/ui/Overlay'
import { CommentThread } from '../../feed/components/CommentsSheet'

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

function CommentsContent({ comments, status, error, viewer, isGuest, draft, replyTarget, submitting, onRetry, onDraftChange, onSubmit, onReply, onCancelReply, onReact }) {
  return <div className="project-comments__content">
    <div className="project-comments__list" aria-live="polite">
      {status === 'loading' ? <LoadingState label="Loading responses" /> : null}
      {status === 'error' ? <ErrorState title="Responses unavailable" description={error} onRetry={onRetry} /> : null}
      {status === 'ready' && !comments.length ? <EmptyState title="No responses yet" description="Start the conversation." headingLevel={3} /> : null}
      {status === 'ready' && comments.length ? <ul className="comments-sheet__thread">{comments.map((comment) => <CommentThread key={comment.commentId || comment._id} comment={comment} viewer={viewer} canReply={!isGuest} onReply={onReply} onReact={onReact} />)}</ul> : null}
    </div>
    {replyTarget ? <div className="comments-sheet__replying"><span>Replying to <strong>@{replyTarget.username || replyTarget.name || 'creator'}</strong></span><Button variant="ghost" onClick={onCancelReply}>Cancel</Button></div> : null}
    {error && status !== 'error' ? <p className="comments-sheet__composer-error" role="alert">{error}</p> : null}
    <form className="project-comments__composer" onSubmit={onSubmit}>
      <Avatar src={viewer?.avatar} alt="" name={viewer?.name || viewer?.username || 'Me'} size="small" />
      <label className="comments-sheet__input-wrap"><span className="gf-sr-only">Add a response</span><input value={draft} maxLength={500} disabled={isGuest || submitting || status !== 'ready'} placeholder={isGuest ? 'Sign in to add a response' : replyTarget ? `Reply to @${replyTarget.username || replyTarget.name || 'creator'}…` : 'Add a response…'} onChange={(event) => onDraftChange(event.target.value)} /><button type="submit" disabled={isGuest || submitting || status !== 'ready' || !draft.trim()}>{submitting ? 'Posting…' : 'Post'}</button></label>
    </form>
    <span className="comments-sheet__limit">{draft.length}/500</span>
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
