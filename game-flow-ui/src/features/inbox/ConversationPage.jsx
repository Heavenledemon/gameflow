import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAppShell } from '../../context/AppShellContext'
import { useToast } from '../../context/ToastContext'
import { ConfirmDialog } from '../../components/ui/Overlay'
import { useConversation } from '../../hooks/useConversation'
import { useConversations } from '../../hooks/useConversations'
import { useCollaborationRequest } from '../../hooks/useCollaborationRequest'
import { useMessagingRealtime } from '../../hooks/useMessagingRealtime'
import { createModerationReport, toggleUserBlock } from '../../lib/moderation'
import ConversationComposer from './components/ConversationComposer'
import ConversationSafety from './components/ConversationSafety'
import InboxTopBar from './components/InboxTopBar'
import MessageThread from './components/MessageThread'
import './conversation.css'

function conversationHeading(conversation, kind, request) {
  if (kind === 'project') return { title: request?.project?.title || conversation?.project?.title || conversation?.projectTitle || 'Project workspace', subtitle: 'Project chat' }
  if (kind === 'collaboration_request') return { title: request?.project?.title || 'Collaboration request', subtitle: request ? `${request.status} · ${request.proposedRole}` : 'Private request conversation' }
  if (kind === 'direct') {
    const participant = conversation?.otherParticipant || conversation?.participant
    return { title: participant?.name || participant?.username || conversation?.title || 'Direct message', subtitle: 'Private conversation' }
  }
  return { title: 'Conversation', subtitle: 'Private conversation' }
}

