import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useConversation } from '../../hooks/useConversation'
import { useConversations } from '../../hooks/useConversations'
import { useCollaborationRequest } from '../../hooks/useCollaborationRequest'
import { useMessagingRealtime } from '../../hooks/useMessagingRealtime'
import { ErrorState, LoadingState } from '../../components/ui/Feedback'
import { BottomSheet, ConfirmDialog } from '../../components/ui/Overlay'
import { createModerationReport, toggleUserBlock } from '../../lib/moderation'
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
  const { success: showSuccess, error: showError } = useToast()
  const scrollRef = useRef(null)
  const nearBottomRef = useRef(true)
  const olderScrollRef = useRef(null)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [showSafetySheet, setShowSafetySheet] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isSafetyAction, setIsSafetyAction] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const { items, conversation: loadedConversation, status, error, nextCursor, draft, setDraft, send, reload, loadMore } = useConversation(token, conversationId)
  const conversations = useConversations(token)
  const routeConversation = location.state?.conversation || null
  const conversation = routeConversation || conversations.items.find((item) => item.id === conversationId) || loadedConversation
  const kind = loadedConversation?.kind || conversation?.kind || 'direct'
  const requestId = conversation?.collaborationRequestId || location.state?.request?.id || null
  const requestState = useCollaborationRequest(token, requestId)
  const request = requestState.request || location.state?.request || null
  const requestTarget = request ? [request.requester, request.recipient].find((person) => String(person?.id) !== String(user?.id || user?._id)) : null
  const moderationTarget = location.state?.moderationTarget || requestTarget || null
  const header = useMemo(() => conversationHeading(kind, request), [kind, request])
  const isReadOnly = isBlocked || (kind === 'collaboration_request' && requestState.status === 'ready' && request?.status !== 'pending')
  const reloadMessages = reload
  const reloadConversationList = conversations.reload
  const reloadRequest = requestState.reload
  const handleRealtimeEvent = useCallback((eventName, event) => {
    const eventConversationId = event?.message?.conversationId || event?.conversationId || event?.payload?.conversationId
    if ((eventName === 'conversation.message.created' || eventName === 'conversation.read.updated') && String(eventConversationId) === String(conversationId)) reloadMessages()
    if (eventName === 'collaboration.request.updated' && requestId && String(event?.request?.id) === String(requestId)) { reloadRequest(); reloadMessages() }
    if (eventName === 'project.member.added' && kind === 'project' && String(event?.projectId) === String(conversation?.projectId)) { reloadConversationList(); reloadMessages() }
  }, [conversation?.projectId, conversationId, kind, reloadConversationList, reloadMessages, reloadRequest, requestId])
  const { connectionState } = useMessagingRealtime(token, { onEvent: handleRealtimeEvent, onReady: reloadMessages })

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

  const openSafety = () => {
    setShowSafetySheet(true)
  }

  const toggleBlock = async () => {
    if (!moderationTarget?.id) return
    setIsSafetyAction(true)
    try {
      const result = await toggleUserBlock(token, moderationTarget.id)
      setIsBlocked(Boolean(result.blocked))
      setShowSafetySheet(false)
      showSuccess(result.blocked ? 'Creator blocked. This conversation is now read-only.' : 'Creator unblocked.')
    } catch (blockError) { showError(blockError.message || 'Unable to update this block.') } finally { setIsSafetyAction(false) }
  }

  const submitReport = async () => {
    const reason = reportReason.trim()
    if (!moderationTarget?.id || !reason) return
    setIsSafetyAction(true)
    try {
      await createModerationReport(token, { targetUserId: moderationTarget.id, reason, contextType: 'conversation', contextId: conversationId })
      setReportReason('')
      setShowSafetySheet(false)
      showSuccess('Report submitted. Thank you for helping keep the community safe.')
    } catch (reportError) { showError(reportError.message || 'Unable to submit this report.') } finally { setIsSafetyAction(false) }
  }

  return <main className="conversation-page">
    <header className="conversation-header"><button className="conversation-back" type="button" aria-label="Back to inbox" onClick={() => navigate('/app/inbox')}>‹</button><div className="conversation-header__copy"><h1>{header.title}</h1><p>{header.subtitle}</p></div><button className="conversation-safety" type="button" aria-label="Conversation safety options" onClick={openSafety}>•••</button></header>
    {connectionState === 'reconnecting' ? <div className="conversation-connection" role="status">Reconnecting… messages will refresh when you’re back online.</div> : null}
    {isReadOnly ? <div className="conversation-notice" role="status">{isBlocked ? 'You blocked this creator. This conversation is read-only.' : `This request is ${request.status}. Its messages are available to read, but replies are closed.`}</div> : null}
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
    <footer className="conversation-composer"><textarea aria-label="Message" value={draft} maxLength={2000} disabled={isReadOnly} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit() } }} placeholder={isReadOnly ? (isBlocked ? 'Messaging is blocked' : 'Replies are closed') : 'Write a message…'} /><button type="button" disabled={!draft.trim() || sending || isReadOnly} onClick={submit}>{sending ? 'Sending…' : 'Send'}</button></footer>
    <BottomSheet open={showSafetySheet} title="Safety options" onClose={() => { if (!isSafetyAction) setShowSafetySheet(false) }}>{!moderationTarget?.id ? <p style={{ margin: '4px 0', color: 'var(--gf-text-muted)', fontSize: 13, lineHeight: 1.5 }}>Safety actions need the other creator’s account ID. This conversation does not provide it yet, so no block or report request was sent.</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}><p style={{ margin: 0, color: 'var(--gf-text-muted)', fontSize: 13, lineHeight: 1.45 }}>Block this creator to stop new messages and collaboration requests, or report a concern.</p><button type="button" disabled={isSafetyAction} onClick={() => setShowBlockConfirm(true)} style={{ minHeight: 46, borderRadius: 12, border: '1px solid rgba(255,120,140,.3)', background: 'rgba(217,75,98,.1)', color: '#ff9cac', fontWeight: 800 }}>{isBlocked ? 'Unblock creator' : 'Block creator'}</button><label style={{ display: 'grid', gap: 7, fontSize: 13, fontWeight: 700 }}>Report concern<textarea value={reportReason} maxLength={500} onChange={(event) => setReportReason(event.target.value)} placeholder="Tell us what happened (up to 500 characters)" style={{ minHeight: 96, boxSizing: 'border-box', resize: 'vertical', padding: 12, borderRadius: 12, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', font: 'inherit' }} /></label><button type="button" disabled={isSafetyAction || !reportReason.trim()} onClick={submitReport} style={{ minHeight: 46, border: 0, borderRadius: 12, background: '#FF7A59', color: '#fff', fontWeight: 800, opacity: isSafetyAction || !reportReason.trim() ? .6 : 1 }}>{isSafetyAction ? 'Submitting…' : 'Submit report'}</button></div>}</BottomSheet>
    <ConfirmDialog open={showBlockConfirm} title={isBlocked ? 'Unblock creator?' : 'Block creator?'} message={isBlocked ? 'You will be able to message and collaborate with this creator again.' : 'Blocking prevents new messages and collaboration requests between you and this creator.'} confirmLabel={isBlocked ? 'Unblock' : 'Block'} onConfirm={toggleBlock} onClose={() => setShowBlockConfirm(false)} />
  </main>
}
