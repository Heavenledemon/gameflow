import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAppShell } from '../../context/AppShellContext'
import { useToast } from '../../context/ToastContext'
import { EmptyState, ErrorState, LoadingState, Skeleton } from '../../components/ui/Feedback'
import { acceptCollaborationRequest, cancelCollaborationRequest, declineCollaborationRequest } from '../../lib/collaboration'
import { useInbox } from '../../hooks/useInbox'
import { useConversations } from '../../hooks/useConversations'
import { useMessagingRealtime } from '../../hooks/useMessagingRealtime'
import ConversationListItem from './components/ConversationListItem'
import InboxTabs from './components/InboxTabs'
import InboxTopBar from './components/InboxTopBar'
import RequestCard from './components/RequestCard'
import { safeInboxError } from './inboxFormatters'
import './inbox.css'

function ListSkeleton({ label }) {
  return <div className="inbox-list" aria-label={label} aria-busy="true">
    {[0, 1, 2].map((key) => <div className="inbox-list-skeleton" key={key}><Skeleton circle width={44} height={44} /><span><Skeleton width="48%" height={14} /><Skeleton width="78%" height={12} /><Skeleton width="62%" height={12} /></span></div>)}
  </div>
}

function RequestList({ box, requests, workingId, onAction, onOpen }) {
  if (requests.status === 'loading' && !requests.items.length) return <ListSkeleton label="Loading collaboration requests" />
  if (requests.status === 'error' && !requests.items.length) return <ErrorState title="Couldn’t load requests" description={safeInboxError('requests')} onRetry={requests.reload} />
  if (requests.status === 'ready' && !requests.items.length) return <EmptyState title={box === 'incoming' ? 'No incoming requests' : 'No sent requests'} description={box === 'incoming' ? 'New collaboration requests will appear here.' : 'Requests you send to project owners will appear here.'} />
  return <div className="inbox-list">
    {requests.items.map((request) => <RequestCard key={request.id} request={request} box={box} pending={workingId === request.id} onAction={onAction} onOpen={onOpen} />)}
    {requests.status === 'error' ? <ErrorState title="Couldn’t load more requests" description={safeInboxError('requests')} onRetry={requests.loadMore} headingLevel={3} /> : null}
    {requests.status === 'loading-more' ? <LoadingState label="Loading more requests" /> : null}
    {requests.nextCursor ? <button className="inbox-load-more" type="button" onClick={requests.loadMore} disabled={requests.status === 'loading-more'}>Load more requests</button> : null}
  </div>
}

function ConversationList({ kind, conversations, onOpen }) {
  const items = conversations.items.filter((conversation) => conversation.kind === (kind === 'projects' ? 'project' : 'direct'))
  const projectChats = kind === 'projects'
  if (conversations.status === 'loading' && !conversations.items.length) return <ListSkeleton label={projectChats ? 'Loading project chats' : 'Loading messages'} />
  if (conversations.status === 'error' && !conversations.items.length) return <ErrorState title="Couldn’t load conversations" description={safeInboxError('messages')} onRetry={conversations.reload} />
  if (conversations.status === 'ready' && !items.length) return <EmptyState title={projectChats ? 'No project chats yet' : 'No messages yet'} description={projectChats ? 'Accepted project collaborations will appear here.' : 'Start a conversation from a creator profile to see it here.'} />
  return <div className="inbox-list">
    {items.map((conversation) => <ConversationListItem key={conversation.id} conversation={conversation} onOpen={onOpen} />)}
    {conversations.status === 'error' ? <ErrorState title="Couldn’t load more conversations" description={safeInboxError('messages')} onRetry={conversations.loadMore} headingLevel={3} /> : null}
    {conversations.status === 'loading-more' ? <LoadingState label="Loading more conversations" /> : null}
    {conversations.nextCursor ? <button className="inbox-load-more" type="button" onClick={conversations.loadMore} disabled={conversations.status === 'loading-more'}>Load more conversations</button> : null}
  </div>
}

export default function InboxPage() {
  const { token } = useAuth()
  const { setTopBar, clearTopBar } = useAppShell()
  const { success, error: showError } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('requests')
  const [box, setBox] = useState('incoming')
  const [workingId, setWorkingId] = useState('')
  const workingRef = useRef('')
  const requests = useInbox(token, box)
  const conversations = useConversations(token)
  const reloadRequests = requests.reload
  const reloadConversations = conversations.reload

  useEffect(() => {
    setTopBar(<InboxTopBar title="Inbox" subtitle="Collaboration hub" />)
    return clearTopBar
  }, [clearTopBar, setTopBar])

  const refreshAll = useCallback(() => { reloadRequests(); reloadConversations() }, [reloadConversations, reloadRequests])
  const handleRealtimeEvent = useCallback((eventName) => {
    if (eventName.startsWith('collaboration.request')) reloadRequests()
    if (eventName.startsWith('conversation.') || eventName.startsWith('project.member.')) reloadConversations()
  }, [reloadConversations, reloadRequests])
  const { connectionState } = useMessagingRealtime(token, { onEvent: handleRealtimeEvent, onReady: refreshAll })

  const activeDescription = useMemo(() => activeTab === 'requests' ? 'Review invitations and collaboration requests.' : activeTab === 'projects' ? 'Continue conversations tied to project workspaces.' : 'Continue private creator conversations.', [activeTab])

  const act = async (request, action) => {
    if (workingRef.current || request.status !== 'pending') return
    workingRef.current = request.id
    setWorkingId(request.id)
    try {
      const result = action === 'accept' ? await acceptCollaborationRequest(token, request.id) : action === 'decline' ? await declineCollaborationRequest(token, request.id) : await cancelCollaborationRequest(token, request.id)
      requests.setItems((current) => current.map((entry) => entry.id === request.id ? result.request : entry).filter((entry) => entry.status === 'pending'))
      success(action === 'accept' ? 'Collaboration accepted. The project workspace is ready.' : action === 'decline' ? 'Request declined.' : 'Request cancelled.')
      refreshAll()
    } catch {
      showError('Unable to update this collaboration request. Try again.')
    } finally {
      workingRef.current = ''
      setWorkingId('')
    }
  }

  const openRequest = (request) => navigate(`/app/inbox/${request.conversationId}`, { state: { conversation: { id: request.conversationId, kind: 'collaboration_request', projectId: request.projectId, collaborationRequestId: request.id }, request } })
  const openConversation = (conversation) => navigate(`/app/inbox/${conversation.id}`, { state: { conversation } })

  return <main className="inbox-page">
    <header className="inbox-page__intro"><p className="inbox-page__eyebrow">Work together</p><h2>Requests and conversations</h2><p>{activeDescription}</p></header>
    {connectionState === 'reconnecting' ? <p className="inbox-connection" role="status">Reconnecting. New activity will refresh when the connection returns.</p> : null}
    <InboxTabs activeTab={activeTab} onTabChange={setActiveTab} requestBox={box} onRequestBoxChange={setBox} />
    <section id={`inbox-panel-${activeTab}`} className="inbox-panel" role="tabpanel" aria-label={activeTab === 'requests' ? 'Collaboration requests' : activeTab === 'projects' ? 'Project chats' : 'Messages'}>
      {activeTab === 'requests' ? <RequestList box={box} requests={requests} workingId={workingId} onAction={act} onOpen={openRequest} /> : <ConversationList kind={activeTab} conversations={conversations} onOpen={openConversation} />}
    </section>
  </main>
}
