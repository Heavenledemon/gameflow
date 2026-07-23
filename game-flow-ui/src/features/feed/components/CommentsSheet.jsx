import { useState } from 'react'
import Avatar from '../../../components/ui/Avatar'
import IconButton from '../../../components/ui/IconButton'
import { Button } from '../../../components/ui/Button'
import EmptyState, { ErrorState } from '../../../components/ui/EmptyState'
import { LoadingState } from '../../../components/ui/Feedback'
import Sheet from '../../../components/ui/Sheet'

const COMMENT_REACTIONS = { heart: '❤️', laugh: '😂', wow: '😮', sad: '😢', fire: '🔥' }

function relativeTime(createdAt) {
  if (!createdAt) return 'Just now'
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000))
  if (seconds < 60) return 'now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
}

function CommentThread({ comment, depth = 0, viewer, canReply, onReply, onReact }) {
  const [reactionsOpen, setReactionsOpen] = useState(false)
  const commentId = comment.commentId || comment._id
  const author = comment.username || comment.name || 'member'
  const avatar = viewer && comment.username === viewer.username && viewer.avatar ? viewer.avatar : comment.avatar
  const reactionCounts = Object.entries(comment.reactions || {}).filter(([, count]) => count > 0)

  return (
    <li className={depth ? 'comments-sheet__reply' : ''}>
      <div className="comments-sheet__comment">
        <Avatar src={avatar} alt="" name={author} size="small" />
        <div className="comments-sheet__comment-body">
          <p><strong>{author}</strong> {comment.text}</p>
          <div className="comments-sheet__comment-meta">
            <span>{relativeTime(comment.createdAt)}</span>
            {canReply ? <button type="button" onClick={() => onReply(comment)}>Reply</button> : null}
            <button
              type="button"
              aria-expanded={reactionsOpen}
              aria-controls={`comment-reactions-${commentId}`}
              onClick={() => setReactionsOpen((current) => !current)}
            >
              {comment.viewerReaction ? `Reacted ${COMMENT_REACTIONS[comment.viewerReaction]}` : 'React'}
            </button>
          </div>

          {reactionsOpen ? (
            <div id={`comment-reactions-${commentId}`} className="comments-sheet__reaction-picker" role="group" aria-label="Choose a reaction">
              {Object.entries(COMMENT_REACTIONS).map(([key, symbol]) => (
                <IconButton
                  key={key}
                  label={`React with ${key}`}
                  className={comment.viewerReaction === key ? 'comments-sheet__reaction--selected' : ''}
                  onClick={() => {
                    setReactionsOpen(false)
                    onReact(comment, key)
                  }}
                >
                  <span aria-hidden="true">{symbol}</span>
                </IconButton>
              ))}
            </div>
          ) : null}

          {reactionCounts.length ? (
            <div className="comments-sheet__reaction-counts" aria-label="Comment reactions">
              {reactionCounts.map(([key, count]) => (
                <span key={key}>{COMMENT_REACTIONS[key]} {count}</span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {(comment.replies || []).length ? (
        <ul className="comments-sheet__thread">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.commentId || reply._id}
              comment={reply}
              depth={depth + 1}
              viewer={viewer}
              canReply={canReply}
              onReply={onReply}
              onReact={onReact}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export default function CommentsSheet({
  open,
  project,
  status,
  error,
  viewer,
  draft,
  replyTarget,
  submitting,
  onClose,
  onRetry,
  onDraftChange,
  onSubmit,
  onReply,
  onCancelReply,
  onReact,
  onOpenProject,
}) {
  const comments = project?.engagement?.comments || []

  return (
    <Sheet
      open={open}
      title={comments.length ? `Comments (${comments.length})` : 'Comments'}
      description={project?.title}
      closeLabel="Close comments"
      onClose={onClose}
      contentClassName="comments-sheet"
    >
      {project?.routeTarget ? (
        <Button variant="secondary" className="comments-sheet__project-link" onClick={onOpenProject}>
          View full project
        </Button>
      ) : null}

      <div className="comments-sheet__list" aria-live="polite">
        {status === 'loading' ? <LoadingState label="Loading comments" /> : null}
        {status === 'error' ? (
          <ErrorState title="Comments unavailable" description={error} onRetry={onRetry} />
        ) : null}
        {status === 'ready' && comments.length === 0 ? (
          <EmptyState title="No comments yet" description="Start the conversation." headingLevel={3} />
        ) : null}
        {status === 'ready' && comments.length ? (
          <ul className="comments-sheet__thread">
            {comments.map((comment) => (
              <CommentThread
                key={comment.commentId || comment._id}
                comment={comment}
                viewer={viewer}
                canReply={project.contentType === 'project'}
                onReply={onReply}
                onReact={onReact}
              />
            ))}
          </ul>
        ) : null}
      </div>

      {replyTarget ? (
        <div className="comments-sheet__replying">
          <span>Replying to <strong>@{replyTarget.username || replyTarget.name || 'creator'}</strong></span>
          <Button variant="ghost" onClick={onCancelReply}>Cancel</Button>
        </div>
      ) : null}

      {error && status !== 'error' ? <p className="comments-sheet__composer-error" role="alert">{error}</p> : null}
      <form className="comments-sheet__composer" onSubmit={onSubmit}>
        <Avatar src={viewer?.avatar} alt="" name={viewer?.name || viewer?.username || 'Me'} size="small" />
        <label className="comments-sheet__input-wrap">
          <span className="gf-sr-only">Add a comment</span>
          <input
            type="text"
            value={draft}
            maxLength={500}
            disabled={submitting || status !== 'ready'}
            placeholder={replyTarget ? `Reply to @${replyTarget.username || replyTarget.name || 'creator'}…` : 'Add a comment…'}
            onChange={(event) => onDraftChange(event.target.value)}
          />
          <button type="submit" disabled={submitting || status !== 'ready' || !draft.trim()}>
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </label>
      </form>
      <span className="comments-sheet__limit">{draft.length}/500</span>
    </Sheet>
  )
}