export default function ConversationPage() {
  const { conversationId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const { setTopBar, clearTopBar } = useAppShell()
  const { success: showSuccess, error: showError } = useToast()
  const scrollRef = useRef(null)
  const nearBottomRef = useRef(true)
  const olderScrollRef = useRef(null)
  const sendingRef = useRef(false)
  const [sending, setSending] = useState(false)
  const [retryingIds, setRetryingIds] = useState(() => new Set())
  const [sendError, setSendError] = useState('')
  const [showSafetySheet, setShowSafetySheet] = useState(false)
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [isSafetyAction, setIsSafetyAction] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const { items, conversation: loadedConversation, status, nextCursor, draft, setDraft, send, reload, loadMore } = useConversation(token, conversationId)
  const conversations = useConversations(token)
  const routeConversation = location.state?.conversation || null
  const conversation = routeConversation || conversations.items.find((item) => item.id === conversationId) || loadedConversation
  const kind = loadedConversation?.kind || conversation?.kind || 'direct'
  const requestId = conversation?.collaborationRequestId || location.state?.request?.id || null
  const requestState = useCollaborationRequest(token, requestId)
  const request = requestState.request || location.state?.request || null
  const requestTarget = request ? [request.requester, request.recipient].find((person) => String(person?.id) !== String(user?.id || user?._id)) : null
  const moderationTarget = location.state?.moderationTarget || conversation?.otherParticipant || conversation?.participant || requestTarget || null
  const header = useMemo(() => conversationHeading(conversation, kind, request), [conversation, kind, request])
  const isReadOnly = isBlocked || (kind === 'collaboration_request' && requestState.status === 'ready' && request?.status !== 'pending')
  const reloadMessages = reload
  const reloadConversationList = conversations.reload
  const reloadRequest = requestState.reload

  useEffect(() => {
    setTopBar(<InboxTopBar title={header.title} subtitle={header.subtitle} onBack={() => navigate('/app/inbox')} onAction={() => setShowSafetySheet(true)} />)
    return clearTopBar
  }, [clearTopBar, header.subtitle, header.title, navigate, setTopBar])

  const handleRealtimeEvent = useCallback((eventName, event) => {
    const eventConversationId = event?.message?.conversationId || event?.conversationId || event?.payload?.conversationId
    const isCurrentConversation = String(eventConversationId) === String(conversationId)
    if (eventName === 'conversation.message.created' && isCurrentConversation) { reloadMessages(); reloadConversationList() }
    if (eventName === 'conversation.read.updated' && isCurrentConversation) reloadConversationList()
    if (eventName === 'collaboration.request.updated' && requestId && String(event?.request?.id) === String(requestId)) { reloadRequest(); reloadMessages() }
    if (eventName === 'project.member.added' && kind === 'project' && String(event?.projectId) === String(conversation?.projectId)) { reloadConversationList(); reloadMessages() }
  }, [conversation?.projectId, conversationId, kind, reloadConversationList, reloadMessages, reloadRequest, requestId])
  const refreshConversation = useCallback(() => { reloadMessages(); reloadConversationList() }, [reloadConversationList, reloadMessages])
  const { connectionState } = useMessagingRealtime(token, { onEvent: handleRealtimeEvent, onReady: refreshConversation })

  useLayoutEffect(() => {
    const element = scrollRef.current
    if (!element) return
    if (olderScrollRef.current) {
      const previous = olderScrollRef.current
      element.scrollTop = previous.top + (element.scrollHeight - previous.height)
      olderScrollRef.current = null
    } else if (nearBottomRef.current) element.scrollTop = element.scrollHeight
  }, [items.length])

  const loadOlder = useCallback(async () => {
    const element = scrollRef.current
    if (element) olderScrollRef.current = { top: element.scrollTop, height: element.scrollHeight }
    await loadMore()
  }, [loadMore])

  const onScroll = () => {
    const element = scrollRef.current
    if (element) nearBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80
  }

  const submit = async () => {
    const body = draft.trim()
    if (!body || sendingRef.current || isReadOnly) return
    sendingRef.current = true
    setSending(true)
    setSendError('')
    try { await send(body, crypto.randomUUID()) }
    catch { setSendError('Message could not be sent. You can retry it below.') }
    finally { sendingRef.current = false; setSending(false) }
  }

  const retry = async (message) => {
    if (!message.clientMessageId || retryingIds.has(message.clientMessageId)) return
    setRetryingIds((current) => new Set(current).add(message.clientMessageId))
    setSendError('')
    try { await send(message.body, message.clientMessageId) }
    catch { setSendError('Message could not be sent. Try again.') }
    finally { setRetryingIds((current) => { const next = new Set(current); next.delete(message.clientMessageId); return next }) }
  }

  const toggleBlock = async () => {
    if (!moderationTarget?.id || isSafetyAction) return
    setIsSafetyAction(true)
    try {
      const result = await toggleUserBlock(token, moderationTarget.id)
      setIsBlocked(Boolean(result.blocked))
      setShowSafetySheet(false)
      showSuccess(result.blocked ? 'Creator blocked. This conversation is now read-only.' : 'Creator unblocked.')
    } catch { showError('Unable to update this block. Try again.') }
    finally { setIsSafetyAction(false) }
  }

  const submitReport = async () => {
    const reason = reportReason.trim()
    if (!moderationTarget?.id || !reason || isSafetyAction) return
    setIsSafetyAction(true)
    try {
      await createModerationReport(token, { targetUserId: moderationTarget.id, reason, contextType: 'conversation', contextId: conversationId })
      setReportReason('')
      setShowSafetySheet(false)
      showSuccess('Report submitted. Thank you for helping keep the community safe.')
    } catch { showError('Unable to submit this report. Try again.') }
    finally { setIsSafetyAction(false) }
  }

  return <main className="conversation-page">
    {connectionState === 'reconnecting' ? <div className="conversation-connection" role="status">Reconnecting. Messages will refresh when you’re back online.</div> : null}
    {isReadOnly ? <div className="conversation-notice" role="status">{isBlocked ? 'You blocked this creator. This conversation is read-only.' : `This request is ${request.status}. Its messages are available to read, but replies are closed.`}</div> : null}
    <MessageThread title={header.title} items={items} status={status} nextCursor={nextCursor} userId={user?.id || user?._id} retryingIds={retryingIds} onLoadOlder={loadOlder} onRetryLoad={reload} onRetryMessage={retry} scrollRef={scrollRef} onScroll={onScroll} />
    <ConversationComposer draft={draft} sending={sending} disabled={isReadOnly} blocked={isBlocked} sendError={sendError} onChange={setDraft} onSend={submit} />
    <ConversationSafety open={showSafetySheet} targetAvailable={Boolean(moderationTarget?.id)} blocked={isBlocked} busy={isSafetyAction} reportReason={reportReason} onReportReasonChange={setReportReason} onRequestBlock={() => setShowBlockConfirm(true)} onReport={submitReport} onClose={() => { if (!isSafetyAction) setShowSafetySheet(false) }} />
    <ConfirmDialog open={showBlockConfirm} title={isBlocked ? 'Unblock creator?' : 'Block creator?'} message={isBlocked ? 'You will be able to message and collaborate with this creator again.' : 'Blocking prevents new messages and collaboration requests between you and this creator.'} confirmLabel={isBlocked ? 'Unblock' : 'Block'} confirmLoading={isSafetyAction} onConfirm={toggleBlock} onClose={() => { if (!isSafetyAction) setShowBlockConfirm(false) }} />
  </main>
}
