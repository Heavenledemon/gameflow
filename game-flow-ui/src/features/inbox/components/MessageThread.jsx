import { EmptyState, ErrorState, Skeleton } from '../../../components/ui/Feedback'
import { formatInboxTime, safeInboxError } from '../inboxFormatters'

function MessageSkeletons() {
  return <div className="message-skeletons" aria-label="Loading messages" aria-busy="true"><Skeleton width="68%" height={54} /><Skeleton className="message-skeletons__mine" width="56%" height={48} /><Skeleton width="74%" height={68} /></div>
}

export default function MessageThread({ title, items, status, nextCursor, userId, retryingIds, onLoadOlder, onRetryLoad, onRetryMessage, onOpenAsset, scrollRef, onScroll }) {
  return <section className="conversation-stream" ref={scrollRef} onScroll={onScroll} aria-label={`${title} messages`}>
    {nextCursor ? <button className="conversation-history" type="button" onClick={onLoadOlder} disabled={status === 'loading-more'}>{status === 'loading-more' ? 'Loading older messages…' : 'Load older messages'}</button> : null}
    {status === 'loading' && !items.length ? <MessageSkeletons /> : null}
    {status === 'error' && !items.length ? <ErrorState title="Couldn’t load messages" description={safeInboxError('conversation')} onRetry={onRetryLoad} /> : null}
    {status === 'error' && items.length ? <div className="conversation-inline-error" role="status">Messages may be out of date. <button type="button" onClick={onRetryLoad}>Retry</button></div> : null}
    {!items.length && status === 'ready' ? <EmptyState title="No messages yet" description="Start the conversation when you’re ready." headingLevel={2} /> : null}
    {items.map((message, index) => {
      const mine = String(message.senderId) === String(userId) || message.senderId === 'me'
      const previous = items[index - 1]
      const grouped = previous && String(previous.senderId) === String(message.senderId) && message.type === 'text' && previous.type === 'text'
      if (message.type === 'system') return <div className="conversation-system" key={message.id}><span>{message.body}</span><time dateTime={message.createdAt}>{formatInboxTime(message.createdAt, true)}</time></div>
      const retrying = retryingIds.has(message.clientMessageId)
      return <article className={mine ? 'message message--mine' : 'message'} key={message.clientMessageId || message.id}>
        {!grouped ? <span className="message__sender">{mine ? 'You' : message.sender?.name || message.sender?.username || 'Creator'}</span> : null}
        <div className="message__bubble">
          {message.body ? <p>{message.body}</p> : null}
          {message.attachments?.map((attachment) => <button type="button" className="message__asset" key={attachment.assetId} onClick={() => onOpenAsset?.(attachment)}><strong>{attachment.name || 'Project asset'}</strong><span>{attachment.mimeType || 'File'} · {Math.max(1, Math.round(Number(attachment.size || 0) / 1024))} KB</span></button>)}
          <div className="message__meta"><time dateTime={message.createdAt}>{formatInboxTime(message.createdAt)}</time>{message.pending ? <span role="status">Sending</span> : null}</div>
          {message.failed ? <button type="button" className="message__retry" disabled={retrying} onClick={() => onRetryMessage(message)}>{retrying ? 'Retrying…' : 'Retry send'}</button> : null}
        </div>
      </article>
    })}
  </section>
}
