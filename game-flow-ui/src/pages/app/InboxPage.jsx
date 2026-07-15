import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { acceptCollaborationRequest, cancelCollaborationRequest, declineCollaborationRequest } from '../../lib/collaboration'
import { useInbox } from '../../hooks/useInbox'
import { useConversations } from '../../hooks/useConversations'
import { useMessagingRealtime } from '../../hooks/useMessagingRealtime'
import { EmptyState, ErrorState, LoadingState, Skeleton } from '../../components/ui/Feedback'
import './InboxPage.css'

const primaryTabs = [
  { id: 'requests', label: 'Requests' },
  { id: 'messages', label: 'Messages' },
  { id: 'projects', label: 'Project chats' },
]

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const elapsed = Date.now() - date.getTime()
  if (elapsed < 60_000) return 'Now'
  if (elapsed < 3_600_000) return `${Math.floor(elapsed / 60_000)}m`
  if (elapsed < 86_400_000) return `${Math.floor(elapsed / 3_600_000)}h`
  if (elapsed < 604_800_000) return `${Math.floor(elapsed / 86_400_000)}d`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function RequestSkeletons() {
  return <div className="inbox-list" aria-label="Loading requests"><div className="inbox-card inbox-card--skeleton"><Skeleton className="inbox-skeleton inbox-skeleton--title" /><Skeleton className="inbox-skeleton" /><Skeleton className="inbox-skeleton inbox-skeleton--short" /></div><div className="inbox-card inbox-card--skeleton"><Skeleton className="inbox-skeleton inbox-skeleton--title" /><Skeleton className="inbox-skeleton" /></div></div>
}

function RequestList({ box, items, status, error, nextCursor, working, onAction, onLoadMore, onRetry, onOpen }) {
  if (status === 'loading' && !items.length) return <RequestSkeletons />
  if (status === 'error' && !items.length) return <ErrorState title="Couldn’t load requests" description={error} onRetry={onRetry} />
  if (status === 'ready' && !items.length) return <EmptyState title={box === 'incoming' ? 'No incoming requests' : 'No sent requests'} description={box === 'incoming' ? 'When a creator wants to collaborate, their request will appear here.' : 'Requests you send to project owners will appear here.'} />
  return <div className="inbox-list">
    {items.map((item) => {
      const person = box === 'incoming' ? item.requester : item.recipient
      const label = item.initiatedBy === 'owner_invite' ? 'Project invitation' : 'Collaboration request'
      return <article className="inbox-card" key={item.id}>
        <button className="inbox-card__body" type="button" onClick={() => item.conversationId && onOpen(item.conversationId, { id: item.conversationId, kind: 'collaboration_request', projectId: item.projectId, collaborationRequestId: item.id }, item)} disabled={!item.conversationId} aria-label={item.conversationId ? `Open conversation for ${item.project?.title || 'project'}` : undefined}>
          <div className="inbox-card__eyebrow"><span>{label}</span><time dateTime={item.updatedAt || item.createdAt}>{formatTime(item.updatedAt || item.createdAt)}</time></div>
          <strong>{item.project?.title || 'Untitled project'}</strong>
          <p>{box === 'incoming' ? `@${person?.username || 'creator'} wants to collaborate as ${item.proposedRole}.` : `Sent to @${person?.username || 'creator'} as ${item.proposedRole}.`}</p>
          {item.message ? <span className="inbox-card__preview">{item.message}</span> : null}
        </button>
        <div className="inbox-card__footer">
          <span className="inbox-status">{item.status}</span>
          <div className="inbox-actions">
            {box === 'incoming' ? <><button className="inbox-button inbox-button--primary" disabled={working === item.id} onClick={() => onAction(item, 'accept')}>{working === item.id ? 'Working…' : 'Accept'}</button><button className="inbox-button" disabled={working === item.id} onClick={() => onAction(item, 'decline')}>Decline</button></> : <button className="inbox-button" disabled={working === item.id} onClick={() => onAction(item, 'cancel')}>{working === item.id ? 'Working…' : 'Cancel'}</button>}
          </div>
        </div>
      </article>
    })}
    {status === 'loading-more' ? <LoadingState label="Loading more requests" /> : null}
    {nextCursor ? <button className="inbox-load-more" type="button" onClick={onLoadMore} disabled={status === 'loading-more'}>Load more requests</button> : null}
  </div>
}

