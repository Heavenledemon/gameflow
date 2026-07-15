import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useConversation } from '../../hooks/useConversation'
import { useConversations } from '../../hooks/useConversations'
import { useCollaborationRequest } from '../../hooks/useCollaborationRequest'
import { ErrorState, LoadingState } from '../../components/ui/Feedback'
import './ConversationPage.css'

function formatTime(value, includeDate = false) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  if (includeDate) return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  const elapsed = Date.now() - date.getTime()
  if (elapsed < 60_000) return 'Now'
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m`
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function conversationHeading(kind, request) {
  if (kind === 'project') return { title: request?.project?.title || 'Project workspace', subtitle: 'Project chat' }
  if (kind === 'collaboration_request') return { title: request?.project?.title || 'Collaboration request', subtitle: request ? `${request.status} · ${request.proposedRole}` : 'Private request conversation' }
  if (kind === 'direct') return { title: 'Direct message', subtitle: 'Private conversation' }
  return { title: 'Conversation', subtitle: 'Private conversation' }
}

export default function ConversationPage() {
  const { conversationId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const scrollRef = useRef(null)
  const nearBottomRef = useRef(true)
  const olderScrollRef = useRef(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const { items, conversation: loadedConversation, status, error, nextCursor, draft, setDraft, send, reload, loadMore } = useConversation(token, conversationId)
  const conversations = useConversations(token)
  const routeConversation = location.state?.conversation || null
  const conversation = routeConversation || conversations.items.find((item) => item.id === conversationId) || loadedConversation
  const kind = loadedConversation?.kind || conversation?.kind || 'direct'
  const requestId = conversation?.collaborationRequestId || location.state?.request?.id || null
  const requestState = useCollaborationRequest(token, requestId)
  const request = requestState.request || location.state?.request || null
  const header = useMemo(() => conversationHeading(kind, request), [kind, request])
  const isReadOnly = kind === 'collaboration_request' && requestState.status === 'ready' && request?.status !== 'pending'

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return
    if (olderScrollRef.current) {
      const previous = olderScrollRef.current
      element.scrollTop = previous.top + (element.scrollHeight - previous.height)
      olderScrollRef.current = null
    } else if (nearBottomRef.current) {
      element.scrollTop = element.scrollHeight
    }
  }, [items.length])

  const loadOlder = useCallback(async () => {
    const element = scrollRef.current
    if (element) olderScrollRef.current = { top: element.scrollTop, height: element.scrollHeight }
    await loadMore()
  }, [loadMore])

  const onScroll = () => {
    const element = scrollRef.current
    if (!element) return
    nearBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80
  }

  const submit = async () => {
    const body = draft.trim()
    if (!body || sending || isReadOnly) return
    setSending(true)
    setSendError('')
    try {
      await send(body, crypto.randomUUID())
    } catch (sendFailure) {
      setSendError(sendFailure.message || 'Message could not be sent. You can retry it below.')
    } finally {
      setSending(false)
    }
  }

  const retry = async (message) => {
    setSendError('')
    try {
      await send(message.body, message.clientMessageId)
    } catch (sendFailure) {
      setSendError(sendFailure.message || 'Message could not be sent. Try again.')
    }
  }

  return <main className="conversation-page">
    <header className="conversation-header"><button className="conversation-back" type="button" aria-label="Back to inbox" onClick={() => navigate('/app/inbox')}>‹</button><div className="conversation-header__copy"><h1>{header.title}</h1><p>{header.subtitle}</p></div></header>
    {isReadOnly ? <div className="conversation-notice" role="status">This request is {request.status}. Its messages are available to read, but replies are closed.</div> : null}
    <section className="conversation-stream" ref={scrollRef} onScroll={onScroll} aria-label={`${header.title} messages`}>
      {nextCursor ? <button className="conversation-history" type="button" onClick={loadOlder} disabled={status === 'loading-more'}>{status === 'loading-more' ? 'Loading older messages…' : 'Load older messages'}</button> : null}
      {status === 'loading' && !items.length ? <LoadingState label="Loading messages" /> : null}
      {status === 'error' && !items.length ? <ErrorState title="Couldn’t load messages" description={error} onRetry={reload} /> : null}
      {status === 'error' && items.length ? <div className="conversation-inline-error" role="status">{error} <button type="button" onClick={reload}>Retry</button></div> : null}
      {!items.length && status === 'ready' ? <p className="conversation-empty">No messages yet. Start the conversation when you’re ready.</p> : null}
      {items.map((message, index) => {
        const mine = String(message.senderId) === String(user?.id) || message.senderId === 'me'
        const previous = items[index - 1]
        const grouped = previous && String(previous.senderId) === String(message.senderId) && message.type === 'text' && previous.type === 'text'
        if (message.type === 'system') return <div className="conversation-system" key={message.id}><span>{message.body}</span><time dateTime={message.createdAt}>{formatTime(message.createdAt, true)}</time></div>
        return <article className={mine ? 'message message--mine' : 'message'} key={message.id}>
          {!grouped ? <span className="message__sender">{mine ? 'You' : 'Creator'}</span> : null}
          <div className="message__bubble"><p>{message.body}</p><div className="message__meta"><time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>{message.pending ? <span>Sending</span> : null}</div>{message.failed ? <button type="button" className="message__retry" onClick={() => retry(message)}>Retry send</button> : null}</div>
        </article>
      })}
    </section>
    {sendError ? <p className="conversation-send-error" role="alert">{sendError}</p> : null}
    <footer className="conversation-composer"><textarea aria-label="Message" value={draft} maxLength={2000} disabled={isReadOnly} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }} placeholder={isReadOnly ? 'Replies are closed' : 'Write a message…'} /><button type="button" disabled={!draft.trim() || sending || isReadOnly} onClick={submit}>{sending ? 'Sending…' : 'Send'}</button></footer>
  </main>
}