function ConversationList({ kind, items, status, error, nextCursor, onLoadMore, onRetry, onOpen }) {
  const conversations = useMemo(() => items.filter((item) => kind === 'projects' ? item.kind === 'project' : item.kind === 'direct'), [items, kind])
  const title = kind === 'projects' ? 'No project chats yet' : 'No messages yet'
  const description = kind === 'projects' ? 'Accepted project collaborations will appear here.' : 'Start a conversation from a creator profile to see it here.'
  if (status === 'loading' && !items.length) return <LoadingState label={kind === 'projects' ? 'Loading project chats' : 'Loading messages'} />
  if (status === 'error' && !items.length) return <ErrorState title="Couldn’t load conversations" description={error} onRetry={onRetry} />
  if (status === 'ready' && !conversations.length) return <EmptyState title={title} description={description} />
  return <div className="inbox-list">
    {conversations.map((conversation) => <button className="inbox-card inbox-card--conversation" type="button" key={conversation.id} onClick={() => onOpen(conversation.id, conversation)}>
      <span className={`inbox-conversation-icon inbox-conversation-icon--${conversation.kind}`}>{conversation.kind === 'project' ? 'P' : 'M'}</span>
      <span className="inbox-conversation-copy"><span className="inbox-card__eyebrow"><span>{conversation.kind === 'project' ? 'Project workspace' : 'Direct message'}</span><time dateTime={conversation.lastMessageAt}>{formatTime(conversation.lastMessageAt)}</time></span><strong>{conversation.kind === 'project' ? 'Project chat' : 'Conversation'}</strong><span className="inbox-card__preview">{conversation.lastMessagePreview || 'No messages yet.'}</span></span>
    </button>)}
    {status === 'loading-more' ? <LoadingState label="Loading more conversations" /> : null}
    {nextCursor ? <button className="inbox-load-more" type="button" onClick={onLoadMore} disabled={status === 'loading-more'}>Load more conversations</button> : null}
  </div>
}

export default function InboxPage() {
  const { token } = useAuth()
  const { success, error: showError } = useToast()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('requests')
  const [box, setBox] = useState('incoming')
  const [working, setWorking] = useState('')
  const requests = useInbox(token, box)
  const conversations = useConversations(token)
  const reloadRequests = requests.reload
  const reloadConversations = conversations.reload

  const refreshAll = useCallback(() => { reloadRequests(); reloadConversations() }, [reloadConversations, reloadRequests])
  useMessagingRealtime(token, { onRefresh: refreshAll })

  const act = async (item, action) => {
    setWorking(item.id)
    try {
      const result = action === 'accept' ? await acceptCollaborationRequest(token, item.id) : action === 'decline' ? await declineCollaborationRequest(token, item.id) : await cancelCollaborationRequest(token, item.id)
      requests.setItems((current) => current.map((entry) => entry.id === item.id ? result.request : entry).filter((entry) => entry.status === 'pending'))
      success(action === 'accept' ? 'Collaboration accepted. The project workspace is ready.' : action === 'decline' ? 'Request declined.' : 'Request cancelled.')
      refreshAll()
    } catch (requestError) {
      showError(requestError.message || 'Unable to update this request.')
    } finally {
      setWorking('')
    }
  }

  return <main className="inbox-page">
    <header className="inbox-page__header"><div><p className="inbox-page__kicker">Your collaboration hub</p><h1>Inbox</h1><p>Requests, messages, and project workspaces in one place.</p></div></header>
    <div className="inbox-tabs" role="tablist" aria-label="Inbox sections">{primaryTabs.map((tab) => <button key={tab.id} className={activeTab === tab.id ? 'inbox-tab inbox-tab--active' : 'inbox-tab'} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}</div>
    {activeTab === 'requests' ? <><div className="inbox-subtabs" role="tablist" aria-label="Request type"><button type="button" className={box === 'incoming' ? 'inbox-subtab inbox-subtab--active' : 'inbox-subtab'} role="tab" aria-selected={box === 'incoming'} onClick={() => setBox('incoming')}>Incoming</button><button type="button" className={box === 'outgoing' ? 'inbox-subtab inbox-subtab--active' : 'inbox-subtab'} role="tab" aria-selected={box === 'outgoing'} onClick={() => setBox('outgoing')}>Sent</button></div><RequestList box={box} items={requests.items} status={requests.status} error={requests.error} nextCursor={requests.nextCursor} working={working} onAction={act} onLoadMore={requests.loadMore} onRetry={requests.reload} onOpen={(conversationId, conversation, request) => navigate(`/app/inbox/${conversationId}`, { state: { conversation, request } })} /></> : <ConversationList kind={activeTab} items={conversations.items} status={conversations.status} error={conversations.error} nextCursor={conversations.nextCursor} onLoadMore={conversations.loadMore} onRetry={conversations.reload} onOpen={(conversationId, conversation) => navigate(`/app/inbox/${conversationId}`, { state: { conversation } })} />}
  </main>
}
